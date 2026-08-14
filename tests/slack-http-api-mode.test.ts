import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const manifest = readFileSync("app.manifest.yaml", "utf8");
const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
  dependencies?: Record<string, string>;
  scripts?: Record<string, string>;
};
const slackCredentials = readFileSync("agent/lib/slack-credentials.ts", "utf8");

test("Slack manifest uses the Eve HTTP webhook and disables Socket Mode", () => {
  assert.equal(
    manifest.match(/https:\/\/sketch\.manasijatech\.com\/eve\/v1\/slack/gu)
      ?.length,
    2,
  );
  assert.match(manifest, /socket_mode_enabled:\s*false/u);
  assert.match(manifest, /- app_mention/u);
  assert.match(manifest, /- message\.im/u);
  assert.match(manifest, /interactivity:[\s\S]*is_enabled:\s*true/u);
});

test("Socket Mode bridge code and commands are absent", () => {
  assert.equal(existsSync("scripts/slack-socket-mode.mjs"), false);
  assert.equal(packageJson.dependencies?.["@slack/socket-mode"], undefined);
  for (const [name, command] of Object.entries(packageJson.scripts ?? {})) {
    assert.doesNotMatch(`${name} ${command}`, /socket/u);
  }
});

test("direct Slack webhooks use Slack request signing", () => {
  assert.match(slackCredentials, /SLACK_SIGNING_SECRET/u);
  assert.match(slackCredentials, /SLACK_BOT_TOKEN/u);
  assert.doesNotMatch(slackCredentials, /SLACK_SOCKET|socketMode|webhookVerifier/u);
});
