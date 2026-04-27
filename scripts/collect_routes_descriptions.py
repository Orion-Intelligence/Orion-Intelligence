#!/usr/bin/env python3
"""Collect route path + description from client and backend route files.

Sources:
- client/src/app/app.routes.ts (Angular routes with data.description)
- backend/routes/api_routes.py (FastAPI decorators with description=...)

Output:
- backend/docs/routes_with_descriptions.json
"""

from __future__ import annotations

import ast
import json
from dataclasses import dataclass
from pathlib import Path
import re
from typing import Any, Optional


DEFAULT_PROJECT_ROOT = Path("/home/usman/Documents/Genesis/Orion-Intelligence")


@dataclass
class RouteRecord:
    path: str
    description: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "path": self.path,
            "description": self.description,
        }


def _count_char(line: str, char: str) -> int:
    return sum(1 for c in line if c == char)


def _find_object_start(lines: list[str], index: int) -> int:
    for i in range(index, -1, -1):
        if lines[i].strip() == "{":
            return i
    return -1


def _find_block_end(lines: list[str], start_index: int) -> int:
    depth = 0
    for i in range(start_index, len(lines)):
        depth += _count_char(lines[i], "{")
        depth -= _count_char(lines[i], "}")
        if i > start_index and depth == 0:
            return i
    return -1


def _leading_spaces(line: str) -> int:
    return len(line) - len(line.lstrip(" "))


def _find_top_level_data_line(lines: list[str], object_start: int, object_end: int, prop_indent: int) -> int:
    prefix = " " * prop_indent + "data:"
    for i in range(object_start + 1, object_end):
        if lines[i].startswith(prefix):
            return i
    return -1


def _extract_data_description_from_line(line: str) -> Optional[str]:
    match = re.search(r"description\s*:\s*'([^']*)'", line)
    return match.group(1) if match else None


def extract_client_routes(client_routes_path: Path, project_root: Path) -> list[RouteRecord]:
    lines = client_routes_path.read_text(encoding="utf-8").splitlines()
    route_records: list[RouteRecord] = []

    for i, line in enumerate(lines):
        path_match = re.match(r"^\s*path:\s*'([^']*)',\s*$", line)
        if not path_match:
            continue

        route_path = path_match.group(1)
        prop_indent = _leading_spaces(line)

        object_start = _find_object_start(lines, i)
        if object_start == -1:
            continue

        object_end = _find_block_end(lines, object_start)
        if object_end == -1:
            continue

        data_line = _find_top_level_data_line(lines, object_start, object_end, prop_indent)
        if data_line == -1:
            continue

        description: Optional[str] = None

        inline_data_match = re.match(r"^\s*data:\s*\{(.*)\}\s*,?\s*$", lines[data_line])
        if inline_data_match:
            description = _extract_data_description_from_line(inline_data_match.group(1))
        else:
            data_end = _find_block_end(lines, data_line)
            if data_end != -1:
                for k in range(data_line, data_end + 1):
                    stripped = lines[k].strip()
                    desc_line = re.match(r"^description:\s*'([^']*)'\s*,?\s*$", stripped)
                    if desc_line:
                        description = desc_line.group(1)
                        break

        if description:
            route_records.append(
                RouteRecord(
                    path=route_path,
                    description=description,
                )
            )

    return route_records


def _ast_expr_to_text(expr: ast.AST) -> str:
    if isinstance(expr, ast.Constant) and isinstance(expr.value, str):
        return expr.value
    try:
        return ast.unparse(expr)
    except Exception:
        return ast.dump(expr, include_attributes=False)


def _extract_backend_route_from_decorator(
    decorator: ast.AST,
) -> Optional[RouteRecord]:
    if not isinstance(decorator, ast.Call):
        return None

    if not isinstance(decorator.func, ast.Attribute):
        return None

    if not isinstance(decorator.func.value, ast.Name):
        return None

    if decorator.func.value.id != "api_routes":
        return None

    route_path: Optional[str] = None
    if decorator.args:
        first_arg = decorator.args[0]
        if isinstance(first_arg, ast.Constant) and isinstance(first_arg.value, str):
            route_path = first_arg.value

    description_expr: Optional[ast.AST] = None

    for kw in decorator.keywords:
        if kw.arg == "path" and route_path is None:
            if isinstance(kw.value, ast.Constant) and isinstance(kw.value.value, str):
                route_path = kw.value.value
        elif kw.arg == "description":
            description_expr = kw.value

    if not route_path or description_expr is None:
        return None

    return RouteRecord(
        path=route_path,
        description=_ast_expr_to_text(description_expr),
    )


def extract_backend_routes(backend_routes_path: Path, project_root: Path) -> list[RouteRecord]:
    tree = ast.parse(backend_routes_path.read_text(encoding="utf-8"), filename=str(backend_routes_path))
    route_records: list[RouteRecord] = []

    for node in ast.walk(tree):
        if not isinstance(node, (ast.AsyncFunctionDef, ast.FunctionDef)):
            continue

        for decorator in node.decorator_list:
            route = _extract_backend_route_from_decorator(
                decorator=decorator,
            )
            if route is not None:
                route_records.append(route)

    return route_records


def build_payload(client_routes: list[RouteRecord], backend_routes: list[RouteRecord]) -> dict[str, Any]:
    all_routes = [*client_routes, *backend_routes]
    return {
        "client_routes": [route.to_dict() for route in client_routes],
        "backend_routes": [route.to_dict() for route in backend_routes],
        "all_routes": [route.to_dict() for route in all_routes],
    }


def main() -> None:
    project_root = DEFAULT_PROJECT_ROOT
    client_path = project_root / "client/src/app/app.routes.ts"
    backend_path = project_root / "backend/routes/api_routes.py"
    output_path = project_root / "backend/docs/routes_with_descriptions.json"

    if not client_path.exists():
        raise FileNotFoundError(f"Client routes file not found: {client_path}")
    if not backend_path.exists():
        raise FileNotFoundError(f"Backend routes file not found: {backend_path}")

    client_routes = extract_client_routes(client_path, project_root)
    backend_routes = extract_backend_routes(backend_path, project_root)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    payload = build_payload(client_routes, backend_routes)
    output_path.write_text(json.dumps(payload, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")

    print(f"Wrote: {output_path}")
    print(f"Client routes with description: {len(client_routes)}")
    print(f"Backend routes with description: {len(backend_routes)}")
    print(f"Total routes with description: {len(client_routes) + len(backend_routes)}")


if __name__ == "__main__":
    main()
