Pointer input proxy
===================

If your game relies on mouse or pointer events, then you can use the
pointer input proxy to forward translate Kate's
:py:mod:`Pointer Input API <KateAPI.pointer_input>` into regular
DOM mouse and pointer events.

There are two configurations that you need to provide here: one
is the element that receives the events (which might be your
game's canvas). The other is whether the cursor displayed by
the browser should be hidden or not (e.g.: if you're using a
custom cursor in your game).


Using in Kart
-------------

To add this bridge to your cartridge, you specify the following in your
``kate.json`` configuration:

.. code-block:: json

  {
    "bridges": [
      {
        "type": "pointer-input-proxy",
        "selector": "#canvas",
        "hide_cursor": false
      }
    ]
  }

The ``selector`` option is a string containing a CSS selector (with a maximum
of 255 characters). This defines which element should receive the pointer
events.

The ``hide_cursor`` option defines whether the browser will show the default
OS cursor when the pointer moves over the cartridge, or if it will not show
anything. Hiding the cursor is useful if your cartridge has a custom cursor.


Polling
-------

The bridge will try to find an element with the given CSS selector as soon
as the page finishes loading. But it will keep trying to find the element
for up to one minute after that. This allows games where the element is
added dynamically from a script to still work—the bridge will still find
the element to propagate the events to as long as it's added in a timely
manner.


Event emulation
---------------

The bridge works by listening to events from :py:mod:`KateAPI.pointer_input`
and then dispatching an equivalent DOM event for it on the element that
was selected.

The following events are dispatched:

================= ===================================
Kate event        DOM events
================= ===================================
moved             mousemove
down              mousedown
up                mouseup
clicked           click
alternate         contextmenu
================= ===================================

.. note::

  Pointer events are not yet dispatched, because Kate's own pointer API
  is missing important information to recreate them. This will be fixed
  once the Kate pointer API is complete.


Pointer coordinates
-------------------

When this bridge propagates coordinates, it will translate them to the
element that was selected. So an event at ``x = 0, y = 0`` is the top-left
corner of the selected element, not the top-left corner of the screen!