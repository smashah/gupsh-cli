import type { Command } from "commander";
import { bento } from "../../core/sdk";
import { fail, show } from "../extended-helpers";

export function registerChangeEmailCommand(subscribers: Command): void {
  subscribers.command("change-email").description("Change a subscriber's email")
    .requiredOption("--old <email>").requiredOption("--new <email>")
    .action(async (opts: { old: string; new: string }) => {
      try { show(await bento.changeEmail(opts.old, opts.new)); }
      catch (error) { fail(error); }
    });
}
