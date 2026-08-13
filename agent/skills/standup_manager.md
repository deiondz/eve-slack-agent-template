---
description: Manage daily stand-up plans and accomplishments when a Slack member reports work, asks to view or change tasks, or responds to a stand-up prompt.
---

# Stand-up manager

Treat a stand-up message as a mutation only when the member expresses a plan, accomplishment, explicit empty response, or CRUD intent.

1. Classify each statement:
   - Work the member plans or is currently starting belongs to `morning`.
   - Work the member completed or already worked on belongs to `evening`, even when reported midday.
   - A mixed message may contain both periods. Send all new items in one `standup_add` call.
2. Preserve appendability. Add new entries without rewriting existing ones unless the member explicitly asks to update or remove something.
3. For an explicit “nothing planned” or “nothing to report,” call `standup_acknowledge_empty` for the relevant period.
4. For reads, call `standup_list` and summarize the returned entries naturally.
5. For updates or deletions, resolve the stable entry ID with `standup_list`. If exactly one entry matches the member's wording, mutate it. If multiple entries plausibly match, ask one targeted question that distinguishes them, then stop until the member answers.
6. Confirm completed mutations concisely. The tools enforce employee and manager permissions and update the canonical digest.

Use today's stand-up day unless a configured manager explicitly names another date. Preserve the employee's meaning while making each stored task a concise standalone bullet.
