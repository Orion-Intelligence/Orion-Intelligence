from __future__ import annotations

import ast
import json
import re
from collections import Counter, defaultdict
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
DOCS_DIR = REPO_ROOT / "docs" / "llm_docs"

SOURCE_ROOTS = [
    "backend/orion",
    "backend/routes",
    "backend/configs",
    "backend/migrations",
    "backend/tests",
    "client/src/app",
    "client/cypress",
    "docs/app_docs",
    "docs/llm_docs",
    "docs/scripts",
]

ROOT_FILES = [
    "README.md",
    "pyproject.toml",
    "docker-compose.yml",
    "docker-compose-dev.yml",
    "docker-compose-testing.yml",
    "run.sh",
    "client/package.json",
    "client/angular.json",
    "client/tsconfig.json",
    "client/tailwind.config.ts",
    "backend/pyproject.toml",
]

TEXT_EXTENSIONS = {
    ".py",
    ".ts",
    ".html",
    ".scss",
    ".css",
    ".json",
    ".md",
    ".yml",
    ".yaml",
    ".toml",
    ".ini",
    ".txt",
    ".sh",
}

SKIP_PARTS = {
    ".git",
    ".venv",
    "node_modules",
    "__pycache__",
    ".pytest_cache",
    "_build",
    "build",
    "dist",
    "coverage",
}

GENERATED_REFERENCE_FILES = {
    "docs/llm_docs/backend_api_reference.md",
    "docs/llm_docs/frontend_source_reference.md",
    "docs/llm_docs/full_project_reference.md",
    "docs/llm_docs/source_file_inventory.md",
    "docs/llm_docs/source_file_inventory.json",
}


@dataclass
class FileDoc:
    path: str
    kind: str
    bytes: int
    lines: int
    summary: str
    classes: list[str]
    functions: list[str]
    methods: list[str]
    exports: list[str]
    selectors: list[str]
    routes: list[str]
    api_paths: list[str]
    templates: list[str]
    styles: list[str]
    data_testids: list[str]
    imports: list[str]


@dataclass
class EndpointDoc:
    method: str
    path: str
    source: str
    line: int
    function: str
    signature: str
    summary: str
    description: str
    request_models: list[str]
    dependencies: list[str]
    roles: list[str]
    licenses: list[str]
    settings: list[str]
    include_in_schema: str
    returns: list[str]


@dataclass
class ComponentDoc:
    path: str
    class_name: str
    kind: str
    selector: str
    template_url: str
    style_urls: list[str]
    standalone: str
    imports: list[str]
    injected_services: list[str]
    inputs: list[str]
    outputs: list[str]
    methods: list[str]
    properties: list[str]
    template_data_testids: list[str]
    template_router_links: list[str]
    template_events: list[str]
    summary: str


def rel(path: Path) -> str:
    return path.relative_to(REPO_ROOT).as_posix()


def should_skip(path: Path) -> bool:
    try:
        relative_path = rel(path)
    except ValueError:
        relative_path = path.as_posix()
    if relative_path in GENERATED_REFERENCE_FILES:
        return True
    if relative_path.startswith("client/cypress/downloads/"):
        return True
    return any(part in SKIP_PARTS for part in path.parts)


def iter_source_files() -> list[Path]:
    files: set[Path] = set()
    for root in SOURCE_ROOTS:
        root_path = REPO_ROOT / root
        if not root_path.exists():
            continue
        for path in root_path.rglob("*"):
            if not path.is_file() or should_skip(path):
                continue
            if path.suffix.lower() in TEXT_EXTENSIONS:
                files.add(path)
    for root_file in ROOT_FILES:
        path = REPO_ROOT / root_file
        if path.exists() and path.is_file():
            files.add(path)
    return sorted(files, key=lambda p: rel(p))


def read_text(path: Path, max_bytes: int = 2_000_000) -> str:
    try:
        if path.stat().st_size > max_bytes:
            return ""
        return path.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return ""


def line_count(text: str) -> int:
    if not text:
        return 0
    return text.count("\n") + (0 if text.endswith("\n") else 1)


def first_sentence(text: str) -> str:
    clean = " ".join(text.strip().split())
    if not clean:
        return ""
    match = re.search(r"(.{1,220}?)(?:\. |$)", clean)
    return (match.group(1) if match else clean[:220]).strip()


def node_name(node: ast.AST | None) -> str:
    if node is None:
        return ""
    try:
        return ast.unparse(node)
    except Exception:
        return ""


def literal_string(node: ast.AST | None) -> str:
    if isinstance(node, ast.Constant) and isinstance(node.value, str):
        return node.value
    if isinstance(node, ast.JoinedStr):
        return ast.unparse(node)
    return ""


def compact(value: str, limit: int = 180) -> str:
    value = " ".join(value.split())
    if len(value) <= limit:
        return value
    return value[: limit - 3] + "..."


