import type { Command } from "commander";
import { bento, CLIError } from "../core/sdk";
import { fail, show } from "./extended-helpers";

export function registerExperimentalCommands(program: Command): void {
  const experimental = program.command("experimental").description("Experimental utilities");
  experimental.command("validate-email <email>").option("--ip <ip>").option("--name <name>")
    .action(async (email: string, opts: { ip?: string; name?: string }) => {
      try { show(await bento.experimentalPost("validation", { email, ...(opts.ip ? { ip: opts.ip } : {}), ...(opts.name ? { name: opts.name } : {}) })); }
      catch (error) { fail(error); }
    });
  experimental.command("guess-gender <name>").action(async (name: string) => {
    try { show(await bento.experimentalPost("gender", { name })); } catch (error) { fail(error); }
  });
  experimental.command("geolocate <ip>").action(async (ip: string) => {
    try { show(await bento.experimentalGet("geolocation", { ip })); } catch (error) { fail(error); }
  });
  experimental.command("blacklist").option("--domain <domain>").option("--ip <ip>")
    .action(async (opts: { domain?: string; ip?: string }) => {
      try {
        if (Boolean(opts.domain) === Boolean(opts.ip)) throw new CLIError("Provide exactly one of --domain or --ip.", "VALIDATION_ERROR", 422);
        show(await bento.experimentalGet("blacklist", opts.domain ? { domain: opts.domain } : { ip: opts.ip as string }));
      } catch (error) { fail(error); }
    });
  experimental.command("moderate <text>").action(async (content: string) => {
    try { show(await bento.experimentalPost("content_moderation", { content })); } catch (error) { fail(error); }
  });
}
