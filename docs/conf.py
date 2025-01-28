project = "Orion Platform Documentation"
author = "Your Name or Team"
release = "1.0"

extensions = [
    "sphinx.ext.autodoc",
    "sphinx.ext.napoleon",
    "sphinx.ext.viewcode",
]

templates_path = ["_templates"]
exclude_patterns = []

html_theme = "sphinx_rtd_theme"

html_logo = "https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/Logo-orion-Intelligence.png"

html_theme_options = {
    "logo_only": True,
    "style_nav_header_background": "#002B36",
}

html_static_path = ["_static"]

html_sidebars = {
    "**": [
        "globaltoc.html",
        "relations.html",
        "searchbox.html",
    ]
}
