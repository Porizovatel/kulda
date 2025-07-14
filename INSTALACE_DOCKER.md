# Instalace KuLiCh v Dockeru na Synology NAS

## Požadavky
- **Synology NAS** s DSM 7.2.2 nebo novější
- **Docker** nainstalovaný z Package Center
- **SSH přístup** k NAS (volitelné, pro pokročilé uživatele)

## Instalace přes Docker GUI

### Krok 1: Příprava souborů
1. Stáhněte nebo zkopírujte celý projekt na váš NAS
2. Umístěte ho do sdílené složky (např. `/volume1/docker/kulich`)

### Krok 2: Otevření Docker aplikace
1. Přihlaste se do DSM
2. Otevřete **Docker** z hlavního menu
3. Přejděte na záložku **Image**

### Krok 3: Sestavení Docker image
1. Klikněte na **Add** → **Add from Folder**
2. Vyberte složku s projektem
3. Zadejte název image: `kulich-app`
4. Klikněte **Build**

### Krok 4: Vytvoření kontejneru
1. Po dokončení sestavení přejděte na záložku **Container**
2. Klikněte **Create**
3. Vyberte image `kulich-app`
4. Zadejte název kontejneru: `kulich-app`

### Krok 5: Konfigurace kontejneru
1. **Port Settings:**
   - Local Port: `3001`
   - Container Port: `3001`
   - Type: `TCP`

2. **Volume Settings:**
   - Mount Path: `/app/data`
   - Local Path: `/volume1/docker/kulich/data`
   - Type: `rw` (read/write)

3. **Environment Variables:**
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: `your_very_secure_jwt_secret_key_here`
   - `DB_PATH`: `/app/data/kulich.db`

### Krok 6: Spuštění kontejneru
1. Klikněte **Apply** a **Next**
2. Zkontrolujte nastavení a klikněte **Apply**
3. Kontejner se automaticky spustí

## Instalace přes SSH (pokročilé)

### Krok 1: Připojení přes SSH
```bash
ssh admin@your-nas-ip
```

### Krok 2: Příprava složek
```bash
sudo mkdir -p /volume1/docker/kulich
cd /volume1/docker/kulich

# Zkopírujte soubory projektu do této složky
```

### Krok 3: Sestavení a spuštění
```bash
# Sestavení Docker image
sudo docker build -t kulich-app .

# Vytvoření a spuštění kontejneru
sudo docker run -d \
  --name kulich-app \
  --restart unless-stopped \
  -p 3001:3001 \
  -v /volume1/docker/kulich/data:/app/data \
  -e NODE_ENV=production \
  -e JWT_SECRET=your_very_secure_jwt_secret_key_here \
  -e DB_PATH=/app/data/kulich.db \
  kulich-app
```

## Použití Docker Compose (doporučeno)

### Krok 1: Vytvoření .env souboru
```bash
cd /volume1/docker/kulich
cat > .env << EOF
JWT_SECRET=your_very_secure_jwt_secret_key_here
NODE_ENV=production
EOF
```

### Krok 2: Spuštění pomocí Docker Compose
```bash
sudo docker-compose up -d
```

## Přístup k aplikaci

Po úspěšném spuštění bude aplikace dostupná na:
- **URL:** `http://your-nas-ip:3001`
- **Výchozí přihlášení:**
  - Email: `admin@kulich.cz`
  - Heslo: `admin123`

## Správa kontejneru

### Zobrazení logů
```bash
sudo docker logs kulich-app
```

### Restart kontejneru
```bash
sudo docker restart kulich-app
```

### Zastavení kontejneru
```bash
sudo docker stop kulich-app
```

### Aktualizace aplikace
```bash
# Zastavení kontejneru
sudo docker stop kulich-app

# Smazání starého kontejneru
sudo docker rm kulich-app

# Sestavení nové image
sudo docker build -t kulich-app .

# Spuštění nového kontejneru
sudo docker-compose up -d
```

## Záloha dat

### Automatická záloha databáze
Databáze SQLite se automaticky ukládá do `/volume1/docker/kulich/data/kulich.db`

### Ruční záloha
```bash
# Kopírování databáze
sudo cp /volume1/docker/kulich/data/kulich.db /volume1/backup/kulich-backup-$(date +%Y%m%d).db
```

### Obnovení ze zálohy
```bash
# Zastavení kontejneru
sudo docker stop kulich-app

# Obnovení databáze
sudo cp /volume1/backup/kulich-backup-YYYYMMDD.db /volume1/docker/kulich/data/kulich.db

# Spuštění kontejneru
sudo docker start kulich-app
```

## Řešení problémů

### Kontejner se nespustí
1. Zkontrolujte logy: `sudo docker logs kulich-app`
2. Ověřte, že port 3001 není používán jiným procesem
3. Zkontrolujte oprávnění ke složce `/volume1/docker/kulich/data`

### Databáze se nevytvoří
1. Ověřte oprávnění ke složce data
2. Zkontrolujte, že je správně namountovaný volume
3. Restartujte kontejner

### Aplikace není dostupná
1. Zkontrolujte, že kontejner běží: `sudo docker ps`
2. Ověřte port mapping
3. Zkontrolujte firewall nastavení na NAS

## Monitoring

### Health check
Aplikace má vestavěný health check dostupný na:
```
http://your-nas-ip:3001/health
```

### Sledování výkonu
```bash
# Statistiky kontejneru
sudo docker stats kulich-app

# Využití místa
sudo docker system df
```

## Bezpečnost

### Doporučení pro produkci:
1. **Změňte výchozí hesla** všech účtů
2. **Nastavte silný JWT_SECRET**
3. **Omezte přístup** pomocí firewall pravidel
4. **Pravidelně zálohujte** databázi
5. **Aktualizujte** Docker image při vydání nových verzí

### Firewall nastavení
1. V DSM jděte do **Control Panel** → **Security** → **Firewall**
2. Vytvořte pravidlo pro port 3001
3. Omezte přístup pouze na vaši lokální síť