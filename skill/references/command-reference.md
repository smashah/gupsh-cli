# gupsh CLI Command Reference

Complete reference for all gupsh CLI commands with options and examples.

## Global Options

These options work with most commands:

| Option | Description |
|--------|-------------|
| `--json` | Output in JSON format for scripting |
| `--quiet` | Minimal output (errors only) |
| `--help` | Show help for any command |

## auth

Authentication management commands.

### auth login

Authenticate with gupsh API credentials.

```bash
# Interactive (prompts for credentials)
gupsh auth login

# Non-interactive (all flags required)
gupsh auth login \
  --publishable-key <key> \
  --secret-key <key> \
  --site-uuid <uuid>

# With custom profile name
gupsh auth login --profile production \
  --publishable-key <key> \
  --secret-key <key> \
  --site-uuid <uuid>
```

**Options**:
| Option | Description |
|--------|-------------|
| `--publishable-key <key>` | gupsh publishable API key |
| `--secret-key <key>` | gupsh secret API key |
| `--site-uuid <uuid>` | gupsh site UUID |
| `--profile <name>` | Profile name (default: "default") |

### auth status

Show current authentication status.

```bash
gupsh auth status
gupsh auth status --json
```

### auth logout

Clear current authentication and remove profile.

```bash
gupsh auth logout
gupsh auth logout --json
```

---

## profile

Manage multiple gupsh account profiles.

### profile add

Add a new named profile (prompts for credentials).

```bash
gupsh profile add production
gupsh profile add staging
```

### profile use

Switch to a different profile.

```bash
gupsh profile use staging
gupsh profile use production
```

### profile list

List all configured profiles.

```bash
gupsh profile list
gupsh profile list --json
```

### profile remove

Remove a profile.

```bash
gupsh profile remove staging
```

---

## subscribers

Subscriber management commands.

### subscribers search

Search for subscribers with various filters.

```bash
# By email
gupsh subscribers search --email user@example.com

# By tag
gupsh subscribers search --tag vip
gupsh subscribers search --tag active

# By custom field
gupsh subscribers search --field plan=pro
gupsh subscribers search --field company=Acme

# Pagination
gupsh subscribers search --tag vip --page 2 --per-page 50
```

**Options**:
| Option | Description |
|--------|-------------|
| `--email <email>` | Filter by email address |
| `--tag <tag>` | Filter by tag name |
| `--field <key=value>` | Filter by custom field |
| `--page <n>` | Page number (default: 1) |
| `--per-page <n>` | Results per page (default: 25) |

### subscribers import

Import subscribers from a CSV file.

```bash
# Basic import (interactive confirmation)
gupsh subscribers import contacts.csv

# Preview without making changes
gupsh subscribers import contacts.csv --dry-run

# Import first N rows only
gupsh subscribers import contacts.csv --limit 100

# Non-interactive (for scripts)
gupsh subscribers import contacts.csv --confirm

# Full workflow
gupsh subscribers import contacts.csv --dry-run           # 1. Preview
gupsh subscribers import contacts.csv --limit 10 --confirm # 2. Test batch
gupsh subscribers import contacts.csv --confirm           # 3. Full import
```

**Options**:
| Option | Description |
|--------|-------------|
| `--dry-run` | Preview without executing |
| `--limit <n>` | Process only first N rows |
| `--sample <n>` | Show N sample rows in preview |
| `--confirm` | Skip interactive confirmation |

**CSV Format**:
- Must have `email` column (case-insensitive)
- Special columns: `name`, `tags`, `remove_tags`
- `tags`/`remove_tags` support comma or semicolon separators
- Other columns become custom fields
- First row is header

```csv
email,name,tags,remove_tags,plan
alice@example.com,Alice Smith,"customer,active",,pro
bob@example.com,Bob Jones,newsletter,trial,starter
```

### subscribers tag

Add or remove tags from subscribers.

```bash
# Single subscriber
gupsh subscribers tag --email user@example.com --add vip
gupsh subscribers tag --email user@example.com --remove trial
gupsh subscribers tag --email user@example.com --add vip,premium --remove trial

# Bulk from CSV
gupsh subscribers tag --file users.csv --add customer --confirm
gupsh subscribers tag --file users.csv --add customer,active --dry-run
```

**Options**:
| Option | Description |
|--------|-------------|
| `--email <email>` | Target single subscriber |
| `--file <path>` | CSV file with emails |
| `--add <tags>` | Comma-separated tags to add |
| `--remove <tags>` | Comma-separated tags to remove |
| `--dry-run` | Preview without executing |
| `--confirm` | Skip interactive confirmation |

### subscribers unsubscribe

Unsubscribe subscribers (stop email delivery).

```bash
# Single subscriber
gupsh subscribers unsubscribe --email user@example.com

# Bulk from CSV
gupsh subscribers unsubscribe --file unsubscribes.csv --dry-run
gupsh subscribers unsubscribe --file unsubscribes.csv --confirm
```

**Options**:
| Option | Description |
|--------|-------------|
| `--email <email>` | Target single subscriber |
| `--file <path>` | CSV file with emails |
| `--dry-run` | Preview without executing |
| `--confirm` | Skip interactive confirmation |

### subscribers subscribe

Re-subscribe a previously unsubscribed subscriber.

```bash
gupsh subscribers subscribe --email user@example.com
```

---

## tags

Tag management commands.

### tags list

List all tags in the account.

```bash
gupsh tags list
gupsh tags list --json
```

### tags create

Create a new tag.

```bash
gupsh tags create "new-feature-announcement"
gupsh tags create newsletter
gupsh tags create "customer-tier-gold"
```

### tags delete

Delete a tag.

```bash
gupsh tags delete "old-tag" --confirm
```

**Note**: Tag deletion may have API limitations. Check the output for details.

---

## fields

Custom field management commands.

### fields list

List all custom fields.

```bash
gupsh fields list
gupsh fields list --json
```

### fields create

Create a new custom field.

```bash
gupsh fields create company_size
gupsh fields create plan_type
```

---

## events

Event tracking commands.

### events track

Track a custom event for a subscriber.

```bash
# Simple event
gupsh events track --email user@example.com --event signed_up

# Event with details (JSON)
gupsh events track \
  --email user@example.com \
  --event purchase \
  --details '{"product": "Pro Plan", "amount": 99}'

# Event with complex details
gupsh events track \
  --email user@example.com \
  --event order_completed \
  --details '{"order_id": "12345", "items": ["SKU001", "SKU002"], "total": 149.99}'
```

**Options**:
| Option | Description |
|--------|-------------|
| `--email <email>` | Subscriber email (required) |
| `--event <name>` | Event name (required) |
| `--details <json>` | Event details as JSON string |

---

## broadcasts

Broadcast management commands.

### broadcasts list

List all broadcasts.

```bash
gupsh broadcasts list
gupsh broadcasts list --json
```

### broadcasts create

Create a new broadcast draft.

```bash
gupsh broadcasts create \
  --name "January Newsletter" \
  --subject "What's new this month" \
  --content "<h1>Hello!</h1><p>Here's our update...</p>" \
  --type html \
  --include-tags "newsletter,active"
```

**Options**:
| Option | Description |
|--------|-------------|
| `--name <name>` | Broadcast name |
| `--subject <subject>` | Email subject line |
| `--content <html>` | Email content |
| `--type <type>` | Content type (html/text) |
| `--include-tags <tags>` | Comma-separated tags to include |
| `--exclude-tags <tags>` | Comma-separated tags to exclude |

---

## stats

Statistics commands.

### stats site

View site-wide statistics.

```bash
gupsh stats site
gupsh stats site --json
```
