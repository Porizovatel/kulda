# Instalace KuLiCh - Kuželkářská Liga Chrástu

## 📋 Požadavky

### Pro lokální vývoj:
- **Node.js 18+**
- **npm** nebo yarn

### Pro produkci (Docker):
- **Docker** a **Docker Compose**
- **Synology NAS** s DSM 7.2.2+ (volitelné)

## 🚀 Rychlá instalace

### 1. Klonování projektu
```bash
git clone <url_repozitáře>
cd kulich-app
```

### 2. Instalace závislostí

#### Frontend
```bash
npm install
```

#### Backend
```bash
cd backend
npm install
cd ..
```

### 3. Konfigurace backend

#### Vytvoření .env souboru
```bash
cd backend
cp .env.example .env
```

#### Úprava konfigurace (volitelné)
```bash
# Upravte backend/.env podle potřeby
# Výchozí nastavení je připraveno pro lokální vývoj
```

### 4. Inicializace databáze
```bash
cd backend
npm run migrate
cd ..
```

### 5. Spuštění aplikace

#### Vývojové prostředí
```bash
# Terminal 1: Backend server
cd backend
npm run dev

# Terminal 2: Frontend aplikace (nový terminál)
npm run dev
```

#### Přístup k aplikaci
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **Health check:** http://localhost:3001/health

## 🔐 První přihlášení

Po spuštění se automaticky vytvoří admin účet:

- **Email:** admin@kulich.cz
- **Heslo:** admin123

**⚠️ DŮLEŽITÉ:** Ihned změňte heslo po prvním přihlášení!

## 🐳 Docker instalace (doporučeno pro produkci)

### 1. Příprava prostředí
```bash
# Vytvoření produkčního .env souboru
cd backend
cp .env.example .env

# Úprava pro produkci
nano .env
```

### 2. Sestavení a spuštění
```bash
# Návrat do root složky
cd ..

# Sestavení a spuštění
docker-compose up -d
```

### 3. Přístup k aplikaci
- **URL:** http://localhost:3001
- **Databáze:** Automaticky se vytvoří v `backend/data/kulich.db`

## 📁 Struktura projektu

```
kulich-app/
├── src/                     # Frontend React aplikace
│   ├── components/          # React komponenty
│   ├── pages/              # Stránky aplikace
│   ├── context/            # React Context providers
│   ├── data/               # IndexedDB konfigurace
│   └── types/              # TypeScript typy
├── backend/                # Backend Node.js server
│   ├── src/
│   │   ├── config/         # Databázová konfigurace
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   └── migrations/     # Databázové migrace
│   ├── data/               # SQLite databáze (vytvoří se automaticky)
│   └── dist/               # Sestavený backend (po build)
├── docker-compose.yml      # Docker Compose konfigurace
├── Dockerfile             # Docker image definice
└── README.md
```

## 🔧 Vývoj

### Přidání nových funkcí

#### Backend API endpoint
1. Vytvořte nový soubor v `backend/src/routes/`
2. Přidejte route do `backend/src/server.ts`
3. Implementujte middleware pro autentifikaci

#### Frontend komponenta
1. Vytvořte komponentu v `src/components/`
2. Přidejte route do `src/App.tsx`
3. Implementujte API volání

#### Databázové změny
1. Vytvořte novou migraci v `backend/src/migrations/`
2. Spusťte migraci: `cd backend && npm run migrate`

### Užitečné příkazy

```bash
# Restart backend serveru
cd backend && npm run dev

# Rebuild frontend
npm run build

# Zobrazení logů Docker kontejneru
docker-compose logs -f

# Restart Docker služeb
docker-compose restart

# Záloha databáze
cp backend/data/kulich.db backup/kulich-$(date +%Y%m%d).db
```

## 🔒 Bezpečnost

### Produkční nastavení
1. **Změňte JWT_SECRET** na silný náhodný klíč
2. **Změňte výchozí hesla** všech účtů
3. **Nastavte CORS** pouze pro vaši doménu
4. **Používejte HTTPS** v produkci

### Doporučené nastavení .env pro produkci
```env
NODE_ENV=production
JWT_SECRET=very_long_random_string_here_min_32_chars
FRONTEND_URL=https://your-domain.com
DB_PATH=/app/data/kulich.db
```

## 📊 Monitoring

### Health check
```bash
curl http://localhost:3001/health
```

### Databázové statistiky
```bash
# Velikost databáze
ls -lh backend/data/kulich.db

# Počet záznamů
sqlite3 backend/data/kulich.db "SELECT COUNT(*) FROM users;"
```

## 🆘 Řešení problémů

### Backend se nespustí
1. Zkontrolujte port 3001: `lsof -i :3001`
2. Ověřte .env soubor v backend složce
3. Zkontrolujte logy: `cd backend && npm run dev`

### Frontend se nepřipojí k backend
1. Ověřte, že backend běží na portu 3001
2. Zkontrolujte CORS nastavení
3. Otevřte Developer Tools pro chyby

### Databáze se nevytvoří
1. Zkontrolujte oprávnění ke složce `backend/data/`
2. Spusťte migrace ručně: `cd backend && npm run migrate`
3. Ověřte SQLite instalaci

### Docker problémy
1. Zkontrolujte Docker logy: `docker-compose logs`
2. Restartujte služby: `docker-compose restart`
3. Rebuild image: `docker-compose build --no-cache`

## 📞 Podpora

Pro podporu a hlášení chyb:
1. Zkontrolujte tento návod
2. Prohledejte existující issues
3. Vytvořte nový issue s detailním popisem problému

## 📝 Changelog

### v1.0.0
- ✅ Migrace z MariaDB na SQLite
- ✅ Docker podpora pro Synology NAS
- ✅ Kompletní frontend aplikace
- ✅ REST API backend
- ✅ Autentifikace a autorizace
- ✅ Správa týmů, hráčů a zápasů