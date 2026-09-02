import { createFileRoute } from "@tanstack/react-router";

import { cronAuthorized, runBalanceReminders } from "@/lib/email/balance-reminders.server";

async function handle(request: Request) {
  if (!cronAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const result = await runBalanceReminders();
    return Response.json(result);
  } catch (error) {
    console.error("[balance-reminders]", error);
    return new Response("Reminder job failed", { status: 500 });
  }
}

export const Route = createFileRoute("/api/cron/balance-reminders")({
  server: {
    handlers: {
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
    },
  },
});
