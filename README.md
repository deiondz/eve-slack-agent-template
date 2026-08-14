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
  host must have the `gh` CLI installed and authenticated.

The Slack app uses the HTTP Events API. Its event and interactive request URL is
`https://sketch.manasijatech.com/eve/v1/slack`. Create or update the app from
[`app.manifest.yaml`](./app.manifest.yaml); the manifest includes the required
bot scopes, subscribes to `app_mention` and `message.im`, enables interactive
callbacks, and explicitly disables Socket Mode.

Deploy the agent at the public URL before Slack verifies the request URL. Then
install the app to the workspace and copy its Bot User OAuth Token and Signing
Secret to `SLACK_BOT_TOKEN` and `SLACK_SIGNING_SECRET`. Eve verifies every HTTP
request with Slack's signing secret before dispatching it.

Eve recommends Vercel Connect for managed Slack credentials. To use it instead
of direct credentials, create a Slack client with triggers, attach the Eve Slack
route, and set the returned client UID as `SLACK_CONNECTOR`:

```bash
vercel connect create slack --triggers
vercel connect detach <uid> --yes
vercel connect attach <uid> --triggers --trigger-path /eve/v1/slack --yes
```

`SLACK_CONNECTOR` takes precedence over `SLACK_BOT_TOKEN` and
`SLACK_SIGNING_SECRET` when both are present.

Run the development server with:

```bash
pnpm dev
```

Slack cannot reach a local-only server. For live Slack testing, deploy the app
or expose the local server through a trusted HTTPS tunnel and temporarily update
both request URLs in the Slack app settings. Run `pnpm start` after `pnpm build`
on a persistent production host.

A successful `pnpm build` deletes the previous local Eve workflow sessions from
`.eve/.workflow-data`. This prevents unfinished runs from an older build from
being re-enqueued against new agent instructions. Stop the running Eve process
before building, then restart it with `pnpm start`. A failed build leaves the
existing sessions untouched.

The production start commands set `TZ=UTC` because Eve schedule expressions are
stored in UTC. Stand-up dates and displayed times still use `Asia/Kolkata`.

The default development commands keep detailed agent event logging off. For a
targeted debugging session, use `pnpm dev:debug` to show expanded Eve tool,
reasoning, and subagent activity plus the app's durable runtime event logs.
Debug output can contain sensitive conversation and integration data.

Every generated root and subagent session is also indexed in the durable
`agent_session_logs` table. Each row records the Eve session ID, agent and
channel identity, model/runtime version, creation time, and parent invocation
metadata for delegated sessions. The index is idempotent and intentionally does
not copy message contents or authentication data. Build cleanup removes the old
Eve streams but retains these metadata-only audit rows; only session IDs from the
current build can be used to locate a local durable stream.

Run the tests and compile the Eve agent with:

```bash
pnpm test
pnpm typecheck
pnpm build
```

Production schedules run Monday-Friday in `Asia/Kolkata`:

- 09:40 — create/update the Morning digest and DM every employee.
- 10:20 — refresh the Morning digest and remind employees still awaiting an update.
- 16:30 — create/update the Evening digest and request accomplishments.
- 17:00 — refresh the Evening digest and remind employees still awaiting an update.

Eve writes production cron expressions in UTC. In development, trigger schedules manually through `POST /eve/v1/dev/schedules/morning-standup`, `morning-reminder`, `evening-standup`, or `evening-reminder`.

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
