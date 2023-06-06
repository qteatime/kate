``capture`` — Screenshots and video recording
=============================================

.. py:module:: KateAPI.capture
  :synopsis: Opt-in or out of screenshots and video recording of your cartridge's screen.

Kate allows players to take screenshots and record videos of a cartridge's
game play. However, it is the cartridge that decides what the player
captures, by specifying which
`Canvas <https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API>`_
should be the capture target.


.. py:function:: set_root(element: HTMLCanvasElement or null)
  
  :param HTMLCanvasElement or null element: The canvas to capture, or ``null`` to disable captures.
  
  Defines the canvas that should be the target of screenshots and video
  captures. You can change this at any point in the cartridge, and setting
  it to ``null`` will disable screenshots and video captures until it's
  set to an ``HTMLCanvasElement`` again.


