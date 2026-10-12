import type { Command } from "commander";
import { bento, CLIError } from "../../core/sdk";
import { fail, jsonObject, show } from "../extended-helpers";

export function registerSubscriberFieldCommand(subscribers: Command): void {
  const field = subscribers.command("field").description("Manage a subscriber's fields");
  field.command("set").requiredOption("--email <email>").requiredOption("--key <key>").requiredOption("--value <value>")
    .action(async (opts: { email: string; key: string; value: string }) => {
      try { show(await bento.addField({ email: opts.email, field: { key: opts.key, value: opts.value } })); }
      catch (error) { fail(error); }
    });
  field.command("remove").requiredOption("--email <email>").requiredOption("--key <key>")
    .action(async (opts: { email: string; key: string }) => {
      try { show(await bento.removeField(opts.email, opts.key)); }
      catch (error) { fail(error); }
    });
  field.command("update").requiredOption("--email <email>").requiredOption("--fields <json>")
    .action(async (opts: { email: string; fields: string }) => {
      try {
        const fields = jsonObject(opts.fields, "--fields");
        if (!Object.keys(fields).length) throw new CLIError("--fields cannot be empty.", "VALIDATION_ERROR", 422);
        show(await bento.updateFields(opts.email, fields));
      } catch (error) { fail(error); }
    });
}
