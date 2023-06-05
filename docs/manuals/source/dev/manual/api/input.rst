Reacting to player input
========================

Kate supports multiple input sources, such as the Kate gamepad and pointer
input. Each of these input sources has a distinct API exposed, and this
section describes all of the different input APIs.


Kate buttons
------------

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


State updates
'''''''''''''

Button states are updated from the Kate Kernel by sending messages to
the cartridge process. They are then synchronised using the
:py:mod:`Timer API <KateAPI.timer>`. This means that the best way
to read button states is to schedule your updates using the Timer API
as well, otherwise APIs like :py:func:`is_just_released` will have no
defined meaning.

Alternatively, instead of pulling button states, you can have them
pushed to your cartridge by listening to button state change events.
This method requires no synchronisation with the Kate timer since
all changes are propagated as discrete events.


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

