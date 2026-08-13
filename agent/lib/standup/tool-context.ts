import type { ToolContext } from "eve/tools";

export function slackActorFrom(ctx: ToolContext): string {
  const value = ctx.session.auth.current?.attributes.user_id;
  if (typeof value !== "string" || !value) {
    throw new Error("Stand-up tools can be used only by an authenticated Slack member.");
  }
  return value;
}
