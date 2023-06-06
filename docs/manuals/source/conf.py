# Configuration file for the Sphinx documentation builder.
#
# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information

project = 'Kate'
copyright = '2023, Q.'
author = 'Q.'
release = "0.23.6"

# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

extensions = [
  "sphinx.ext.todo"
]

templates_path = ['_templates']
exclude_patterns = []

rst_epilog = """
.. |btn_cancel| image:: /icons/cancel_24.png
   :height: 1em
   :alt: Cancel button (a.k.a. X)
   :align: middle

.. |btn_capture| image:: /icons/capture_24.png
   :height: 1em
   :alt: Capture button
   :align: middle

.. |btn_dpad| image:: /icons/dpad_24.png
   :height: 1em
   :alt: D-Pad
   :align: middle

.. |btn_l| image:: /icons/l_24.png
   :height: 1em
   :alt: Left trigger
   :align: middle

.. |btn_menu| image:: /icons/menu_24.png
   :height: 1em
   :alt: Menu button
   :align: middle

.. |btn_ok| image:: /icons/ok_24.png
   :height: 1em
   :alt: Ok button (a.k.a. O)
   :align: middle

.. |btn_r| image:: /icons/r_24.png
   :height: 1em
   :alt: Right trigger
   :align: middle

.. |btn_menu_text| replace:: |btn_menu| *(Menu button)*

.. |btn_capture_text| replace:: |btn_capture| *(Capture button)*

.. |btn_dpad_text| replace:: |btn_dpad| *(D-Pad)*
"""


# -- Options for HTML output -------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#options-for-html-output

html_theme = 'furo'
html_static_path = ['_static']

html_css_files = [
  "css/custom.css"
]

html_theme_options = {
  "announcement": "Both Kate and this documentation are a work in progress and may change at any time.",
  "source_repository": "https://github.com/qteatime/kate",
  "source_branch": "main",
  "source_directory": "docs/manual"
}

pygments_style = "colorful"