def infer_kind(path: Path, text: str) -> str:
    suffix = path.suffix.lower()
    name = path.name
    if suffix == ".py":
        if "/routes/" in rel(path):
            return "backend route module"
        if name.startswith("test_") or "/tests/" in rel(path):
            return "backend test"
        if "model" in name or "/models/" in rel(path) or "/shared_model/" in rel(path):
            return "backend model"
        if "manager" in rel(path):
            return "backend manager/service"
        return "backend python"
    if suffix == ".ts":
        if "@Component" in text:
            return "angular component"
        if "@Injectable" in text:
            return "angular service/resolver/guard"
        if "@Directive" in text:
            return "angular directive"
        if "@Pipe" in text:
            return "angular pipe"
        if path.name.endswith(".routes.ts"):
            return "angular routes"
        if path.name.endswith(".model.ts") or "/model/" in rel(path) or "/models/" in rel(path):
            return "typescript model"
        return "typescript"
    if suffix == ".html":
        return "angular template"
    if suffix in {".scss", ".css"}:
        return "stylesheet"
    if suffix == ".json":
        return "json data/config"
    if suffix == ".md":
        return "documentation"
    if suffix in {".yml", ".yaml", ".toml", ".ini"}:
        return "configuration"
    if suffix == ".sh":
        return "script"
    return "text"


def summarize_python(path: Path, text: str) -> dict[str, Any]:
    data: dict[str, Any] = {
        "classes": [],
        "functions": [],
        "methods": [],
        "imports": [],
        "api_paths": [],
        "summary": "",
    }
    try:
        tree = ast.parse(text)
    except SyntaxError:
        data["summary"] = "Python file could not be parsed; see source for details."
        return data

    doc = ast.get_docstring(tree)
    if doc:
        data["summary"] = first_sentence(doc)

    for node in tree.body:
        if isinstance(node, ast.Import):
            data["imports"].extend(alias.name for alias in node.names[:8])
        elif isinstance(node, ast.ImportFrom):
            module = node.module or ""
            names = ", ".join(alias.name for alias in node.names[:8])
            data["imports"].append(f"{module}: {names}" if module else names)
        elif isinstance(node, ast.ClassDef):
            data["classes"].append(node.name)
            for item in node.body:
                if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    data["methods"].append(f"{node.name}.{item.name}")
        elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            data["functions"].append(node.name)

    data["api_paths"] = sorted(set(re.findall(r"['\"](/(?:api|admin|robots)[^'\"]*)['\"]", text)))
    if not data["summary"]:
        parts = []
        if data["classes"]:
            parts.append("classes " + ", ".join(data["classes"][:4]))
        if data["functions"]:
            parts.append("functions " + ", ".join(data["functions"][:5]))
        if data["api_paths"]:
            parts.append("API routes " + ", ".join(data["api_paths"][:3]))
        data["summary"] = "Defines " + "; ".join(parts) + "." if parts else "Python source module."
    return data


def summarize_ts(path: Path, text: str) -> dict[str, Any]:
    classes = re.findall(r"\bexport\s+class\s+([A-Za-z0-9_]+)|\bclass\s+([A-Za-z0-9_]+)", text)
    class_names = [a or b for a, b in classes]
    functions = re.findall(r"\bexport\s+function\s+([A-Za-z0-9_]+)|\bfunction\s+([A-Za-z0-9_]+)", text)
    function_names = [a or b for a, b in functions]
    methods = re.findall(r"^\s*(?:public |private |protected )?([A-Za-z_][A-Za-z0-9_]*)\s*\([^)]*\)\s*(?::|\{|=>)", text, re.M)
    imports = re.findall(r"import\s+(?:[^'\"]+from\s+)?['\"]([^'\"]+)['\"]", text)
    selectors = re.findall(r"selector:\s*['\"]([^'\"]+)['\"]", text)
    templates = re.findall(r"templateUrl:\s*['\"]([^'\"]+)['\"]", text)
    styles = re.findall(r"styleUrls?:\s*(?:\[)?\s*['\"]([^'\"]+)['\"]", text)
    routes = re.findall(r"path:\s*['\"]([^'\"]*)['\"]", text)
    exports = re.findall(r"\bexport\s+(?:class|interface|enum|type|const|function)\s+([A-Za-z0-9_]+)", text)
    data_testids = re.findall(r"data-testid=['\"]([^'\"]+)['\"]", text)
    summary = ""
    if selectors:
        summary = f"Angular component/directive using selector {selectors[0]}."
    elif "@Injectable" in text:
        summary = "Angular injectable service, resolver, or guard."
    elif routes:
        summary = f"Angular route definition with {len(routes)} route path entries."
    elif class_names:
        summary = "TypeScript module defining " + ", ".join(class_names[:4]) + "."
    else:
        summary = "TypeScript source module."
    return {
        "classes": class_names,
        "functions": function_names,
        "methods": methods[:80],
        "imports": imports[:80],
        "selectors": selectors,
        "templates": templates,
        "styles": styles,
        "routes": routes[:120],
        "exports": exports,
        "data_testids": data_testids[:120],
        "summary": summary,
    }


