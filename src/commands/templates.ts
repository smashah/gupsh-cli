import type { Command } from "commander";
import { bento, CLIError } from "../core/sdk";
import { fail, show } from "./extended-helpers";

export function registerTemplatesCommands(program: Command): void {
  const templates = program.command("templates").description("Manage email templates");
  templates.command("get <id>").action(async (id: string) => {
    try { show(await bento.getEmailTemplate(id)); } catch (error) { fail(error); }
  });
  templates.command("update <id>").option("--subject <subject>").option("--html <html>")
    .action(async (id: string, opts: { subject?: string; html?: string }) => {
      try {
        if (opts.subject === undefined && opts.html === undefined) throw new CLIError("Provide --subject or --html.", "VALIDATION_ERROR", 422);
        show(await bento.updateEmailTemplate(id, opts));
      } catch (error) { fail(error); }
    });
}
