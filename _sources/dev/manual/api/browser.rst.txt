``browser`` — Navigating to URLs
================================

.. py:module:: KateAPI.browser
  :synopsis: Navigate to external URLs using the system's browser

Kate allows cartridges to request opening URLs using the system's browser
through the Browser API. This API is gated by a capability, and cartridges
are not informed if the user opened the URL or not.


.. py:function:: open(url: URL)

  :param url: The URL to open.

  Asks the user to open the given ``URL`` in their system browser. Only
  HTTP and HTTPS protocols are supported at this point.

  .. important::

    Use of this API requires the :ref:`Open URLs <open urls capability>`
    capability. Users can remove the grant for this capability at any point;
    the cartridge will not be notified if opening the URL succeeded or not.


.. py:function:: download_from_bytes(filename: string, data: Uint8Array)

  :param filename: A suggestion for the name of the file;
  :param data: A byte array containing the data of the file.

  Asks the user to save the given data in their device file system, handled
  in a way similar to how browsers download files. The provided file name
  is just a suggestion and not a guarantee that the file will exist under
  that name — likewise, there's no way of controlling where in the file
  system the file will end.

  All files downloaded in this manner will be tainted with as untrusted
  (e.g.: by attaching the Mark of the Web to them).

  .. important::

    Use of this API requires the :ref:`Download Files <download files capability>`
    capability. Users can remove the grant for this capability at any point;
    the cartridge will not be notified if opening the URL succeeded or not.
