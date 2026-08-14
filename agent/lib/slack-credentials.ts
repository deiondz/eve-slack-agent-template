import { connectSlackCredentials } from "@vercel/connect/eve";
import type { SlackChannelCredentials } from "eve/channels/slack";

export const slackCredentials: SlackChannelCredentials = process.env.SLACK_CONNECTOR
  ? connectSlackCredentials(process.env.SLACK_CONNECTOR)
  : {
      botToken: process.env.SLACK_BOT_TOKEN,
      signingSecret: process.env.SLACK_SIGNING_SECRET,
    };
