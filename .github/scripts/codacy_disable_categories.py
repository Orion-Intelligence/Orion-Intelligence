from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE_URL = "https://api.codacy.com/api/v3"
DEFAULT_CATEGORIES = ("ErrorProne", "UnusedCode")
PAGE_LIMIT = 100


def normalize(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", (value or "").lower())


def request(path: str, auth: tuple[str, str], method: str = "GET", body: dict | None = None) -> dict:
    url = f"{BASE_URL}{path}"
    data = json.dumps(body).encode("utf-8") if body is not None else None
    header_name, token = auth
    headers = {header_name: token, "Accept": "application/json"}
    if data is not None:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            payload = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(f"{method} {path} failed with HTTP {exc.code}: {detail}") from exc
    return json.loads(payload) if payload else {}


def repository_path(args) -> str:
    return f"/analysis/organizations/{args.provider}/{args.organization}/repositories/{args.repository}"


def list_tools(args, auth: tuple[str, str]) -> list[dict]:
    return request(f"{repository_path(args)}/tools", auth).get("data") or []


def list_patterns(args, auth: tuple[str, str], tool_uuid: str) -> list[dict]:
    patterns: list[dict] = []
    cursor = None
    while True:
        query = {"limit": PAGE_LIMIT}
        if cursor:
            query["cursor"] = cursor
        path = f"{repository_path(args)}/tools/{tool_uuid}/patterns?{urllib.parse.urlencode(query)}"
        response = request(path, auth)
        patterns.extend(response.get("data") or [])
        cursor = (response.get("pagination") or {}).get("cursor")
        if not cursor:
            return patterns


def pattern_category(pattern: dict) -> str:
    definition = pattern.get("patternDefinition") or pattern
    return definition.get("category") or ""


def pattern_id(pattern: dict) -> str:
    definition = pattern.get("patternDefinition") or pattern
    return definition.get("id") or ""


def is_tool_enabled(tool: dict) -> bool:
    settings = tool.get("settings") or {}
    return bool(settings.get("isEnabled", tool.get("isEnabled", tool.get("enabled", False))))


def credentials() -> tuple[str, str] | None:
    account_token = os.getenv("CODACY_API_TOKEN")
    if account_token:
        return "api-token", account_token
    project_token = os.getenv("CODACY_PROJECT_TOKEN")
    if project_token:
        return "project-token", project_token
    return None


def main() -> int:
    parser = argparse.ArgumentParser(description="Disable every Codacy code pattern in the given issue categories.")
    parser.add_argument("--provider", default=os.getenv("CODACY_PROVIDER", "gh"))
    parser.add_argument("--organization", default=os.getenv("CODACY_ORGANIZATION", "Orion-Intelligence"))
    parser.add_argument("--repository", default=os.getenv("CODACY_REPOSITORY", "Orion-Intelligence"))
    parser.add_argument("--category", action="append", dest="categories", default=None)
    parser.add_argument("--apply", action="store_true", help="Write the changes. Without it the script only reports.")
    parser.add_argument("--reanalyze-commit", help="Request reanalysis of this commit after applying changes.")
    args = parser.parse_args()

    auth = credentials()
    if not auth:
        print("CODACY_API_TOKEN or CODACY_PROJECT_TOKEN is not set.", file=sys.stderr)
        return 1

    wanted = {normalize(name) for name in (args.categories or DEFAULT_CATEGORIES)}
    tools = list_tools(args, auth)
    if not tools:
        print("No tools returned for this repository. Check the provider, organization and repository names.")
        return 1

    seen_categories: set[str] = set()
    total_disabled = 0

    for tool in tools:
        tool_uuid = tool.get("uuid")
        tool_name = tool.get("name") or tool_uuid
        if not tool_uuid or not is_tool_enabled(tool):
            continue

        patterns = list_patterns(args, auth, tool_uuid)
        targets = []
        for pattern in patterns:
            category = pattern_category(pattern)
            seen_categories.add(category)
            if normalize(category) in wanted and pattern.get("enabled"):
                targets.append(pattern)

        if not targets:
            continue

        print(f"{tool_name}: disabling {len(targets)} of {len(patterns)} patterns")
        for pattern in targets:
            print(f"  - {pattern_id(pattern)} [{pattern_category(pattern)}]")
        total_disabled += len(targets)

        if args.apply:
            category_query = ",".join(sorted({pattern_category(pattern) for pattern in targets}))
            query = urllib.parse.urlencode({"categories": category_query})
            request(
                f"{repository_path(args)}/tools/{tool_uuid}/patterns?{query}",
                auth,
                method="PATCH",
                body={"enabled": False},
            )

    print()
    print(f"Categories seen across this repository: {', '.join(sorted(name for name in seen_categories if name))}")
    if args.apply:
        print(f"Disabled {total_disabled} patterns. Re-analyze the repository for the issue counts to drop.")
        if args.reanalyze_commit:
            request(
                f"/organizations/{args.provider}/{args.organization}/repositories/{args.repository}/reanalyzeCommit",
                auth,
                method="POST",
                body={"commitUuid": args.reanalyze_commit},
            )
            print(f"Requested reanalysis of {args.reanalyze_commit}.")
    else:
        print(f"Dry run. {total_disabled} patterns would be disabled. Re-run with --apply to write the change.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
