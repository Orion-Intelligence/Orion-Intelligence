project = "Orion Documentation"
author = "Abdul Mannan"
release = "1.0.3.1"

extensions = [
    "myst_parser",
    "sphinx_design",
]

source_suffix = [".rst", ".md"]
master_doc = "index"
html_theme = "shibuya"
exclude_patterns = [
    "llm_docs/**",
]

myst_enable_extensions = [
    "colon_fence",
]

myst_heading_anchors = 3

html_static_path = ["_static"]

html_theme_options = {
    "color_mode": "dark",
}

html_css_files = [
    "custom.css",
]
