import type { DigestEmployee, StandupPeriod } from "./service.js";

interface DigestInput {
  standupDate: string;
  period: StandupPeriod;
  employees: readonly DigestEmployee[];
}

function displayDate(standupDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${standupDate}T00:00:00.000Z`));
}

export function renderStandupDigest({
  standupDate,
  period,
  employees,
}: DigestInput): string {
  const sections = employees.map((employee) => {
    const bullets =
      employee.entries.length > 0
        ? employee.entries.map((entry) => `• ${entry.text}`)
        : [
            employee.response === "empty"
              ? period === "morning"
                ? "• No plans today"
                : "• No accomplishments to report"
              : "• Awaiting update",
          ];
    return [`<@${employee.employeeSlackUserId}>`, ...bullets].join("\n");
  });

  const label = period === "morning" ? "Morning" : "Evening";
  return [
    `${label} stand-up — ${displayDate(standupDate)}`,
    ...sections,
  ].join("\n\n");
}
