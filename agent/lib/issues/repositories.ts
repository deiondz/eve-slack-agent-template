export type RepositoryActivity = "active" | "quiet" | "dormant" | "empty";

export interface IssueRepository {
  slug: `manasijatech/${string}`;
  productArea: string;
  role: string;
  aliases: readonly string[];
  activity: RepositoryActivity;
  githubContacts: readonly string[];
  contactBasis: "top contributor signal; not confirmed ownership";
  requiresConfirmation: boolean;
}

function repository(
  name: string,
  productArea: string,
  role: string,
  aliases: readonly string[],
  activity: RepositoryActivity,
  githubContacts: readonly string[],
  requiresConfirmation = activity !== "active",
): IssueRepository {
  return {
    slug: `manasijatech/${name}`,
    productArea,
    role,
    aliases,
    activity,
    githubContacts,
    contactBasis: "top contributor signal; not confirmed ownership",
    requiresConfirmation,
  };
}

// Distilled from the internal repository inventory snapshot dated 2026-08-13.
// Contributor signals identify likely context, never accountable ownership.
export const issueRepositories: readonly IssueRepository[] = [
  repository(
    "drishti-sdk",
    "Drishti",
    "Public Python/TypeScript SDKs and MCP installer",
    ["drishti sdk", "python sdk", "typescript sdk", "sdk installer"],
    "active",
    ["jtuluve"],
  ),
  repository(
    "drishti-skills",
    "Drishti",
    "Public agent skills for company and market research",
    ["drishti skills", "agent skills", "research skills"],
    "active",
    ["deiondz"],
  ),
  repository(
    "drishti-templates",
    "Drishti",
    "Public example applications",
    ["drishti templates", "example app", "example application"],
    "active",
    ["deiondz"],
  ),
  repository(
    "drishti-landing-page",
    "Drishti",
    "Product marketing and documentation site",
    ["drishti website", "drishti landing", "drishti docs", "documentation site"],
    "active",
    ["deiondz"],
  ),
  repository(
    "alpha-api",
    "Drishti",
    "Market-data and commercial API behind the developer product",
    ["drishti api", "alpha api", "market data api", "commercial api"],
    "active",
    ["jtuluve"],
  ),
  repository(
    "mcp",
    "Drishti",
    "Authenticated Drishti MCP server",
    ["drishti mcp", "mcp server", "oauth mcp", "drishti tools"],
    "active",
    ["jtuluve"],
  ),
  repository(
    "myuki",
    "Myuki",
    "Web application",
    [
      "myuki",
      "myuki web",
      "myuki app",
      "morning summary",
      "marketcap",
      "market cap",
      "ask myuki web",
    ],
    "active",
    ["deiondz"],
  ),
  repository(
    "myuki-electron-app",
    "Myuki",
    "Desktop application",
    ["myuki desktop", "myuki electron", "electron app", "desktop client"],
    "active",
    ["deiondz"],
  ),
  repository(
    "pulse-app",
    "Myuki",
    "Mobile application branded Myuki Go",
    ["myuki go", "myuki mobile", "pulse mobile", "ios app", "android app"],
    "active",
    ["Sahad-09"],
  ),
  repository(
    "pulse",
    "Myuki",
    "Market-intelligence web experience",
    ["pulse web", "pulse market intelligence", "pulse chat", "pulse payments"],
    "active",
    ["deiondz"],
  ),
  repository(
    "alpha-alerts-api-v2",
    "Myuki",
    "Alerts and notification backend",
    ["alerts api", "notification backend", "myuki alerts", "alpha alerts"],
    "active",
    ["Shaunfurtado"],
  ),
  repository(
    "official-alerts-app",
    "Myuki",
    "Earlier desktop alerts application",
    ["official alerts", "alphine", "tauri alerts", "desktop alerts"],
    "quiet",
    ["deiondz"],
  ),
  repository(
    "myuki-pulse-website",
    "Myuki",
    "Static brand or marketing page",
    ["myuki pulse website", "pulse brand page", "whatsapp brand page"],
    "quiet",
    ["TechManasija"],
  ),
  repository(
    "pulse-waitlist",
    "Myuki",
    "Waitlist and marketing site",
    ["pulse waitlist", "myuki waitlist", "waitlist page"],
    "quiet",
    ["deion"],
  ),
  repository(
    "ananta-market-stack",
    "Ananta",
    "Open-source core product",
    ["ananta", "ananta core", "market stack", "trading research assistant"],
    "active",
    ["Shaunfurtado"],
  ),
  repository(
    "ananta-electron-app",
    "Ananta",
    "Private desktop companion",
    ["ananta desktop", "ananta electron", "ananta desktop companion"],
    "active",
    ["Shaunfurtado"],
  ),
  repository(
    "identity-platform",
    "Shared platform",
    "Authentication and identity service",
    ["identity platform", "authentication service", "auth service", "identity"],
    "active",
    ["TechManasija"],
  ),
  repository(
    "billings-platform",
    "Shared platform",
    "Billing, subscriptions, invoicing, and reconciliation",
    ["billing platform", "billings platform", "subscription", "invoice", "reconciliation"],
    "active",
    ["deiondz"],
  ),
  repository(
    "platform-console",
    "Shared platform",
    "Developer and customer platform console",
    ["platform console", "developer console", "customer console", "product catalog", "checkout"],
    "active",
    ["deiondz"],
  ),
  repository(
    "operation-dashboard",
    "Shared platform",
    "Internal billing and identity administration",
    ["operation dashboard", "operations dashboard", "billing admin", "identity admin"],
    "active",
    ["deiondz"],
  ),
  repository(
    "ai-processing",
    "Shared data and AI",
    "AI classification, summarization, transcription, and document workflows",
    ["ai processing", "classification", "summarization", "transcription", "document workflow"],
    "active",
    ["Shaunfurtado"],
  ),
  repository(
    "data-ingestion",
    "Shared data and AI",
    "Market-data ingestion and processing",
    ["data ingestion", "market data ingestion", "ingestion pipeline", "data processing"],
    "active",
    ["Shaunfurtado"],
  ),
  repository(
    "Kite",
    "Shared data and AI",
    "Zerodha market-data and trading services",
    ["kite", "zerodha", "zerodha market data", "trading service"],
    "active",
    ["dRDX420"],
  ),
  repository(
    "daily-summary",
    "Shared data and AI",
    "Daily market and earnings-report generation prototypes",
    ["daily summary", "earnings report", "market report generator"],
    "active",
    ["TechManasija"],
  ),
  repository(
    "live-concall-service",
    "Shared data and AI",
    "Conference-call streaming and transcription",
    ["live concall", "concall service", "conference call", "call transcription"],
    "active",
    ["jtuluve"],
  ),
  repository(
    "workers",
    "Shared data and AI",
    "Edge workers for market datasets and metrics",
    ["workers", "edge worker", "cloudflare worker", "market metrics", "corporate actions"],
    "active",
    ["TechManasija"],
  ),
  repository(
    ".github",
    "Organization",
    "Public organization profile",
    ["organization profile", "github profile", "org readme"],
    "active",
    ["TechManasija"],
  ),
  repository(
    "manasija-landing",
    "Organization",
    "Corporate and product website",
    ["manasija website", "company website", "corporate site", "manasija landing"],
    "active",
    ["Sahad-09"],
  ),
  repository(
    "cli-automation-tool",
    "Internal tooling",
    "Local build and deployment automation",
    ["cli automation", "build automation", "deployment automation"],
    "quiet",
    ["deiondz"],
  ),
  repository(
    "invite-spark-finance",
    "Internal or experimental",
    "Invite-signup finance site",
    ["invite spark", "finance invite", "invite signup"],
    "quiet",
    ["TechManasija"],
  ),
  repository(
    "max",
    "Internal or experimental",
    "Autonomous financial-research agent",
    ["max agent", "financial research agent", "autonomous research", "whatsapp research"],
    "active",
    ["deiondz"],
  ),
  repository(
    "optrack-app",
    "Internal or experimental",
    "Options and portfolio-tracking prototypes",
    ["optrack", "options tracking", "portfolio tracking", "greeks", "f&o"],
    "active",
    ["dRDX420"],
  ),
  repository(
    "r2-explorer-template",
    "Internal or experimental",
    "R2 file-management template",
    ["r2 explorer", "r2 file manager", "cloudflare r2 template"],
    "dormant",
    [],
  ),
  repository(
    "r2-viewer",
    "Internal or experimental",
    "Empty R2 viewer repository",
    ["r2 viewer"],
    "empty",
    [],
  ),
  repository(
    "lovable-manasija",
    "Internal or experimental",
    "Empty Lovable repository",
    ["lovable manasija", "lovable"],
    "empty",
    [],
  ),
  repository(
    "samvitti-news",
    "Earlier market applications",
    "Earlier market-news and ingestion collection",
    ["samvitti", "samvitti news", "legacy market news", "news ingestion"],
    "active",
    ["padi-g"],
    true,
  ),
  repository(
    "tattva-ui",
    "Earlier market applications",
    "Earlier market dashboard frontend",
    ["tattva", "tattva ui", "legacy market dashboard"],
    "dormant",
    ["padi-g"],
  ),
  repository(
    "tatva-ui-2",
    "Earlier market applications",
    "Newer market-intelligence frontend",
    ["tatva ui 2", "tatva-ui-2", "newer market frontend"],
    "active",
    ["deiondz"],
    true,
  ),
];

