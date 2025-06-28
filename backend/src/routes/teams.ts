import express from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../config/database';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Získat všechny týmy
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT id, name, venue, day_of_week, time_start, time_end, 
             start_date, end_date, created_at, updated_at
      FROM teams 
      ORDER BY name
    `);
    
    const teams = (rows as any[]).map(team => ({
      id: team.id,
      name: team.name,
      venue: team.venue,
      schedule: {
        dayOfWeek: team.day_of_week,
        timeStart: team.time_start,
        timeEnd: team.time_end
      },
      startDate: team.start_date,
      endDate: team.end_date,
      createdAt: team.created_at,
      updatedAt: team.updated_at
    }));
    
    res.json(teams);
  } catch (error) {
    console.error('Chyba při načítání týmů:', error);
    res.status(500).json({ error: 'Interní chyba serveru' });
  }
});

// Získat tým podle ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.execute(`
      SELECT id, name, venue, day_of_week, time_start, time_end, 
             start_date, end_date, created_at, updated_at
      FROM teams 
      WHERE id = ?
    `, [id]);
    
    const teams = rows as any[];
    if (teams.length === 0) {
      return res.status(404).json({ error: 'Tým nenalezen' });
    }
    
    const team = teams[0];
    const formattedTeam = {
      id: team.id,
      name: team.name,
      venue: team.venue,
      schedule: {
        dayOfWeek: team.day_of_week,
        timeStart: team.time_start,
        timeEnd: team.time_end
      },
      startDate: team.start_date,
      endDate: team.end_date,
      createdAt: team.created_at,
      updatedAt: team.updated_at
    };
    
    res.json(formattedTeam);
  } catch (error) {
    console.error('Chyba při načítání týmu:', error);
    res.status(500).json({ error: 'Interní chyba serveru' });
  }
});

// Vytvořit nový tým
router.post('/', [
  authenticateToken,
  requireRole(['admin', 'manager']),
  body('name').notEmpty().trim(),
  body('venue').notEmpty().trim(),
  body('schedule.dayOfWeek').isInt({ min: 0, max: 6 }),
  body('schedule.timeStart').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('schedule.timeEnd').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('startDate').isISO8601()
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, venue, schedule, startDate, endDate } = req.body;

    const [result] = await pool.execute(`
      INSERT INTO teams (name, venue, day_of_week, time_start, time_end, start_date, end_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      name,
      venue,
      schedule.dayOfWeek,
      schedule.timeStart,
      schedule.timeEnd,
      startDate,
      endDate || null
    ]);

    const teamId = (result as any).insertId;
    
    res.status(201).json({
      message: 'Tým vytvořen úspěšně',
      id: teamId
    });
  } catch (error) {
    console.error('Chyba při vytváření týmu:', error);
    res.status(500).json({ error: 'Interní chyba serveru' });
  }
});

// Aktualizovat tým
router.put('/:id', [
  authenticateToken,
  requireRole(['admin', 'manager']),
  body('name').notEmpty().trim(),
  body('venue').notEmpty().trim(),
  body('schedule.dayOfWeek').isInt({ min: 0, max: 6 }),
  body('schedule.timeStart').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('schedule.timeEnd').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('startDate').isISO8601()
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, venue, schedule, startDate, endDate } = req.body;

    const [result] = await pool.execute(`
      UPDATE teams 
      SET name = ?, venue = ?, day_of_week = ?, time_start = ?, time_end = ?, 
          start_date = ?, end_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name,
      venue,
      schedule.dayOfWeek,
      schedule.timeStart,
      schedule.timeEnd,
      startDate,
      endDate || null,
      id
    ]);

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: 'Tým nenalezen' });
    }

    res.json({ message: 'Tým aktualizován úspěšně' });
  } catch (error) {
    console.error('Chyba při aktualizaci týmu:', error);
    res.status(500).json({ error: 'Interní chyba serveru' });
  }
});

// Smazat tým
router.delete('/:id', [
  authenticateToken,
  requireRole(['admin', 'manager'])
], async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Kontrola závislostí
    const [playerCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM players WHERE team_id = ?',
      [id]
    );
    
    const [matchCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM matches WHERE home_team_id = ? OR away_team_id = ?',
      [id, id]
    );

    const players = (playerCount as any[])[0].count;
    const matches = (matchCount as any[])[0].count;

    if (players > 0 || matches > 0) {
      return res.status(400).json({ 
        error: `Nelze smazat tým, protože má ${players} hráčů a ${matches} zápasů.` 
      });
    }

    const [result] = await pool.execute('DELETE FROM teams WHERE id = ?', [id]);

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: 'Tým nenalezen' });
    }

    res.json({ message: 'Tým smazán úspěšně' });
  } catch (error) {
    console.error('Chyba při mazání týmu:', error);
    res.status(500).json({ error: 'Interní chyba serveru' });
  }
});

export default router;