def summarize_html(text: str) -> dict[str, Any]:
    data_testids = re.findall(r"data-testid=['\"]([^'\"]+)['\"]", text)
    router_links = re.findall(r"\[?routerLink\]?=['\"]([^'\"]+)['\"]", text)
    events = re.findall(r"\(([A-Za-z0-9_.-]+)\)=", text)
    elements = re.findall(r"<([a-zA-Z][a-zA-Z0-9-]*)\b", text)
    element_counts = Counter(elements)
    summary = "Angular template"
    if data_testids:
        summary += f" with {len(data_testids)} test ids"
    if router_links:
        summary += f" and {len(router_links)} router links"
    summary += "."
    return {
        "data_testids": data_testids[:160],
        "routes": router_links[:80],
        "functions": [],
        "classes": [],
        "methods": [],
        "imports": [],
        "summary": summary,
        "exports": [],
        "selectors": [],
        "templates": [],
        "styles": [],
        "top_elements": [f"{k}:{v}" for k, v in element_counts.most_common(8)],
        "events": events[:120],
    }


def summarize_json(text: str) -> dict[str, Any]:
    summary = "JSON file."
    exports: list[str] = []
    try:
        data = json.loads(text)
        if isinstance(data, dict):
            keys = list(data.keys())
            exports = keys[:80]
            summary = f"JSON object with {len(keys)} top-level keys."
        elif isinstance(data, list):
            summary = f"JSON array with {len(data)} items."
    except Exception:
        summary = "JSON-like file could not be parsed."
    return {
        "summary": summary,
        "exports": exports,
        "classes": [],
        "functions": [],
        "methods": [],
        "imports": [],
        "selectors": [],
        "routes": [],
        "api_paths": [],
        "templates": [],
        "styles": [],
        "data_testids": [],
    }


def summarize_markdown(text: str) -> dict[str, Any]:
    headings = re.findall(r"^(#{1,6})\s+(.+)$", text, re.M)
    title = headings[0][1] if headings else ""
    summary = f"Documentation page: {title}." if title else "Markdown documentation."
    return {
        "summary": summary,
        "exports": [h[1] for h in headings[:80]],
        "classes": [],
        "functions": [],
        "methods": [],
        "imports": [],
        "selectors": [],
        "routes": re.findall(r"`(/[^`]+)`", text)[:80],
        "api_paths": re.findall(r"`(/api/[^`]+)`", text)[:80],
        "templates": [],
        "styles": [],
        "data_testids": [],
    }


def document_file(path: Path) -> FileDoc:
    text = read_text(path)
    kind = infer_kind(path, text)
    base: dict[str, Any] = {
        "summary": "File is larger than the analyzer read limit; inventory includes metadata only.",
        "classes": [],
        "functions": [],
        "methods": [],
        "exports": [],
        "selectors": [],
        "routes": [],
        "api_paths": [],
        "templates": [],
        "styles": [],
        "data_testids": [],
        "imports": [],
    }
    if text:
        if path.suffix == ".py":
            base.update(summarize_python(path, text))
        elif path.suffix == ".ts":
            base.update(summarize_ts(path, text))
        elif path.suffix == ".html":
            base.update(summarize_html(text))
        elif path.suffix == ".json":
            base.update(summarize_json(text))
        elif path.suffix == ".md":
            base.update(summarize_markdown(text))
        elif path.suffix in {".scss", ".css"}:
            selectors = re.findall(r"(^|[\\s{}])([.#][A-Za-z0-9_-]+)", text)
            base["selectors"] = [s[1] for s in selectors[:120]]
            base["summary"] = f"Stylesheet with {len(selectors)} selector-like rules."
        else:
            base["summary"] = "Text/configuration file."
            base["api_paths"] = sorted(set(re.findall(r"(/api/[A-Za-z0-9_./{}:-]+)", text)))[:80]
    return FileDoc(
        path=rel(path),
        kind=kind,
        bytes=path.stat().st_size,
        lines=line_count(text),
        summary=base.get("summary", ""),
        classes=base.get("classes", []),
        functions=base.get("functions", []),
        methods=base.get("methods", []),
        exports=base.get("exports", []),
        selectors=base.get("selectors", []),
        routes=base.get("routes", []),
        api_paths=base.get("api_paths", []),
        templates=base.get("templates", []),
        styles=base.get("styles", []),
        data_testids=base.get("data_testids", []),
        imports=base.get("imports", []),
    )


