# gupsh CLI

This fork adapts [Bento CLI 0.1.6](https://github.com/bentonow/bento-cli) to gupsh. The original MIT license and attribution are in [LICENSE](LICENSE) and [NOTICE](NOTICE).

```bash
npm i -g @gupsh/cli
gupsh auth login --api-url https://api.gupsh.app/api/v1
```

Each profile can target an environment:

```bash
gupsh profile add local --api-url http://localhost:8600/api/v1 --dashboard-url http://localhost:8602/marketing/overview \
  --publishable-key "$PK" --secret-key "$SK" --site-uuid "$SITE"
gupsh profile add prod --publishable-key "$PK" --secret-key "$SK" --site-uuid "$SITE"
gupsh profile use local
gupsh stats site --json
```

The API URL resolves from `GUPSH_API_BASE_URL`, `BENTO_API_BASE_URL`, the selected profile, then `https://api.gupsh.app/api/v1`. Dashboard and config overrides follow the same `GUPSH_*` then `BENTO_*` order (`GUPSH_DASHBOARD_URL`, `GUPSH_CONFIG_PATH`); confirmation accepts `GUPSH_AUTO_CONFIRM` or `BENTO_AUTO_CONFIRM`. With no stored profile, set `GUPSH_PUBLISHABLE_KEY`, `GUPSH_SECRET_KEY`, and `GUPSH_SITE_UUID` (or the `BENTO_*` equivalents) for an in-memory CI profile. Set `GUPSH_USE_ENV_CREDENTIALS=1` to select env credentials even when a stored profile exists.

The fork keeps upstream commands, flags, JSON output, and exit codes, while changing the binary, default hosts, and profile-specific URLs.

## Additional Bento-compatible commands

```bash
gupsh subscribers field set --email person@example.com --key plan --value pro
gupsh subscribers field remove --email person@example.com --key plan
gupsh subscribers field update --email person@example.com --fields '{"plan":"pro"}'
gupsh subscribers change-email --old person@example.com --new new@example.com
gupsh subscribers unsubscribe --email person@example.com --trigger-automations --dry-run
gupsh events purchase --email person@example.com --amount 2500 --currency USD --key order-123 --cart '{"items":[]}'
gupsh events import events.json
gupsh emails send --to person@example.com --from sender@example.com --subject Hello --html-body '<p>Hello</p>' --dry-run
gupsh emails send-batch --file emails.json --yes
gupsh templates get 123
gupsh templates update 123 --subject 'Updated subject' --html '<p>Updated</p>'
gupsh workflows list
gupsh forms responses 123
gupsh stats segment 123
gupsh stats report 123
gupsh experimental validate-email person@example.com --ip 203.0.113.1 --name Person
gupsh experimental guess-gender Alex
gupsh experimental geolocate 203.0.113.1
gupsh experimental blacklist --domain example.com
gupsh experimental moderate 'Example text'
```

`events import` accepts an array of event objects (`email`, `type`, and optional `fields`, `details`, `date`). `emails send-batch` accepts an array of email objects (`to`, `from`, `subject`, `html_body`, and optional `personalizations`). Events use batches of 1,000 and emails use batches of 60. Both commands report each chunk's accepted count or error and continue after a failed chunk; they do not automatically replay an uncertain request. Sending mail and automation-triggering unsubscribe require confirmation, or `--yes` in scripts. `--dry-run` prints the planned request payloads and makes no API call. Add `--json` for machine-readable output.

---
# gupsh CLI

Command-line interface for [gupsh](https://gupsh.app) email marketing. Manage subscribers, tags, events, and broadcasts directly from your terminal.

[![npm version](https://img.shields.io/npm/v/@gupsh/cli.svg)](https://www.npmjs.com/package/@gupsh/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
# Recommended: Run with npx (always uses latest version)
npx @gupsh/cli --help

# Or install globally
npm install -g @gupsh/cli

# Or with Bun
bun install -g @gupsh/cli
```

> **Tip:** Using `npx` is recommended when possible—it always fetches the latest version, requires no installation, and is ideal for CI/CD pipelines.

## Quick Start

```bash
# 1. Authenticate with your gupsh credentials
gupsh auth login

# 2. Verify your connection
gupsh stats site

# 3. Start managing your subscribers
gupsh subscribers search --email user@example.com
gupsh tags list
```

## Authentication

The CLI uses your gupsh API credentials. Get them from [Settings > Teams](https://app.gupsh.app/marketing/settings) in your gupsh dashboard.

```bash
# Interactive login (prompts for credentials)
gupsh auth login

# Non-interactive login (for CI/scripts)
gupsh auth login \
  --publishable-key "your-publishable-key" \
  --secret-key "your-secret-key" \
  --site-uuid "your-site-uuid"

# Or run directly with npx (no install required)
npx @gupsh/cli auth login \
  --publishable-key "your-publishable-key" \
  --secret-key "your-secret-key" \
  --site-uuid "your-site-uuid"

# Check authentication status
gupsh auth status

# Log out (removes stored credentials)
gupsh auth logout
```

### Multiple Profiles

Manage multiple gupsh accounts (e.g., production, staging):

```bash
# Add a named profile
gupsh profile add production
gupsh profile add staging

# Switch between profiles
gupsh profile use staging

# List all profiles
gupsh profile list

# Remove a profile
gupsh profile remove staging
```

Credentials are stored securely at:
- **macOS**: `~/Library/Application Support/gupsh/config.json`
- **Linux**: `~/.config/gupsh/config.json`
- **Windows**: `%APPDATA%/gupsh/config.json`

## Commands

### Dashboard

```bash
# Open the gupsh dashboard for your active profile
gupsh dashboard

# Target a specific profile
gupsh dashboard --profile staging

# JSON mode still opens the browser but prints machine-readable output
gupsh dashboard --json
```

### Subscribers

```bash
# Look up a subscriber
gupsh subscribers search --email user@example.com

# Look up + check if they have a tag
gupsh subscribers search --email user@example.com --tag vip

# Look up + check field value
gupsh subscribers search --email user@example.com --field plan=pro

# Import subscribers from CSV (email column required)
gupsh subscribers import contacts.csv
gupsh subscribers import contacts.csv --dry-run        # Preview first
gupsh subscribers import contacts.csv --limit 100      # Import first 100

# Add/remove tags from subscribers
gupsh subscribers tag --email user@example.com --add vip
gupsh subscribers tag --email user@example.com --remove trial
gupsh subscribers tag --file users.csv --add customer,active --confirm

# Unsubscribe (stop email delivery)
gupsh subscribers unsubscribe --email user@example.com
gupsh subscribers unsubscribe --file unsubscribes.csv --confirm

# Re-subscribe (restore email delivery)
gupsh subscribers subscribe --email user@example.com
```

### Tags

```bash
# List all tags
gupsh tags list

# Search tags by name
gupsh tags list news         # Fuzzy match on tag name

# Create a new tag
gupsh tags create "new-feature-announcement"

# Delete a tag (via web interface - API limitation)
gupsh tags delete "old-tag"
```

### Custom Fields

```bash
# List all custom fields
gupsh fields list

# Search fields by key or name
gupsh fields list company    # Fuzzy match on field key + name

# Create a new field
gupsh fields create company_size
```

### Events

Track custom events to trigger automations:

```bash
# Track a simple event
gupsh events track --email user@example.com --event signed_up

# Track with details
gupsh events track \
  --email user@example.com \
  --event purchase \
  --details '{"product": "Pro Plan", "amount": 99}'
```

### Broadcasts

```bash
# List all broadcasts
gupsh broadcasts list

# Paginate results
gupsh broadcasts list --page 1 --per-page 10

# Notes:
# - `--page` by itself uses gupsh's API pagination (25 results per page, minimal memory).
# - Adding `--per-page` tells the CLI to fetch the full list once and slice locally, so prefer
#   smaller values here when you have very large broadcast histories.

# Create a broadcast draft
gupsh broadcasts create \
  --name "January Newsletter" \
  --subject "What's new this month" \
  --content "<h1>Hello!</h1><p>Here's our update...</p>" \
  --type html \
  --include-tags "newsletter,active"
```

### Sequences

```bash
# List all sequences
gupsh sequences list

# Create a sequence email with inline HTML
gupsh sequences create-email \
  --sequence-id 123 \
  --subject "Welcome to gupsh" \
  --html "<h1>Hi there</h1>" \
  --delay-interval days \
  --delay-count 7

# Create from an HTML file
gupsh sequences create-email \
  --sequence-id 123 \
  --subject "Day 2 follow-up" \
  --html-file ./emails/day-2.html

# Update an existing sequence email template
gupsh sequences update-email \
  --template-id 12345 \
  --subject "Updated Welcome Subject"

# Update subject + HTML inline
gupsh sequences update-email \
  --template-id 12345 \
  --subject "Refined Subject" \
  --html "<h1>Updated body</h1>"

# Update HTML from file
gupsh sequences update-email \
  --template-id 12345 \
  --html-file ./emails/updated-welcome.html
```

Maintainer release order for this feature:
1. Ship the API endpoint in `gupsh`.
2. Publish a `gupsh-node-sdk` version that includes `createSequenceEmail`.
3. Release `gupsh-cli` against that SDK version.

Current API limitation: sequence email updates support `subject` and `html` fields only.

### Statistics

```bash
# View site-wide stats
gupsh stats site
```

## Output Modes

| Flag | Description |
|------|-------------|
| *(none)* | Human-readable tables with colors |
| `--json` | Machine-readable JSON for scripting |
| `--quiet` | Minimal output (errors only) |

```bash
# Default: pretty tables
gupsh subscribers search --email user@example.com

# JSON for scripting
gupsh subscribers search --email user@example.com --json | jq '.data[].email'

# Quiet for automation (exit code only)
gupsh tags create "test-tag" --quiet && echo "Created!"
```

### JSON Response Format

All `--json` output follows a consistent schema:

```json
{
  "success": true,
  "error": null,
  "data": { ... },
  "meta": {
    "count": 10,
    "total": 100
  }
}
```

## Safety Features

Bulk operations include safety flags to prevent mistakes:

| Flag | Description |
|------|-------------|
| `--dry-run` | Preview what would happen without making changes |
| `--limit <n>` | Only process the first N items |
| `--sample <n>` | Show N sample items in the preview |
| `--confirm` | Skip interactive confirmation (for scripts) |

```bash
# Preview an import without executing
gupsh subscribers import big-list.csv --dry-run

# Import only the first 10 rows to test
gupsh subscribers import big-list.csv --limit 10

# Tag subscribers non-interactively (CI/scripts)
gupsh subscribers tag --file users.csv --add customer --confirm
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `BENTO_CONFIG_PATH` | Override config file location |
| `BENTO_API_BASE_URL` | Override API endpoint (for testing) |
| `BENTO_AUTO_CONFIRM` | Set to `true` to skip all confirmations |
| `DEBUG` | Set to `gupsh` for verbose SDK logging |

## CSV Format

### For Subscriber Imports

CSV files must have an `email` column (case-insensitive). The CLI recognizes these special columns:

| Column | Description |
|--------|-------------|
| `email` | **Required**. Subscriber email address |
| `name` | Optional. Subscriber display name |
| `tags` | Optional. Tags to add (comma or semicolon separated) |
| `remove_tags` | Optional. Tags to remove (comma or semicolon separated) |
| *(other)* | Any other columns become custom fields |

**Basic import with custom fields:**
```csv
email,first_name,last_name,plan
alice@example.com,Alice,Smith,pro
bob@example.com,Bob,Jones,starter
```

**Import with inline tag assignment:**
```csv
email,name,tags,remove_tags,company
jesse@example.com,Jesse Hanley,"customer,mql",lead,Acme Inc
alice@example.com,Alice Smith,"newsletter,active",,Widgets Co
```

### For Email Lists (tag/unsubscribe operations)

A simple CSV with an `email` column:

```csv
email
alice@example.com
bob@example.com
```

Or a plain text file with one email per line (no header needed):

```
alice@example.com
bob@example.com
```

**Note:** Email lists are automatically deduplicated and normalized to lowercase.

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid arguments or usage |
| 6 | CSV parsing error |

## Examples

### CI/CD: Sync subscribers from your database

```bash
#!/bin/bash
# Export active users and sync to gupsh

psql -c "COPY (SELECT email, name FROM users WHERE active) TO STDOUT CSV HEADER" \
  > /tmp/active-users.csv

# Using npx (no install required)
npx @gupsh/cli subscribers import /tmp/active-users.csv --confirm --json

# Or if installed globally
gupsh subscribers import /tmp/active-users.csv --confirm --json
```

### Scripting: Tag users based on activity

```bash
#!/bin/bash
# Tag users who haven't been active

# Check if a subscriber has the "inactive" tag
gupsh subscribers search --email user@example.com --tag inactive --json \
  | jq -r '.data[].email' \
  | while read email; do
      gupsh subscribers tag --email "$email" --add "needs-reengagement" --confirm
    done
```

### Automation: Track events from webhooks

```bash
# In your webhook handler
curl -X POST https://your-server.com/webhook -d '{"email": "user@example.com", "event": "purchase"}'

# Handler script
gupsh events track \
  --email "$WEBHOOK_EMAIL" \
  --event "$WEBHOOK_EVENT" \
  --details "$WEBHOOK_DETAILS"
```

## Development

```bash
# Clone the repository
git clone https://github.com/smashah/gupsh-cli.git
cd gupsh-cli

# Install dependencies
bun install

# Run CLI locally
bun run dev

# Run tests
bun test

# Lint and format
bun lint
bun format
```

## Claude Code Skill

This repository includes a [Claude Code](https://claude.ai/code) skill that provides guidance for using the gupsh CLI. The skill teaches Claude about all available commands, safety patterns, and best practices.

### Installing the Skill

To install the gupsh-cli skill for Claude Code:

```bash
# Navigate to your Claude Code skills directory
cd ~/.claude/skills

# Clone the skill (or symlink from your local clone)
git clone https://github.com/smashah/gupsh-cli.git gupsh-cli-repo
ln -s gupsh-cli-repo/skill gupsh-cli

# Or copy directly
cp -r /path/to/gupsh-cli/skill ~/.claude/skills/gupsh-cli
```

Alternatively, if you're working within the gupsh-cli repository, the skill is automatically available at `skill/SKILL.md`.

### What the Skill Provides

- **Command reference**: All CLI commands with options and examples
- **Safety-first philosophy**: Guidance on `--dry-run`, `--limit`, and `--confirm` flags
- **Anti-patterns**: Common mistakes to avoid with bulk operations
- **Workflows**: CI/CD integration, scripting patterns, safe import validation

## Requirements

- **Runtime**: [Bun](https://bun.sh) >= 1.0.0 or Node.js >= 18
- **gupsh Account**: [Sign up](https://gupsh.app) if you don't have one

## Support

- **Documentation**: [docs.bentonow.com](https://github.com/smashah/gupsh-cli#readme)
- **Issues**: [GitHub Issues](https://github.com/smashah/gupsh-cli/issues)
- **Community**: [Discord](https://discord.gg/gupsh)

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built with love by the [gupsh](https://gupsh.app) team.
