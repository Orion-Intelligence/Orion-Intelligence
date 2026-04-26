#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
import warnings
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = REPO_ROOT / "backend"
PUBLIC_OUTPUT = REPO_ROOT / "docs" / "app_docs" / "swagger_api_reference.md"
LLM_OUTPUT = REPO_ROOT / "docs" / "llm_docs" / "swagger_api_reference.md"

HTTP_METHODS = ("get", "post", "put", "patch", "delete")
JSON_CONTENT_TYPES = ("application/json", "application/*+json")


def load_openapi_schema() -> dict[str, Any]:
    sys.path.insert(0, str(BACKEND_ROOT))
    warnings.filterwarnings("ignore", message="Duplicate Operation ID.*")
    import main  # type: ignore

    return main.app.openapi()


def compact(value: str, limit: int = 700) -> str:
    value = " ".join(str(value or "").split())
    if len(value) <= limit:
        return value
    return value[: limit - 3].rstrip() + "..."


def md_escape(value: Any) -> str:
    return str(value if value is not None else "").replace("|", "\\|").replace("\n", "<br>")


def strip_response_sections(description: str) -> str:
    if not description:
        return ""
    if "Documentation file not found:" in description:
        return ""
    description_match = re.search(r"^##\s*Description\s*\n(.*?)(?:\n##\s|\Z)", description, flags=re.I | re.M | re.S)
    if description_match:
        text = description_match.group(1)
    else:
        text = description
    text = re.split(r"\n##\s+(?:Response|Responses|Request)\b", text, maxsplit=1, flags=re.I)[0]
    text = re.sub(r"```.*?```", "", text, flags=re.S)
    text = re.sub(r"^\s*#{1,6}\s*Description\s*\n+", "", text.strip(), flags=re.I)
    text = re.sub(r"^\s*#{1,6}\s+", "", text, flags=re.M)
    return compact(text, 500)


def schema_ref_name(schema: dict[str, Any]) -> str:
    ref = schema.get("$ref", "")
    if isinstance(ref, str) and ref.startswith("#/components/schemas/"):
        return ref.rsplit("/", 1)[-1]
    return ""


def resolve_ref(schema: Any, root: dict[str, Any]) -> Any:
    if not isinstance(schema, dict):
        return schema
    ref = schema.get("$ref")
    if not isinstance(ref, str) or not ref.startswith("#/"):
        return schema
    node: Any = root
    for part in ref[2:].split("/"):
        node = node.get(part, {})
    return node


def merged_schema(schema: Any, root: dict[str, Any]) -> dict[str, Any]:
    schema = resolve_ref(schema, root)
    if not isinstance(schema, dict):
        return {}
    if "allOf" in schema:
        merged: dict[str, Any] = {}
        for item in schema.get("allOf") or []:
            part = merged_schema(item, root)
            merged.update(part)
            if part.get("properties"):
                merged.setdefault("properties", {}).update(part.get("properties", {}))
            if part.get("required"):
                merged["required"] = sorted(set(merged.get("required", [])) | set(part.get("required", [])))
        return merged
    return schema


def sample_string(name: str, schema: dict[str, Any]) -> str:
    fmt = schema.get("format")
    lowered = name.lower()
    if fmt == "binary":
        return "@sample-file.txt"
    if fmt == "date-time" or "date" in lowered:
        return "2026-04-26T00:00:00Z"
    if fmt == "date":
        return "2026-04-26"
    if fmt == "email" or "email" in lowered:
        return "analyst@example.com"
    if fmt in {"uri", "url"} or "url" in lowered or "domain" in lowered:
        return "https://example.com"
    if "ip" in lowered:
        return "8.8.8.8"
    if "country" in lowered:
        return "pakistan"
    if "doc_id" in lowered or lowered.endswith("_id") or lowered == "id":
        return "example-doc-id"
    if "filename" in lowered:
        return "example"
    if lowered in {"network"}:
        return "all"
    if lowered in {"category", "content", "platform"}:
        return "all"
    if lowered in {"q", "query", "text", "message", "raw"}:
        return "example query"
    if lowered == "lang":
        return "en"
    return "string"


