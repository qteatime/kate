``*_input`` — Reacting to player input
======================================

Kate supports multiple input sources, such as the Kate gamepad and pointer
input. Each of these input sources has a distinct API exposed, and this
section describes all of the different input APIs.


State updates
-------------

Input states are updated from the Kate Kernel by sending messages to
the cartridge process. They are then synchronised using the
:py:mod:`Timer API <KateAPI.timer>`, which ticks at 30 FPS. This means
that the best way to read button states is to schedule your updates using
the Timer API as well, otherwise APIs like :py:func:`is_just_released` will
have no defined meaning.

For example, if you're using
`requestAnimationFrame <https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame>`_
to update your game, then querying the button state might end up reporting
that a button was "just pressed" or "just released" multiple frames in
a row:

.. code-block:: javascript
  :caption: Non-recommended way of interacting with the input APIs.
  
  function update() {
    if (KateAPI.input.is_just_pressed("menu")) {
      show_menu_screen();
    } else if (KateAPI.input.is_just_pressed("o")) {
      next_dialogue();
    }

    requestAnimationFrame(update);
  }

  // Don't do this, input states will not have been properly updated when
  // your function is called!
  requestAnimationFrame(update);

Instead, use the Timer API to schedule your updates:

.. code-block:: javascript
  
  KateAPI.timer.on_tick.listen(time => {
    if (KateAPI.input.is_just_pressed("menu")) {
      show_menu_screen();
    } else if (KateAPI.input.is_just_pressed("o")) {
      next_dialogue();
    }
  });

Alternatively, instead of pulling input states in your update function,
you can have them pushed to your cartridge code by listening to input state
change events. This method requires no synchronisation with the Kate timer
since all changes are propagated as discrete events, but requires you
to write your code in an event-driven manner.

For example:

.. code-block:: javascript

  KateAPI.input.on_key_pressed.listen(key => {
    if (key === "menu") {
      show_menu_screen();
    } else if (key === "o") {
      next_dialogue();
    }
  });


Kate buttons (``input``)
------------------------

.. py:module:: KateAPI.input
   :synopsis: React to buttons pressed in the Kate gamepad.

The Kate buttons API (``input``) allows a cartridge to react to buttons pressed
in the standard Kate gamepad. This gamepad is made out of:

* A four-directions D-pad (|btn_dpad|);
* Two face buttons: |btn_ok| *(Ok)* and |btn_cancel| *(Cancel)*;
* Two analog shoulder triggers: |btn_l| and |btn_r|; and
* Two special buttons: |btn_capture_text| and |btn_menu_text|.

Although your cartridge reacts to these Kate buttons, a player may be
interacting with it through other means. E.g.: players running a Kate
emulator on a PC might be interacting with your cartridge through a
keyboard. Whereas players running a Kate emulator on a phone might
be interacting with your cartridge through virtual buttons using their
touch screen. In all cases the Kate emulator translates these distinct
input sources into Kate button presses, so you don't need to be aware
of them.


Pause state
'''''''''''

When the player brings up the context menu, Kate considers the game
paused and will not forward any input to the cartridge during this
period. That lasts until the cartridge goes back to running in the
foreground.

This state is readable from the input API and can be used by the
cartridge to avoid updating other game entities while the player
is not actively interacting with it.


.. py:property:: is_paused
   :type: boolean

   Returns whether the cartridge is in a "paused" state, where the
   Kate Kernel will not be forwarding input to it because it's not
   the application currently in the foreground.

   .. rubric:: Example

   .. code-block:: javascript

      function update(lag) {
        if (!KateAPI.input.is_paused) {
          player.update(lag);
          for (const enemy of enemies) {
            enemy.update(lag);
          }
        }
      }


Button identifiers
''''''''''''''''''

.. py:class:: InputKey

Each button in the Kate gamepad is identified by a unique string. These are
referred to as ``InputKey`` below:

================  =====================================
Button            Identifier
================  =====================================
|btn_ok|          ``o``
|btn_cancel|      ``x``
|btn_dpad|        ``up``, ``right``, ``down``, ``left``
|btn_l|           ``ltrigger``
|btn_r|           ``rtrigger``
|btn_menu|        ``menu`` and ``long_menu``
|btn_capture|     ``capture`` and ``long_capture``
================  =====================================

|btn_menu| and |btn_capture| are special in that Kate distinguishes between
a short and long press. This also means that state changes for these buttons
is delayed until the player releases the button, so Kate can decide whether
to report that as a "short" or "long" press.

Other buttons do not have a concept of "long press", but may be considered
repeat presses if the player presses the button and doesn't release it
for a long period of time.


Events
''''''

The input API provides two events for discrete changes to the button
states. These are forwarded directly from the Kate Kernel and propagated
to any listener in the cartridge.


.. py:property:: on_key_pressed
   :type: EventStream(InputKey)

   Emitted whenever the player presses a button, without delay. Therefore
   it does not distinguish between short and long presses.

   The data in the event is a string containing one of the :ref:`button identifiers`.


.. py:property:: on_extended_key_pressed
   :type: EventStream({key: InputKey, is_repeat: boolean})

   Emitted when the player presses a button (or in the case of
   |btn_menu| and |btn_capture|, when the player releases the button).

   This event distinguishes between short and long presses, which means that
   there will be a delay to report presses to |btn_menu| and |btn_capture|.
   And other buttons may have events firing multiple times while the player
   is holding down the button—e.g.: holding down |btn_ok| for several seconds
   would cause multiple events to be emitted with the identifier ``o``. The
   first one would have ``is_repeat`` set to false, whereas the subsequent
   ones would have ``is_repeat`` set to true.


Querying button states
''''''''''''''''''''''

