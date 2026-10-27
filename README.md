# SAFe Agile Forge

**SAFe Agile Forge — PI Ceremony Planner & PI Event Command Center**, a NOVYX FORGE project.

Select a role (RTE, PM, PO or Scrum Master) to plan ceremonies, or select PI Planner to organize the event itself. In the ceremony planner, select ceremonies, enter your PI iteration dates, preview the proposed events and download an Outlook-compatible `.ics` calendar. Runs entirely in the browser without a backend.

## Hosting and publication

- **Production address:** https://safeforge.novyxforge.com (intended; activate subdomain and SSL at mijn.host).
- **Source control:** https://github.com/fathom-web/SAFeForge (branch `main`).
- **Hosting:** mijn.host / DirectAdmin, **not GitHub Pages**.
- **Deployment:** DirectAdmin Git Manager, same method as the main NovyxForge site: **FETCH → DEPLOY**.
- There is **no FTP GitHub Actions workflow** and no FTP credentials are needed.

### Initial hosting setup

1. At mijn.host, go to **Hosting → your hosting package → Open DirectAdmin**.
2. In DirectAdmin, open **Subdomain Management** for `novyxforge.com`, and add `safeforge`.
3. Note the actual **document root** displayed for the new subdomain. A standard independent subdomain often uses `domains/safeforge.novyxforge.com/public_html`; legacy layouts can differ. **Do not guess this path or deploy to the main site's root.**
4. Open **Git Manager** in DirectAdmin under the hosting account, create/import a **new** Git repository:
   - Remote: `https://github.com/fathom-web/SAFeForge.git`
   - Branch: `main`
   - Keyfile: blank (repository is public)
   - Deploy directory: **exactly the subdomain document root** obtained in step 3.
5. Use **FETCH**, then **DEPLOY**. Confirm `index.html` appears in the subdomain document root and the site loads.
6. Activate SSL/HTTPS for `safeforge.novyxforge.com` using the hosting control panel.
7. Every subsequent push to GitHub can be deployed through **FETCH → DEPLOY**. Automatic updates require configuring a DirectAdmin webhook/automation separately; a GitHub push alone does not currently auto-deploy.

Do **not** change the Git deployment or document root for `novyxforge.com`. The website and repository must remain isolated.

## PI Event Command Center (new)

The landing page includes a **PI Planner** choice, separate from the RTE / PM / PO / Scrum Master calendar workflows.

### Event wizard
- Number of ARTs, ART names, teams per ART, team members and breakout sizing.
- PI Planning dates, location, remote/hybrid setting, joint or parallel ART planning.
- Organizer, contact address, stakeholders, facilitators and expected attendance.

### Event operations
- Editable two-day SAFe-inspired program, rooms and team assignments.
- Per-ART registration summaries and cross-ART dependencies.
- Organizer task assignments, deadline and milestone tracking, speaker confirmations.
- Room capacities, session overlaps, double-booked speaker warnings.
- Participant and RSVP status, CSV import/export, catering preferences, onsite check-in.
- Checklist, event feedback, post-event actions.
- Offline generated **PDF event draaiboek** and **real .xlsx workbook** with 12 data tabs.
- Outlook-compatible calendar (.ics) for the event or program.
- Shareable **RSVP form** at `rsvp.html`: responses via the participant's email client or a downloadable CSV that the organizer imports.

### Current architectural limits
This version is static HTML/JS, hosted without a backend. Event data is stored **per browser** in localStorage and can be backed up/imported as JSON. There is **no server-side multi-organizer synchronization, online database, centralized RSVP collection, automatic email delivery, live room reservations or direct Outlook/Defensie integration**. The RSVP link provides a prefilled form, but recipients must explicitly send an email or export a CSV; their response is not silently collected by the app.

Treat generated documents as proposed plans requiring organizational review. Only use public / nonsensitive information in the publicly hosted interface. Do not enter classified or operationally sensitive information, protected facility details, or unnecessary personal/medical data. Prefer minimizing names, email addresses, and dietary preference details where possible; handle exported files securely.

## Security and disclaimer

The app is a local browser-based calendar proposal tool. It does not connect to Microsoft 365 or Defensie systems. Imported `.ics` files are not automatically distributed as meeting invitations. Do not enter operationally sensitive or classified information in a publicly hosted tool. Independent project, not affiliated with Scaled Agile.
