# KuLiCh - Kuželkářská Liga Chrástu

Webová aplikace pro správu kuželkářské ligy s MariaDB databází na Synology NAS.

## Architektura

### Frontend
- **React 18** + TypeScript + Tailwind CSS
- **Lokální fallback:** IndexedDB (Dexie) pro offline režim
- **API komunikace:** REST API s JWT autentifikací

### Backend
- **Node.js** + Express + TypeScript
- **Databáze:** MariaDB na Synology NAS
- **Autentifikace:** JWT tokeny s bcrypt hashováním
- **Bezpečnost:** Helmet, CORS, Rate limiting

## Funkcionalita

Aplikace podporuje tři uživatelské role:

1. **Admin** - má plný přístup ke všem částem aplikace včetně správy uživatelů
2. **Správce** - může editovat týmy, hráče, zápasy, výsledky a rozpisy  
3. **Čtenář** - má přístup jen ke čtení informací

### Hlavní funkce
- ✅ Správa týmů a hráčů
- ✅ Automatické generování rozpisu zápasů
- ✅ Zadávání výsledků a výpočet bodování
- ✅ Ligová tabulka a statistiky hráčů
- ✅ Import/Export dat do Excel
- ✅ Kalendářní zobrazení zápasů
- ✅ Role-based přístupová práva

## Instalace

### Požadavky
- **Node.js 18+**
- **Synology NAS** s MariaDB
- **npm** nebo yarn

### 1. Klonování a instalace
```bash
git clone <url_repozitáře>
cd kulich-app

# Instalace všech závislostí (frontend + backend)
npm run setup
```

### 2. Konfigurace MariaDB na Synology NAS
Postupujte podle detailního návodu v souboru `INSTALACE_MARIADB.md`

### 3. Konfigurace backend serveru
```bash
cd backend
cp .env.example .env
# Upravte .env soubor s vašimi údaji
```

### 4. Spuštění migrací databáze
```bash
npm run backend:migrate
```

### 5. Spuštění aplikace

#### Vývojové prostředí
```bash
# Terminal 1: Backend server
npm run backend:dev

# Terminal 2: Frontend aplikace
npm run dev
```

#### Produkční prostředí
```bash
# Sestavení backend
npm run backend:build

# Spuštění backend
npm run backend:start

# Sestavení frontend
npm run build

# Frontend bude v složce dist/
```

## První přihlášení

Po spuštění migrací se automaticky vytvoří výchozí admin účet:

- **Email:** admin@kulich.cz
- **Heslo:** admin123

**DŮLEŽITÉ:** Ihned změňte heslo po prvním přihlášení!

## API Endpoints

### Autentifikace
- `POST /api/auth/register` - Registrace nového uživatele
- `POST /api/auth/login` - Přihlášení
- `GET /api/auth/verify` - Ověření tokenu

### Týmy
- `GET /api/teams` - Seznam všech týmů
- `GET /api/teams/:id` - Detail týmu
- `POST /api/teams` - Vytvoření týmu (admin/manager)
- `PUT /api/teams/:id` - Aktualizace týmu (admin/manager)
- `DELETE /api/teams/:id` - Smazání týmu (admin/manager)

### Další endpoints
- Hráči: `/api/players`
- Zápasy: `/api/matches`
- Sezóny: `/api/seasons`
- Statistiky: `/api/stats`

## Databázové schéma

### Hlavní tabulky
- **users** - Uživatelé a jejich role
- **teams** - Týmy a jejich rozpisy
- **players** - Hráči a jejich historie
- **matches** - Zápasy a jejich stav
- **player_performances** - Výkony hráčů v zápasech
- **team_performances** - Výkony týmů v zápasech
- **seasons** - Sezóny ligy

## Pravidla bodování

### Body za zápas
- **Výhra:** 2 body
- **Remíza:** 1 bod  
- **Prohra:** 0 bodů

### Pomocné body
- Výhry v duelech hráčů (2 body za každý)
- Porovnání celkového počtu kuželek (2 body)

### Pořadí při rovnosti bodů
1. Nejvyšší počet pomocných bodů
2. Nejvyšší průměr kuželek na zápas

## Bezpečnost

- **JWT autentifikace** s bcrypt hashováním hesel
- **Role-based přístup** k funkcím
- **Rate limiting** proti útokům
- **CORS ochrana** pro API
- **Helmet.js** pro HTTP security headers
- **Input validace** pomocí express-validator

## Záloha a obnova dat

### Export dat
Aplikace umožňuje export všech dat do Excel souboru přes UI.

### Záloha databáze
```bash
# Export databáze
mysqldump -h NAS_IP -u kulich_user -p kulich_db > backup.sql

# Import databáze
mysql -h NAS_IP -u kulich_user -p kulich_db < backup.sql
```

## Řešení problémů

### Časté problémy
1. **Připojení k databázi** - Zkontrolujte firewall a síťová nastavení
2. **CORS chyby** - Ověřte FRONTEND_URL v .env souboru
3. **JWT chyby** - Vygenerujte nový JWT_SECRET

### Logy
- **Backend logy:** Konzole kde běží `npm run backend:dev`
- **Frontend logy:** Developer Tools v prohlížeči
- **Databázové logy:** MariaDB logy na Synology NAS

## Vývoj

### Struktura projektu
```
kulich-app/
├── src/                 # Frontend React aplikace
├── backend/             # Backend Node.js server
│   ├── src/
│   │   ├── config/      # Konfigurace databáze
│   │   ├── middleware/  # Express middleware
│   │   ├── routes/      # API routes
│   │   └── migrations/  # Databázové migrace
├── INSTALACE_MARIADB.md # Návod na instalaci
└── README.md
```

### Přidání nových funkcí
1. **Backend:** Přidejte nové routes do `backend/src/routes/`
2. **Frontend:** Vytvořte nové komponenty v `src/components/`
3. **Databáze:** Vytvořte nové migrace v `backend/src/migrations/`

## Podpora

Pro podporu a hlášení chyb použijte GitHub issues nebo kontaktujte administrátora ligy.

## Licence

MIT License