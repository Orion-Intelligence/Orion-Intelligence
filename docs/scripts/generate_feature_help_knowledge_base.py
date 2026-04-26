#!/usr/bin/env python3
from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
LLM_DOCS_DIR = REPO_ROOT / "docs" / "llm_docs"
CATALOG_PATH = LLM_DOCS_DIR / "feature_catalog.json"
OUTPUT_PATH = LLM_DOCS_DIR / "feature_help_knowledge_base.md"


CATEGORY_TITLES = {
    "access": "Access And Onboarding",
    "overview": "Overview",
    "search": "Search And Investigation",
    "indexed_investigation": "Indexed Investigation Modules",
    "live_lookup": "Live Lookup Modules",
    "scan": "Scan Modules",
    "ai": "AI Features",
    "graph": "Graph Investigation",
    "reports": "Reports And Review",
    "profile": "Profile And Alerts",
    "settings": "Settings",
    "administration": "Administration",
    "support": "Support And Documentation",
}


def as_list(value: Any) -> list[Any]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def join_inline(values: list[Any], fallback: str = "none") -> str:
    cleaned = [str(value) for value in values if value not in (None, "")]
    if not cleaned:
        return fallback
    return ", ".join(f"`{value}`" for value in cleaned)


def sentence(values: list[Any], fallback: str) -> str:
    cleaned = [str(value).strip() for value in values if str(value).strip()]
    if not cleaned:
        return fallback
    return "; ".join(cleaned)


def slug(value: str) -> str:
    return "".join(ch.lower() if ch.isalnum() else "-" for ch in value).strip("-")


def render_feature(feature: dict[str, Any]) -> list[str]:
    title = feature.get("title") or feature.get("id") or "Untitled Feature"
    aliases = as_list(feature.get("aliases"))
    routes = as_list(feature.get("routes"))
    roles = as_list(feature.get("roles"))
    licenses = as_list(feature.get("licenses"))
    settings = as_list(feature.get("settings"))
    backend_routes = as_list(feature.get("backend_routes"))
    steps = as_list(feature.get("steps"))
    troubleshooting = as_list(feature.get("troubleshooting"))

    lines = [
        f"### {title}",
        "",
        f"- **Feature ID:** `{feature.get('id', slug(title))}`",
        f"- **User asks for:** {sentence(aliases, 'the exact feature name')}",
        f"- **Where to go:** {join_inline(routes, 'deployment-specific navigation')}",
        f"- **Roles:** {join_inline(roles, 'role-dependent')}",
        f"- **Licenses:** {join_inline(licenses)}",
        f"- **Settings:** {join_inline(settings)}",
    ]
    if backend_routes:
        lines.append(f"- **Related backend APIs:** {join_inline(backend_routes)}")

    lines.extend(["", "**How to guide the user**", ""])
    if steps:
        for index, step in enumerate(steps, 1):
            lines.append(f"{index}. {step}")
    else:
        lines.append("1. Open the feature from the relevant dashboard area.")
        lines.append("2. Follow the visible controls for the task.")
        lines.append("3. Review the result or report.")

    lines.extend(["", "**When the user cannot see it**", ""])
    if troubleshooting:
        for item in troubleshooting:
            lines.append(f"- {item}")
    else:
        lines.append("- Check role, tenant, license, account status, and system settings.")
    lines.append("")
    return lines


def render(catalog: dict[str, Any]) -> str:
    features = as_list(catalog.get("features"))
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for feature in features:
        grouped[str(feature.get("category") or "other")].append(feature)

    lines = [
        "(feature-help-knowledge-base)=",
        "",
        "# Feature Help Knowledge Base",
        "",
        "This page is the primary retrieval source for assistants that need to help users navigate Orion, choose the right feature, and complete a workflow step by step. It is intentionally organized by user intent rather than source files.",
        "",
        "## Assistant Answering Rules",
        "",
        "When a user asks how to use the application:",
        "",
        "1. Match the user's words to the feature title or aliases.",
        "2. Tell the user where to go in the UI before mentioning API or implementation details.",
        "3. Give short step-by-step instructions.",
        "4. Mention role, license, and setting requirements only when they affect visibility or access.",
        "5. If the user cannot see a feature, check role, tenant state, license, account status, and system settings.",
        "6. Use API documentation only when the user asks for API integration or programmatic access.",
        "7. Do not answer normal user navigation questions from source-file inventory documents.",
        "",
        "## Best Retrieval Sources",
        "",
        "| User question type | Best source |",
        "| --- | --- |",
        "| Where do I go for a feature? | `feature_help_knowledge_base.md` or `feature_catalog.json` |",
        "| How do I complete a workflow? | `application_feature_guide.md` or `user_manual.md` |",
        "| Which public API do I call? | `swagger_api_reference.md` |",
        "| Where is this implemented in code? | source reference files, only for developer questions |",
        "",
        "## Feature Index",
        "",
        "| Feature | Category | Routes | Common user wording |",
        "| --- | --- | --- | --- |",
    ]

    for feature in features:
        title = feature.get("title") or feature.get("id") or "Untitled Feature"
        category = CATEGORY_TITLES.get(str(feature.get("category")), str(feature.get("category") or "Other").replace("_", " ").title())
        routes = ", ".join(str(route) for route in as_list(feature.get("routes"))[:4]) or "deployment-specific"
        aliases = ", ".join(str(alias) for alias in as_list(feature.get("aliases"))[:6]) or title
        lines.append(f"| [{title}](#{slug(title)}) | {category} | `{routes}` | {aliases} |")

    for category in CATEGORY_TITLES:
        items = grouped.get(category, [])
        if not items:
            continue
        lines.extend(["", f"## {CATEGORY_TITLES[category]}", ""])
        for feature in items:
            lines.extend(render_feature(feature))

    remaining = sorted(key for key in grouped if key not in CATEGORY_TITLES)
    for category in remaining:
        lines.extend(["", f"## {category.replace('_', ' ').title()}", ""])
        for feature in grouped[category]:
            lines.extend(render_feature(feature))

    lines.extend(
        [
            "## Notes For LLM Integration",
            "",
            "- Use `feature_catalog.json` for structured retrieval, ranking, and alias matching.",
            "- Use this page when the answer should be readable and step-based.",
            "- Keep source inventory files out of normal user-help prompts unless the user is asking a developer or implementation question.",
            "- If a feature is controlled by `ai_endpoint_enabled`, explain that administrators can enable or disable AI endpoints from System Settings.",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> int:
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    OUTPUT_PATH.write_text(render(catalog), encoding="utf-8")
    print(json.dumps({"output": OUTPUT_PATH.relative_to(REPO_ROOT).as_posix(), "features": len(as_list(catalog.get("features")))}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
