# System Info: dumps

## Description

Retrieve the complete catalog of breach dumps collected from Telegram channels and monitored websites.

Supported filters:
- **page:** page number of the result set
- **source:** all, telegram, websites (origin of the leak, e.g., Telegram or monitored websites)
- **group:** leak group or channel name derived from the source (e.g., Telegram channel name)
- **status:** all, parsed, unparsed
- **daterange:** optional date range string (e.g., `2025-01-01,2025-01-15`)
- **q:** free-text search query applied to `leak_url`, `source`, `group`, and other indexed fields (default: `*`)

Common use-cases include identifying newly leaked dumps, retrieving unparsed dumps for analysis, or filtering dumps from specific threat groups or Telegram channels.

## Response

Paginated dump catalog response containing:
- **total_count** — total number of dumps matching filters
- **page** — current page number
- **mDumpCallbackLinks** — list of dump entries, each containing:
  - **leak_url** — raw dump reference or asset URL
  - **source** — origin of the leak (e.g., telegram, websites)
  - **group** — associated leak group or channel name derived from the source (e.g., Telegram channel name)
  - **link** — direct reference link to the dump message or file
  - **parsed_status** — whether the dump has been parsed/processed
  - **created_at** — first-seen timestamp of the dump

Example response:
```json
{
  "total_count": 152,
  "page": 1,
  "mDumpCallbackLinks": [
    {
      "leak_url": "https://t.me/example_leaks/1234",
      "source": "telegram",
      "group": "example_leak_group",
      "link": "https://t.me/example_leaks/1234",
      "parsed_status": "parsed",
      "created_at": "2025-12-03T21:15:23Z"
    }
  ]
}
```
