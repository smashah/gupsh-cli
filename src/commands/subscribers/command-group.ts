import type { Command } from "commander";

import { registerImportCommand } from "./import";
import { registerSearchCommand } from "./search";
import { registerSubscribeCommand } from "./subscribe";
import { registerTagCommand } from "./tag";
import { registerUnsubscribeCommand } from "./unsubscribe";
import { registerSubscriberFieldCommand } from "./field";
import { registerChangeEmailCommand } from "./change-email";

export function registerSubscribersCommands(program: Command): void {
  const subscribers = program.command("subscribers").description("Manage subscribers");

  registerSearchCommand(subscribers);
  registerImportCommand(subscribers);
  registerTagCommand(subscribers);
  registerSubscribeCommand(subscribers);
  registerUnsubscribeCommand(subscribers);
  registerSubscriberFieldCommand(subscribers);
  registerChangeEmailCommand(subscribers);
}
