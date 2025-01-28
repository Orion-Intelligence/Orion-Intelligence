project = 'Orion Platform Documentation'
copyright = '2025, Orion'
author = 'Orion Team'

extensions = [
    'sphinx.ext.autodoc',
    'sphinx.ext.napoleon',
    'sphinx.ext.viewcode',
    'sphinx_rtd_theme',
]

templates_path = ['_templates']
exclude_patterns = []

html_theme = 'sphinx_rtd_theme'

html_logo = 'https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/Logo-orion-Intelligence.png'

html_theme_options = {
    'logo_only': True,
    'style_nav_header_background': '#004080',
    'collapse_navigation': False,
    'sticky_navigation': True,
    'navigation_depth': 4,
}

html_static_path = ['_static']
