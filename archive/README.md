# Cyber Attack Journaling Tool

Website-based cyber incident journaling with separate pages for Cases and Events.

## Pages

- `http://localhost:3000/` redirects to Event Logger
- `http://localhost:3000/event-logger`
  - Create and search Events
  - New case creation is explicit via `Create new case if no case is selected`
  - Edit page: `/event-edit?id=<eventId>`
- `http://localhost:3000/case-logger`
  - Create and search Cases
  - Edit page: `/case-edit?id=<caseId>`
  - Timeline view per case (chronological event summaries with expandable details)
- `http://localhost:3000/timelines`
  - Each case has its own visual event timeline (chronological)
  - Filter by search, severity, team, status, and direction
- `http://localhost:3000/wiki`
  - Shared wiki pages (create/edit/delete)
  - Shared checklist (add/update/toggle/delete)

## Case Fields

- Team Number (`1` or `2`)
- First Reported (first event date)
- Last Updated (last added event)
- Severity (`Low`, `Medium`, `High`, `Critical`)
- Owner
- Status (`Triage`, `Event`, `Incident`, `Critical`, `Review`, `Closed`)
- Current Action / Next Steps
- Summary
- Details

## Event Fields

- Case (optional only when explicit "Create new case..." is enabled)
- Time (default current time)
- Auto-generated Case ID
- Team Number (`1` or `2`)
- Severity (`Low`, `Medium`, `High`, `Critical`)
- Event Type (`Finding/ Evidence`, `Action`, `Decision`, `Meeting`, `Join/Leave`, `Comms`, `Note`)
- Summary
- Details
- Services Affected (reusable)
- Hosts Affected (reusable)
- Owner (reusable)
- Tags (reusable)

## Reusable Values

- Dedicated quick-add form for reusable catalog values
- Inline `+` buttons next to event/case inputs to add typed values directly to reusable lists
- Inline dropdown menus in event fields to insert saved values directly
- Quick-value delete form (user-accessible) to remove saved catalog values

## Live Refresh

- Event and Case pages poll a lightweight change-state endpoint and refresh only when a new case or event was created
- Change-state endpoint: `GET /api/changes`

## Filters

- Event Logger supports field-level filters:
  - search, case, severity, team, event type, event case id, case reference, summary, details, service, host, owner, tag, time from/to
  - sort by + order
- Case Logger supports field-level filters:
  - search, severity, team, status, case reference, owner, summary, details, current action, first reported from/to, last updated from/to
  - sort by + order

## Timeline

- Case cards include a visual timeline:
  - Events are listed in chronological order
  - Summary is shown directly
  - `More detail` expands full event details and context fields
- Case board default view is compact; expanded detail is behind `More detail`

## CSV Import / Export

- Export endpoints:
  - `GET /api/export/cases.csv`
  - `GET /api/export/events.csv`
- Import endpoints:
  - `POST /api/import/cases.csv` (body: CSV text)
  - `POST /api/import/events.csv` (body: CSV text)
- Case Logger UI includes direct export buttons and CSV file import forms

## Admin Actions

- `Case Logger` includes an admin icon in the top bar; clicking it opens admin-password-protected actions:
  - `Delete Events`
  - `Delete Cases + Events`
  - `Delete All Data`
- Backend endpoints:
  - `POST /api/admin/delete-events`
  - `POST /api/admin/delete-cases`
  - `POST /api/admin/reset-database`
- All admin endpoints require JSON body `{ "password": "..." }`
- Requires `ADMIN_PASSWORD` environment variable

Catalog API:

- `POST /api/catalog/{type}` to add reusable value (`type` in `services|hosts|owners|tags`)
- `DELETE /api/catalog/{type}` to delete reusable value (JSON body `{ "name": "..." }`)

## Run PostgreSQL (Docker only)

```bash
docker compose up -d
```

This starts PostgreSQL on `localhost:5433`.

Default credentials from `docker-compose.yml`:

- DB: `journaling`
- User: `journaling`
- Password: `journaling`

## Run Website Locally (Bun)

Install dependencies:

```bash
bun install
```

Run:

```bash
bun run start
```

## Configuration

The app reads:

- `PORT` (default: `3000`)
- `DATABASE_URL` (default: `postgresql://journaling:journaling@localhost:5433/journaling`)
- `ADMIN_PASSWORD` (required to enable database reset)

Example:

```bash
export DATABASE_URL="postgresql://journaling:journaling@localhost:5433/journaling"
export ADMIN_PASSWORD="change-me"
bun run start
```

Or create a local `.env` file:

```bash
DATABASE_URL=postgresql://journaling:journaling@localhost:5433/journaling
ADMIN_PASSWORD=change-me
```
