# Configuration file for the Sphinx documentation builder.
#
# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information

project = 'Kate'
copyright = '2023-2024, Niini'
author = 'Niini'
release = "0.25.3"

# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

extensions = [
  "sphinx.ext.todo",
  "sphinx.ext.extlinks"
]

templates_path = ['_templates']
exclude_patterns = []

rst_epilog = """
.. |btn_berry| image:: /icons/berry_32.png
   :height: 1em
   :alt: Berry button
   :align: middle

.. |btn_cancel| image:: /icons/cancel_32.png
   :height: 1em
   :alt: Cancel button (a.k.a. X)
   :align: middle

.. |btn_capture| image:: /icons/capture_32.png
   :height: 1em
   :alt: Capture button
   :align: middle

.. |btn_dpad| image:: /icons/dpad_32.png
   :height: 1em
   :alt: D-Pad
   :align: middle

.. |btn_l| image:: /icons/l_32.png
   :height: 1em
   :alt: Left shoulder button
   :align: middle

.. |btn_menu| image:: /icons/menu_32.png
   :height: 1em
   :alt: Menu button
   :align: middle

.. |btn_ok| image:: /icons/ok_32.png
   :height: 1em
   :alt: Ok button (a.k.a. O)
   :align: middle

.. |btn_r| image:: /icons/r_32.png
   :height: 1em
   :alt: Right shoulder button
   :align: middle

.. |btn_sparkle| image:: /icons/sparkle_32.png
   :height: 1em
   :alt: Sparkle button
   :align: middle

.. |btn_berry_text| replace:: |btn_berry| *(Berry button)*

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
  "source_directory": "docs/source"
}

pygments_style = "colorful"

python_display_short_literal_types = True