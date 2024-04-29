Capture canvas
==============

Automatically sets up Kate's :py:mod:`Capture API <KateAPI.capture>` to
record a specific canvas in the cartridge's process. When setting up the
bridge you must also provide the canvas to be the target of screenshots and
video captures.


Using in your build configuration
---------------------------------

To add this bridge to your cartridge you specify the following in your
``kate.json`` configuration:

.. code-block:: json

  {
    "bridges": [
      {
        "type": "capture-canvas",
        "selector": "#canvas"
      }
    ]
  }

The ``selector`` is a :term:`CSS selector` that must resolve to a canvas element
when the page is loaded. Kate will poll for this selector for up to 1 minute,
so dynamically inserted canvases will still be found, granted they're added
to the page in a timely manner.


How it works
------------

This bridge just gets a reference to the canvas pointed by the configuration
and passes that reference to :py:func:`KateAPI.capture.set_root`. Kate's
capture API handles everything else.