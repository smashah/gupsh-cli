import { confirm } from "@inquirer/prompts";
import { readFile } from "node:fs/promises";
import { output } from "../core/output";
import { CLIError } from "../core/sdk";
import { config } from "../core/config";

export function jsonObject(value: string, flag: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
  } catch { /* The message below covers invalid JSON. */ }
  throw new CLIError(`${flag} must be a JSON object.`, "VALIDATION_ERROR", 422);
}

export async function jsonArrayFile(file: string, label: string): Promise<Array<Record<string, unknown>>> {
  let parsed: unknown;
  try { parsed = JSON.parse(await readFile(file, "utf8")); }
  catch (error) { throw new CLIError(`Cannot read ${label} JSON file: ${error instanceof Error ? error.message : String(error)}`, "VALIDATION_ERROR", 422); }
  if (!Array.isArray(parsed) || !parsed.every((item) => item && typeof item === "object" && !Array.isArray(item))) {
    throw new CLIError(`${label} file must contain a JSON array of objects.`, "VALIDATION_ERROR", 422);
  }
  return parsed as Array<Record<string, unknown>>;
}

export function show(value: unknown): void {
  if (output.isJson()) {
    output.json({ success: true, error: null, data: value, meta: { count: Array.isArray(value) ? value.length : 1 } });
  } else if (value && typeof value === "object" && "data" in value && Array.isArray(value.data)) {
    show(value.data);
  } else if (Array.isArray(value)) {
    output.table(value.map((item) => item && typeof item === "object" ? item as Record<string, unknown> : { value: item }));
  } else if (value && typeof value === "object") {
    output.object(value as Record<string, unknown>);
  } else {
    output.log(String(value));
  }
}

export function fail(error: unknown): never {
  output.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

export async function approved(label: string, recipients: string[], yes?: boolean): Promise<boolean> {
  if (yes) return true;
  if (output.isJson() || !process.stdin.isTTY) {
    throw new CLIError(`Confirmation required for ${label} to ${recipients.length} recipient(s). Pass --yes.`, "VALIDATION_ERROR", 422);
  }
  output.info(`${label}: ${recipients.length} recipient(s): ${recipients.join(", ")}`);
  return confirm({ message: "Proceed?", default: false });
}

export async function preview(path: string, bodies: Array<Record<string, unknown>>): Promise<void> {
  const profile = await config.getCurrentProfile();
  show({ dryRun: true, path, requests: bodies.map((body) => ({ ...body, site_uuid: profile?.siteUuid ?? "<active site UUID>" })) });
}

export function chunks<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size));
  return result;
}

export function batchFailure(response: unknown, requested: number): string | undefined {
  if (!response || typeof response !== "object") return "Unexpected batch response";
  const value = response as { results?: unknown; failed?: unknown };
  if (typeof value.results !== "number") return "Batch response did not report an accepted count";
  if (value.results !== requested || (typeof value.failed === "number" && value.failed > 0)) {
    return `API accepted ${value.results} of ${requested} item(s); failed: ${String(value.failed ?? requested - value.results)}`;
  }
  return undefined;
}
