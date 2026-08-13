This is a multi-workflow Slack agent built with [eve](https://beta.eve.dev). Its first workflow manages appendable morning plans and evening accomplishments for a configured team.

Its second workflow turns authenticated Slack bug reports and concrete feature
requests into formatted GitHub issues. It maps Myuki reports to the appropriate
repository, links the original Slack thread, deduplicates retries, posts the
result to `C0BPD515TB4`, suggests likely owners by matching GitHub collaborators
to Slack profiles, and waits for an employee to explicitly choose an assignee.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Feve-slack-agent-template%2Ftree%2Fmain&connect=%5B%7B%22type%22%3A%22slack%22%2C%22env%22%3A%22SLACK_CONNECTOR%22%2C%22triggers%22%3Atrue%2C%22triggerPath%22%3A%22%2Feve%2Fv1%2Fslack%22%7D%5D)


## Getting Started

Use Node.js 24 or newer (required by the installed Eve version).

Copy `.env.example` to `.env`, then configure:

- Run `codex login` on the persistent host. Eve uses that local login to serve
  the pinned `gpt-5.6-luna` model through the Codex backend.
- Slack credentials.
- `SLACK_DAILY_UPDATES_CHANNEL_ID` and `STANDUP_ROSTER_JSON` as the one-time bootstrap configuration. After the first database initialization, a configured manager can view or change both through Slack chat and the persisted values take precedence.
- `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in deployed environments. Local development defaults to `standup.sqlite`.
- `GH_TOKEN` and `ISSUE_ROUTING_CHANNEL_ID` for Slack-to-GitHub issue tracking. The runtime
  host must have the `gh` CLI installed and authenticated; this workflow is
  intended for the persistent Socket Mode deployment.

The Slack app needs bot scopes for mentions, posting/updating messages, opening DMs, reading DM history, resolving member profiles, and reading channels used for issue routing (`app_mentions:read`, `chat:write`, `im:write`, `im:history`, `users:read`, `users:read.email`, `channels:history`, and `groups:history`). Subscribe it to `app_mention` and `message.im` events. For Socket Mode, enable it in the app manifest and create an app-level token with `connections:write`; set that `xapp-...` value as `SLACK_APP_TOKEN` and the installed bot's `xoxb-...` value as `SLACK_BOT_TOKEN`.

When using Vercel Connect, link the project and pull environment variables:

```bash
vercel link
vercel env pull
```

Then, run the development server:

```bash
pnpm dev:socket
```

`dev:socket` starts Eve and a Socket Mode client in one long-running process.
Use `pnpm start:socket` after `pnpm build` in production. Socket Mode requires a
persistent Node process and is not suitable for a Vercel serverless deployment;
use the Vercel Connect webhook setup there instead.

Run the tests and compile the Eve agent with:

```bash
pnpm test
pnpm typecheck
pnpm build
```

Production schedules run Monday-Friday in `Asia/Kolkata`:

- 09:40 — create/update the Morning digest and DM every employee.
- 16:40 — create/update the Evening digest and request accomplishments.
- 17:00 — remind only employees still awaiting an evening response.

Eve writes Vercel cron expressions in UTC. In development, trigger schedules manually through `POST /eve/v1/dev/schedules/morning-standup`, `evening-standup`, or `evening-reminder`.

The root agent owns Slack and schedules. Stand-up conversations are delegated to the declared `agent/subagents/standup/` specialist, whose CRUD tools authorize directly against the authenticated Slack context Eve propagates into the child session rather than trusting message text.

Issue reports and assignment follow-ups are delegated to
`agent/subagents/issue-tracker/`. Slack authenticates the real reporter and
source-thread metadata before model dispatch, and Eve propagates that context
into the child session without an extra model tool call. The specialist's tools constrain GitHub writes to the
`manasijatech` organization and use `gh` for every GitHub operation. Repository
routing aliases, product roles, activity signals, and likely context contacts
for all 38 repositories live in `agent/lib/issues/repositories.ts`. Contributor
signals are presented as contacts, not as confirmed ownership.

Configured managers can say things like “show the stand-up configuration,”
“use channel `C0123456789` for daily updates,” or “add `<@U123>` to the
stand-up roster as Sam.” Roster changes are persisted in the stand-up database;
the agent reads the current roster before applying partial changes.
Roster roles are `employee`, `manager`, or `employee_manager`; the last option
both participates in stand-ups and has manager permissions.

You can start editing the agent by modifying `agent/agent.ts`. Its behavior is defined in `agent/instructions.md`, and tools live in `agent/tools/`. The agent auto-updates as you edit the files.

This project uses the Eve framework's bundled guides — see `node_modules/eve/docs/` after installing dependencies.

## Learn More

To learn more about eve, take a look at the following resources:

- [Eve Documentation](https://beta.eve.dev/docs/introduction) - learn about Eve features and API.
- [Vercel Connect](https://vercel.com/docs) - manages the Slack channel's credentials in this template.

You can check out [the Eve GitHub repository](https://github.com/vercel/eve) - your feedback and contributions are welcome!

<img width="1552" height="1013" alt="Image Edit Request" src="https://github.com/user-attachments/assets/115c947d-1b7d-4464-8d57-91f2dd8758f0" />
