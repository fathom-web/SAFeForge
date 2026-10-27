# SAFe Agile Forge

**PI Ceremony Planner** by NOVYX FORGE.

Selecteer je rol (RTE, PM, PO of Scrum Master), kies de SAFe-ceremonies die je wilt plannen, vul de PI-iteraties in en download een Outlook-compatibel **.ics**-bestand.

## Website

Beoogd domein: **https://safeforge.novyxforge.com**

De website werkt client-side; er is geen backend, geen API en geen koppeling met Microsoft 365 of Defensiesystemen. Een geëxporteerd kalenderbestand moet de gebruiker zelf in Outlook importeren; er worden geen uitnodigingen verstuurd.

## GitHub Pages activeren

1. Open **Settings → Pages** van deze repository.
2. Kies **Deploy from a branch**, branch **main**, folder **/(root)** en klik **Save**.
3. Controleer bij **Custom domain** dat **safeforge.novyxforge.com** is ingesteld, en klik zonodig **Save**.
4. Configureer bij je DNS-provider een **CNAME** met naam **safeforge** en waarde **fathom-web.github.io** (zonder repositorynaam).
5. Wanneer het certificaat gereed is, schakel **Enforce HTTPS** in.

> Het `CNAME`-bestand staat reeds in de repository. Maak géén nieuwe A-records of wijzigingen aan je hoofddomein `novyxforge.com`.

## Gebruik

1. Stel de iteratiedatums in.
2. Kies je rol en je ceremonies.
3. Bekijk de voorgestelde kalender, pas tijdstippen aan en download het `.ics`-bestand.
4. Controleer de afspraken na import in Outlook.

## Beveiliging

Voer op deze publieke website geen gerubriceerde of operationeel gevoelige gegevens in. Of bestanden op een werkapparaat geïmporteerd mogen worden, wordt bepaald door het lokale beveiligingsbeleid.

Dit is een onafhankelijke tool, niet officieel gelieerd aan Scaled Agile.