def route_decorator_data(decorator: ast.AST, lines: list[str]) -> dict[str, Any] | None:
    if not isinstance(decorator, ast.Call):
        return None
    func = decorator.func
    method = ""
    if isinstance(func, ast.Attribute) and func.attr in {"get", "post", "put", "delete", "patch"}:
        method = func.attr.upper()
    if not method:
        return None
    path = literal_string(decorator.args[0]) if decorator.args else ""
    if not path:
        return None
    raw = ast.get_source_segment("\n".join(lines), decorator) or ""
    keywords = {kw.arg: kw.value for kw in decorator.keywords if kw.arg}
    deps_raw = node_name(keywords.get("dependencies"))
    summary = literal_string(keywords.get("summary"))
    description = literal_string(keywords.get("description"))
    include = node_name(keywords.get("include_in_schema")) or "default"
    roles = sorted(set(re.findall(r"user_role\\.([A-Z_]+)", raw)))
    licenses = sorted(set(re.findall(r"license_required\(['\"]([^'\"]+)['\"]", raw)))
    settings = []
    if "ai_endpoint_required" in raw:
        settings.append("ai_endpoint_enabled")
    dependencies = []
    if deps_raw:
        dependencies.append(compact(deps_raw, 260))
    return {
        "method": method,
        "path": path,
        "raw": raw,
        "dependencies": dependencies,
        "summary": summary,
        "description": description,
        "include": include,
        "roles": roles,
        "licenses": licenses,
        "settings": settings,
    }


def function_signature(node: ast.FunctionDef | ast.AsyncFunctionDef) -> str:
    args = []
    all_args = list(node.args.posonlyargs) + list(node.args.args)
    defaults = [None] * (len(all_args) - len(node.args.defaults)) + list(node.args.defaults)
    for arg, default in zip(all_args, defaults):
        name = arg.arg
        annotation = node_name(arg.annotation)
        value = f"{name}: {annotation}" if annotation else name
        if default is not None:
            value += f" = {node_name(default)}"
        args.append(value)
    if node.args.vararg:
        args.append("*" + node.args.vararg.arg)
    for arg, default in zip(node.args.kwonlyargs, node.args.kw_defaults):
        value = arg.arg
        if arg.annotation:
            value += f": {node_name(arg.annotation)}"
        if default is not None:
            value += f" = {node_name(default)}"
        args.append(value)
    if node.args.kwarg:
        args.append("**" + node.args.kwarg.arg)
    prefix = "async " if isinstance(node, ast.AsyncFunctionDef) else ""
    return f"{prefix}{node.name}({', '.join(args)})"


def endpoint_docs(files: list[Path]) -> list[EndpointDoc]:
    endpoints: list[EndpointDoc] = []
    for path in files:
        if path.suffix != ".py" or "/routes/" not in rel(path):
            continue
        text = read_text(path)
        if not text:
            continue
        lines = text.splitlines()
        try:
            tree = ast.parse(text)
        except SyntaxError:
            continue
        for node in ast.walk(tree):
            if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                continue
            for decorator in node.decorator_list:
                route = route_decorator_data(decorator, lines)
                if not route:
                    continue
                request_models = []
                for arg in node.args.args:
                    annotation = node_name(arg.annotation)
                    if annotation and annotation not in {"Request", "Response", "UploadFile", "str", "int", "bool"}:
                        request_models.append(annotation)
                returns = []
                for child in ast.walk(node):
                    if isinstance(child, ast.Return) and child.value is not None:
                        returns.append(compact(node_name(child.value), 220))
                doc = ast.get_docstring(node)
                endpoints.append(
                    EndpointDoc(
                        method=route["method"],
                        path=route["path"],
                        source=f"{rel(path)}:{node.lineno}",
                        line=node.lineno,
                        function=node.name,
                        signature=function_signature(node),
                        summary=route["summary"] or (first_sentence(doc or "") if doc else ""),
                        description=route["description"],
                        request_models=sorted(set(request_models)),
                        dependencies=route["dependencies"],
                        roles=route["roles"],
                        licenses=route["licenses"],
                        settings=route["settings"],
                        include_in_schema=route["include"],
                        returns=returns[:6],
                    )
                )
    return sorted(endpoints, key=lambda e: (e.source, e.method, e.path))