def sample_for_schema(schema: Any, root: dict[str, Any], name: str = "value", depth: int = 0) -> Any:
    if depth > 6:
        return "..."
    schema = merged_schema(schema, root)
    if not isinstance(schema, dict) or not schema:
        return {}
    if "example" in schema:
        return schema["example"]
    if "examples" in schema and isinstance(schema["examples"], list) and schema["examples"]:
        return schema["examples"][0]
    if "default" in schema and schema["default"] is not None:
        return schema["default"]
    if schema.get("enum"):
        return schema["enum"][0]
    if "const" in schema:
        return schema["const"]
    for key in ("anyOf", "oneOf"):
        choices = [item for item in schema.get(key, []) if item.get("type") != "null"]
        if choices:
            return sample_for_schema(choices[0], root, name, depth + 1)

    typ = schema.get("type")
    if not typ:
        if schema.get("properties") is not None or schema.get("additionalProperties") is not None:
            typ = "object"
        elif schema.get("items") is not None:
            typ = "array"

    if typ == "object":
        properties = schema.get("properties") or {}
        if properties:
            sample: dict[str, Any] = {}
            required = set(schema.get("required") or [])
            ordered = sorted(properties, key=lambda key: (key not in required, key))
            for prop_name in ordered[:30]:
                sample[prop_name] = sample_for_schema(properties[prop_name], root, prop_name, depth + 1)
            return sample
        additional = schema.get("additionalProperties")
        if isinstance(additional, dict):
            return {"key": sample_for_schema(additional, root, "key", depth + 1)}
        return {"key": "value"}
    if typ == "array":
        return [sample_for_schema(schema.get("items", {}), root, name, depth + 1)]
    if typ == "integer":
        return 1
    if typ == "number":
        return 1.0
    if typ == "boolean":
        return True
    if typ == "string":
        return sample_string(name, schema)
    return "string"


def json_block(value: Any) -> str:
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
        except Exception:
            return f"```text\n{value.strip()}\n```"
        value = parsed
    return "```json\n" + json.dumps(value, indent=2, ensure_ascii=False) + "\n```"


def extract_json_fence(description: str, markers: tuple[str, ...]) -> str:
    if not description:
        return ""
    lowered = description.lower()
    for marker in markers:
        index = lowered.find(marker.lower())
        if index < 0:
            continue
        match = re.search(r"```(?:json)?\s*(.*?)```", description[index:], flags=re.S | re.I)
        if match:
            return match.group(1).strip()
    return ""


