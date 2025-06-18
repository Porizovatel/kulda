# KuLiCh - Kuželkářská Liga Chrástu

Webová aplikace pro správu kuželkářské ligy s lokální databází.

## Funkcionalita

Aplikace podporuje tři uživatelské role:

1. **Admin** - má plný přístup ke všem částem aplikace včetně správy uživatelů
2. **Správce** - může editovat týmy, hráče, zápasy, výsledky a rozpisy  
3. **Čtenář** - má přístup jen ke čtení informací

## Technologie

- **Frontend:** React 18 + TypeScript + Tailwind CSS
- **Databáze:** IndexedDB (lokální databáze v prohlížeči)
- **Autentifikace:** Lokální systém s hashovanými hesly
- **Build:** Vite
- **Ikony:** Lucide React

## Instalace a spuštění

### Požadavky

- Node.js 18+
- npm nebo yarn

### Lokální vývoj

```bash
# Klonování projektu
git clone <url_repozitáře>
cd kulich-app

# Instalace závislostí
npm install

# Spuštění vývojového serveru
npm run dev

# Aplikace bude dostupná na http://localhost:5173
```

### Produkční build

```bash
# Sestavení aplikace
npm run build

# Náhled produkční verze
npm run preview
```

## První přihlášení

Při prvním spuštění aplikace se automaticky vytvoří výchozí admin účet:

- **Email:** admin@kulich.cz
- **Heslo:** admin123

**DŮLEŽITÉ:** Ihned změňte heslo po prvním přihlášení!

## Struktura aplikace

### Databáze

Aplikace používá IndexedDB pro lokální ukládání dat:

- **teams** - informace o týmech
- **players** - hráči a jejich historie
- **matches** - zápasy a výsledky
- **seasons** - sezóny
- **users** - uživatelé a jejich role
- **sessions** - přihlašovací relace

### Komponenty

- **Layout** - hlavní rozložení s navigací
- **RouteGuards** - ochrana tras podle rolí
- **Modály** - formuláře pro přidávání/editaci dat
- **ImportModal** - import/export dat

### Stránky

- **Dashboard** - přehled statistik
- **Teams** - správa týmů
- **Players** - správa hráčů
- **Matches** - správa zápasů
- **Schedule** - rozpis zápasů
- **Standings** - ligová tabulka
- **PlayerStats** - statistiky hráčů
- **Users** - správa uživatelů (pouze admin)

## Funkce

### Správa týmů
- Přidávání/editace týmů
- Nastavení hracích časů
- Správa hráčů v týmu

### Správa zápasů
- Ruční přidávání zápasů
- Automatické generování rozpisu
- Zadávání výsledků
- Výpočet bodů podle pravidel

### Statistiky
- Ligová tabulka
- Statistiky hráčů
- Přehledy výkonů

### Import/Export
- Export dat do Excel souboru
- Import dat z Excel souboru
- Záloha celé databáze

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

- Lokální autentifikace s hashovanými hesly
- Role-based přístup k funkcím
- Automatické odhlášení po vypršení relace
- Ochrana tras podle uživatelských rolí

## Údržba

### Záloha dat
Použijte funkci Export v aplikaci pro vytvoření zálohy všech dat.

### Čištění dat
Aplikace automaticky čistí vypršené přihlašovací relace.

## Podpora

Pro podporu a hlášení chyb použijte GitHub issues nebo kontaktujte administrátora ligy.

## Licence

MIT License