def parse_component_doc(path: Path, file_doc: FileDoc) -> ComponentDoc | None:
    text = read_text(path)
    if not text:
        return None
    kind = "component" if "@Component" in text else "service" if "@Injectable" in text else "directive" if "@Directive" in text else "pipe" if "@Pipe" in text else ""
    if not kind:
        return None
    class_match = re.search(r"export\s+class\s+([A-Za-z0-9_]+)|class\s+([A-Za-z0-9_]+)", text)
    class_name = (class_match.group(1) or class_match.group(2)) if class_match else path.stem
    selector = (re.search(r"selector:\s*['\"]([^'\"]+)['\"]", text) or [None, ""])[1]
    template_url = (re.search(r"templateUrl:\s*['\"]([^'\"]+)['\"]", text) or [None, ""])[1]
    style_urls = re.findall(r"styleUrls?:\s*(?:\[)?\s*['\"]([^'\"]+)['\"]", text)
    standalone = (re.search(r"standalone:\s*(true|false)", text) or [None, ""])[1]
    imports_block = re.search(r"imports:\s*\[([^\]]*)\]", text, re.S)
    imports = []
    if imports_block:
        imports = [compact(x.strip(), 80) for x in imports_block.group(1).replace("\n", " ").split(",") if x.strip()]
    constructor = re.search(r"constructor\s*\((.*?)\)", text, re.S)
    injected = []
    if constructor:
        injected = re.findall(r"(?:private|public|protected)\s+([A-Za-z0-9_]+)\s*:\s*([A-Za-z0-9_]+)", constructor.group(1))
        injected = [f"{name}: {typ}" for name, typ in injected]
    inputs = re.findall(r"@Input\([^)]*\)\s*([A-Za-z0-9_]+)|\breadonly\s+([A-Za-z0-9_]+)\s*=\s*input", text)
    outputs = re.findall(r"@Output\([^)]*\)\s*([A-Za-z0-9_]+)|\b([A-Za-z0-9_]+)\s*=\s*output", text)
    input_names = [a or b for a, b in inputs]
    output_names = [a or b for a, b in outputs]
    properties = re.findall(r"^\s*(?:public |private |protected |readonly )?([A-Za-z_][A-Za-z0-9_]*)\s*(?::[^=;]+)?\s*=", text, re.M)
    template_path = path.parent / template_url if template_url else None
    template_text = read_text(template_path) if template_path and template_path.exists() else ""
    data_testids = re.findall(r"data-testid=['\"]([^'\"]+)['\"]", template_text)[:80]
    router_links = re.findall(r"\[?routerLink\]?=['\"]([^'\"]+)['\"]", template_text)[:80]
    events = re.findall(r"\(([A-Za-z0-9_.-]+)\)=", template_text)[:80]
    summary = file_doc.summary
    if kind == "component" and template_text:
        summary += f" Template has {len(data_testids)} data-testid markers and {len(events)} event bindings."
    return ComponentDoc(
        path=rel(path),
        class_name=class_name,
        kind=kind,
        selector=selector,
        template_url=template_url,
        style_urls=style_urls,
        standalone=standalone or "unspecified",
        imports=imports[:80],
        injected_services=injected[:80],
        inputs=input_names[:80],
        outputs=output_names[:80],
        methods=file_doc.methods[:120],
        properties=properties[:120],
        template_data_testids=data_testids,
        template_router_links=router_links,
        template_events=events,
        summary=summary,
    )


def matching_brace_end(text: str, start: int) -> int:
    quote = ""
    escape = False
    depth = 0
    for index in range(start, len(text)):
        char = text[index]
        if quote:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == quote:
                quote = ""
            continue
        if char in {"'", '"', "`"}:
            quote = char
            continue
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return index
    return len(text) - 1


def enclosing_object_block(text: str, position: int) -> str:
    quote = ""
    escape = False
    stack: list[int] = []
    for index, char in enumerate(text[: position + 1]):
        if quote:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == quote:
                quote = ""
            continue
        if char in {"'", '"', "`"}:
            quote = char
            continue
        if char == "{":
            stack.append(index)
        elif char == "}" and stack:
            stack.pop()
    if not stack:
        return text[max(0, position - 300): min(len(text), position + 500)]
    start = stack[-1]
    end = matching_brace_end(text, start)
    return text[start: end + 1]


def top_level_property_value(block: str, key: str) -> str:
    quote = ""
    escape = False
    depth = 0
    index = 0
    pattern = key + ":"
    while index < len(block):
        char = block[index]
        if quote:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == quote:
                quote = ""
            index += 1
            continue
        if char in {"'", '"', "`"}:
            quote = char
            index += 1
            continue
        if char in "{[":
            depth += 1
            index += 1
            continue
        if char in "}]":
            depth -= 1
            index += 1
            continue
        if depth == 1 and block.startswith(pattern, index):
            start = index + len(pattern)
            return read_top_level_value(block, start)
        index += 1
    return ""


def read_top_level_value(block: str, start: int) -> str:
    quote = ""
    escape = False
    depth = 0
    value_start = start
    while value_start < len(block) and block[value_start].isspace():
        value_start += 1
    for index in range(value_start, len(block)):
        char = block[index]
        if quote:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == quote:
                quote = ""
            continue
        if char in {"'", '"', "`"}:
            quote = char
            continue
        if char in "{[(":
            depth += 1
            continue
        if char in "}])":
            if depth == 0:
                return block[value_start:index].strip()
            depth -= 1
            continue
        if char == "," and depth == 0:
            return block[value_start:index].strip()
    return block[value_start:].strip().rstrip("}")


def clean_route_property(value: str, kind: str) -> str:
    if not value:
        return ""
    value = value.strip()
    if kind == "data" and value.startswith("{") and value.endswith("}"):
        value = value[1:-1]
    if kind == "redirect" and len(value) >= 2 and value[0] in {"'", '"'} and value[-1] == value[0]:
        value = value[1:-1]
    return compact(value, 200)


