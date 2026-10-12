import type { Command } from "commander";
import { bento, CLIError } from "../core/sdk";
import { output } from "../core/output";
import { approved, batchFailure, chunks, fail, jsonArrayFile, jsonObject, preview, show } from "./extended-helpers";

type Email = Record<string, unknown> & { to: string; from: string; subject: string; html_body: string };

function validate(email: Record<string, unknown>, index: number): Email {
  for (const key of ["to", "from", "subject", "html_body"]) {
    if (typeof email[key] !== "string" || !email[key]) {
      throw new CLIError(`Email ${index + 1} requires ${key}.`, "VALIDATION_ERROR", 422);
    }
  }
  return email as Email;
}

async function send(emails: Email[], dryRun?: boolean, yes?: boolean): Promise<void> {
  if (emails.length === 0) throw new CLIError("Emails file must contain at least one email.", "VALIDATION_ERROR", 422);
  const batches = chunks(emails, 60);
  if (dryRun) { await preview("/batch/emails", batches.map((batch) => ({ emails: batch }))); return; }
  if (!await approved("Send transactional emails", emails.map((email) => email.to), yes)) return;
  const results: Array<{ chunk: number; count: number; response?: unknown; error?: string }> = [];
  for (const [index, batch] of batches.entries()) {
    try {
      const response = await bento.sendEmails(batch);
      results.push({ chunk: index + 1, count: batch.length, response, error: batchFailure(response, batch.length) });
    }
    catch (error) { results.push({ chunk: index + 1, count: batch.length, error: error instanceof Error ? error.message : String(error) }); }
  }
  const failed = results.some((result) => result.error);
  if (output.isJson()) output.json({ success: !failed, error: failed ? "One or more email chunks failed." : null, data: { total: emails.length, chunks: results }, meta: { count: results.length } });
  else {
    output.info(`Emails: ${emails.length} across ${results.length} chunk(s)`);
    output.table(results.map((result) => ({ chunk: result.chunk, count: result.count, accepted: (result.response as { results?: number } | undefined)?.results ?? 0, error: result.error ?? "" })));
  }
  if (failed) process.exitCode = 1;
}

export function registerEmailsCommands(program: Command): void {
  const emails = program.command("emails").description("Send transactional emails");
  emails.command("send").requiredOption("--to <email>").requiredOption("--from <email>")
    .requiredOption("--subject <subject>").requiredOption("--html-body <html>")
    .option("--personalizations <json>").option("--yes").option("--dry-run")
    .action(async (opts: { to: string; from: string; subject: string; htmlBody: string; personalizations?: string; yes?: boolean; dryRun?: boolean }) => {
      try {
        const email: Email = { to: opts.to, from: opts.from, subject: opts.subject, html_body: opts.htmlBody, transactional: true };
        if (opts.personalizations) email.personalizations = jsonObject(opts.personalizations, "--personalizations");
        await send([email], opts.dryRun, opts.yes);
      } catch (error) { fail(error); }
    });
  emails.command("send-batch").requiredOption("--file <file.json>")
    .option("--yes").option("--dry-run")
    .action(async (opts: { file: string; yes?: boolean; dryRun?: boolean }) => {
      try {
        const source = await jsonArrayFile(opts.file, "Emails");
        await send(source.map((item, index) => validate({ ...item, transactional: true }, index)), opts.dryRun, opts.yes);
      } catch (error) { fail(error); }
    });
}
