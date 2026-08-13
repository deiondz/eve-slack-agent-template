import assert from "node:assert/strict";
import test from "node:test";

import {
  buildFollowupComment,
  buildIssueBody,
  slackMessageMarker,
  slackThreadMarker,
} from "../agent/lib/issues/format.js";

const context = {
  actorSlackUserId: "U_GAUTAM",
  actorDisplayName: "Gautam Padiyar",
  channelId: "C_MYUKI",
  messageTs: "1786595030.000200",
  teamId: "T_TEAM",
  threadTs: "1786595000.000100",
};

test("issue body preserves missing information, evidence, backlink, and stable markers", () => {
  const body = buildIssueBody({
    context,
    observed: "Market-cap filter is active but some stocks are missing.",
    evidence: ["Screenshot 2026-08-13 at 9.54.50 AM.png — filtered list"],
    repositoryRouting: "Myuki product behavior maps to manasijatech/myuki.",
    slackPermalink: "https://example.slack.com/archives/C_MYUKI/p1786595000000100",
  });

  assert.match(body, /## Expected behavior\n\nNot provided/);
  assert.match(body, /Screenshot 2026-08-13/);
  assert.match(body, /Original thread: https:\/\/example\.slack\.com/);
  assert.ok(body.includes(slackThreadMarker(context)));
  assert.ok(body.includes(slackMessageMarker(context)));
  assert.ok(body.includes(slackThreadMarker(context)));
});

test("follow-up comments carry the message marker for retry safety", () => {
  const body = buildFollowupComment({
    context,
    observed: "The missing stocks appear only when the market-cap filter is active.",
    slackPermalink: "https://example.slack.com/thread",
  });
  assert.ok(body.includes(slackMessageMarker(context)));
  assert.match(body, /Additional report from/);
});