def preferred_content(content: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    if not content:
        return "", {}
    for content_type in JSON_CONTENT_TYPES:
        if content_type in content:
            return content_type, content[content_type]
    for content_type in ("multipart/form-data", "application/x-www-form-urlencoded"):
        if content_type in content:
            return content_type, content[content_type]
    content_type = next(iter(content))
    return content_type, content[content_type]


def request_body_sample(operation: dict[str, Any], root: dict[str, Any]) -> tuple[str, Any, str]:
    request_body = operation.get("requestBody") or {}
    content_type, media = preferred_content(request_body.get("content") or {})
    if not content_type:
        return "", None, ""
    schema = media.get("schema") or {}
    sample = sample_for_schema(schema, root)
    return content_type, sample, schema_ref_name(schema)


def response_sample(operation: dict[str, Any], root: dict[str, Any], path: str) -> tuple[str, Any, str, str]:
    responses = operation.get("responses") or {}
    status = "200" if "200" in responses else next((key for key in responses if key.startswith("2")), "200")
    response = responses.get(status) or {}
    content_type, media = preferred_content(response.get("content") or {})
    schema = media.get("schema") or {}
    if isinstance(schema, dict) and schema:
        return status, sample_for_schema(schema, root), content_type or "application/json", schema_ref_name(schema)

    extracted = extract_json_fence(
        operation.get("description", ""),
        ("Example response", "Example successful response", "Response example"),
    )
    if extracted:
        return status, extracted, "application/json", ""
    if "screenshot" in path:
        return status, "<webp image bytes>", content_type or "image/webp", ""
    return status, {"status": "success", "result": {}}, content_type or "application/json", ""


def parameter_sample(parameter: dict[str, Any], root: dict[str, Any]) -> Any:
    schema = parameter.get("schema") or {}
    return sample_for_schema(schema, root, parameter.get("name", "value"))


def sample_url(path: str, parameters: list[dict[str, Any]], root: dict[str, Any]) -> str:
    url = path
    query_parts: list[str] = []
    for parameter in parameters:
        name = parameter.get("name", "")
        value = str(parameter_sample(parameter, root))
        if parameter.get("in") == "path":
            url = url.replace("{" + name + "}", value)
        elif parameter.get("in") == "query":
            if parameter.get("required") or parameter.get("schema", {}).get("default") is not None:
                query_parts.append(f"{name}={value}")
    if query_parts:
        url += "?" + "&".join(query_parts)
    return url


def curl_sample(
    method: str,
    path: str,
    parameters: list[dict[str, Any]],
    content_type: str,
    body_sample: Any,
    root: dict[str, Any],
    secured: bool,
) -> str:
    url = "$BASE_URL" + sample_url(path, parameters, root)
    parts = [f"curl -X {method.upper()} \"{url}\""]
    if secured:
        parts.append('  -H "Authorization: Bearer $TOKEN"')
    if body_sample is not None:
        if content_type == "multipart/form-data" and isinstance(body_sample, dict):
            for key, value in body_sample.items():
                if isinstance(value, str) and value.startswith("@"):
                    parts.append(f'  -F "{key}={value}"')
                else:
                    parts.append(f'  -F "{key}={json.dumps(value, ensure_ascii=False)}"')
        else:
            parts.append(f'  -H "Content-Type: {content_type or "application/json"}"')
            body = json.dumps(body_sample, indent=2, ensure_ascii=False)
            parts.append("  -d '" + body + "'")
    return " \\\n".join(parts)


def render_parameter_table(parameters: list[dict[str, Any]], root: dict[str, Any]) -> list[str]:
    if not parameters:
        return ["No path or query parameters."]
    lines = [
        "| Name | In | Required | Type | Description | Sample |",
        "| --- | --- | --- | --- | --- | --- |",
    ]
    for parameter in parameters:
        schema = parameter.get("schema") or {}
        sample = parameter_sample(parameter, root)
        if isinstance(sample, (dict, list)):
            sample_text = json.dumps(sample, ensure_ascii=False)
        else:
            sample_text = sample
        lines.append(
            "| {name} | {loc} | {required} | {typ} | {description} | `{sample}` |".format(
                name=md_escape(parameter.get("name", "")),
                loc=md_escape(parameter.get("in", "")),
                required="yes" if parameter.get("required") else "no",
                typ=md_escape(schema.get("type") or schema_ref_name(schema) or "string"),
                description=md_escape(compact(parameter.get("description", ""), 220)),
                sample=md_escape(sample_text),
            )
        )
    return lines


def render_body_fields(body_sample: Any) -> list[str]:
    if not isinstance(body_sample, dict) or not body_sample:
        return []
    lines = ["| Field | Sample |", "| --- | --- |"]
    for key, value in body_sample.items():
        if isinstance(value, (dict, list)):
            rendered = json.dumps(value, ensure_ascii=False)
        else:
            rendered = value
        lines.append(f"| {md_escape(key)} | `{md_escape(rendered)}` |")
    return lines


def collect_operations(schema: dict[str, Any]) -> dict[str, list[tuple[str, str, dict[str, Any]]]]:
    grouped: dict[str, list[tuple[str, str, dict[str, Any]]]] = {}
    for path, path_item in schema.get("paths", {}).items():
        for method in HTTP_METHODS:
            operation = path_item.get(method)
            if not operation:
                continue
            tags = operation.get("tags") or ["API"]
            grouped.setdefault(tags[0], []).append((method, path, operation))
    return grouped


def render(schema: dict[str, Any]) -> str:
    grouped = collect_operations(schema)
    operation_count = sum(len(items) for items in grouped.values())
    lines = [
        "(swagger-api-reference)=",
        "",
        "# Swagger API Reference",
        "",
        "This page documents only the API operations exposed by the running FastAPI `/docs` page and `/openapi.json` schema. Routes hidden with `include_in_schema=False` or routers mounted with `include_in_schema=False` are intentionally excluded.",
        "",
        f"- Generated from: `/openapi.json`",
        f"- Exposed operations: **{operation_count}**",
        f"- Tags: **{len(grouped)}**",
        "",
        "## Authentication",
        "",
        "Most endpoints require an OAuth2 bearer token. Request samples use `$BASE_URL` and `$TOKEN` placeholders:",
        "",
        "```bash",
        'BASE_URL="http://localhost:8000"',
        'TOKEN="<access-token>"',
        "```",
        "",
        "Common error shapes:",
        "",
        "```json",
        json.dumps(
            {
                "401": {"detail": "Not authenticated"},
                "403": {"detail": "Forbidden"},
                "422": {"detail": [{"loc": ["body", "field"], "msg": "Field required", "type": "missing"}]},
            },
            indent=2,
        ),
        "```",
        "",
        "## Endpoint Index",
        "",
        "| Method | Path | Summary | Tag |",
        "| --- | --- | --- | --- |",
    ]

    for tag in sorted(grouped):
        for method, path, operation in grouped[tag]:
            lines.append(f"| `{method.upper()}` | `{path}` | {md_escape(operation.get('summary', ''))} | {md_escape(tag)} |")

    root = schema
    for tag in sorted(grouped):
        lines.extend(["", f"## {tag}", ""])
        for method, path, operation in grouped[tag]:
            parameters = operation.get("parameters") or []
            content_type, body_sample, request_schema = request_body_sample(operation, root)
            response_status, response_body, response_content_type, response_schema = response_sample(operation, root, path)
            secured = bool(operation.get("security"))

            lines.extend(
                [
                    f"### `{method.upper()} {path}`",
                    "",
                    f"- **Summary:** {operation.get('summary', '')}",
                    f"- **Operation ID:** `{operation.get('operationId', '')}`",
                    f"- **Auth:** {'Bearer token required' if secured else 'No bearer token declared in OpenAPI'}",
                    f"- **Response status:** `{response_status}`",
                ]
            )
            description = strip_response_sections(operation.get("description", ""))
            if description:
                lines.extend(["", "**Description**", "", description])

            lines.extend(["", "**Parameters**", "", *render_parameter_table(parameters, root)])

            lines.extend(["", "**Request Sample**", "", "```bash"])
            lines.append(curl_sample(method, path, parameters, content_type or "application/json", body_sample, root, secured))
            lines.append("```")

            if body_sample is None:
                lines.extend(["", "Request body: none."])
            else:
                schema_label = f" `{request_schema}`" if request_schema else ""
                lines.extend(["", f"Request content type: `{content_type}`{schema_label}.", "", json_block(body_sample)])
                body_fields = render_body_fields(body_sample)
                if body_fields:
                    lines.extend(["", "**Request Fields**", "", *body_fields])

            schema_label = f" `{response_schema}`" if response_schema else ""
            lines.extend(["", f"**Response Sample `{response_status}`**", "", f"Response content type: `{response_content_type}`{schema_label}.", "", json_block(response_body)])

    lines.append("")
    return "\n".join(lines)


def main() -> int:
    schema = load_openapi_schema()
    content = render(schema)
    PUBLIC_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    LLM_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC_OUTPUT.write_text(content, encoding="utf-8")
    LLM_OUTPUT.write_text(content, encoding="utf-8")
    print(
        json.dumps(
            {
                "output": PUBLIC_OUTPUT.relative_to(REPO_ROOT).as_posix(),
                "llm_output": LLM_OUTPUT.relative_to(REPO_ROOT).as_posix(),
                "operations": sum(1 for path_item in schema.get("paths", {}).values() for method in HTTP_METHODS if method in path_item),
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
