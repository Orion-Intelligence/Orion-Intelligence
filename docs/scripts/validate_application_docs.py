#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
import warnings
from pathlib import Path
from typing import Any

from PIL import Image


REPO_ROOT = Path(__file__).resolve().parents[2]
DOCS_DIR = REPO_ROOT / "docs"
APP_DOCS_DIR = DOCS_DIR / "app_docs"
LLM_DOCS_DIR = DOCS_DIR / "llm_docs"
BACKEND_ROUTES_DIR = REPO_ROOT / "backend" / "routes"

FEATURE_CATALOG = LLM_DOCS_DIR / "feature_catalog.json"
FEATURE_HELP = LLM_DOCS_DIR / "feature_help_knowledge_base.md"
APPLICATION_FEATURE_GUIDE = LLM_DOCS_DIR / "application_feature_guide.md"
SWAGGER_REFERENCE = APP_DOCS_DIR / "swagger_api_reference.md"
USER_MANUAL = APP_DOCS_DIR / "user_manual.md"
DOCS_INDEX = DOCS_DIR / "index.md"
SPHINX_CONF = DOCS_DIR / "conf.py"

NON_ROUTE_DESCRIPTORS = {
    "report pages",
    "supported report pages",
    "support overlay",
    "sidebar documentation link",
    "sidebar onion link",
    "sidebar whistle blowing link",
}

FRONTEND_ROUTE_PATTERNS = [
    r"^/docs$",
    r"^/login$",
    r"^/signup$",
    r"^/reset(?:/:token)?$",
    r"^/onboarding$",
    r"^/welcome(?:/:token)?$",
    r"^/notification$",
    r"^/dashboard$",
    r"^/dashboard/(home|scan|ctigraph|social-graph|social-intel|social-mapper|directory|netint)$",
    r"^/dashboard/api(?:/(email-breach|social-scanner|wanted-list|national-identity|playstore-scanner|software-scanner|file-scanner|text-analysis|crypto-scanner))?$",
    r"^/dashboard/(discussion|breach|strategic|feed)/(:category|[a-z0-9-]+)$",
    r"^/dashboard/defacement/(all|hacked|phishing|databases|:category)$",
    r"^/dashboard/social/(all|telegram|twitter|mastodon|pastebin|forum|reddit|:category)$",
    r"^/dashboard/exploit/(all|cve|tools|zeroday|:category)$",
    r"^/dashboard/consolidated/all$",
    r"^/dashboard/scanner/(network-scan|repository-scan|seo-scan|apk-scan)$",
    r"^/dashboard/dump/(listing|credential)$",
    r"^/dashboard/stealerlogs/(iocs|credential)$",
    r"^/dashboard/tenant/(view-profiles|view-tenants|auditlog)$",
    r"^/dashboard/profile/(ai|homepage|statistics|ioc|auditlog|users|account|event-management|feeder|tenant-settings|tenant|system-settings|addcustomalert)$",
    r"^/dashboard/profile/consolidated/all$",
    r"^/dashboard/profile/alerts/:type$",
    r"^/dashboard/profile/user/:user_id$",
]


def fail(message: str, failures: list[str]) -> None:
    failures.append(message)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def route_is_known(route: str) -> bool:
    if not route.startswith("/"):
        return route in NON_ROUTE_DESCRIPTORS
    return any(re.match(pattern, route) for pattern in FRONTEND_ROUTE_PATTERNS)


def backend_route_paths() -> set[str]:
    paths: set[str] = set()
    route_re = re.compile(r"@\w+\.(?:get|post|put|patch|delete)\(\s*['\"]([^'\"]+)['\"]", re.S)
    for path in BACKEND_ROUTES_DIR.glob("*.py"):
        text = path.read_text(encoding="utf-8", errors="replace")
        paths.update(route_re.findall(text))
    return paths


def openapi_operation_count() -> int:
    sys.path.insert(0, str(REPO_ROOT / "backend"))
    warnings.filterwarnings("ignore", message="Duplicate Operation ID.*")
    import main  # type: ignore

    schema = main.app.openapi()
    return sum(
        1
        for path_item in schema.get("paths", {}).values()
        for method in path_item
        if method in {"get", "post", "put", "patch", "delete"}
    )


def validate_feature_catalog(failures: list[str]) -> None:
    catalog = load_json(FEATURE_CATALOG)
    features = catalog.get("features", [])
    if not features:
        fail("feature_catalog.json has no features", failures)
        return

    ids = [feature.get("id") for feature in features]
    duplicates = sorted({feature_id for feature_id in ids if ids.count(feature_id) > 1})
    if duplicates:
        fail(f"feature_catalog.json has duplicate ids: {duplicates}", failures)

    required_fields = {"id", "title", "category", "aliases", "routes", "roles", "licenses", "settings", "steps", "troubleshooting"}
    backend_paths = backend_route_paths()
    for feature in features:
        missing = sorted(required_fields - set(feature))
        if missing:
            fail(f"feature {feature.get('id', '<missing-id>')} is missing fields: {missing}", failures)
        if not feature.get("steps"):
            fail(f"feature {feature.get('id')} has no steps", failures)
        for route in feature.get("routes", []):
            if not route_is_known(route):
                fail(f"feature {feature.get('id')} references unknown UI route/descriptor: {route}", failures)
        for route in feature.get("backend_routes", []):
            if route not in backend_paths:
                fail(f"feature {feature.get('id')} references unknown backend route: {route}", failures)


