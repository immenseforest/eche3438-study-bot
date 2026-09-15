# ECHE 3438 Study Bot

A self-hosted Discord study assistant with guided learning, article discovery and persistent 24-hour / 12-hour reminders. Each Discord server chooses its own channel and keeps independent settings. No AI API subscription is required.

**Live bot name:** `eche3438groupCbog`. **Repository/package name:** `eche3438-study-bot`.

## Add the running bot

[Invite eche3438groupCbog](https://discord.com/oauth2/authorize?client_id=1549558733233717350&scope=bot%20applications.commands&permissions=117760&integration_type=0), then run `/eche setup channel:#study-channel` as a server manager. The invite installs the maintainer-hosted application; Discord does not host its process. This is a dedicated course application with a different application ID and credential from the journal bot.

The live service has a private ECHE course pack. This public repository includes only demonstration content with no scheduled events. Instructor documents, extracted text, local study packs, credentials, channel IDs and delivery records are excluded.

## Run your own instance

Requires Node.js 22.12+ and npm.

```sh
npm ci
cp .env.example .env
cp config.example.json config.json
npm test
npm start
```

On Windows use `Copy-Item` instead of `cp`, or copy those files in Explorer. Set `ECHE_DISCORD_BOT_TOKEN` in `.env` to your own Discord bot token. Create your own application in the Discord Developer Portal; set both its application name and bot username as desired. Only the Guilds intent is used; Message Content is unnecessary. Invite your application with bot and applications.commands scopes and permissions 117760 (view, send, read history, embed links, attach files).

Open http://127.0.0.1:3438. Then use `/eche setup` in your server. Choose a channel whose existing access matches your study group; the bot does not change channel permissions. Only members who can access that channel can use course commands there. Global command registration may take a little time to appear.

## Commands

| Command | Purpose |
| --- | --- |
| `/eche setup` | Select the server's reminder channel; Manage Server required |
| `/eche learn` | Six-step learning wizard with Back/Next and a prediction reveal |
| `/eche guide` | Download chapter summaries and reading suggestions |
| `/eche plan`, `/eche next` | Full preparation plan or upcoming sessions |
| `/eche prompt` | Reusable prompt for deeper study with an assistant |
| `/eche questions` | Questions to ask the instructor or technician |
| `/eche read` | Related Crossref article metadata, cached seven days |
| `/eche topic` | Record a confirmed tutorial topic; Manage Server required |
| `/eche status`, `/eche pause`, `/eche resume` | Inspect or control reminders |
| `/eche resolve` | Reconcile uncertain delivery after checking channel history |

## Add course content privately

Create `private/course.mjs` and `private/study.mjs` using the interfaces in [docs/COURSE-PACK.md](docs/COURSE-PACK.md). These paths are ignored by Git. The demonstration modules document the minimum exports. Restart after changing a course pack. Use materials you are authorized to use; open-sourcing the engine does not grant rights to redistribute teaching materials.

## Reliability and limitations

- Checks every 30 seconds. Configure timezone-aware UTC start timestamps in your pack. The supplied live course uses America/Toronto.
- After downtime, delivers the most recent applicable preparation window, not both missed reminders. Past events are skipped.
- Receipts survive restarts. Ambiguous sends are held for manual reconciliation to reduce duplicates.
- Each server has independent channel, pause, topic overrides and receipt state. Changing its channel starts new delivery history for that destination.
- Keep the host awake and online. Run only one process against a state directory. The dashboard port prevents a second instance on the same port, but this is not a distributed service.
- Crossref results are metadata, not verified summaries or promises of free full-text access.
- No deadlines or results should be invented. Review D2L/instructor updates yourself; this bot does not monitor D2L.
- Dashboard is loopback-only and read-only. Do not expose it publicly without adding authentication.
- Calendar export includes session alarms; import behaviour depends on your calendar app.

## Development

`npm test` exercises reminder windows, legacy-state migration and concurrent server isolation. Core files: `src/server.mjs` (Discord + local HTTP), `src/guild-state.mjs` (scoped state), `src/reminders.mjs` (scheduling), `src/research.mjs` (article discovery), and course-pack loaders. No build step.

MIT license applies to the code and demonstration content in this repository. External linked publications and locally added course packs retain their own rights. AI-assisted development and explanations should be reviewed by people who understand the course.
