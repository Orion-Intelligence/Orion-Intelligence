# Social: social_graph_management

## Description

These endpoints handle the retrieval and maintenance of social connection graphs, useful for mapping extensive networks of related targets.

### Get Social Graph Data
**Endpoint:** `POST /api/social/graph/data`

Retrieves the graph data structure containing nodes and edges for the provided usernames.

**Request Payload:**
- **usernames** — List of target usernames to map.
- **priority** (optional) — List of priority usernames to emphasize in the graph generation.
- **limit** (optional) — Maximum number of nodes to return (default: 200).

Example Payload:
```json
{
  "usernames": ["target_one", "target_two"],
  "limit": 150
}
```

### Prune Social Graph
**Endpoint:** `POST /api/social/graph/prune`

Cleans up the user's social graph by removing dangling or unconnected roots to optimize performance and relevance.

This endpoint does not require any request payload.

## Response

The graph data endpoint returns the structure of the requested network graph (nodes and edges), while the prune endpoint returns a status of the cleanup operation.

Example response for `POST /api/social/graph/data`:
```json
{
  "result": {
    "nodes": [
      {"id": "target_one", "label": "target_one"}
    ],
    "edges": [
      {"source": "target_one", "target": "target_two"}
    ]
  }
}
```