def validate_feature_help(failures: list[str]) -> None:
    catalog = load_json(FEATURE_CATALOG)
    feature_count = len(catalog.get("features", []))
    text = FEATURE_HELP.read_text(encoding="utf-8")
    section_count = text.count("### ")
    if section_count != feature_count:
        fail(f"feature_help_knowledge_base.md has {section_count} feature sections; expected {feature_count}", failures)
    if "source-file inventory" in text.lower() and "only for developer questions" not in text.lower():
        fail("feature_help_knowledge_base.md mentions source inventory without limiting it to developer questions", failures)


def validate_application_feature_guide(failures: list[str]) -> None:
    catalog = load_json(FEATURE_CATALOG)
    text = APPLICATION_FEATURE_GUIDE.read_text(encoding="utf-8").lower()
    for feature in catalog.get("features", []):
        title = str(feature.get("title", "")).lower()
        aliases = [str(alias).lower() for alias in feature.get("aliases", [])[:3]]
        if title and title in text:
            continue
        if any(alias and alias in text for alias in aliases):
            continue
        fail(f"application_feature_guide.md does not mention feature: {feature.get('id')} ({feature.get('title')})", failures)


def validate_swagger_reference(failures: list[str]) -> None:
    text = SWAGGER_REFERENCE.read_text(encoding="utf-8")
    operation_sections = text.count("### `")
    request_samples = text.count("**Request Sample**")
    response_samples = text.count("**Response Sample")
    openapi_count = openapi_operation_count()
    if operation_sections != openapi_count:
        fail(f"swagger_api_reference.md documents {operation_sections} operations; OpenAPI exposes {openapi_count}", failures)
    if request_samples != openapi_count:
        fail(f"swagger_api_reference.md has {request_samples} request samples; expected {openapi_count}", failures)
    if response_samples != openapi_count:
        fail(f"swagger_api_reference.md has {response_samples} response samples; expected {openapi_count}", failures)


def validate_user_manual_screenshots(failures: list[str]) -> None:
    text = USER_MANUAL.read_text(encoding="utf-8")
    referenced = re.findall(r"```\{figure\}\s+\.\./screenshots/([^\s]+)", text)
    if not referenced:
        fail("user_manual.md does not reference screenshots", failures)
        return
    for filename in sorted(set(referenced)):
        path = DOCS_DIR / "screenshots" / filename
        if not path.exists():
            fail(f"user_manual.md references missing screenshot: {filename}", failures)
            continue
        if path.stat().st_size <= 0:
            fail(f"referenced screenshot is empty: {filename}", failures)
            continue
        try:
            with Image.open(path) as image:
                width, height = image.size
        except Exception as exc:
            fail(f"referenced screenshot is unreadable: {filename}: {exc}", failures)
            continue
        if width < 300 or height < 200:
            fail(f"referenced screenshot is unexpectedly small: {filename} ({width}x{height})", failures)


def validate_index(failures: list[str]) -> None:
    text = DOCS_INDEX.read_text(encoding="utf-8")
    if ":caption: Source Reference:" in text:
        fail("docs/index.md exposes source references as a visible navigation tab", failures)
    if "llm_docs/" in text:
        fail("docs/index.md exposes LLM-only docs in the ReadTheDocs navigation", failures)
    forbidden_public_entries = (
        "app_docs/feature_help_knowledge_base",
        "app_docs/application_feature_guide",
        "app_docs/backend_api_reference",
        "app_docs/frontend_source_reference",
        "app_docs/full_project_reference",
        "app_docs/source_file_inventory",
    )
    for entry in forbidden_public_entries:
        if entry in text:
            fail(f"docs/index.md exposes LLM/source-only docs entry: {entry}", failures)
    required_public_entries = (
        "app_docs/introduction_to_platform",
        "app_docs/introduction_to_modules",
        "app_docs/user_manual",
        "app_docs/developer_documentation",
        "app_docs/swagger_api_reference",
    )
    for entry in required_public_entries:
        if entry not in text:
            fail(f"docs/index.md is missing public docs entry: {entry}", failures)


def validate_readthedocs_excludes(failures: list[str]) -> None:
    text = SPHINX_CONF.read_text(encoding="utf-8")
    if '"llm_docs/**"' not in text and "'llm_docs/**'" not in text:
        fail("docs/conf.py does not exclude llm_docs/** from the ReadTheDocs build", failures)
    if '"api_docs/**"' not in text and "'api_docs/**'" not in text:
        fail("docs/conf.py does not exclude legacy api_docs/** from the ReadTheDocs build", failures)


def main() -> int:
    failures: list[str] = []
    validate_feature_catalog(failures)
    validate_feature_help(failures)
    validate_application_feature_guide(failures)
    validate_swagger_reference(failures)
    validate_user_manual_screenshots(failures)
    validate_index(failures)
    validate_readthedocs_excludes(failures)

    if failures:
        print("Documentation validation failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("Documentation validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
