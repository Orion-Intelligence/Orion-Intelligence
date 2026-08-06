import re
import sys
from pathlib import Path


site, project_name, company_name = map(str, sys.argv[1:])


def slug(value: str, fallback: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-") or fallback


project_slug = slug(project_name, "project")
company_slug = slug(company_name, "company")
replacements = (
    ("Genesis Technologies", company_name),
    ("Genessis Technologies", company_name),
    ("Genesis", company_name),
    ("Genessis", company_name),
    ("Orion Intelligence", project_name),
    ("Orion", project_name),
    ("https://try.orionintelligence.org", "configured production URL"),
    ("/tmp/orion-docs-build", f"/tmp/{project_slug}-docs-build"),
    ("orion", project_slug),
    ("genesis", company_slug),
    ("genessis", company_slug),
)

for path in Path(site).rglob("*"):
    if path.suffix not in {".html", ".js", ".txt"}:
        continue

    content = path.read_text()
    for old, new in replacements:
        content = content.replace(old, new)
    path.write_text(content)
