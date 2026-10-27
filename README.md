# SAFe Agile Forge

**PI Ceremony Planner — NOVYX FORGE**

Selecteer je rol (RTE, PM, PO of Scrum Master), kies je ceremonies, voer de iteratiedatums in en exporteer je kalender als Outlook `.ics`. De applicatie is statisch, client-side en heeft geen backend.

## Productiewebsite

**https://safeforge.novyxforge.com** — hosting bij **mijn.host**, broncode op **GitHub**.

> GitHub Pages is **niet** de host. Het subdomein moet bij mijn.host bestaan en naar de eigen mijn.host-webhosting verwijzen. Zet `safeforge` in DNS niet op `fathom-web.github.io`.

## Automatisch publiceren via GitHub

Er staat een GitHub Actions-workflow in [`.github/workflows/deploy-mijnhost.yml`](.github/workflows/deploy-mijnhost.yml). Iedere push naar `main` met gewijzigde websitebestanden start automatisch de deploy zodra de repositoryvariabele `FORGE_DEPLOY_ENABLED` de waarde `true` heeft.

### Eenmalige mijn.host-inrichting

1. Open in het mijn.host controlepaneel **Hosting → je hostingpakket → Domeinnamen → Subdomeinen** en maak **safeforge** aan onder **novyxforge.com**.
2. Zoek de **eigen webroot/document root** van dit subdomein op.
3. Maak via **Hosting → je hostingpakket → FTP accounts** een **apart FTP-account uitsluitend voor SAFe Agile Forge**, met de hoofdmap exact op de webroot van het subdomein. Daarmee kan de automatische deployment nooit een andere Forge-site overschrijven.
4. Noteer de beveiligde FTPS-hostnaam, de FTP-gebruikersnaam en het wachtwoord. Gebruik een geldige FTPS-verbinding (standaard expliciete FTPS op poort 21; pas de workflow aan als mijn.host voor jouw account een andere poort voorschrijft).
5. Zorg dat `safeforge.novyxforge.com` in DNS naar je mijn.host-webhosting verwijst; gebruik de instellingen voor het subdomein vanuit mijn.host, niet de oude GitHub Pages-CNAME.

### Eenmalige GitHub-inrichting

Ga naar **Settings → Secrets and variables → Actions** in deze repository.

Maak bij **Repository secrets** exact deze drie secrets aan:

| Secret | Waarde |
| --- | --- |
| `FTP_SERVER` | FTPS-serverhost die mijn.host voor jouw pakket opgeeft |
| `FTP_USERNAME` | De gebruikersnaam van het speciale FTP-account voor safeforge |
| `FTP_PASSWORD` | Het wachtwoord van dat FTP-account |

Maak bij **Repository variables** deze variabele aan:

| Variable | Waarde |
| --- | --- |
| `FORGE_DEPLOY_ENABLED` | `true` |

De eerste deploy start je via **Actions → Deploy SAFe Agile Forge to mijn.host → Run workflow**, of door een wijziging aan `index.html` te pushen. Vervolgens gaat dat automatisch bij iedere relevante push.

### Belangrijk voor veiligheid

- De GitHub Actions-workflow publiceert alleen `index.html` en een eventuele `assets/`-map.
- Gebruik een apart, tot de webroot van `safeforge` beperkt FTP-account.
- Zet wachtwoorden nooit in code, README, screenshots of Issues; alleen in **GitHub Actions secrets**.
- De workflow is met `FORGE_DEPLOY_ENABLED` standaard uitgeschakeld, totdat je de secrets en het hostingpad hebt gecontroleerd.
- De workflow gebruikt versleutelde **FTPS**, niet onbeveiligde FTP.
- Github Actions synchroniseert de eigen websitebestanden zonder een volledige schoonmaak van de doelmap.

## Lokaal gebruiken

Open `index.html` in een browser. Geen installatie of server nodig.

## Disclaimer

Voer geen vertrouwelijke, gerubriceerde of operationeel gevoelige informatie in een publieke website in. Import van `.ics`-bestanden op werkapparatuur valt onder het lokale beveiligingsbeleid. Onafhankelijke tool, niet officieel gelieerd aan Scaled Agile.
