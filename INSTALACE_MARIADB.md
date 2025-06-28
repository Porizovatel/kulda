# Instalace a konfigurace MariaDB na Synology NAS

## 1. Instalace MariaDB na Synology NAS

### Krok 1: Přístup do Package Center
1. Přihlaste se do DSM (DiskStation Manager)
2. Otevřete **Package Center**
3. Vyhledejte **MariaDB 10**
4. Klikněte na **Instalovat**

### Krok 2: Konfigurace MariaDB
1. Po instalaci otevřete **MariaDB 10** z hlavního menu
2. Nastavte **root heslo** (zapamatujte si ho!)
3. Povolte **TCP/IP připojení**
4. Nastavte port **3306** (výchozí)

### Krok 3: Vytvoření databáze a uživatele
1. Otevřete **phpMyAdmin** (nainstaluje se automaticky s MariaDB)
2. Přihlaste se jako **root** s heslem, které jste nastavili
3. Vytvořte novou databázi:
   ```sql
   CREATE DATABASE kulich_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
4. Vytvořte uživatele pro aplikaci:
   ```sql
   CREATE USER 'kulich_user'@'%' IDENTIFIED BY 'your_secure_password';
   GRANT ALL PRIVILEGES ON kulich_db.* TO 'kulich_user'@'%';
   FLUSH PRIVILEGES;
   ```

## 2. Konfigurace síťového přístupu

### Krok 1: Firewall nastavení
1. V DSM jděte do **Ovládací panel** → **Zabezpečení** → **Firewall**
2. Vytvořte pravidlo pro port **3306**:
   - Typ: **Vlastní**
   - Protokol: **TCP**
   - Port: **3306**
   - Zdroj IP: **Vaše lokální síť** (např. 192.168.1.0/24)

### Krok 2: Zjištění IP adresy NAS
1. V DSM jděte do **Ovládací panel** → **Síť** → **Síťové rozhraní**
2. Poznamenejte si **IP adresu** vašeho NAS (např. 192.168.1.100)

## 3. Instalace a spuštění backend serveru

### Krok 1: Příprava prostředí
```bash
# Přejděte do složky backend
cd backend

# Nainstalujte závislosti
npm install

# Vytvořte .env soubor
cp .env.example .env
```

### Krok 2: Konfigurace .env souboru
Upravte soubor `.env` s vašimi údaji:
```env
# Database Configuration
DB_HOST=192.168.1.100  # IP adresa vašeho Synology NAS
DB_PORT=3306
DB_USER=kulich_user
DB_PASSWORD=your_secure_password  # Heslo, které jste nastavili
DB_NAME=kulich_db

# JWT Configuration
JWT_SECRET=your_very_secure_jwt_secret_key_here  # Vygenerujte silný klíč
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

### Krok 3: Spuštění migrací
```bash
# Sestavte projekt
npm run build

# Spusťte migrace databáze
npm run migrate
```

### Krok 4: Spuštění serveru
```bash
# Pro vývoj (s automatickým restartováním)
npm run dev

# Pro produkci
npm run build
npm start
```

## 4. Konfigurace frontend aplikace

### Krok 1: Aktualizace API konfigurace
Vytvořte soubor `src/config/api.ts`:
```typescript
export const API_BASE_URL = 'http://localhost:3001/api';
```

### Krok 2: Spuštění frontend aplikace
```bash
# V hlavní složce projektu
npm run dev
```

## 5. Testování připojení

### Test 1: Health check
Otevřete v prohlížeči: `http://localhost:3001/health`
Měli byste vidět: `{"status":"OK","timestamp":"..."}`

### Test 2: Databázové připojení
Zkontrolujte logy serveru - měli byste vidět:
```
✅ Připojení k MariaDB úspěšné
🚀 Server běží na portu 3001
```

### Test 3: Přihlášení do aplikace
1. Otevřete `http://localhost:5173`
2. Přihlaste se s výchozím účtem:
   - Email: `admin@kulich.cz`
   - Heslo: `admin123`

## 6. Řešení problémů

### Problém: Nelze se připojit k databázi
**Řešení:**
1. Zkontrolujte, zda MariaDB běží na NAS
2. Ověřte firewall pravidla
3. Zkontrolujte IP adresu a port v .env souboru
4. Zkuste připojení z phpMyAdmin

### Problém: CORS chyby
**Řešení:**
1. Zkontrolujte `FRONTEND_URL` v .env souboru
2. Ujistěte se, že backend běží na portu 3001
3. Zkontrolujte, zda frontend běží na portu 5173

### Problém: JWT chyby
**Řešení:**
1. Vygenerujte nový `JWT_SECRET` (min. 32 znaků)
2. Restartujte backend server
3. Vymažte localStorage v prohlížeči

## 7. Produkční nasazení

### Doporučení pro produkci:
1. **Změňte výchozí hesla** všech účtů
2. **Použijte HTTPS** pro frontend i backend
3. **Nastavte silný JWT_SECRET**
4. **Omezte přístup k databázi** pouze na potřebné IP adresy
5. **Pravidelně zálohujte databázi**
6. **Monitorujte logy** serveru a databáze

### Záloha databáze:
```bash
# Export databáze
mysqldump -h 192.168.1.100 -u kulich_user -p kulich_db > backup.sql

# Import databáze
mysql -h 192.168.1.100 -u kulich_user -p kulich_db < backup.sql
```

## 8. Údržba

### Pravidelné úkoly:
- **Týdně:** Kontrola logů serveru
- **Měsíčně:** Záloha databáze
- **Čtvrtletně:** Aktualizace závislostí
- **Ročně:** Změna hesel a JWT klíčů