Button states are updated at 30 FPS. If you're looking to query them in your
game you'll need to make sure you're using the :py:mod:`Timer API <KateAPI.timer>`
to keep your update loop synchronised with Kate's button state updates, otherwise
the functions will have no defined meaning and you might find that the controls
for your game fail randomly.


.. py:function:: is_pressed(key: InputKey) -> boolean
   
   :param InputKey key: The button (one of the :ref:`button identifiers`) to test.
   :returns: Whether the button is pressed at this point in time.
   :rtype: boolean

   Tests whether the button is pressed at this point in time. This function
   does not require strong synchronisation, since the main thread cannot
   have concurrent modifications to the button states.


.. py:function:: frames_pressed(key: InputKey) -> number
   
   :param InputKey key: The button (one of the :ref:`button identifiers`) to query.
   :returns: The number of frames (according to :py:mod:`KateAPI.timer`) the button has been pressed for.
   :rtype: number

   Returns the number of frames that the button has been held down, fully
   pressed. This is according to the Timer API, so you must synchronise your
   queries using the same API for the return value to make sense.


.. py:function:: is_just_pressed(key: InputKey) -> boolean

   :param InputKey key: The button (one of the :ref:`button identifiers`) to query.
   :returns: Whether the button was pressed *this* frame.
   :rtype: boolean

   Returns whether the button was pressed this exact frame, according to the
   :py:mod:`KateAPI.timer`. You must synchronise your queries with the Timer API.


.. py:function:: is_just_released(key: InputKey) -> boolean
   
   :param InputKey key: The button (one of the :ref:`button identifiers`) to query.
   :returns: Whether the button was released *this* frame.
   :rtype: boolean

   Returns whether the button was released this exact frame, according to the
   :py:mod:`KateAPI.timer`. You must synchronise your queries with the Timer API.


Pointer input (``pointer_input``)
---------------------------------

.. py:module:: KateAPI.pointer_input
  :synopsis: React to pointer (such as mouse) events.

The Pointer API (``pointer_input``) allows a cartridge to react to pointer
events that happen when the cartridge is the foreground application (i.e.:
when the player is actively interacting with it).

A pointer event can come from many different input devices, the most common
one being a mouse. But touch input and pen/stylus devices also generate
pointer events. The design takes after the :term:`DOM pointer events`.
That is, pointing devices are anything that can target some coordinate on
the screen, and the pointer API provides ways to react to this pointer
moving or touching/parting from the screen.

.. note::

  Currently the pointer API does not support pen pressure, tilt, and other
  more complex properties, but they're planned for a future revision.

  The Kate pointer API only supports one active pointer. That is, there is
  only one coordinate in the screen that the pointing device can be pointing
  at at any given time.


Pointer location
''''''''''''''''

Pointing devices allow the player to target specific coordinates of the
screen, which they do so by moving a "pointer" around. For example, a
player using a mouse can move the mouse around to change where the
pointer in the screen points at. A player using a trackpad can do the
same by sliding their finger around the pad. All of these movements
generate discrete pointer movement events and update the current
location of the pointer.

For example, a cartridge that wishes to change how a button on the
screen looks when the player moves the pointer on top of it could do
so as follows:

.. code-block:: javascript

  const button = {
    color: "#ccc",
    left: 100,
    top: 100,
    right: 200,
    bottom: 200
  };

  KateAPI.timer.on_tick.listen(time => {
    const pointer = KateAPI.pointer.location;
    if (
      pointer.x >= button.left && pointer.x <= button.right &&
      pointer.y >= button.top && pointer.y <= button.bottom
    ) {
      button.color = "#039";
    } else {
      button.color = "#ccc";
    }

    const canvas = document.querySelector("#canvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 300, 300);
    ctx.fillStyle = button.color;
    ctx.fillRect(button.left, button.top, button.right - button.left, button.bottom - button.top);
  });


Types
"""""

.. py:class:: PointerLocation

  Represents the coordinates of the pointer on the cartridge screen.

  .. py:property:: x
    :type: number

    The horizontal position of the pointer on the cartridge screen, in pixels.

  .. py:property:: y
    :type: number

    The vertical position of the pointer on the cartridge screen, in pixels.


Events
""""""

Discrete events are emitted whenever a pointer changes. While the events
are still throttled at 30 FPS, your cartridge can build its own synchronisation
when handling them.


.. py:property:: on_moved
  :type: EventStream(PointerLocation)

  Emitted whenever the position of the pointer on the screen changes.


Querying state
""""""""""""""

The state is updated at 30 FPS, so you'll need to use the :py:mod:`KateAPI.timer`
API to synchronise your updates with the input state updates to be able to
get something sensible out of the data.


.. py:property:: x
  :type: number

  The horizontal position of the pointer in the cartridge screen, in pixels.

.. py:property:: y
  :type: number

  The vertical position of the pointer in the cartridge screen, in pixels.

.. py:property:: location
  :type: PointerLocation

  The horizontal and vertical position of the pointer in the cartridge
  screen, in pixels.


Pointer buttons
'''''''''''''''

