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

    Use of this API requires the ``Open URLs`` capability. Users can remove
    the grant for this capability at any point; the cartridge will not be
    notified if opening the URL succeeded or not.