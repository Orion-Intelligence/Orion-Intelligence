# System Info: directory

## Description

Retrieve the complete list of monitored and crawled sources across Clearnet, Onion, and I2P.

Supported filters:
- **page:** page number of the result
- **network:** all, onion, i2p, clearnet
- **index:** all, general, leak, defacement, chat, exploit, twitter, reddit
- **content_type:** all, general, forums, news, stolen, drugs, hacking, marketplaces, cryptocurrency, leaks, adult, tracking, chat, social
- **daterange:** optional date range (e.g., `2025-12-03,2025-12-18`)

Results include URL, detected content type(s), index classification, network layer, and last-update metadata.

## Response

Paginated directory results containing fields:
- **url** — source address
- **content_type** — detected source categories
- **index_type** — assigned indexing group
- **leak_model_last_update / generic_model_last_update** — last time parsed
- **network_type** — clearnet / onion / i2p
- **name** — resolved source identifier (if applicable)

Example response:
```json
{
  "total": 12345,
  "page": 1,
  "results": [
    {
      "url": "http://exampleonionforumabcdef.onion/",
      "content_type": ["forums", "hacking"],
      "index_type": "general",
      "leak_model_last_update": "2025-12-05T10:15:00Z",
      "generic_model_last_update": "2025-12-04T09:00:00Z",
      "network_type": "onion",
      "name": "Example Darknet Forum"
    }
  ]
}
```
