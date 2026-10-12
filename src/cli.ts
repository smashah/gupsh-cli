import { Command } from "commander";
import chalk from "chalk";

import { registerAuthCommands } from "./commands/auth";
import { registerBroadcastsCommands } from "./commands/broadcasts";
import { registerDashboardCommand } from "./commands/dashboard";
import { registerEventsCommands } from "./commands/events";
import { registerEmailsCommands } from "./commands/emails";
import { registerTemplatesCommands } from "./commands/templates";
import { registerWorkflowsCommands } from "./commands/workflows";
import { registerFormsCommands } from "./commands/forms";
import { registerExperimentalCommands } from "./commands/experimental";
import { registerFieldsCommands } from "./commands/fields";
import { registerProfileCommands } from "./commands/profile";
import { registerSequencesCommands } from "./commands/sequences";
import { registerStatsCommands } from "./commands/stats";
import { registerSubscribersCommands } from "./commands/subscribers";
import { registerTagsCommands } from "./commands/tags";
import { output } from "./core/output";
import { config } from "./core/config";

const program = new Command();

program
  .name("gupsh")
  .description(
    "gupsh CLI - Command-oriented interface for gupsh email marketing"
  )
  .version("0.1.6")
  .option("--json", "Output machine-readable JSON")
  .option("--quiet", "Suppress non-essential output (errors still print)")
  .hook("preAction", (thisCommand) => {
    configureOutputMode(thisCommand.optsWithGlobals());
  })
  .action(async () => {
    if (output.isJson()) {
      output.jsonError("No command provided. Pass a command or remove --json.", {
        code: 2,
        count: 0,
      });
      process.exit(2);
    }

    if (output.isQuiet()) {
      return;
    }

    await showWelcomeScreen();
  });

// Register command groups
registerAuthCommands(program);
registerProfileCommands(program);
registerSubscribersCommands(program);
registerTagsCommands(program);
registerFieldsCommands(program);
registerEventsCommands(program);
registerEmailsCommands(program);
registerTemplatesCommands(program);
registerWorkflowsCommands(program);
registerFormsCommands(program);
registerExperimentalCommands(program);
registerBroadcastsCommands(program);
registerSequencesCommands(program);
registerStatsCommands(program);
registerDashboardCommand(program);

// Future commands to be implemented:
// - subscribers (search, import, tag, suppress)
// - mcp (status, start, stop)
// - ask

program.parseAsync().catch((error) => {
  // Commander's exitOverride throws here — let it pass
  if (error?.code === "commander.helpDisplayed" || error?.code === "commander.version") {
    return;
  }

  // Friendly fallback for any uncaught error
  if (error instanceof Error) {
    output.error(error.message);
  } else {
    output.error("An unexpected error occurred.");
  }
  process.exit(1);
});

function configureOutputMode(options: { json?: boolean; quiet?: boolean }): void {
  if (options.json && options.quiet) {
    output.error("Cannot use --json and --quiet together.");
    process.exit(2);
  }

  if (options.json) {
    output.setMode("json");
    return;
  }

  if (options.quiet) {
    output.setMode("quiet");
    return;
  }

  output.setMode("normal");
}

async function showWelcomeScreen(): Promise<void> {
  const version = "0.1.6";
  
  // gupsh brand color
  const brand = chalk.hex("#8B5CF6");
  const dim = chalk.dim;
  const bold = chalk.bold;
  
  const logo = brand("gupsh");

  console.log(logo);
  console.log(`  ${dim("Email marketing from your terminal")}           ${dim(`v${version}`)}`);
  console.log();

  // Check auth status
  let authStatus: string;
  try {
    const currentProfile = await config.getCurrentProfileName();
    if (currentProfile) {
      authStatus = chalk.green(`● Authenticated`) + dim(` (${currentProfile})`);
    } else {
      authStatus = chalk.yellow(`○ Not authenticated`);
    }
  } catch {
    authStatus = chalk.yellow(`○ Not authenticated`);
  }
  
  console.log(`  ${authStatus}`);
  console.log();
  console.log(`  ${bold("Quick Start")}`);
  console.log(`  ${dim("$")} gupsh auth login          ${dim("Authenticate with Bento")}`);
  console.log(`  ${dim("$")} gupsh stats site          ${dim("View your site statistics")}`);
  console.log(`  ${dim("$")} gupsh dashboard           ${dim("Open the gupsh web dashboard")}`);
  console.log(`  ${dim("$")} gupsh subscribers search  ${dim("Search your subscribers")}`);
  console.log(`  ${dim("$")} gupsh tags list           ${dim("List all tags")}`);
  console.log();
  console.log(`  ${bold("All Commands")}`);
  console.log(`  ${dim("$")} gupsh --help              ${dim("Show all available commands")}`);
  console.log();
  console.log(`  ${dim("Documentation:")} ${chalk.cyan("https://github.com/smashah/gupsh-cli#readme")}`);
  console.log();
}