A pointing device can have one or more buttons, whith the player can then
press. When they do so Kate will provide events on which button was pressed
along with the coordinate where the pointer was at the time.

For example, when using a mouse the player can move the pointer around
the screen and then press the primary mouse button (say the left button). The game can then
interpret this as the player wishing to paint that coordinate on the screen.
It may react similarly if the player touches the screen at that
point, or presses the stylus against a digitizer.

But players can press a secondary mouse button (say the right button) as well.
In this case a game may decide to interpret this action by showing a
context menu instead of painting that location.

.. code-block:: javascript

  const canvas = document.querySelector("#canvas");
  const ctx = canvas.getContext("2d");

  KateAPI.pointer_input.on_clicked.listen(event => {
    ctx.fillRect(event.location.x, event.location.y, 1, 1);
  })

  KateAPI.pointer_input.on_alternate.listen(event => {
    show_context_menu();
  });

Types
"""""

.. py:class:: PointerClick
  
  Represents the click of a button at a particular pointer coordinate.

  .. py:property:: location
    :type: PointerLocation

    The coordinates where the pointer was at the time the click happened.

  .. py:property:: button
    :type: number

    The button that was pressed. This is the same constant used by
    the :term:`DOM pointer events`, and can be one of:

    ===== ======================================
    Id    Description
    ===== ======================================
    ``0`` Left mouse, touch contact, pen contact
    ``1`` Middle mouse
    ``2`` Right mouse, pen barrel button
    ``3`` X1 (back) mouse
    ``4`` X2 (forward) mouse
    ``5`` Pen eraser button
    ===== ======================================

Events
""""""

Discrete events are emitted whenever the state of a button in the pointing
device changes. These are throttled at 30 FPS, but your cartridge can build
your own synchronisation when listening to them.

.. py:property:: on_clicked
  :type: EventStream(PointerClick)

  Emitted whenever the primary pointer button is pressed.

.. py:property:: on_alternate
  :type: EventStream(PointerClick)

  Emitted whenever the alternate pointer button is pressed
  (e.g.: right mouse button).

.. py:property:: on_down
  :type: EventStream(PointerClick)

  Emitted whenever one of the pointer buttons is pressed. You can use the
  :py:attr:`PointerClick.button` property to distinguish which button was
  pressed.

.. py:property:: on_up
  :type: EventStream(PointerClick)

  Emitted whenever one of the pointer buttons is released. You can use the
  :py:attr:`PointerClick.button` property to distinguish which button was
  released.


Querying state
""""""""""""""

Button states update at 30 FPS. In order to query them you'll need to
synchronise your calls with the :py:mod:`KateAPI.timer` API.

.. py:function:: frames_pressed(button: number) -> number

  :param number button: The identifier of the button to query.
  :returns: The number of frames the button has been pressed for.
  :rtype: number

  Returns the number of frames the button has been pressed for.

.. py:function:: is_pressed(button: number) -> boolean

  :param number button: The identifier of the button to query.
  :returns: Whether the button is pressed right now.
  :rtype: boolean

  True if the button is pressed at all at the time this is called. This
  call does not have to be synchronised with the Timer API.

.. py:function:: is_just_pressed(button: number) -> boolean

  :param number button: The identifier of the button to query.
  :returns: Whether the button was pressed this frame.
  :rtype: boolean

  True if the button was pressed during this frame. This only makes sense
  if your update function is synchronised with the Timer API.

.. py:function:: is_just_released(button: number) -> boolean

  :param number button: The identifier of the button to query.
  :returns: Whether the button was released this frame.
  :rtype: boolean

  True if the button was released during this frame. This only makes sense
  if your update function is synchronised with the Timer API.
