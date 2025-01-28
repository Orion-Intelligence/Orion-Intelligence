# Configuration file for Sphinx documentation builder.

# -- Project information -----------------------------------------------------
project = 'Orion Documentation'
author = 'Your Name'
release = '1.0.0'

# -- General configuration ---------------------------------------------------
extensions = ['myst_parser']
source_suffix = ['.rst', '.md']
master_doc = 'index'
html_theme = 'sphinx_rtd_theme'

# -- Options for HTML output -------------------------------------------------
html_static_path = ['_static']
