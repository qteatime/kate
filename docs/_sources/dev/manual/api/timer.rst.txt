``timer`` — Scheduling updates
==============================

.. py:module:: KateAPI.timer
  :synopsis: Schedule functions in synchrony with Kate's refresh rate.

Kate updates its internal state at a maximum of 30 FPS, regardless of the
host device capabilities. This is, however, synchronised with the device's
refresh rate and the browser's rendering loop.

The Timer API provides a single event, emitted whenever the emulator is
ready to refresh. All listeners of the event are called synchronously
and expected to run to completion during that call. That is, you should
not have asynchronous processes spawning (e.g.: by using promises)
from your listener function, as that will cause the code to run without
any synchronisation, and the behaviour of querying the Kate emulator
state will thus be unpredictable.


.. py:property:: on_tick
  :type: EventStream[number]

  Emitted whenever Kate is ready to refresh. The data in this event is
  a :term:`monotonic timestamp`, which you can then use to calculate
  how much time has passed since your update function was previously called.


.. py:property:: fps
  :type: number

  The current estimated number of frames the game is running at. Can be
  useful for debugging performance issues with your game's loop.