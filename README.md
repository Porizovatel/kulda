# KuLiCh - Kuželkářská Liga Chrástu

Webová aplikace pro správu kuželkářské ligy s podporou InfluxDB běžící na Synology NAS.

## Funkcionalita

Aplikace podporuje tři uživatelské role:

1. **Admin** - má plný přístup ke všem částem aplikace včetně správy uživatelů
2. **Správce** - může editovat týmy, hráče, zápasy, výsledky a rozpisy  
3. **Čtenář** - má přístup jen ke čtení informací

## Požadavky

- Synology NAS s DSM 7.2.2
- Container Manager (Docker) nainstalovaný
- Node.js 18+ pro vývoj
- InfluxDB 2.x

## Krok za krokem - Instalace na Synology NAS

### 1. Instalace InfluxDB na Synology NAS

1. **Otevřete Container Manager** v DSM
2. **Registry** → Vyhledejte "influxdb" → Stáhněte "influxdb:2.7-alpine"
3. **Image** → Vyberte stažený obraz → **Launch**
4. **Obecné nastavení:**
   - Název kontejneru: `influxdb-kulich`
   - Povolit automatický restart
5. **Pokročilé nastavení:**
   - **Porty:** Místní port 8086 → Port kontejneru 8086
   - **Svazky:** Vytvořte novou složku `/docker/influxdb` a namapujte na `/var/lib/influxdb2`
   - **Proměnné prostředí:**
     ```
     DOCKER_INFLUXDB_INIT_MODE=setup
     DOCKER_INFLUXDB_INIT_USERNAME=admin
     DOCKER_INFLUXDB_INIT_PASSWORD=AdminPassword123
     DOCKER_INFLUXDB_INIT_ORG=kulich
     DOCKER_INFLUXDB_INIT_BUCKET=bowling_league
     DOCKER_INFLUXDB_INIT_ADMIN_TOKEN=your-super-secret-token-here
     ```
6. **Spustit** kontejner

### 2. Ověření InfluxDB

1. Otevřete webový prohlížeč a jděte na `http://IP_VAŠEHO_NAS:8086`
2. Přihlaste se pomocí:
   - Uživatel: `admin`
   - Heslo: `AdminPassword123`
3. Ověřte, že organizace "kulich" a bucket "bowling_league" existují

### 3. Příprava aplikace

#### Stažení a konfigurace

```bash
# Klonování nebo stažení projektu
git clone <url_repozitáře> kulich-app
cd kulich-app

# Instalace závislostí
npm install

# Vytvoření konfiguračního souboru
cp .env.example .env
```

#### Konfigurace .env souboru

```bash
# Upravte .env soubor s IP adresou vašeho NAS
VITE_INFLUXDB_URL=http://192.168.1.100:8086
VITE_INFLUXDB_TOKEN=your-super-secret-token-here
```

**Poznámka:** Nahraďte `192.168.1.100` skutečnou IP adresou vašeho NAS a `your-super-secret-token-here` tokenem z kroku 1.

### 4. Vývoj a testování

```bash
# Spuštění vývojového serveru
npm run dev

# Aplikace bude dostupná na http://localhost:5173
```

### 5. Produkční nasazení na NAS

#### Možnost A: Přímé nasazení

```bash
# Sestavení aplikace
npm run build

# Zkopírování do Web Station
# Zkopírujte obsah složky 'dist' do složky webu na NAS
# Například do /volume1/web/kulich/
```

#### Možnost B: Docker kontejner

1. **Vytvořte Dockerfile:**

```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

2. **V Container Manager:**
   - Importujte projekt jako Docker image
   - Nastavte port 80 → 3000 (nebo jiný volný port)
   - Spustit kontejner

### 6. Síťové nastavení

1. **Firewall:** Zajistěte, že porty 8086 (InfluxDB) a 3000 (aplikace) jsou povoleny
2. **DHCP rezervace:** Doporučujeme nastavit statickou IP pro NAS
3. **Port forwarding:** Pokud chcete přístup z internetu, nastavte port forwarding na routeru

### 7. První přihlášení

1. Otevřete aplikaci v prohlížeči
2. Výchozí admin účet:
   - Email: `admin@kulich.cz`
   - Heslo: `admin123`
3. **DŮLEŽITÉ:** Ihned změňte heslo po prvním přihlášení

### 8. Konfigurace týmů a sezón

1. Přihlaste se jako admin
2. Vytvořte novou sezónu
3. Přidejte týmy a hráče
4. Nastavte rozpis zápasů

## Údržba

### Zálohování

```bash
# Záloha InfluxDB dat
docker exec influxdb-kulich influx backup /backup
```

### Čištění logů

```bash
# V Container Manager → Vyberte kontejner → Logy → Vymazat
```

### Monitoring

- Sledujte využití paměti a CPU v Container Manager
- Kontrolujte logy InfluxDB kontejneru

## Řešení problémů

### InfluxDB se nespustí
- Zkontrolujte logy kontejneru
- Ověřte, že port 8086 není obsazen
- Zkontrolujte oprávnění složky `/docker/influxdb`

### Aplikace se nemůže připojit k InfluxDB
- Ověřte IP adresu v .env souboru
- Zkontrolujte firewall nastavení
- Ověřte, že InfluxDB kontejner běží

### Pomalé načítání
- Zkontrolujte síťové připojení
- Možná potřebujete více RAM pro NAS
- Zvažte SSD cache pro Docker

## Podpora

Pro podporu a hlášení chyb použijte GitHub issues nebo kontaktujte administrátora ligy.

## Licence

MIT License