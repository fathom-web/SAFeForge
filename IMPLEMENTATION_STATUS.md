# SAFe Agile Forge – Implementation status

**Last reviewed:** 2026-10-28  
**Scope:** Original backlog of approximately 80 features, grouped into Ceremony Planner (C), PI Event Planner (P), UX (U), and technology/security (T).

## Delivered and working in isolated technical tests

**Ceremony Planner**
- Task-based landing → choose ceremony calendar or organize PI Planning (U01).
- Role selection, PI iteration date cascades, custom start/end lengths (C04, C06).
- Corrected Business Context and Architecture Vision content ownership; explicit planner/facilitator/content roles (C02 partial).
- Prevent overlapping selection of a full PI Planning/ART Sync/I&A and their constituent events (C05).
- ART/team context, optional import of a local PI Event Planner snapshot (C01, T01 partial).
- Personal preparation checklists and notes (C12–C13 partial).
- Holiday, overlap and cadence warnings (C07, C20 partial).
- Downloadable .ics, PDF and genuine multi-sheet XLSX (C18, C21).
- More stable event identifiers across date changes (C18 partial; Outlook reimports are not a guaranteed live update).

**PI Event Planner**
- Multi-ART/team intake, locations, rooms, speakers, attendees, catering and RSVP CSV (P01–P08; automatic mail delivery not included).
- Three readiness streams and clear incomplete points (P09–P12).
- Manual iteration capacity register by team (P14).
- Committed/uncommitted PI Objectives and Planned/Actual Business Value (P15–P18).
- Basic visual ART Planning Board with feature/enabler allocation (P19).
- Cross-ART dependency register, ROAM risk board (P20–P21).
- Management Review decision register, team and ART confidence votes, Plan Rework status, final result overview (P23–P26).
- Event agenda, tasks/deadlines, speaker confirmation, room checks, check-in, feedback and actions (P05–P08, P27–P31 partial).
- PDF event draaiboek and **20-tab editable .xlsx**.
- Local JSON backup/import and **Undo** using a 12-revision browser history (T03, U11).
- Prepare → Execute → Close navigation and plain-language glossary (U04, U09).

## Partially implemented — needs product-level acceptance

| ID(s) | Gap |
|---|---|
| C01–C04 | Full team-level role/participant permission matrix, validation against authoritative role definitions |
| C07–C09 | Team-specific vacations, flexible custom cadence, explicit PI-to-PI continuity and recurring exceptions |
| C12–C17 | Facilitation/live event mode and structured outputs/actions attached to every ceremony |
| C18–C22 | Real calendar update/cancel flow, calendar month/week UI and longer-term effectiveness metrics |
| P02, P19–P22 | Truly independent ART agendas, richer board dependencies/milestones, version comparison of draft vs final plan |
| P24–P26 | Confidence vote review/rework workflow requires human governance; this tool records votes but cannot guarantee consensus |
| U02–U08 | Beginner/expert toggle affects glossary preference; not every form has a contextual wizard or automatic next action |
| U10–U16 | Demo dataset, cross-module search, advanced accessibility/mobile testing, fully localized English interface |
| T01–T03 | Shared ART metadata is imported locally, not centrally synchronized; project archive/clone feature still absent |
| T07–T10 | Privacy impact review, verification of GitHub CI runs, profile-specific versioning, comprehensive copyright/legal review |

## Not achievable securely on the current static-only hosting without new infrastructure

- T04: Multi-user authentication, shared organization/event access and edit permissions.
- T05: Central collection and automatic reconciliation of RSVP responses. Current link sends via the participant’s own mail client or CSV.
- T06: Verified Microsoft 365/Outlook/Defensie integrations, secure invitation sending and cancellation handling.
- C10 / T09: Fully separate AI-Native SAFe event model. Current methodology defaults are based on **classical** PI Planning; avoid mixing these profiles.
- Business/departmental deployment with protected location, personnel, classified or operational content requires an approved hosting and security design.

## Quality and rollout checklist

- [x] All five JavaScript entry points compile in isolated syntax checks.
- [x] Test cases exercise classical PI method screens, objective and ROAM data, and confidence voting.
- [x] The PI Event Planner exports a structurally valid PDF and a ZIP-backed workbook with 20 spreadsheet sheets.
- [x] The Ceremony Planner generates a PDF and an XLSX-compatible workbook.
- [ ] Real browser acceptance test: current Chrome/Edge/Safari, Windows/macOS/iOS/Android.
- [ ] Verify data retention/import after migration and refresh on live DirectAdmin hosting.
- [x] Regression test suite and GitHub Actions workflow committed (`tests/smoke.mjs`); first GitHub CI execution not independently verified.
- [ ] Accessibility and keyboard-screen-reader testing.
- [ ] Get SAFe content signoff from experienced RTE/PM/BO/System Architect.
- [ ] Security/privacy and organizational approval before using real personnel or operational information.

## Deployment

Source: https://github.com/fathom-web/SAFeForge

On **mijn.host DirectAdmin → Git → safeforge → FETCH → DEPLOY**. GitHub push itself does not automatically deploy the static website.

The site is a planning aid, is not approved by Scaled Agile, Inc., and does not connect to Defensie or Outlook systems.
