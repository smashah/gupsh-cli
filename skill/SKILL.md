---
name: gupsh-cli
description: >
  Guide for using gupsh CLI to manage email marketing operations.
  Use when running gupsh commands, managing subscribers, tags, events,
  or automating email marketing workflows. Triggers on: gupsh CLI usage,
  subscriber management, email list operations, CSV imports.
---

# gupsh CLI

A command-line interface for [gupsh](https://gupsh.app) email marketing. Manage subscribers, tags, events, and broadcasts directly from the terminal.

## Philosophy: Safety-First Automation

Email operations affect real people. A bulk operation mistake can unsubscribe thousands or spam your entire list. The gupsh CLI is designed with **safety-first automation** in mind.

**Before running any command, ask**:
- Is this a bulk operation? If yes, use `--dry-run` first
- Will this modify subscriber data? If yes, consider `--limit` for testing
- Is this running in CI/automation? If yes, use `--confirm` to skip interactive prompts
- Do I need the output for scripting? If yes, use `--json`

**Core principles**:
1. **Preview before execute**: Always `--dry-run` bulk operations first
2. **Progressive rollout**: Use `--limit` to test on small batches
3. **Explicit confirmation**: Bulk operations require `--confirm` in scripts
4. **Scriptable output**: Use `--json` for machine-readable, consistent output

## Command Reference

### Authentication

```bash
# Interactive login (prompts for credentials)
gupsh auth login

# Non-interactive login (for CI/scripts)
gupsh auth login \
  --publishable-key "your-publishable-key" \
  --secret-key "your-secret-key" \
  --site-uuid "your-site-uuid"

# Check authentication status
gupsh auth status

# Log out (removes stored credentials)
gupsh auth logout
```

**Credentials**: Get from [Settings > Teams](https://app.gupsh.app/marketing/settings) in gupsh dashboard.

### Profile Management

Manage multiple gupsh accounts (production, staging, etc.):

```bash
gupsh profile add production    # Add named profile
gupsh profile add staging
gupsh profile use staging       # Switch active profile
gupsh profile list              # List all profiles
gupsh profile remove staging    # Remove a profile
```

### Subscribers

**Search subscribers**:
```bash
gupsh subscribers search --email user@example.com
gupsh subscribers search --tag vip
gupsh subscribers search --field plan=pro
gupsh subscribers search --tag active --page 2 --per-page 50
```

**Import from CSV** (requires `email` column):
```bash
gupsh subscribers import contacts.csv                    # Interactive
gupsh subscribers import contacts.csv --dry-run          # Preview only
gupsh subscribers import contacts.csv --limit 100        # First 100 rows
gupsh subscribers import contacts.csv --confirm          # Non-interactive
```

**Manage tags on subscribers**:
```bash
gupsh subscribers tag --email user@example.com --add vip
gupsh subscribers tag --email user@example.com --remove trial
gupsh subscribers tag --file users.csv --add customer,active --confirm
```

**Subscription management**:
```bash
gupsh subscribers unsubscribe --email user@example.com
gupsh subscribers unsubscribe --file unsubscribes.csv --confirm
gupsh subscribers subscribe --email user@example.com     # Re-subscribe
```

### Tags

```bash
gupsh tags list                           # List all tags
gupsh tags create "new-feature-announcement"  # Create tag
gupsh tags delete "old-tag"               # Delete (API limitation applies)
```

### Custom Fields

```bash
gupsh fields list                         # List all fields
gupsh fields create company_size          # Create field
```

### Events

Track custom events to trigger automations:

```bash
gupsh events track --email user@example.com --event signed_up

gupsh events track \
  --email user@example.com \
  --event purchase \
  --details '{"product": "Pro Plan", "amount": 99}'
```

### Broadcasts

```bash
gupsh broadcasts list                     # List all broadcasts

gupsh broadcasts create \
  --name "January Newsletter" \
  --subject "What's new this month" \
  --content "<h1>Hello!</h1><p>Here's our update...</p>" \
  --type html \
  --include-tags "newsletter,active"
```

### Statistics

```bash
gupsh stats site                          # View site-wide stats
```

## Safety Flags

| Flag | Purpose |
|------|---------|
| `--dry-run` | Preview what would happen without making changes |
| `--limit <n>` | Only process first N items |
| `--sample <n>` | Show N sample items in preview |
| `--confirm` | Skip interactive confirmation (required for scripts) |

## Output Modes

| Flag | Output Type |
|------|-------------|
| *(none)* | Human-readable tables with colors |
| `--json` | Machine-readable JSON for scripting |
| `--quiet` | Minimal output (errors only) |

**JSON response format**:
```json
{
  "success": true,
  "error": null,
  "data": { ... },
  "meta": { "count": 10, "total": 100 }
}
```

## CSV Format

**For imports** - requires `email` column, recognizes special columns:

| Column | Description |
|--------|-------------|
| `email` | Required. Subscriber email |
| `name` | Optional. Display name |
| `tags` | Optional. Tags to add (comma/semicolon separated) |
| `remove_tags` | Optional. Tags to remove |
| *(other)* | Custom fields |

```csv
email,name,tags,first_name,plan
alice@example.com,Alice Smith,"customer,active",Alice,pro
bob@example.com,Bob Jones,newsletter,Bob,starter
```

**For tag/unsubscribe operations** - simple email list or plain text:
```csv
email
alice@example.com
bob@example.com
```

Or one email per line (no header).

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid arguments or usage |
| 6 | CSV parsing error |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `BENTO_CONFIG_PATH` | Override config file location |
| `BENTO_API_BASE_URL` | Override API endpoint (testing) |
| `BENTO_AUTO_CONFIRM` | Set `true` to skip all confirmations |
| `DEBUG` | Set `gupsh` for verbose SDK logging |

## Anti-Patterns to Avoid

**Running bulk operations without preview**:
```bash
# BAD: Direct import without testing
gupsh subscribers import huge-list.csv --confirm

# GOOD: Preview first, then limit test, then full import
gupsh subscribers import huge-list.csv --dry-run
gupsh subscribers import huge-list.csv --limit 10 --confirm
gupsh subscribers import huge-list.csv --confirm
```

**Forgetting --confirm in scripts**:
```bash
# BAD: Will hang waiting for input in CI
gupsh subscribers tag --file users.csv --add vip

# GOOD: Explicit confirmation for automation
gupsh subscribers tag --file users.csv --add vip --confirm
```

**Not using --json for scripting**:
```bash
# BAD: Parsing human-readable tables
gupsh subscribers search --tag vip | grep email

# GOOD: Structured JSON output
gupsh subscribers search --tag vip --json | jq '.data[].email'
```

**Running destructive operations without understanding scope**:
```bash
# BAD: Unsubscribe operation on unclear file
gupsh subscribers unsubscribe --file list.csv --confirm

# GOOD: Preview the file contents first
head -20 list.csv
wc -l list.csv
gupsh subscribers unsubscribe --file list.csv --dry-run
```

## Common Workflows

### CI/CD: Sync subscribers from database
```bash
psql -c "COPY (SELECT email, name FROM users WHERE active) TO STDOUT CSV HEADER" \
  > /tmp/active-users.csv

gupsh subscribers import /tmp/active-users.csv --confirm --json
```

### Scripting: Batch tag operations
```bash
gupsh subscribers search --tag inactive --json \
  | jq -r '.data[].email' \
  | while read email; do
      gupsh subscribers tag --email "$email" --add "needs-reengagement" --confirm
    done
```

### Testing: Safe import validation
```bash
# 1. Validate CSV format
gupsh subscribers import contacts.csv --dry-run

# 2. Test with small batch
gupsh subscribers import contacts.csv --limit 5 --confirm

# 3. Full import
gupsh subscribers import contacts.csv --confirm
```

## Running Tests

```bash
bun test                                   # Run all tests
bun test src/tests/commands/tags.test.ts   # Run specific test file
```

## Remember

The gupsh CLI gives you direct access to operations that affect real subscribers. The safety flags exist because mistakes are costly. Use `--dry-run` and `--limit` liberally. When in doubt, preview first.

For complex automation, prefer `--json` output and proper error handling over parsing human-readable tables.
