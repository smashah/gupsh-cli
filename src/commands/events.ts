/**
 * Events commands
 *
 * Commands:
 * - gupsh events track --email <email> --event <name> [--details <json>] - Track a custom event
 */

import { Command } from "commander";
import { bento, CLIError } from "../core/sdk";
import { output } from "../core/output";
import { batchFailure, chunks, fail, jsonArrayFile, jsonObject, preview, show } from "./extended-helpers";

interface TrackOptions {
  email: string;
  event: string;
  details?: string;
}

export function registerEventsCommands(program: Command): void {
  const events = program
    .command("events")
    .description("Track events for subscribers");

  events
    .command("track")
    .description("Track a custom event for a subscriber")
    .requiredOption("-e, --email <email>", "Subscriber email address")
    .requiredOption("--event <name>", "Event name (e.g., 'button_clicked', 'purchase')")
    .option("-d, --details <json>", "Event details as JSON (e.g., '{\"product\": \"widget\"}')")
    .action(async (options: TrackOptions) => {
      try {
        let details: Record<string, unknown> | undefined;

        if (options.details) {
          try {
            details = JSON.parse(options.details);
          } catch {
            output.error("Invalid JSON in --details. Ensure valid JSON format.");
            process.exit(1);
          }
        }

        output.startSpinner("Tracking event...");

        const success = await bento.track({
          email: options.email,
          type: options.event,
          details,
        });

        if (!success) {
          output.failSpinner("Failed to track event");
          output.error("Event tracking failed. Please verify the email address is valid.");
          process.exit(1);
        }

        output.stopSpinner("Event tracked");

        if (output.isJson()) {
          output.json({
            success: true,
            error: null,
            data: {
              email: options.email,
              event: options.event,
              details: details ?? null,
            },
            meta: { count: 1 },
          });
        } else if (!output.isQuiet()) {
          output.success(`Tracked event "${options.event}" for ${options.email}`);
          if (details) {
            output.info(`Details: ${JSON.stringify(details)}`);
          }
        }
      } catch (error) {
        output.failSpinner();
        if (error instanceof CLIError) {
          output.error(error.message);
        } else if (error instanceof Error) {
          output.error(error.message);
        } else {
          output.error("An unexpected error occurred.");
        }
        process.exit(1);
      }
    });

  events.command("purchase").description("Record a purchase")
    .requiredOption("--email <email>").requiredOption("--amount <cents>")
    .requiredOption("--currency <currency>").requiredOption("--key <key>")
    .option("--cart <json>").option("--dry-run")
    .action(async (opts: { email: string; amount: string; currency: string; key: string; cart?: string; dryRun?: boolean }) => {
      try {
        const amount = Number(opts.amount);
        if (!Number.isSafeInteger(amount) || amount < 0) throw new CLIError("--amount must be a non-negative integer number of cents.", "VALIDATION_ERROR", 422);
        const details: Record<string, unknown> = { unique: { key: opts.key }, value: { amount, currency: opts.currency } };
        if (opts.cart) details.cart = jsonObject(opts.cart, "--cart");
        const events = [{ email: opts.email, type: "$purchase", details }];
        if (opts.dryRun) { await preview("/batch/events", [{ events }]); return; }
        const response = await bento.postEvents(events);
        const error = batchFailure(response, events.length);
        if (error) throw new CLIError(error, "API_ERROR");
        show(response);
      } catch (error) { fail(error); }
    });

  events.command("import <file.json>").description("Import JSON events in chunks of 1,000")
    .option("--dry-run").action(async (file: string, opts: { dryRun?: boolean }) => {
      try {
        const events = await jsonArrayFile(file, "Events");
        if (events.length === 0) throw new CLIError("Events file must contain at least one event.", "VALIDATION_ERROR", 422);
        for (const [index, event] of events.entries()) {
          if (typeof event.email !== "string" || !event.email || typeof event.type !== "string" || !event.type) {
            throw new CLIError(`Event ${index + 1} requires email and type.`, "VALIDATION_ERROR", 422);
          }
        }
        const batches = chunks(events, 1000);
        if (opts.dryRun) { await preview("/batch/events", batches.map((batch) => ({ events: batch }))); return; }
        const results: Array<{ chunk: number; count: number; response?: unknown; error?: string }> = [];
        for (const [index, batch] of batches.entries()) {
          try {
            const response = await bento.postEvents(batch);
            results.push({ chunk: index + 1, count: batch.length, response, error: batchFailure(response, batch.length) });
          }
          catch (error) { results.push({ chunk: index + 1, count: batch.length, error: error instanceof Error ? error.message : String(error) }); }
        }
        const failed = results.some((result) => result.error);
        if (output.isJson()) output.json({ success: !failed, error: failed ? "One or more event chunks failed." : null, data: { total: events.length, chunks: results }, meta: { count: results.length } });
        else {
          output.info(`Events: ${events.length} across ${results.length} chunk(s)`);
          output.table(results.map((result) => ({ chunk: result.chunk, count: result.count, accepted: (result.response as { results?: number } | undefined)?.results ?? 0, error: result.error ?? "" })));
        }
        if (failed) process.exitCode = 1;
      } catch (error) { fail(error); }
    });
}
