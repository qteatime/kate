Network proxy
=============

The network proxy bridge translates all GET HTTP requests on the same origin
into read calls to the :py:mod:`Cartridge File System API <KateAPI.cart_fs>`.
There is no configuration for this bridge.


Using in Kart
-------------

To add this bridge to your cartridge, you specify the following in your
``kate.json`` configuration:

.. code-block:: json

  {
    "bridges": [
      {
        "type": "network-proxy"
      }
    ]
  }


Requests handled
----------------

This bridge handles requests that are specified only as a pathname. It can
handle requests both with the HTTP client APIs (XMLHttpRequest and fetch),
and the more implicit ones when referencing an external resource in e.g.:
an Image, Audio, or Video.

For example, given:

.. code-block:: javascript

  const image = new Image();
  image.src = "/sprites/girl.png";

The bridge will patch the HTMLImageElement ``src`` setter to interpret
the path as the following:

.. code-block:: javascript

  const image = new Image();
  const path = await KateAPI.cart_fs.get_file_url("/sprites/girl.png");
  image.src = path;

Because the bridge only patches the ``src`` setter, the following will not
be handled, and the cartridge will fail to load the image due to being blocked
from making network requests:

.. code-block:: javascript

  const image = new Image();
  image.setAttribute("src", "/sprites/girl.png");

When it comes down to XMLHttpRequest, the bridge patches the ``open`` and
``send`` methods. This means that the API remains the same, but when you
call ``open`` the method will internally translate the given path into
a blob URL. The ``send`` call will then hit the blob URL and immediately
return.

The same is true for ``fetch``, but in this case the bridge just replaces
the function with a patched version that translates URLs it's given before
invoking the built-in ``fetch`` on the translated URL.


Non-handled requests
--------------------

This bridge does not do anything special to blob URLs or data URLs. It also
just passes through any URL for a different origin, which will then be blocked
by the browsers' Content Security Policy set for the cartridge.


HTML handling
-------------

Currently this bridge only handles APIs that result in immediate HTTP
requests once called. However, it's possible to create HTML elements that will,
once added to the document, cause multiple HTTP requests to be sent.

For example:

.. code-block:: javascript
  :linenos:
  :emphasize-lines: 6

  const element = document.createElement("div");
  element.innerHTML = `
    <link href="/game.css">
    <script src="/game.js"></script>
  `;
  document.body.append(element);

In this case no HTTP request happens until line 6, where two HTTP requests
will be fired at some point, to ``game.css`` and ``game.js`` respectively.
Potentially more if ``game.css`` references external resources.
The bridge does not yet handle these cases, and this causes things like
Twine games to not work properly. This will be fixed in a future version,
no changes will be needed in cartridges created before the fix.