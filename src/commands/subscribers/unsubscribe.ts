import type { Command } from "commander";

import { output } from "../../core/output";
import { Safety, safety } from "../../core/safety";
import { bento } from "../../core/sdk";
import { handleSubscriberError, printCsvErrors, resolveEmailTargets } from "./helpers";
import { approved, preview, show } from "../extended-helpers";

interface UnsubscribeOptions {
  email?: string;
  file?: string;
  dryRun?: boolean;
  limit?: string;
  sample?: string;
  confirm?: boolean;
  triggerAutomations?: boolean;
  yes?: boolean;
}

export function registerUnsubscribeCommand(subscribers: Command): void {
  const command = subscribers
    .command("unsubscribe")
    .description("Unsubscribe subscribers (stop email delivery)")
    .option("-e, --email <email>", "Single email to unsubscribe")
    .option("-f, --file <file>", "CSV or newline list of subscriber emails");
  command.option("--trigger-automations", "Unsubscribe through events and trigger automations")
    .option("--yes", "Skip confirmation for automation-triggering unsubscribe");

  Safety.addFlags(command);

  command.action(async (opts: UnsubscribeOptions) => {
    try {
      const targets = await resolveEmailTargets({ email: opts.email, file: opts.file });
      if (!targets) {
        output.error("Provide --email <email> or --file <path> to select subscribers.");
        process.exit(2);
      }

      if (targets.errors.length > 0) {
        printCsvErrors(targets.errors);
        process.exit(6);
      }

      if (opts.triggerAutomations) {
        const bodies = targets.emails.map((email) => ({ events: [{ email, type: "$unsubscribe" }] }));
        if (opts.dryRun) { await preview("/batch/events", bodies); return; }
        if (!await approved("Unsubscribe with automations", targets.emails, opts.yes)) return;
        const results: unknown[] = [];
        for (const body of bodies) results.push(await bento.postEvents(body.events));
        show({ recipients: targets.emails, results });
        return;
      }

      await safety.protect<string, void>(
        {
          name: "Unsubscribe Subscribers",
          items: targets.emails,
          formatItem: (email) => ({ email }),
          isDangerous: true,
          execute: async (emails) => {
            for (const email of emails) {
              await bento.unsubscribe(email);
            }
            emitResult(emails.length);
          },
        },
        Safety.parseOptions(opts)
      );
    } catch (error) {
      handleSubscriberError(error);
    }
  });
}

function emitResult(count: number): void {
  if (output.isJson()) {
    output.json({
      success: true,
      error: null,
      data: {
        updated: count,
        action: "unsubscribe",
      },
      meta: { count },
    });
    return;
  }

  output.success(`Unsubscribed ${count} subscriber(s).`);
}
