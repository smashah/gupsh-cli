import type { Command } from "commander";
import { bento } from "../core/sdk";
import { fail, show } from "./extended-helpers";

export function registerWorkflowsCommands(program: Command): void {
  program.command("workflows").description("View workflows").command("list").action(async () => {
    try { show(await bento.getWorkflows()); } catch (error) { fail(error); }
  });
}
