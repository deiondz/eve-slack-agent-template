# Manasija GitHub repository and contributor inventory

> **Internal / sensitive.** This report includes metadata and contributor information for private repositories visible to the authenticated `TechManasija` GitHub profile. Do not publish it without review.

_Snapshot: 2026-08-13 (Asia/Kolkata)._

## Scope and identity

The requested organization is [Manasija](https://github.com/manasijatech), whose GitHub login is `manasijatech`. GitHub reports the organization name as “Manasija” and describes it as AI-powered market intelligence, trading workflows, and developer infrastructure. The similarly named [`manasija`](https://api.github.com/users/manasija) namespace is an unrelated personal user account, not this organization. Collection used the authenticated [`TechManasija`](https://github.com/TechManasija) profile, which has `repo` and `read:org` access.

The paginated [organization repository endpoint](https://api.github.com/orgs/manasijatech/repos?type=all&per_page=100) returned **38 repositories: 5 public and 33 private**. None is archived, disabled, or a fork. Two (`lovable-manasija`, `r2-viewer`) are empty. Across the snapshot there are 8 stars, 1 fork, and 16 open issues as reported by repository metadata; these totals are mutable and private-repository counts are access-dependent. The organization profile and mission are also documented in its [profile README](https://github.com/manasijatech/.github/blob/main/profile/README.md).

Manasija has two primary product families, **Drishti** and **Myuki**, plus **Ananta**, a single open-source project with a private desktop companion. The repository evidence also shows shared services, internal tooling, and earlier or experimental applications. The product map below separates those categories instead of presenting all repositories as independent products.

## Methodology and interpretation

- Repository metadata comes from each repository's GitHub REST resource (`https://api.github.com/repos/manasijatech/<repo>`), topics endpoint, and recursive default-branch tree. Dates are ISO 8601 UTC. `Updated` is GitHub's repository metadata update time; `pushed` is the latest repository push time. GitHub's `open_issues_count` field includes open pull requests as well as issues.
- Purpose statements prioritize the repository's root README, then package manifests and named source files. A generic scaffold README is not treated as proof of the product's purpose. “Unknown” means the accessible repository evidence is insufficient.
- Contributor data comes from the paginated [`contributors`](https://docs.github.com/en/rest/repos/repos#list-repository-contributors) endpoint with `per_page=100&anon=1`. Counts are GitHub's contributor-endpoint `contributions` values, generally contributions attributed to the repository's default branch; they are not a full audit of every branch, deleted account, squash attribution, co-author, or collaborator.
- GitHub logins are deduplicated case-insensitively in the organization summary. Anonymous commit-author records have no GitHub login and therefore remain separate, grouped only by the author name returned by GitHub. Similar names are **not** assumed to be the same person. Accounts with API type `Bot` are marked as bots; `manasijatech-org` is returned as type `User` and is not reclassified.
- Direct links to private repositories require a GitHub account with access. “No detected license” means GitHub's license detector returned no SPDX license; it is not legal advice about repository contents.

## Product and repository map

This map records the agreed product model. A repository can support a product without being a separate product. The **activity signal** is derived from the latest push date, not roadmap intent: `active` means pushed within 90 days of this snapshot, `quiet` means 91–365 days, `dormant` means more than 365 days, and `empty` means GitHub returned no repository tree. Only a product owner can confirm whether a quiet or dormant repository is maintained, superseded, or retired.

The **contributor signal** is the authenticated, non-bot account with the largest count from GitHub's contributors endpoint. It is useful for finding likely context, but it does not establish code ownership, employment, or current responsibility. Confirmed owners are not yet recorded.

| Product area | Repository | Role in the portfolio | Activity signal | Contributor signal |
|---|---|---|---|---|
| Drishti | [`drishti-sdk`](https://github.com/manasijatech/drishti-sdk) | Public Python/TypeScript SDKs and MCP installer | Active | `jtuluve` |
| Drishti | [`drishti-skills`](https://github.com/manasijatech/drishti-skills) | Public agent skills for company and market research | Active | `deiondz` |
| Drishti | [`drishti-templates`](https://github.com/manasijatech/drishti-templates) | Public example applications | Active | `deiondz` |
| Drishti | [`drishti-landing-page`](https://github.com/manasijatech/drishti-landing-page) | Product marketing and documentation site | Active | `deiondz` |
| Drishti | [`alpha-api`](https://github.com/manasijatech/alpha-api) | Market-data and commercial API behind the developer product | Active | `jtuluve` |
| Drishti | [`mcp`](https://github.com/manasijatech/mcp) | Authenticated Drishti MCP server | Active | `jtuluve` |
| Myuki | [`myuki`](https://github.com/manasijatech/myuki) | Web application | Active | `deiondz` |
| Myuki | [`myuki-electron-app`](https://github.com/manasijatech/myuki-electron-app) | Desktop application | Active | `deiondz` |
| Myuki | [`pulse-app`](https://github.com/manasijatech/pulse-app) | Mobile application branded Myuki Go | Active | `Sahad-09` |
| Myuki | [`pulse`](https://github.com/manasijatech/pulse) | Market-intelligence web experience | Active | `deiondz` |
| Myuki | [`alpha-alerts-api-v2`](https://github.com/manasijatech/alpha-alerts-api-v2) | Alerts and notification backend | Active | `Shaunfurtado` |
| Myuki | [`official-alerts-app`](https://github.com/manasijatech/official-alerts-app) | Earlier desktop alerts application | Quiet | `deiondz` |
| Myuki | [`myuki-pulse-website`](https://github.com/manasijatech/myuki-pulse-website) | Static brand or marketing page | Quiet | `TechManasija` |
| Myuki | [`pulse-waitlist`](https://github.com/manasijatech/pulse-waitlist) | Waitlist and marketing site | Quiet | `deion` |
| Ananta | [`ananta-market-stack`](https://github.com/manasijatech/ananta-market-stack) | Open-source core product | Active | `Shaunfurtado` |
| Ananta | [`ananta-electron-app`](https://github.com/manasijatech/ananta-electron-app) | Private desktop companion to the same product | Active | `Shaunfurtado` |
| Shared platform | [`identity-platform`](https://github.com/manasijatech/identity-platform) | Authentication and identity service | Active | `TechManasija` |
| Shared platform | [`billings-platform`](https://github.com/manasijatech/billings-platform) | Billing, subscriptions, invoicing, and reconciliation | Active | `deiondz` |
| Shared platform | [`platform-console`](https://github.com/manasijatech/platform-console) | Developer and customer platform console | Active | `deiondz` |
| Shared platform | [`operation-dashboard`](https://github.com/manasijatech/operation-dashboard) | Internal billing and identity administration | Active | `deiondz` |
| Shared data and AI | [`ai-processing`](https://github.com/manasijatech/ai-processing) | AI classification, summarization, transcription, and document workflows | Active | `Shaunfurtado` |
| Shared data and AI | [`data-ingestion`](https://github.com/manasijatech/data-ingestion) | Market-data ingestion and processing | Active | `Shaunfurtado` |
| Shared data and AI | [`Kite`](https://github.com/manasijatech/Kite) | Zerodha market-data and trading services | Active | `dRDX420` |
| Shared data and AI | [`daily-summary`](https://github.com/manasijatech/daily-summary) | Daily market and earnings-report generation prototypes | Active | `TechManasija` |
| Shared data and AI | [`live-concall-service`](https://github.com/manasijatech/live-concall-service) | Conference-call streaming and transcription | Active | `jtuluve` |
| Shared data and AI | [`workers`](https://github.com/manasijatech/workers) | Edge workers for market datasets and metrics | Active | `TechManasija` |
| Organization | [`.github`](https://github.com/manasijatech/.github) | Public organization profile | Active | `TechManasija` |
| Organization | [`manasija-landing`](https://github.com/manasijatech/manasija-landing) | Corporate and product website | Active | `Sahad-09` |
| Internal tooling | [`cli-automation-tool`](https://github.com/manasijatech/cli-automation-tool) | Local build and deployment automation | Quiet | `deiondz` |
| Internal or experimental | [`invite-spark-finance`](https://github.com/manasijatech/invite-spark-finance) | Invite-signup finance site | Quiet | `TechManasija` |
| Internal or experimental | [`max`](https://github.com/manasijatech/max) | Autonomous financial-research agent | Active | `deiondz` |
| Internal or experimental | [`optrack-app`](https://github.com/manasijatech/optrack-app) | Options and portfolio-tracking prototypes | Active | `dRDX420` |
| Internal or experimental | [`r2-explorer-template`](https://github.com/manasijatech/r2-explorer-template) | R2 file-management template | Dormant | None returned |
| Internal or experimental | [`r2-viewer`](https://github.com/manasijatech/r2-viewer) | Empty R2 viewer repository | Empty | None returned |
| Internal or experimental | [`lovable-manasija`](https://github.com/manasijatech/lovable-manasija) | Empty Lovable repository | Empty | None returned |
| Earlier market applications | [`samvitti-news`](https://github.com/manasijatech/samvitti-news) | Earlier market-news and ingestion collection | Active | `padi-g` |
| Earlier market applications | [`tattva-ui`](https://github.com/manasijatech/tattva-ui) | Earlier market dashboard frontend | Dormant | `padi-g` |
| Earlier market applications | [`tatva-ui-2`](https://github.com/manasijatech/tatva-ui-2) | Newer market-intelligence frontend | Active | `deiondz` |

### Product boundaries that still need owner confirmation

- Drishti has four repositories named directly for the product. `alpha-api` and `mcp` are listed as Drishti supporting services because their current READMEs expose the Drishti API and tools; confirm whether they belong to Drishti or to the shared platform.
- Myuki, Myuki Go, and Pulse are presented as applications within one Myuki product family. The source establishes their technical roles but does not fully document their commercial names or whether Pulse remains a distinct product identity.
- `samvitti-news`, `tattva-ui`, and `tatva-ui-2` are grouped as earlier market applications based on their structure and history. Their replacement or retirement status is not confirmed.

## Repositories

Each repository is documented in three views: GitHub metadata, its evidence-based purpose, and the contributors attributed to it by GitHub.

### Repository metadata

All repositories are non-forks and unarchived. `—` means GitHub returned no value. The `C / U / P` field is created / updated / pushed. Counts are stars / forks / open issues.

| Repository | Access | Description | Language · topics · license | C / U / P (UTC) | S / F / I | Branch |
|---|---|---|---|---|---:|---|
| [.github](https://github.com/manasijatech/.github) | Public | — | — · — · no detected license | 2026-06-06 / 2026-06-06 / 2026-06-06 | 0 / 0 / 0 | `main` |
| [ai-processing](https://github.com/manasijatech/ai-processing) | Private | — | Python · — · no detected license | 2025-06-28 / 2026-08-13 / 2026-08-13 | 0 / 0 / 3 | `main` |
| [alpha-alerts-api-v2](https://github.com/manasijatech/alpha-alerts-api-v2) | Private | RESTful alert-notification API built with NestJS | TypeScript · — · no detected license | 2025-06-30 / 2026-08-12 / 2026-08-12 | 0 / 0 / 0 | `main` |
| [alpha-api](https://github.com/manasijatech/alpha-api) | Private | — | Python · — · no detected license | 2025-12-11 / 2026-08-11 / 2026-08-11 | 0 / 0 / 1 | `main` |
| [ananta-electron-app](https://github.com/manasijatech/ananta-electron-app) | Private | — | TypeScript · — · no detected license | 2026-07-03 / 2026-07-03 / 2026-07-03 | 0 / 0 / 0 | `master` |
| [ananta-market-stack](https://github.com/manasijatech/ananta-market-stack) | Public | Private trading research assistant stack | TypeScript · `algo-trading-infra`, `artificial-intelligence`, `indian-stock-market`, `stock-market` · MIT | 2026-04-02 / 2026-08-07 / 2026-08-10 | 8 / 1 / 5 | `main` |
| [billings-platform](https://github.com/manasijatech/billings-platform) | Private | — | TypeScript · — · no detected license | 2026-05-08 / 2026-07-29 / 2026-07-29 | 0 / 0 / 0 | `master` |
| [cli-automation-tool](https://github.com/manasijatech/cli-automation-tool) | Private | — | TypeScript · — · no detected license | 2025-12-08 / 2026-02-26 / 2026-02-26 | 0 / 0 / 0 | `master` |
| [daily-summary](https://github.com/manasijatech/daily-summary) | Private | — | HTML · — · no detected license | 2026-02-10 / 2026-08-07 / 2026-08-07 | 0 / 0 / 0 | `main` |
| [data-ingestion](https://github.com/manasijatech/data-ingestion) | Private | — | Python · — · no detected license | 2025-06-28 / 2026-08-13 / 2026-08-13 | 0 / 0 / 0 | `main` |
| [drishti-landing-page](https://github.com/manasijatech/drishti-landing-page) | Private | — | TypeScript · — · no detected license | 2026-05-12 / 2026-08-11 / 2026-08-11 | 0 / 0 / 0 | `master` |
| [drishti-sdk](https://github.com/manasijatech/drishti-sdk) | Public | — | Python · — · no detected license | 2026-05-08 / 2026-08-11 / 2026-08-11 | 0 / 0 / 0 | `main` |
| [drishti-skills](https://github.com/manasijatech/drishti-skills) | Public | — | — · — · no detected license | 2026-07-08 / 2026-08-05 / 2026-08-05 | 0 / 0 / 0 | `main` |
| [drishti-templates](https://github.com/manasijatech/drishti-templates) | Public | — | TypeScript · — · no detected license | 2026-06-18 / 2026-06-25 / 2026-06-24 | 0 / 0 / 0 | `main` |
| [identity-platform](https://github.com/manasijatech/identity-platform) | Private | — | TypeScript · — · no detected license | 2026-05-05 / 2026-07-02 / 2026-07-02 | 0 / 0 / 0 | `master` |
| [invite-spark-finance](https://github.com/manasijatech/invite-spark-finance) | Private | — | TypeScript · — · no detected license | 2025-09-18 / 2026-02-20 / 2026-02-20 | 0 / 0 / 0 | `main` |
| [Kite](https://github.com/manasijatech/Kite) | Private | — | HTML · — · no detected license | 2026-03-20 / 2026-08-13 / 2026-08-13 | 0 / 0 / 0 | `main` |
| [live-concall-service](https://github.com/manasijatech/live-concall-service) | Private | — | Python · — · no detected license | 2026-07-31 / 2026-08-12 / 2026-08-12 | 0 / 0 / 0 | `master` |
| [lovable-manasija](https://github.com/manasijatech/lovable-manasija) | Private | — | — · — · no detected license | 2025-09-18 / 2025-09-18 / 2025-09-18 | 0 / 0 / 0 | `main` |
| [manasija-landing](https://github.com/manasijatech/manasija-landing) | Private | — | TypeScript · — · no detected license | 2026-05-29 / 2026-07-29 / 2026-07-29 | 0 / 0 / 0 | `main` |
| [max](https://github.com/manasijatech/max) | Private | — | TypeScript · — · no detected license | 2026-07-06 / 2026-07-22 / 2026-07-22 | 0 / 0 / 0 | `main` |
| [mcp](https://github.com/manasijatech/mcp) | Private | — | Python · — · no detected license | 2026-05-14 / 2026-07-29 / 2026-07-29 | 0 / 0 / 0 | `main` |
| [myuki](https://github.com/manasijatech/myuki) | Private | — | TypeScript · — · no detected license | 2025-11-07 / 2026-08-12 / 2026-08-13 | 0 / 0 / 0 | `main` |
| [myuki-electron-app](https://github.com/manasijatech/myuki-electron-app) | Private | “I tell myself that this is going to be a cool project!” | TypeScript · — · no detected license | 2026-01-30 / 2026-06-04 / 2026-06-04 | 0 / 0 / 0 | `main` |
| [myuki-pulse-website](https://github.com/manasijatech/myuki-pulse-website) | Private | — | HTML · — · no detected license | 2026-04-14 / 2026-04-14 / 2026-04-30 | 0 / 0 / 0 | `main` |
| [official-alerts-app](https://github.com/manasijatech/official-alerts-app) | Private | — | TypeScript · — · no detected license | 2025-08-29 / 2025-10-13 / 2025-11-28 | 0 / 0 / 0 | `main` |
| [operation-dashboard](https://github.com/manasijatech/operation-dashboard) | Private | — | TypeScript · — · no detected license | 2026-07-02 / 2026-07-29 / 2026-07-29 | 0 / 0 / 0 | `main` |
| [optrack-app](https://github.com/manasijatech/optrack-app) | Private | — | C++ · — · no detected license | 2026-03-26 / 2026-05-20 / 2026-05-20 | 0 / 0 / 0 | `main` |
| [platform-console](https://github.com/manasijatech/platform-console) | Private | — | HTML · — · no detected license | 2026-05-06 / 2026-08-05 / 2026-08-05 | 0 / 0 / 0 | `main` |
| [pulse](https://github.com/manasijatech/pulse) | Private | — | TypeScript · — · no detected license | 2025-10-21 / 2026-07-29 / 2026-07-29 | 0 / 0 / 0 | `main` |
| [pulse-app](https://github.com/manasijatech/pulse-app) | Private | — | TypeScript · — · no detected license | 2026-01-30 / 2026-08-13 / 2026-08-13 | 0 / 0 / 0 | `main` |
| [pulse-waitlist](https://github.com/manasijatech/pulse-waitlist) | Private | — | TypeScript · — · no detected license | 2026-04-01 / 2026-04-01 / 2026-04-05 | 0 / 0 / 0 | `main` |
| [r2-explorer-template](https://github.com/manasijatech/r2-explorer-template) | Private | — | TypeScript · — · no detected license | 2025-07-17 / 2025-07-17 / 2025-07-17 | 0 / 0 / 0 | `main` |
| [r2-viewer](https://github.com/manasijatech/r2-viewer) | Private | — | — · — · no detected license | 2025-07-17 / 2025-07-17 / 2025-07-17 | 0 / 0 / 0 | `main` |
| [samvitti-news](https://github.com/manasijatech/samvitti-news) | Private | — | Python · — · no detected license | 2024-06-29 / 2026-08-12 / 2026-08-12 | 0 / 0 / 0 | `main` |
| [tattva-ui](https://github.com/manasijatech/tattva-ui) | Private | — | JavaScript · — · no detected license | 2024-11-17 / 2025-06-27 / 2025-07-30 | 0 / 0 / 6 | `main` |
| [tatva-ui-2](https://github.com/manasijatech/tatva-ui-2) | Private | — | JavaScript · — · no detected license | 2025-04-09 / 2026-07-29 / 2026-07-29 | 0 / 0 / 0 | `main` |
| [workers](https://github.com/manasijatech/workers) | Private | — | JavaScript · — · no detected license | 2026-05-25 / 2026-07-21 / 2026-07-21 | 0 / 0 / 1 | `main` |

### What each project does

| Repository | Evidence-based purpose |
|---|---|
| [.github](https://github.com/manasijatech/.github/tree/main/profile) | Organization profile content: describes Manasija's products, focus areas, links, and financial-information disclaimer. [Evidence](https://github.com/manasijatech/.github/blob/main/profile/README.md) |
| [ai-processing](https://github.com/manasijatech/ai-processing) | Python/Celery AI-processing system for classifying and tagging market news and announcements; summarizing tweets, concalls, YouTube, and daily email; transcription, document chat, alerts, and LLM evaluations. [Evidence](https://github.com/manasijatech/ai-processing/blob/main/README.md) |
| [alpha-alerts-api-v2](https://github.com/manasijatech/alpha-alerts-api-v2) | NestJS backend for alerts and notifications, with authentication/OTP, user preferences, portfolio-price alerts, feature policies, and delivery integrations. [README](https://github.com/manasijatech/alpha-alerts-api-v2/blob/main/README.md) · [source](https://github.com/manasijatech/alpha-alerts-api-v2/tree/main/src) |
| [alpha-api](https://github.com/manasijatech/alpha-api) | FastAPI market-data and commercial API for Indian-market concalls, news, corporate announcements, earnings, real-time feeds, accounts, credits, entitlements, and API keys. [Evidence](https://github.com/manasijatech/alpha-api/blob/main/README.md) |
| [ananta-electron-app](https://github.com/manasijatech/ananta-electron-app) | Electron tray companion for Ananta Market Stack: pairs with the stack, plays alert audio, displays an active-alert popup, and produces Windows installers. [Evidence](https://github.com/manasijatech/ananta-electron-app/blob/master/README.md) |
| [ananta-market-stack](https://github.com/manasijatech/ananta-market-stack) | Self-hosted broker-aware trading and market-data workspace with a Next.js UI, FastAPI backend, encrypted broker credentials, portfolios, quotes, alerts, Redis workflows, and Docker packaging. [Evidence](https://github.com/manasijatech/ananta-market-stack/blob/main/README.md) |
| [billings-platform](https://github.com/manasijatech/billings-platform) | Internal NestJS billing platform covering product catalogs, checkout, subscriptions, invoicing, Razorpay, payment reconciliation, Zoho Books sync, reporting, and operations APIs. [Evidence](https://github.com/manasijatech/billings-platform/blob/master/README.md) |
| [cli-automation-tool](https://github.com/manasijatech/cli-automation-tool) | Interactive TypeScript CLI that discovers local Node projects, builds them with Bun, deploys with PM2, manages environment setup, and records build history. [Evidence](https://github.com/manasijatech/cli-automation-tool/blob/master/README.md) |
| [daily-summary](https://github.com/manasijatech/daily-summary) | Prototype and generated artifacts for HTML daily summaries and multi-step company earnings reports. There is no root README, so current production ownership/status is unknown. [Tree evidence](https://github.com/manasijatech/daily-summary/tree/main/earnings_report_generator) |
| [data-ingestion](https://github.com/manasijatech/data-ingestion) | Collection of market-data ingestion and processing scripts—announcements, news, bhavcopy, concalls, symbols, alerts—scheduled through Celery workers in `ai-processing`. [Evidence](https://github.com/manasijatech/data-ingestion/blob/main/README.md) |
| [drishti-landing-page](https://github.com/manasijatech/drishti-landing-page) | Next.js marketing site for Drishti developer APIs, with product pages, API documentation navigation, pricing/CTA configuration, and SEO metadata. The README is mostly template/setup material, so this is inferred from app routes and configuration. [README](https://github.com/manasijatech/drishti-landing-page/blob/master/README.md) · [app source](https://github.com/manasijatech/drishti-landing-page/tree/master/src/app) |
| [drishti-sdk](https://github.com/manasijatech/drishti-sdk) | Official Python and TypeScript HTTP/WebSocket clients for Alpha API `/v1`, plus the `drishti-mcp` installer for configuring supported AI clients. [Evidence](https://github.com/manasijatech/drishti-sdk/blob/main/README.md) |
| [drishti-skills](https://github.com/manasijatech/drishti-skills) | Installable agent skills for Indian-listed-company research: quick stock analysis, earnings analysis, and event calendars, with a non-advisory scope. [Evidence](https://github.com/manasijatech/drishti-skills/blob/main/README.md) |
| [drishti-templates](https://github.com/manasijatech/drishti-templates) | Example application templates for Drishti. The current tree contains a Next.js AI chat template connected to Drishti MCP, with memory, agent UI, and setup documentation. [Template README](https://github.com/manasijatech/drishti-templates/blob/main/chat-drishti-mcp/README.md) · [tree](https://github.com/manasijatech/drishti-templates/tree/main/chat-drishti-mcp) |
| [identity-platform](https://github.com/manasijatech/identity-platform) | Dedicated NestJS identity service using Better Auth and MongoDB, shared Manasija-domain cookies, and bearer/JWT support for native clients. [Evidence](https://github.com/manasijatech/identity-platform/blob/master/README.md) |
| [invite-spark-finance](https://github.com/manasijatech/invite-spark-finance) | Lovable-generated Vite/React site with an invite signup and finance-related policy pages, backed by Supabase. The README is generic, so the exact product status/name is uncertain. [README](https://github.com/manasijatech/invite-spark-finance/blob/main/README.md) · [source](https://github.com/manasijatech/invite-spark-finance/tree/main/src) |
| [Kite](https://github.com/manasijatech/Kite) | Zerodha Kite Connect service collection: WebSocket ticks, MySQL-backed symbol synchronization, Redis tick consumers, intraday/OI signals, portfolio/strategy calculations, and option-chain analytics. [Evidence](https://github.com/manasijatech/Kite/blob/main/README.md) |
| [live-concall-service](https://github.com/manasijatech/live-concall-service) | Small Plivo service and browser dashboard for placing India-compliant outbound conference calls, streaming call audio, and live transcription. [Evidence](https://github.com/manasijatech/live-concall-service/blob/master/README.md) |
| [lovable-manasija](https://github.com/manasijatech/lovable-manasija) | **Unknown:** empty repository; no default-branch tree, README, language, or contributors were returned. [Metadata](https://api.github.com/repos/manasijatech/lovable-manasija) |
| [manasija-landing](https://github.com/manasijatech/manasija-landing) | Next.js 16 Manasija corporate/product website, with pages for careers, Ananta Market Stack, Myuki products, and downloads, packaged for Cloudflare. [README](https://github.com/manasijatech/manasija-landing/blob/main/README.md) · [routes](https://github.com/manasijatech/manasija-landing/tree/main/src/app) |
| [max](https://github.com/manasijatech/max) | Autonomous financial-research agent that plans tasks, uses live market data, self-checks, refines answers, and exposes CLI/WhatsApp workflows. [Evidence](https://github.com/manasijatech/max/blob/main/README.md) |
| [mcp](https://github.com/manasijatech/mcp) | FastMCP server exposing authenticated Drishti tools through an OAuth flow, including search, documents, indexes, billing/product metadata, and observability. [Evidence](https://github.com/manasijatech/mcp/blob/main/README.md) |
| [myuki](https://github.com/manasijatech/myuki) | Next.js Myuki web product. Source evidence shows authentication, user preferences, smallcase integration, document/PDF handling, chat, audio, and market-alert functionality; its root README is only the Next.js scaffold, so the precise intended product boundary is not documented. [README](https://github.com/manasijatech/myuki/blob/main/README.md) · [source](https://github.com/manasijatech/myuki/tree/main/src) |
| [myuki-electron-app](https://github.com/manasijatech/myuki-electron-app) | Electron desktop client for Myuki with authentication, deep links, global keybindings, microphone access, WebSocket communication, and self-update/build packaging. [package](https://github.com/manasijatech/myuki-electron-app/blob/main/package.json) · [Electron source](https://github.com/manasijatech/myuki-electron-app/tree/main/electron) |
| [myuki-pulse-website](https://github.com/manasijatech/myuki-pulse-website) | Minimal static HTML landing/brand page using Myuki/Pulse imagery and WhatsApp branding. No README or package manifest documents its exact role. [Source](https://github.com/manasijatech/myuki-pulse-website/blob/main/index.html) |
| [official-alerts-app](https://github.com/manasijatech/official-alerts-app) | Tauri 2 / Next.js desktop alerts application (package name `alphine`) with updater/autostart support. Its README remains the upstream template, so product behavior beyond the source structure is not authoritatively documented. [README](https://github.com/manasijatech/official-alerts-app/blob/main/README.md) · [source](https://github.com/manasijatech/official-alerts-app/tree/main/src) |
| [operation-dashboard](https://github.com/manasijatech/operation-dashboard) | Internal billing and identity administration dashboard, with operator RBAC, service credentials, MySQL-backed dashboard tables, and privileged identity writes. [Evidence](https://github.com/manasijatech/operation-dashboard/blob/main/README.md) |
| [optrack-app](https://github.com/manasijatech/optrack-app) | C++ application plus Python strategy prototypes for options/F&O portfolio tracking, Greeks, instruments, and position/profit calculations. The README contains only the project name, so lifecycle and runtime role are unknown. [README](https://github.com/manasijatech/optrack-app/blob/main/README.md) · [source](https://github.com/manasijatech/optrack-app/tree/main/Python) |
| [platform-console](https://github.com/manasijatech/platform-console) | Manasija developer/platform console built with Next.js/T3: authentication plus product catalog, billing/checkout integration, API/developer workflows, and operational UI. The README is partly scaffold material; purpose is inferred from routes and documented billing integration. [README](https://github.com/manasijatech/platform-console/blob/main/README.md) · [source](https://github.com/manasijatech/platform-console/tree/main/src) |
| [pulse](https://github.com/manasijatech/pulse) | Next.js market-intelligence web application with chat, market movements, correlation charts, waitlist/onboarding, authentication and payments. Its root README is a generic scaffold, so this purpose is inferred from package/routes/assets. [README](https://github.com/manasijatech/pulse/blob/main/README.md) · [source](https://github.com/manasijatech/pulse/tree/main/src) |
| [pulse-app](https://github.com/manasijatech/pulse-app) | Expo/React Native mobile app branded “Myuki Go,” with stock/event monitoring, Ask Myuki, live concalls, market-movement views, authentication, and native release tooling. [Evidence](https://github.com/manasijatech/pulse-app/blob/main/README.md) |
| [pulse-waitlist](https://github.com/manasijatech/pulse-waitlist) | Next.js waitlist/marketing page for Pulse/Myuki, with store badges, team/testimonial imagery, and a branded signup page. The README is generic, so this is inferred from page source/assets. [README](https://github.com/manasijatech/pulse-waitlist/blob/main/README.md) · [page](https://github.com/manasijatech/pulse-waitlist/blob/main/src/app/page.tsx) |
| [r2-explorer-template](https://github.com/manasijatech/r2-explorer-template) | Cloudflare Worker template providing a Google Drive-like interface for managing R2 bucket files, metadata, previews, editing, uploads, and access control. [Evidence](https://github.com/manasijatech/r2-explorer-template/blob/main/README.md) |
| [r2-viewer](https://github.com/manasijatech/r2-viewer) | **Unknown:** empty repository; no default-branch tree, README, language, or contributors were returned. [Metadata](https://api.github.com/repos/manasijatech/r2-viewer) |
| [samvitti-news](https://github.com/manasijatech/samvitti-news) | Legacy/active collection of Python and Node scripts for market news, announcements, bhavcopy, tweets, concalls, AI classification/tagging, backfills, and data migration. The root `README` has no useful project narrative, so status and boundaries are uncertain. [Tree evidence](https://github.com/manasijatech/samvitti-news/tree/main/scripts) |
| [tattva-ui](https://github.com/manasijatech/tattva-ui) | Create React App frontend for protected market dashboards, news and announcement feeds, alerts, concalls, and research views. [README](https://github.com/manasijatech/tattva-ui/blob/main/README.md) · [source](https://github.com/manasijatech/tattva-ui/tree/main/src) |
| [tatva-ui-2](https://github.com/manasijatech/tatva-ui-2) | Newer React Router market-intelligence frontend with account/admin, announcements, chat, PDF/document, alerts, and related API clients. The README covers only Bun setup, so purpose is inferred from its application/API tree. [README](https://github.com/manasijatech/tatva-ui-2/blob/main/README.md) · [API tree](https://github.com/manasijatech/tatva-ui-2/tree/main/api) |
| [workers](https://github.com/manasijatech/workers) | Collection of Cloudflare/Vercel edge workers for attachments, corporate actions, event calendars, 52-week data, F&O bhavcopy, ban lists, and Screener-derived points/metrics. [Tree evidence](https://github.com/manasijatech/workers) |

### Contributors for each repository

The values below are `login: contributions`; `(bot)` is GitHub API type `Bot`, and `anon` denotes an unlinked commit-author record. The direct contributor source for each repository is `https://api.github.com/repos/manasijatech/<repo>/contributors?anon=1&per_page=100`.

| Repository | Contributors returned by GitHub |
|---|---|
| [.github](https://api.github.com/repos/manasijatech/.github/contributors?anon=1&per_page=100) | `TechManasija: 2` |
| [ai-processing](https://api.github.com/repos/manasijatech/ai-processing/contributors?anon=1&per_page=100) | `Shaunfurtado: 607`, `jtuluve: 461`, `TechManasija: 385`, `Sahad-09: 50`, `prag-z: 22`, `padi-g: 19`, `manasijatech-org: 6`, anon `padi-g: 2` |
| [alpha-alerts-api-v2](https://api.github.com/repos/manasijatech/alpha-alerts-api-v2/contributors?anon=1&per_page=100) | `Shaunfurtado: 130`, `TechManasija: 126`, `deiondz: 99`, `Sahad-09: 39`, `jtuluve: 23`, anon `Deion: 3`, anon `deion: 2`, `padi-g: 1` |
| [alpha-api](https://api.github.com/repos/manasijatech/alpha-api/contributors?anon=1&per_page=100) | `jtuluve: 132`, `Shaunfurtado: 71`, `TechManasija: 14`, `deiondz: 2` |
| [ananta-electron-app](https://api.github.com/repos/manasijatech/ananta-electron-app/contributors?anon=1&per_page=100) | `Shaunfurtado: 10` |
| [ananta-market-stack](https://api.github.com/repos/manasijatech/ananta-market-stack/contributors?anon=1&per_page=100) | `Shaunfurtado: 327`, `Sahad-09: 119`, `dependabot[bot]: 48` (bot), `deiondz: 32`, `TechManasija: 29`, `jtuluve: 22` |
| [billings-platform](https://api.github.com/repos/manasijatech/billings-platform/contributors?anon=1&per_page=100) | `deiondz: 17`, `TechManasija: 15`, `jtuluve: 5` |
| [cli-automation-tool](https://api.github.com/repos/manasijatech/cli-automation-tool/contributors?anon=1&per_page=100) | `deiondz: 4`, `TechManasija: 1` |
| [daily-summary](https://api.github.com/repos/manasijatech/daily-summary/contributors?anon=1&per_page=100) | `TechManasija: 4`, `greencrusader98: 3`, `Shaunfurtado: 3` |
| [data-ingestion](https://api.github.com/repos/manasijatech/data-ingestion/contributors?anon=1&per_page=100) | `Shaunfurtado: 102`, `TechManasija: 82`, `jtuluve: 43`, `Sahad-09: 7`, `padi-g: 3`, `prag-z: 2`, anon `padi-g: 1` |
| [drishti-landing-page](https://api.github.com/repos/manasijatech/drishti-landing-page/contributors?anon=1&per_page=100) | `deiondz: 118`, `jtuluve: 45`, anon `Deion Dsouza: 4`, `Shaunfurtado: 3`, `greencrusader98: 1` |
| [drishti-sdk](https://api.github.com/repos/manasijatech/drishti-sdk/contributors?anon=1&per_page=100) | `jtuluve: 62`, `TechManasija: 1`, `deiondz: 1` |
| [drishti-skills](https://api.github.com/repos/manasijatech/drishti-skills/contributors?anon=1&per_page=100) | `deiondz: 9` |
| [drishti-templates](https://api.github.com/repos/manasijatech/drishti-templates/contributors?anon=1&per_page=100) | `deiondz: 11` |
| [identity-platform](https://api.github.com/repos/manasijatech/identity-platform/contributors?anon=1&per_page=100) | `TechManasija: 20`, `deiondz: 8` |
| [invite-spark-finance](https://api.github.com/repos/manasijatech/invite-spark-finance/contributors?anon=1&per_page=100) | `lovable-dev[bot]: 10` (bot), `TechManasija: 6` |
| [Kite](https://api.github.com/repos/manasijatech/Kite/contributors?anon=1&per_page=100) | `dRDX420: 74`, `TechManasija: 59`, `Shaunfurtado: 43` |
| [live-concall-service](https://api.github.com/repos/manasijatech/live-concall-service/contributors?anon=1&per_page=100) | `jtuluve: 13`, `TechManasija: 1` |
| [lovable-manasija](https://api.github.com/repos/manasijatech/lovable-manasija/contributors?anon=1&per_page=100) | None (empty repository) |
| [manasija-landing](https://api.github.com/repos/manasijatech/manasija-landing/contributors?anon=1&per_page=100) | `Sahad-09: 47`, `deiondz: 8`, `TechManasija: 7`, `Shaunfurtado: 3`, anon `Railway Agent: 2` |
| [max](https://api.github.com/repos/manasijatech/max/contributors?anon=1&per_page=100) | `deiondz: 26` |
| [mcp](https://api.github.com/repos/manasijatech/mcp/contributors?anon=1&per_page=100) | `jtuluve: 52`, `TechManasija: 4`, `Shaunfurtado: 3` |
| [myuki](https://api.github.com/repos/manasijatech/myuki/contributors?anon=1&per_page=100) | `deiondz: 116`, `Sahad-09: 107`, `Shaunfurtado: 41`, `TechManasija: 35`, `jtuluve: 16` |
| [myuki-electron-app](https://api.github.com/repos/manasijatech/myuki-electron-app/contributors?anon=1&per_page=100) | `deiondz: 120`, `github-actions[bot]: 21` (bot), `Sahad-09: 12`, `TechManasija: 11`, `Shaunfurtado: 1` |
| [myuki-pulse-website](https://api.github.com/repos/manasijatech/myuki-pulse-website/contributors?anon=1&per_page=100) | `TechManasija: 1` |
| [official-alerts-app](https://api.github.com/repos/manasijatech/official-alerts-app/contributors?anon=1&per_page=100) | `deiondz: 64` |
| [operation-dashboard](https://api.github.com/repos/manasijatech/operation-dashboard/contributors?anon=1&per_page=100) | `deiondz: 6` |
| [optrack-app](https://api.github.com/repos/manasijatech/optrack-app/contributors?anon=1&per_page=100) | `dRDX420: 8`, `Shaunfurtado: 4` |
| [platform-console](https://api.github.com/repos/manasijatech/platform-console/contributors?anon=1&per_page=100) | `deiondz: 59`, `TechManasija: 25`, `Shaunfurtado: 25`, `jtuluve: 24` |
| [pulse](https://api.github.com/repos/manasijatech/pulse/contributors?anon=1&per_page=100) | `deiondz: 258`, `Sahad-09: 40`, `TechManasija: 26` |
| [pulse-app](https://api.github.com/repos/manasijatech/pulse-app/contributors?anon=1&per_page=100) | `Sahad-09: 221`, `TechManasija: 4`, `Shaunfurtado: 3` |
| [pulse-waitlist](https://api.github.com/repos/manasijatech/pulse-waitlist/contributors?anon=1&per_page=100) | `deion: 2` |
| [r2-explorer-template](https://api.github.com/repos/manasijatech/r2-explorer-template/contributors?anon=1&per_page=100) | None |
| [r2-viewer](https://api.github.com/repos/manasijatech/r2-viewer/contributors?anon=1&per_page=100) | None (empty repository) |
| [samvitti-news](https://api.github.com/repos/manasijatech/samvitti-news/contributors?anon=1&per_page=100) | anon `padi-g: 93`, `padi-g: 51`, `TechManasija: 47`, `Shaunfurtado: 45`, `jtuluve: 44`, anon `Ubuntu: 30` |
| [tattva-ui](https://api.github.com/repos/manasijatech/tattva-ui/contributors?anon=1&per_page=100) | anon `padi-g: 57`, `padi-g: 8`, anon `Ubuntu: 5` |
| [tatva-ui-2](https://api.github.com/repos/manasijatech/tatva-ui-2/contributors?anon=1&per_page=100) | `deiondz: 528`, `Shaunfurtado: 33`, `TechManasija: 32`, `Sahad-09: 19`, `manasijatech-org: 7`, anon `Deion: 6`, anon `deion: 2`, `padi-g: 1`, `jtuluve: 1`, anon `Ubuntu: 1` |
| [workers](https://api.github.com/repos/manasijatech/workers/contributors?anon=1&per_page=100) | `TechManasija: 6`, `Shaunfurtado: 3` |

## Contributor directory

This directory lists the authenticated human or organization-style accounts included in this report. Display names come from each account's public GitHub profile. **Observed areas** describe repositories with attributed commits; they do not establish the person's job title or assigned team. Roles, employment status, and ownership remain unconfirmed until an organization owner supplies them.

| GitHub account | Public profile name | Observed areas | Confirmed role or ownership |
|---|---|---|---|
| [`TechManasija`](https://github.com/TechManasija) | Tech Manasija | Organization-wide; Drishti; Myuki; shared platform and data | Not recorded |
| [`deiondz`](https://github.com/deiondz) | DD | Drishti; Myuki; shared platform; internal applications | Not recorded |
| [`Shaunfurtado`](https://github.com/Shaunfurtado) | Shaun Roshan Furtado | Ananta; Myuki; shared data and AI; Drishti services | Not recorded |
| [`jtuluve`](https://github.com/jtuluve) | Jnanesh | Drishti; Myuki; shared platform and data | Not recorded |
| [`Sahad-09`](https://github.com/Sahad-09) | Sahad | Myuki; Ananta; organization website; shared AI | Not recorded |
| [`padi-g`](https://github.com/padi-g) | Gautam Padiyar | Shared data and AI; earlier market applications | Not recorded |
| [`dRDX420`](https://github.com/dRDX420) | Not published | Kite and options-tracking applications | Not recorded |
| [`prag-z`](https://github.com/prag-z) | Pragadeeshwar Kannan | Shared AI and data processing | Not recorded |
| [`manasijatech-org`](https://github.com/manasijatech-org) | Not published | Shared AI and earlier market applications | Not recorded; GitHub classifies this as a user account |
| [`greencrusader98`](https://github.com/greencrusader98) | Shiva Bhaskar | Daily summaries and the Drishti landing page | Not recorded |
| [`deion`](https://github.com/deion) | Not published | Myuki/Pulse waitlist | Not recorded |

Automation is kept separate from the contributor directory because bot commits do not represent team membership.

| Bot account | Function visible from GitHub |
|---|---|
| [`dependabot[bot]`](https://github.com/apps/dependabot) | Dependency-update automation |
| [`github-actions[bot]`](https://github.com/apps/github-actions) | GitHub Actions automation |
| [`lovable-dev[bot]`](https://github.com/apps/lovable-dev) | Lovable-generated changes |

## Organization-wide contributor summary

The report includes **14 unique authenticated logins** across **35 repositories with contributor records**, including **3 bot accounts**. These linked accounts total **5,777** endpoint-reported contributions; the anonymous records add **208**, for **5,985** records in the summed per-repository counts. The table counts distinct repositories in which each login appears.

| Login | API type | Repositories | Summed contributions |
|---|---|---:|---:|
| [deiondz](https://github.com/deiondz) | User | 19 | 1,486 |
| [Shaunfurtado](https://github.com/Shaunfurtado) | User | 19 | 1,457 |
| [TechManasija](https://github.com/TechManasija) | User | 25 | 943 |
| [jtuluve](https://github.com/jtuluve) | User | 14 | 943 |
| [Sahad-09](https://github.com/Sahad-09) | User | 10 | 661 |
| [padi-g](https://github.com/padi-g) | User | 6 | 83 |
| [dRDX420](https://github.com/dRDX420) | User | 2 | 82 |
| [dependabot[bot]](https://github.com/apps/dependabot) | Bot | 1 | 48 |
| [prag-z](https://github.com/prag-z) | User | 2 | 24 |
| [github-actions[bot]](https://github.com/apps/github-actions) | Bot | 1 | 21 |
| [manasijatech-org](https://github.com/manasijatech-org) | User | 2 | 13 |
| [lovable-dev[bot]](https://github.com/apps/lovable-dev) | Bot | 1 | 10 |
| [greencrusader98](https://github.com/greencrusader98) | User | 2 | 4 |
| [deion](https://github.com/deion) | User | 1 | 2 |

Anonymous records are excluded from the unique-login total. Grouped by the exact author name GitHub returned, they are: `padi-g` 153 contributions across 4 repository records; `Ubuntu` 36 across 3; `Deion` 9 across 3; `Deion Dsouza` 4 across 1; `deion` 4 across 2; and `Railway Agent` 2 across 1. These may overlap with authenticated users, but the API does not establish that identity, so merging them would be speculative.

## Coverage and gaps

- Coverage includes all 38 repositories visible to `TechManasija`: all 5 public repositories and all 33 private repositories. Every paginated repository and contributor request completed without an HTTP error.
- The product-family assignments reflect the agreed organization model plus repository evidence. The Drishti service boundary, the relationship between Myuki and Pulse, and the lifecycle of earlier market applications still need confirmation from a product owner.
- GitHub activity identifies likely sources of repository context, not accountable owners. The organization has not yet supplied team roles, employment status, maintainers, or ownership assignments for the contributor directory.
- Root README content was available for 31 repositories. Seven lacked a usable root README (`.github` has its README under `profile/`; `daily-summary`, `drishti-templates`, `lovable-manasija`, `myuki-pulse-website`, `r2-viewer`, and `samvitti-news` lacked a standard root README response). Purpose was derived from other repository files where possible.
- `lovable-manasija` and `r2-viewer` are empty. `r2-explorer-template` is non-empty but its contributor endpoint returned no entries. Therefore 35 repositories have contributor records.
- The contributors endpoint is not a collaborator or organization-membership list. It omits people who have access but no attributable default-branch contributions and may undercount work merged through squash/rebase, unlinked emails, alternate branches, or renamed/deleted accounts.
- GitHub returned two separate anonymous `Deion` records with 3 contributions each for `tatva-ui-2`; the per-repository table combines these exact-name duplicates to `Deion: 6`, while preserving the record-count behavior in this note.
- Repository descriptions, topics, language detection, issue counts, and timestamps are point-in-time GitHub values and will change. Private links and API responses are only reproducible by an authorized account.