def angular_routes(path: Path) -> list[dict[str, str]]:
    text = read_text(path)
    routes = []
    for match in re.finditer(r"path:\s*['\"]([^'\"]*)['\"]", text):
        chunk = enclosing_object_block(text, match.start())
        load = top_level_property_value(chunk, "loadComponent")
        redirect = top_level_property_value(chunk, "redirectTo")
        data = top_level_property_value(chunk, "data")
        routes.append(
            {
                "path": match.group(1),
                "line": str(text[: match.start()].count("\n") + 1),
                "load_component": clean_route_property(load, "load"),
                "redirect_to": clean_route_property(redirect, "redirect"),
                "data": clean_route_property(data, "data"),
            }
        )
    return routes


def write_backend_api(endpoints: list[EndpointDoc]) -> None:
    by_file: dict[str, list[EndpointDoc]] = defaultdict(list)
    for endpoint in endpoints:
        by_file[endpoint.source.split(":")[0]].append(endpoint)
    lines = [
        "(backend-api-reference)=",
        "",
        "# Backend API Reference",
        "",
        "This reference is generated from FastAPI route decorators in `backend/routes`. It lists each discovered endpoint, handler, request model hints, dependencies, roles, licenses, system settings, and return targets visible from static analysis.",
        "",
        f"Generated endpoint count: **{len(endpoints)}**.",
        "",
        "## Endpoint Summary",
        "",
        "| Method | Path | Handler | Source | Roles | Licenses | Settings |",
        "| --- | --- | --- | --- | --- | --- | --- |",
    ]
    for e in endpoints:
        lines.append(
            f"| `{e.method}` | `{e.path}` | `{e.function}` | `{e.source}` | {', '.join(e.roles) or '-'} | {', '.join(e.licenses) or '-'} | {', '.join(e.settings) or '-'} |"
        )
    lines.extend(["", "## Endpoint Details", ""])
    for source, entries in by_file.items():
        lines.extend([f"### `{source}`", ""])
        for e in entries:
            lines.extend(
                [
                    f"#### `{e.method} {e.path}`",
                    "",
                    f"- **Handler:** `{e.signature}`",
                    f"- **Source:** `{e.source}`",
                    f"- **Summary:** {e.summary or '-'}",
                    f"- **Description:** {e.description or '-'}",
                    f"- **Request models:** {', '.join(f'`{m}`' for m in e.request_models) or '-'}",
                    f"- **Roles:** {', '.join(f'`{r}`' for r in e.roles) or '-'}",
                    f"- **Licenses:** {', '.join(f'`{l}`' for l in e.licenses) or '-'}",
                    f"- **Settings:** {', '.join(f'`{s}`' for s in e.settings) or '-'}",
                    f"- **Include in schema:** `{e.include_in_schema}`",
                    f"- **Dependencies:** {', '.join(f'`{d}`' for d in e.dependencies) or '-'}",
                    f"- **Return expressions:** {', '.join(f'`{r}`' for r in e.returns) or '-'}",
                    "",
                ]
            )
    (DOCS_DIR / "backend_api_reference.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_frontend_reference(components: list[ComponentDoc], route_entries: list[dict[str, str]]) -> None:
    by_kind: dict[str, list[ComponentDoc]] = defaultdict(list)
    for component in components:
        by_kind[component.kind].append(component)
    lines = [
        "(frontend-source-reference)=",
        "",
        "# Frontend Source Reference",
        "",
        "This reference is generated from Angular route declarations, component metadata, injectable metadata, and HTML templates under `client/src/app`.",
        "",
        f"Generated Angular route entries: **{len(route_entries)}**.",
        f"Generated Angular artifacts: **{len(components)}**.",
        "",
        "## Angular Route Entries",
        "",
        "| Path | Line | Load Component | Redirect | Data |",
        "| --- | ---: | --- | --- | --- |",
    ]
    for route in route_entries:
        lines.append(
            f"| `{route['path']}` | {route['line']} | `{route['load_component'] or '-'}` | `{route['redirect_to'] or '-'}` | `{route['data'] or '-'}` |"
        )
    for kind in sorted(by_kind):
        entries = sorted(by_kind[kind], key=lambda c: c.path)
        lines.extend(["", f"## {kind.title()}s", ""])
        lines.extend(["| Class | Selector | Source | Template | Injected Services |", "| --- | --- | --- | --- | --- |"])
        for c in entries:
            lines.append(
                f"| `{c.class_name}` | `{c.selector or '-'}` | `{c.path}` | `{c.template_url or '-'}` | {', '.join(f'`{s}`' for s in c.injected_services[:6]) or '-'} |"
            )
        lines.append("")
        for c in entries:
            lines.extend(
                [
                    f"### `{c.class_name}`",
                    "",
                    f"- **Kind:** `{c.kind}`",
                    f"- **Source:** `{c.path}`",
                    f"- **Selector:** `{c.selector or '-'}`",
                    f"- **Template:** `{c.template_url or '-'}`",
                    f"- **Styles:** {', '.join(f'`{s}`' for s in c.style_urls) or '-'}",
                    f"- **Standalone:** `{c.standalone}`",
                    f"- **Summary:** {c.summary}",
                    f"- **Imports:** {', '.join(f'`{i}`' for i in c.imports[:15]) or '-'}",
                    f"- **Injected services:** {', '.join(f'`{s}`' for s in c.injected_services) or '-'}",
                    f"- **Inputs:** {', '.join(f'`{i}`' for i in c.inputs) or '-'}",
                    f"- **Outputs:** {', '.join(f'`{o}`' for o in c.outputs) or '-'}",
                    f"- **Properties:** {', '.join(f'`{p}`' for p in c.properties[:25]) or '-'}",
                    f"- **Methods:** {', '.join(f'`{m}`' for m in c.methods[:35]) or '-'}",
                    f"- **Template data-testid markers:** {', '.join(f'`{t}`' for t in c.template_data_testids[:40]) or '-'}",
                    f"- **Template router links:** {', '.join(f'`{r}`' for r in c.template_router_links[:25]) or '-'}",
                    f"- **Template events:** {', '.join(f'`{e}`' for e in c.template_events[:35]) or '-'}",
                    "",
                ]
            )
    (DOCS_DIR / "frontend_source_reference.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_inventory(files: list[FileDoc]) -> None:
    data = {
        "schema_version": "1.0",
        "description": "Generated source file inventory for maintainable Orion source roots. Large generated assets, dependency directories, build outputs, and caches are excluded.",
        "file_count": len(files),
        "files": [asdict(f) for f in files],
    }
    (DOCS_DIR / "source_file_inventory.json").write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    by_area: dict[str, list[FileDoc]] = defaultdict(list)
    for f in files:
        area = f.path.split("/", 1)[0]
        if f.path.startswith("client/src/app"):
            area = "client/src/app"
        elif f.path.startswith("backend/orion"):
            area = "backend/orion"
        elif f.path.startswith("backend/routes"):
            area = "backend/routes"
        elif f.path.startswith("backend/tests"):
            area = "backend/tests"
        elif f.path.startswith("docs/"):
            area = "docs"
        by_area[area].append(f)
    kind_counts = Counter(f.kind for f in files)
    lines = [
        "(source-file-inventory)=",
        "",
        "# Source File Inventory",
        "",
        "This inventory is generated from maintainable source roots. It intentionally excludes dependency folders, build output, caches, and generated bundles. Static binary assets are summarized by nearby source references rather than expanded as implementation files.",
        "",
        f"Inventory file count: **{len(files)}**.",
        "",
        "## Counts By Kind",
        "",
        "| Kind | Count |",
        "| --- | ---: |",
    ]
    for kind, count in kind_counts.most_common():
        lines.append(f"| {kind} | {count} |")
    lines.extend(["", "## Files", ""])
    for area in sorted(by_area):
        lines.extend([f"### `{area}`", ""])
        for f in sorted(by_area[area], key=lambda item: item.path):
            details = []
            if f.classes:
                details.append("classes: " + ", ".join(f.classes[:6]))
            if f.functions:
                details.append("functions: " + ", ".join(f.functions[:8]))
            if f.selectors:
                details.append("selectors: " + ", ".join(f.selectors[:6]))
            if f.routes:
                details.append("routes: " + ", ".join(f.routes[:6]))
            if f.api_paths:
                details.append("api: " + ", ".join(f.api_paths[:6]))
            detail_text = "; ".join(details) if details else "-"
            lines.extend(
                [
                    f"#### `{f.path}`",
                    "",
                    f"- **Kind:** {f.kind}",
                    f"- **Size:** {f.bytes} bytes, {f.lines} lines",
                    f"- **Summary:** {f.summary}",
                    f"- **Details:** {detail_text}",
                    "",
                ]
            )
    (DOCS_DIR / "source_file_inventory.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_project_reference(files: list[FileDoc], endpoints: list[EndpointDoc], components: list[ComponentDoc]) -> None:
    kind_counts = Counter(f.kind for f in files)
    area_counts = Counter(
        "client" if f.path.startswith("client/") else "backend" if f.path.startswith("backend/") else "docs" if f.path.startswith("docs/") else "root"
        for f in files
    )
    lines = [
        "(full-project-reference)=",
        "",
        "# Full Project Reference",
        "",
        "This generated reference gives a source-level map of the Orion repository. It is intended as the entry point for developers and LLM retrieval systems that need to understand the entire maintainable codebase.",
        "",
        "## Generated Reference Set",
        "",
        "- `feature_help_knowledge_base.md`: primary assistant-facing user navigation and feature workflow guide.",
        "- `application_feature_guide.md`: user-facing feature guide with routes, prerequisites, and steps.",
        "- `feature_catalog.json`: structured feature catalog for LLM/RAG retrieval.",
        "- `swagger_api_reference.md`: `/docs` and `/openapi.json` exposed API reference with request and response samples.",
        "- `backend_api_reference.md`: FastAPI endpoint reference generated from decorators.",
        "- `frontend_source_reference.md`: Angular route, component, service, directive, and template reference.",
        "- `source_file_inventory.md`: per-file source inventory.",
        "- `source_file_inventory.json`: machine-readable source inventory.",
        "",
        "## Coverage Summary",
        "",
        f"- Source files inventoried: **{len(files)}**",
        f"- Backend API endpoints discovered: **{len(endpoints)}**",
        f"- Angular artifacts discovered: **{len(components)}**",
        "",
        "## Counts By Area",
        "",
        "| Area | Files |",
        "| --- | ---: |",
    ]
    for area, count in area_counts.most_common():
        lines.append(f"| {area} | {count} |")
    lines.extend(["", "## Counts By File Kind", "", "| Kind | Files |", "| --- | ---: |"])
    for kind, count in kind_counts.most_common():
        lines.append(f"| {kind} | {count} |")
    lines.extend(
        [
            "",
            "## Backend Architecture Map",
            "",
            "- `backend/routes`: FastAPI routers and public route entry points.",
            "- `backend/configs`: authentication, role, status, license, limiter, Swagger, and exception wiring.",
            "- `backend/orion/api/interactive`: user-facing managers for search, account, alert, tenant, graph, feeder, feedback, signup, payment, directory, and homepage workflows.",
            "- `backend/orion/api/server`: server-side crawl, config, and entity managers used by route handlers and ingestion callbacks.",
            "- `backend/orion/services`: infrastructure services for Mongo, Elastic, Arango, Redis, sessions, encryption, mail, STIX, and logging.",
            "- `backend/orion/middleware`: security headers, service readiness, content policy, and admin cache middleware.",
            "- `backend/migrations`: migration runner and migration scripts.",
            "- `backend/tests`: pytest coverage for services, pages, auth, search, routes, and fake model helpers.",
            "",
            "## Frontend Architecture Map",
            "",
            "- `client/src/app/app.routes.ts`: Angular route tree and lazy component loading.",
            "- `client/src/app/pages`: dashboard pages, graph pages, scans, login/signup/onboarding, profile, tenant, dump, credentials, and AI workspace surfaces.",
            "- `client/src/app/sections/report`: report templates and report social-interaction widgets.",
            "- `client/src/app/shared`: reusable models, guards, resolvers, directives, partials, services, icons, styles, and constants.",
            "- `client/src/app/services`: application state, dashboard/search state, auth, alerts, audit logs, license checks, export, directory, and notifications.",
            "- `client/cypress`: end-to-end tests, controllers, fixtures, and support helpers.",
            "",
            "## How To Use This Documentation With An LLM",
            "",
            "1. Use `feature_help_knowledge_base.md` first for user questions about where to go or how to use a feature.",
            "2. Use `feature_catalog.json` for structured retrieval, alias matching, and RAG indexing.",
            "3. Use `swagger_api_reference.md` for API requests that appear in the live `/docs` Swagger UI.",
            "4. Use `backend_api_reference.md` for broader backend route/source access, roles, license, and settings questions.",
            "5. Use `frontend_source_reference.md` for UI component, route, and template behavior questions.",
            "6. Use `source_file_inventory.json` to locate files by class, function, selector, route, or API path.",
            "7. Use `source_file_inventory.md` when a human-readable source map is needed.",
            "",
            "## Known Limits",
            "",
            "This is static documentation. It reports code structure and direct strings from source files. It does not execute every runtime path, infer dynamic authorization from every helper, or expand minified/generated bundles and binary assets as implementation files.",
            "",
        ]
    )
    (DOCS_DIR / "full_project_reference.md").write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    paths = iter_source_files()
    files = [document_file(path) for path in paths]
    path_by_name = {f.path: f for f in files}
    endpoints = endpoint_docs(paths)
    components = []
    for path in paths:
        if path.suffix == ".ts":
            file_doc = path_by_name.get(rel(path))
            if file_doc:
                component = parse_component_doc(path, file_doc)
                if component:
                    components.append(component)
    route_entries = angular_routes(REPO_ROOT / "client/src/app/app.routes.ts")
    write_backend_api(endpoints)
    write_frontend_reference(sorted(components, key=lambda c: (c.kind, c.path)), route_entries)
    write_inventory(files)
    write_project_reference(files, endpoints, components)
    print(json.dumps({
        "files": len(files),
        "endpoints": len(endpoints),
        "angular_artifacts": len(components),
        "route_entries": len(route_entries),
    }, indent=2))


if __name__ == "__main__":
    main()
