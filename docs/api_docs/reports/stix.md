# Report: stix

## Description

Return a **STIX 2.1 bundle** for a single document.

This endpoint converts an Orion document into a STIX 2.1 `bundle` (spec_version `2.1`) containing:
- **TLP marking definitions** (AMBER and RED)
- a primary **report** object
- optional **infrastructure** describing the source/service (e.g., onion market/forum)
- extracted **SCO observables** (e.g., `url`, `domain-name`, `ipv4-addr`, `ipv6-addr`, `email-addr`, `autonomous-system`, `directory`, `user-agent`)
- an **observed-data** object referencing extracted SCOs
- optional **indicator** objects with STIX patterns for extracted observables

Request:
- **doc_id** — required. Orion document identifier.
- **lang** — optional. Language variant requested from backend.

Notes:
- Missing fields are skipped (no empty objects are emitted).
- `report.object_refs` links all generated objects (indicators, infrastructure, observed-data, etc.).
- `report.external_references` includes the source URL (when available) and Orion content hash.
- Custom Orion metadata is exported using `x_orion_*` properties on relevant objects.

Minimal example request:
```json
{
  "doc_id": "4856ea0a54f79ddb5ad8377ecf3b08f16491441208aaab95c095dcb0b46266a1",
  "lang": "en"
}
```

## Response

A STIX 2.1 bundle matching the structure below.

Top-level response fields:
- **type**: `bundle`
- **id**: `bundle--<uuid>`
- **spec_version**: `2.1`
- **objects**: array of STIX objects

Objects you will commonly see in `objects`:
1) **marking-definition** (TLP AMBER / TLP RED)
2) **infrastructure** (optional) — e.g., onion/clearnet service context
3) **SCOs** (optional) — `url`, `domain-name`, `ipv4-addr`, `ipv6-addr`, `email-addr`, etc.
4) **observed-data** (optional) — references SCOs via `object_refs`
5) **indicator** (optional) — one per IOC category with `pattern_type: stix`
6) **report** — the primary object that ties everything together via `object_refs`

Example response:
```json
{
  "type": "bundle",
  "id": "bundle--9b9910f5-1d12-5908-bcfc-862ad032bcf7",
  "spec_version": "2.1",
  "objects": [
    {
      "type": "marking-definition",
      "spec_version": "2.1",
      "id": "marking-definition--...",
      "created": "2025-12-09T03:35:41.659Z",
      "definition_type": "tlp",
      "definition": {"tlp": "amber"}
    },
    {
      "type": "infrastructure",
      "spec_version": "2.1",
      "id": "infrastructure--...",
      "created": "2025-12-09T03:35:41.659Z",
      "modified": "2025-12-09T03:35:41.659Z",
      "name": "fast card service - credit cards, transfers, gift",
      "description": "...",
      "infrastructure_types": ["anonymization"],
      "first_seen": "2025-12-09T03:35:41.659Z",
      "last_seen": "2025-12-09T03:35:41.659Z",
      "labels": ["leaks", "marketplaces", "onion", "orion:general"],
      "object_marking_refs": ["marking-definition--..."],
      "x_orion_network": "onion"
    },
    {
      "type": "url",
      "id": "url--...",
      "value": "http://example.onion"
    },
    {
      "type": "domain-name",
      "id": "domain-name--...",
      "value": "example.onion"
    },
    {
      "type": "observed-data",
      "spec_version": "2.1",
      "id": "observed-data--...",
      "created": "2025-12-09T03:35:41.659Z",
      "modified": "2025-12-09T03:35:41.659Z",
      "first_observed": "2025-12-09T03:35:41.659Z",
      "last_observed": "2025-12-09T03:35:41.659Z",
      "number_observed": 1,
      "object_refs": ["domain-name--...", "url--..."],
      "object_marking_refs": ["marking-definition--..."]
    },
    {
      "type": "indicator",
      "spec_version": "2.1",
      "id": "indicator--...",
      "created": "2025-12-09T03:35:41.659Z",
      "modified": "2025-12-09T03:35:41.659Z",
      "name": "Domains",
      "indicator_types": ["malicious-activity"],
      "pattern_type": "stix",
      "pattern": "[domain-name:value IN ('example.onion')]",
      "valid_from": "2025-12-09T03:35:41.659Z",
      "labels": ["leaks", "marketplaces", "onion", "orion:general"],
      "object_marking_refs": ["marking-definition--..."]
    },
    {
      "type": "report",
      "spec_version": "2.1",
      "id": "report--...",
      "created": "2025-12-09T03:35:41.659Z",
      "modified": "2025-12-09T03:35:41.659Z",
      "name": "fast card service - credit cards, transfers, gift",
      "description": "...",
      "report_types": ["threat-report"],
      "published": "2025-12-09T03:35:41.659Z",
      "labels": ["leaks", "marketplaces", "onion", "orion:general"],
      "lang": "en",
      "external_references": [
        {"source_name": "source", "url": "http://example.onion"},
        {"source_name": "content-hash", "external_id": "<hash>"}
      ],
      "object_refs": [
        "indicator--...",
        "infrastructure--...",
        "observed-data--..."
      ],
      "object_marking_refs": ["marking-definition--..."],
      "x_orion_doc_id": "<hash>",
      "x_orion_network": "onion"
    }
  ]
}
```
