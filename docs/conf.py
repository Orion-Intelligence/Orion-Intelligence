# Configuration file for Sphinx documentation builder.

# -- Project information -----------------------------------------------------
project = 'Orion Documentation'
author = 'Abdul Mannan'
release = '1.0.0'

# -- General configuration ---------------------------------------------------
extensions = ['myst_parser']
source_suffix = ['.rst', '.md']
master_doc = 'index'
html_theme = 'shibuya'

# -- Options for HTML output -------------------------------------------------
html_static_path = ['_static']

# -- Options for themes -------------------------------------------------
html_theme_options = {
    "color_mode": "dark",
}

# -- Custom css -------------------------------------------------
html_css_files = ["custom.css"]