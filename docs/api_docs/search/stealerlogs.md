# Search: stealerlogs

## Description

Search stealer log credentials and log files using filters such as free-text query, URL, username, type and date range; returns normalized credential or log records from the stealer logs index.

Request body (`search_credential_param_model`):
- **daterange** — optional creation date range in `YYYY-MM-DD,YYYY-MM-DD` format; empty string means no filter
- **q** — free-text search across the raw line and extracted fields (email, domain, username, URL, etc.)
- **url** — optional URL/domain filter (for example `accounts.epicgames.com`)
- **user** — optional username or login identifier (for example `uzzalsen2530`)
- **type** — record type; `"c"` returns credential-level stealer log entries (email/password, username, etc.); any other value returns log/file-style entries (for example leaked CSV or other files)
- **page** — page number of the paginated result set (1-based)
- **category** — optional category string (reserved for future use)
- **fullsearch** — when `false`, uses an optimized/simple search (for example email domain lookups like `gmail.com`) for faster responses; when `true`, enables full wildcard/substring search over `raw` and extracted fields at the cost of performance.

Minimal example request for a credential (stealer log) search:
```json
{
  "q": "",
  "url": "",
  "user": "uzzalsen2530",
  "type": "c",
  "page": 1,
  "fullsearch": false,
  "daterange": "",
  "password_schema":""
}
```
Example full wildcard search over a password value:
```json
{
  "q": "Zolkina23!",
  "type": "c",
  "page": 1,
  "fullsearch": true
}
```

## Response

Stealer logs search results containing a paginated list of matching credential or log records.

The response is a JSON object with:
- **Result** — list of matching records from the stealer logs index
- **Suggestions** — optional list of suggestion strings (for example corrected queries); may be empty
- **Page_Count** — number of pages available for the given query and filters (may be fractional depending on the backend calculation)

Each entry in **Result** for `type = "c"` (credential mode) typically contains:
- **type** — record type (for example `"c"` for credential)
- **raw** — original raw line as found in the source log
- **channel** — high-level source channel (for example `"Collection"`)
- **file** — optional file name or identifier when available, otherwise `null`
- **domain** — list of extracted domains (for example `"gmail.com"` or `"authenticate.riotgames.com"`)
- **email** — list of extracted email addresses when present
- **password** — extracted password value when present
- **username** — list of extracted usernames or logins
- **_id** — internal unique identifier of the record
- **m_index** — internal index/model used for search (for example `"stealer_model"`)
- **m_sub_host** — extracted sub-host or path component (for example `"/"`)

When `type` is not `"c"`, records may represent higher-level log or file objects (for example leaked CSV or other file-based dumps) and can include additional file-related metadata fields depending on the source.

Example response:
```json
{
  "Result": [
    {
      "type": "c",
      "raw": "https://accounts.epicgames.com/register/customized uzzalsen2530@gmail.com:Lazpro&Adi@2022!",
      "channel": "Collection",
      "file": null,
      "domain": [
        "gmail.com"
      ],
      "email": [
        "uzzalsen2530@gmail.com"
      ],
      "password": "Lazpro&Adi@2022!",
      "username": [
        "uzzalsen2530"
      ],
      "_id": "2025_UTC_1d57898b680608fcb703a2bccede92d4b913bd810f84ef81fd95c8037493b4f6",
      "m_index": "stealer_model",
      "m_sub_host": "/"
    },
    {
      "type": "c",
      "raw": "https://authenticate.riotgames.com/ FaM1R:Zolkina23!",
      "channel": "Collection",
      "file": null,
      "domain": [
        "authenticate.riotgames.com"
      ],
      "password": "Zolkina23!",
      "username": [
        "FaM1R"
      ],
      "_id": "2025_UTC_ac9459ac22cc2fe21060f39980882d98aa0cf15f524e7f835a55c94c08631371",
      "m_index": "stealer_model",
      "m_sub_host": "/"
    }
  ],
  "Suggestions": [],
  "Page_Count": 0.2
}
```
