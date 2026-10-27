# SAFe Agile Forge

**SAFe Agile Forge — PI Ceremony Planner**, a NOVYX FORGE project.

Select a role (RTE, PM, PO or Scrum Master), select ceremonies, enter your PI iteration dates, preview the proposed events and download an Outlook-compatible `.ics` calendar. Runs entirely in the browser without a backend.

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

## Security and disclaimer

The app is a local browser-based calendar proposal tool. It does not connect to Microsoft 365 or Defensie systems. Imported `.ics` files are not automatically distributed as meeting invitations. Do not enter operationally sensitive or classified information in a publicly hosted tool. Independent project, not affiliated with Scaled Agile.
