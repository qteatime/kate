Preserve WebGL Render
=====================

Forces a all canvases in the cartridge's process to disable its
off-screen rendering optimisation to provide support for Kate's
screenshot feature. There's no configuration for this bridge, it'll
affect all canvases.


Using in Kart
-------------

To add this bridge to your cartridge, you specify the following in your
``kate.json`` configuration:

.. code-block:: json

  {
    "bridges": [
      {
        "type": "preserve-webgl-render"
      }
    ]
  }


Why and how
-----------

Kate's screenshot and video capture runs on its own process, and as such
it's not synchronised with your game's drawing loop. The
`WebGL API <https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API>`_
offers a rendering optimisation where the contents drawn to the screen
are not always available to this separate process Kate runs, and in that
case the player might capture a screenshot that ends up blank because
your game is in the process of updating the screen at that exact moment.

In some cases this optimisation is turned on by whatever engine you're
using (e.g.: Ren'Py uses it), and it might be quite difficult to disable it.
That's because you choose to have or not the optimisation only when creating
the WebGL context for the canvas, and you can't change it afterwards.

The bridge patches the function that creates canvas rendering contexts to
prevent the optimisation from being enabled in the first place, but passing
through every other option. This keeps the same behaviour, but allows
screenshots to be taken consistently.


Performance drawbacks
---------------------

Not having to preserve the WebGL render is a rendering optimisation. This
means that this bridge will have a negative effect on your game's rendering
performance. That said, for most cases, and for the kind of games Kate is
designed for, the difference tends to not be noticeable. You should do some
thorough testing on lower end devices to make sure your game still runs
fine after disabling the optimisation, though.