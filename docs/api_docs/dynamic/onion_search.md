# Dynamic: dynamic_onion_search

## Description

Perform a dynamic Onion search using a user-provided query string.  
The API submits the query to the onion search engine and returns raw results without UI rendering.

Supported input:
- **query**: search string (keywords, onion URLs, or identifiers)

The API is designed for rapid investigative lookups and does not require rendering on the client.

## Request Body

```json
{
  "text": {
    "query": "hacking"
  }
}
```

## Response

The API returns a JSON object containing the raw search results.

Example response:
```json
{
  "job_id": "5486279598248634122",
  "status": "done",
  "result": {
    "status": "success",
    "query": "hacking",
    "results": [
      {
        "engine": "example_engine.onion",
        "status": "success",
        "search_url": "http://example_engine.onion/search?q=hacking",
        "first_result": {
          "url": "http://example_result.onion",
          "title": "Example Title",
          "description": "Example description..."
        }
      }
    ],
    "query_type": "search_text"
  }
}
```

---

Field semantics for each element under **result**:
- **query** — original search query  
- **engine** — search engine identifier (e.g., "onion")  
- **total_hits** — total number of matched results  
- **results** — array of result objects  
- **status** — processing status (success, failed)  