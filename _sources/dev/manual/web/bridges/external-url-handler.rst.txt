External URL handler
====================

Patches ``window.open`` and other navigation APIs to allow them to be 
opened in a regular browser's window or tab.

.. important::

  Usage of this bridge requires you to request the
  :ref:`Open URLs <open urls capability>` capability.


Using in Kart
-------------

To add this bridge to your cartridge you specify the following in your
``kate.json`` configuration:

.. code-block:: json

  {
    "bridges": [
      {
        "type": "external-url-handler"
      }
    ]
  }