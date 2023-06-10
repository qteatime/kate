Ren'Py tweaks
=============

If you're using Ren'Py, you should add this bridge. It includes emulation and
translation of any Ren'Py-specific feature that cannot be covered by adapting
the Kate runtime environment to be more browser-like. You configure this
bridge by specifying the version of Ren'Py that your cartridge uses.


Using in Kart
-------------

To add this bridge to your cartridge you specify the following in your
``kate.json`` configuration:

.. code-block:: json

  {
    "bridges": [
      {
        "type": "preserve-webgl-render",
        "version": {
          "major": 7,
          "minor": 5
        }
      }
    ]
  }

The ``version`` option describes the Ren'Py version your cartridge uses.
Ren'Py has a ``<major>.<minor>`` public version schema, so for something
like Ren'Py 7.5 you'd specify ``{major: 7, minor: 5}``.


How it works
------------

Currently the only thing this bridge does is hiding the hamburger menu
that Ren'Py includes in the web export. Because players cannot focus or
interact with the cartridge's process directly, and because Kate disables
all navigation in the cartridge, the hamburger menu is unusable.

Kate offers the features that the hamburger menu provides natively, so the
options currently exposed through the hamburger menu are also not necessary,
and are less Kate-user friendly.

Future versions of this bridge will cover remaining needs of both exposing
Kate features to Ren'Py, and supporting special Ren'Py features in Kate
(e.g.: arbitrary text input).