export function assertOrganizationRepository(
  repo: string,
): asserts repo is `manasijatech/${string}` {
  if (!/^manasijatech\/[A-Za-z0-9_.-]+$/.test(repo)) {
    throw new Error("Issue repository must belong to the manasijatech organization.");
  }
}

export function repositoryRegistryForModel() {
  return issueRepositories.map((repository) => ({ ...repository }));
}

export function repositoryCandidatesForModel(query: string, limit = 8) {
  const normalized = query.toLowerCase();
  const terms = normalized
    .split(/[^a-z0-9]+/u)
    .filter((term) => term.length > 2);
  const ranked = issueRepositories
    .map((repository) => {
      const name = repository.slug.slice("manasijatech/".length).toLowerCase();
      const aliases = repository.aliases.map((alias) => alias.toLowerCase());
      const descriptiveText = `${repository.productArea} ${repository.role}`.toLowerCase();
      const score =
        (normalized.includes(name) ? 20 : 0) +
        aliases.reduce(
          (total, alias) => total + (normalized.includes(alias) ? 12 : 0),
          0,
        ) +
        terms.reduce(
          (total, term) =>
            total +
            (name.includes(term) ? 4 : 0) +
            (aliases.some((alias) => alias.includes(term)) ? 3 : 0) +
            (descriptiveText.includes(term) ? 1 : 0),
          0,
        );
      return { repository, score };
    })
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ repository }) => ({ ...repository }));

  return ranked.length > 0 ? ranked : repositoryRegistryForModel();
}
