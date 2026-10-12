import type { Command } from "commander";
import { bento } from "../core/sdk";
import { fail, show } from "./extended-helpers";

export function registerFormsCommands(program: Command): void {
  program.command("forms").description("View forms").command("responses <form_id>").action(async (id: string) => {
    try { show(await bento.getFormResponses(id)); } catch (error) { fail(error); }
  });
}
