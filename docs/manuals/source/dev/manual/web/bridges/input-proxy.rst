Button input proxy
==================

The button input proxy translates input coming from the Kate gamepad into
keyboard keys being pressed in the cartridge process. These are turned
into regular :ref:`DOM keyboard events` dispatched from the :ref:`Window`
or :ref:`Document`.

You configure what keyboard keys each button maps to, however this bridge
only supports mapping one Kate button press to one keyboard key press.


Using in Kart
-------------

To add this bridge to your cartridge, you specify the following in your
``kate.json`` configuration:

.. code-block:: json

  {
    "bridges": [
      {
        "type": "input-proxy",
        "mapping": "defaults"
      }
    ]
  }

The ``mapping`` configuration specifies how Kate buttons are translated
to keyboard key presses. There are pre-defined mappings, such as ``default``,
and the possibility of specifying your own mappings.

To specify your own mapping, you'd write this bridge configuration as follows:

.. code-block:: json

  {
    "bridges": [
      {
        "type": "input-proxy",
        "mapping": {
          "up": "ArrowUp",
          "right": "ArrowRight",
          "down": "ArrowDown",
          "left": "ArrowLeft",
          "x": "Escape",
          "o": "Enter",
          "menu": "ShiftLeft",
          "capture": "ControlLeft",
          "l": "PageUp",
          "r": "PageDown"
        }
      }
    ]
  }


Pre-defined mappings
""""""""""""""""""""

The following pre-defined mappings are available:

``defaults``
''''''''''''

============== ===============================
Button         Keyboard key
============== ===============================
|btn_dpad|     Arrow keys
|btn_cancel|   Escape
|btn_ok|       Enter
|btn_menu|     Left Shift
|btn_capture|  Left Control
|btn_l|        Page Up
|btn_r|        Page Down
============== ===============================

``kate``
''''''''

============== ===============================
Button         Keyboard key
============== ===============================
|btn_dpad|     Arrow keys
|btn_cancel|   X
|btn_ok|       Z
|btn_menu|     Left Shift
|btn_capture|  Left Control
|btn_l|        A
|btn_r|        S
============== ===============================


Keyboard key identifiers
""""""""""""""""""""""""

The supported key identifiers can be seen in Kart's
:download:`keymap.json <../../../../../../../packages/kate-tools/assets/keymap.json>`.


Event emulation
---------------

In order to translate Kate button presses into keyboard key presses, the
bridge dispatches keyboard events on the cartridge's process. It does
so by patching the ``addEventListener`` method of Window and Document
objects.

It handles pause states properly by not forwarding the events while the
cartridge does not have the active focus.

.. note::

  Event listeners added through setters or added on other objects are
  not currently handled. If you need a different patch, please
  `open an issue on GitHub <https://github.com/qteatime/kate/issues>`_
  to discuss your use case.