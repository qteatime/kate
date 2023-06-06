``cart_fs`` — Reading files
===========================

.. py:module:: KateAPI.cart_fs
   :synopsis: Read files bundled with the cartridge.

The Cartridge File System API (``cart_fs``) provides access to reading
files that were bundled with the cartridge. A cartridge can only read
its own files, and cannot modify any of them. This API is strictly
read-only.

For updating your cartridge, you need to distribute a new cartridge binary
with the new data. If you're looking for storing save data, you should
look at the :py:mod:`Object Storage API <KateAPI.store>`.


The file system
---------------

A cartridge contains a file system section, which is a key/value store
mapping a "path" identifier to a file—its binary contents and metadata.
Files can be read by providing the unique "path" to this API.

Although the API calls it a "path", it's in reality just a unique
identifier that looks like a Unix path for convenience. That is,
a file may be identified by ``/images/sprite.png``, but that does
not mean that there exists a folder called ``images``. The API
requires that the whole ``/images/sprite.png`` match exactly
the key that was used when packaging the cartridge.

This restriction also means that paths are case-sensitive. That is,
``/images/sprite.png``, ``/images/Sprite.png``, and ``/images/sprite.PNG``
identify **three different resources**. This is different from file systems
like Windows where all of those identifiers point to the same file, but
similar to Linux file systems. If you get errors saying that a file cannot
be found, but you know it should be in the cartridge, it's good to check
if the spelling matches what the cartridge packager reported when providing
the cartridge summary.

Kate does, however, require a path to comply with the URL pathname
specification (:rfc:`3986#section-3.3`). This means that Kate will
still consider ``/images/nina%20smile.png`` and ``/images/nina smile.png``
to point to the same resource.


Types
-----

.. py:class:: File

   Describes the contents and meta-data of a file returned by the
   cartridge file system API.
   
   .. py:attribute:: data
      :type: Uint8Array
      
      The binary contents of the file.

   .. py:attribute:: mime
      :type: string

      The :term:`MIME type` stored with the file.


Reading files
-------------

.. py:function:: read_file(path: string) -> File promise
   :async:
   
   :param string path: The path identifier of the file to read.
   :returns: The file data and metadata.
   :rtype: Promise(File)

   Reads the file pointed by the given ``path``. This will return a
   :py:class:`File` with the binary contents of the file and its
   :term:`MIME type`.

   .. rubric:: Example

   .. code-block:: javascript

      const sprite_file = await KateAPI.cart_fs.read_file("/sprite.png");
      const sprite_blob = new Blob([sprite_file.bytes], { type: sprite_file.mime });
      const sprite = new Image();
      sprite.src = URL.createObjectUrl(sprite_blob);
      canvas.getContext("2d").drawImage(sprite, 0, 0);


.. py:function:: get_file_url(path: string) -> string promise
   :async:

   :param string path: The path identifier of the file to read.
   :returns: A ``blob://`` URL for the contents of the file.
   :rtype: Promise(string)

   This is a convenience for invoking :py:func:`read_file` and creating
   a ``blob://`` URL from its binary contents, which can then be used
   by the Image, Audio, and other DOM objects to load the data with
   the appropriate context.

   .. rubric:: Example

   .. code-block:: javascript

      const sprite = new Image();
      sprite.src = await KateAPI.cart_fs.get_file_url("/sprite.png");
      canvas.getContext("2d").drawImage(sprite, 0, 0);
