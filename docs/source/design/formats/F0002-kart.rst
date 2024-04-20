#F0002 — KART cartridges
========================

:Author: Niini
:Started: 2023-12-30
:Last updated: 2023-12-30
:Status: Design in progress


Timeline
--------

=========== ================ =====================
First draft Proof of Concept Stable implementation
=========== ================ =====================
2023-12-30  —                —
=========== ================ =====================


Summary
-------

Applications in Kate are distributed as a single binary blob containing all of
the data that is needed to execute the application. There are a few properties
we are interested in for such format:

- **Direct execution**: It should be possible (but not mandatory!) to execute
  the application directly from the binary blob without loading all of it in
  memory at once. Blobs for games can easily be several gigabytes in size.

- **Bounded memory codecs**: Related to the requirement above, it should be
  possible to decode and encode cartridge blobs while using bounded memory,
  but not necessarily *constant* memory.

- **Rich metadata**: It should be possible to encode rich metadata about the
  application, as Kate uses this to enable displaying and searching for
  cartridges in the console and the catalog.

- **Multiparty whole-cartridge signatures**: It should be possible to sign
  the whole cartridge by multiple signees. We expect authors to sign their
  own cartridges to ensure provision, but we may also require a
  "trusted signee" to allow access to more powerful features like network
  access --- this would allow veto signatures from trusted independent auditors.

- **Block integrity checking**: It should be possible to check that the
  contents of the cartridge have not been corrupted *even when no signature
  is present*.

- **Backwards compatibility**: It should be possible to amend the schema for the
  cartridge without invalidating previous cartridges. A cartridge released for
  Kate **must** be decodable by all future versions of the console, otherwise
  we would fail the goal of being a platform for video-game preservation.

- **Forward evolution**: It should be possible to *distribute* cartridges made
  with a version X of the schema, and get a clear error indicating that the
  user needs to upgrade their console to version Y in order to decode the
  cartridge.

Towards that end, Kate cartridges (``.KART`` files) are an uncompressed archive
format that ending with a metadata blob and content location tables.


Technical summary
-----------------

Kate cartridges are a binary archive format comprised of four sections::

    -- The schema signature magic bytes + version
    0x0000    K A R T
    0x0004    version: uint32                   -- the LJT schema version used

    -- The binary file contents
    0x0000    count: uint32                     -- the number of files
    0x0004    size: uint32                    \
    0x0008    file contents (up to `size`)    | -- repeated for each file
    ...

    -- The metadata blob
    0x0000    LJT encoding of `Metadata` record (magic-less)

    -- The header blob
    0x0000    LJT encoding of `Header` record (magic-less)

For the LJT specification, see :doc:`F0001-ljt`. All numbers in the cartridge
are encoded using little-endian encoding, and all of them have a fixed size.

The current LJT schema used is version 6. You can find all LJT schemas in
the `'schema' package <https://github.com/qteatime/kate/tree/main/packages/schema/schemas>`_
in Kate's repository.

The most relevant portions of this schema, for decoding, are the Header type
and the file and signature tables in the Metadata type. They have approximately
the following shape:

.. code-block:: typescript

  type Header {
    minimum-kate-version: {
      major: uint32
      minor: uint32
      patch: uint32
    }
    metadata-location: {
      offset: uint64
      size: uint64
    }
    content-location {
      offset: uint64
      size: uint64
    }
  }

  type Metadata {
    // ...(other fields omitted)
    files: Array<{
      path: text
      mime: text
      integrity: raw-bytes
      hash-algorithm: Sha-512 (as a LJT record)
      offset: uint64
      size: uint32    (individual files always limited to 4GB)
    }>
    signature: Array<{
      signed-by: text
      key-id: text;
      signature: raw-bytes
    }>
  }

The process of encoding a Kate cartridge starts by first writing all of the
files to the archive (and keeping track of their metadata), then writing the
cartridge metadata which includes a location table to each file giving their
offset in the archive and an integrity hash. Lastly, the Header section is
written which gives information on where the metadata and file blobs are.

The process of decoding a Kate cartridge will generally start by looking at
the Header at the end of the file, then decoding the Metadata section, then
using the file location table in the metadata to decode individual files at
their specified offsets. While a Kate cartridge can also be decoded in a
stream fashion, from beginning to end, it would not be possible to do
integrity checks in this manner as that data is only present in the metadata
blob.

Note that the signature is only present in the metadata blob, and it *only*
signs the metadata blob (with an empty signature list). That means files are
not signed directly, but their integrity hash in the content location table
is.


Reference codecs
""""""""""""""""

The codec modules in `the 'schema' package <https://github.com/qteatime/kate/blob/main/packages/schema/source/>`_
act as a reference implementation for the blob decoding.
The `LJT VM <https://github.com/qteatime/kate/tree/main/packages/ljt-vm>`_ is
the reference implementation for encoding and decoding the LJT sections of the
file.


Direct execution
""""""""""""""""

Kate cartridges can be executed directly from the binary blob, as long as
the IO device supports random-access to parts of the blob. For IO devices
that *only* support streaming, the blob must be decoded into individual
components and stored somewhere that allows access to the individual
components prior to executing it --- streaming execution is not possible
and not a goal.

Here we start by decoding the Header section of the cartridge, then we
find and decode the Metadata section which contains information about which
runtime to use to execute the cartridge and a file location table for all
the (read-only) contents of the cartridge.

By loading the runtime and feeding it the file location table, the runtime
can then pick the files it needs from the given offsets in the cartridge
blob without needing a separate pass where those files are written to
another storage location.


Bounded memory codecs
"""""""""""""""""""""

Kate cartridge blobs require at most ``max(block-size...)`` bytes of memory to
decode, but there's no constant number that can be used to pre-allocate a single
decoding buffer. Each block has different sizes, either indicated at the start
of the block, as it's the case with files, or in the Header location table,
as it's the case with the Metadata block. The Header location table itself is
fixed-size, but that size might change between schema versions.


Rich metadata
"""""""""""""

The Metadata section includes information on how to uniquely identify the
cartridge, as well as how to present it, how to classify it, its legally
binding documents, accessibility provisions, security requirements, and
how to execute the cartridge application (allowing for different runtimes
to use the same archive format).

Because these only have their semantic defined by the interpreter of the
cartridge, we don't discuss them in this document. How Kate interprets
these fields is described in :doc:`/dev/manual/model/cartridges` and
:doc:`/dev/manual/kart/configuration`.


Multi-party, whole cartridge signatures
"""""""""""""""""""""""""""""""""""""""

The primary purpose of Kate cartridge signatures is to ensure that the
cartridge was made by whoever is distributing it, and that entity has
ownership over the domain they specified in the cartridge identification.
Because Kate cartridges *are not required to be distributed in a central place*,
a malicious attacker could publish a cartridge named ``qteati.me/cute-game``
with outrageous capability requests and trick people into thinking that
comes from the maintainers of Kate. Signatures are primarily a means to
avoid this situation, by tying the signature key to the domain.

The secondary goal of signatures is to allow independent "vouching" for a
cartridge, particularly ones that require powerful capabilities. For example,
you might not immediately trust a cartridge asking for network access if it
comes from a developer you never consumed things from before. But if a person
you trust vouched for them, you would be more likely to trust it.

The signature block in the cartridge metadata supports both of these goals.
Each signature includes the signee and the signature. The signee is a domain
name which is then used to find which public keys are associated with it. The
signature succeeds in being verified if the specified public keys for that signee
can verify it.

Note that we **only** sign and verify the metadata binary (with an empty
signature list). This is enough to indicate a high degree of trust that the
cartridge does belong to the sources it specifies, and has been vouched for
by the people listed in the signatures. Signature verification however does
not prevent a cartridge from being executed --- that would be problematic
for the goal of video game preservation, particularly given how Kate ties it
to ephemeral domain names. It's only another indication for players to take
into account when choosing whether to grant capabilities or not, but
capabilities remain the only *damage-mitigation security feature* that Kate
provides.

Verifying signatures by signee allows us to partially verify a cartridge and
show that to players as well, when aiding them in assessing the risk of
granting capabilities.


Block integrity checking
""""""""""""""""""""""""

The metadata section in the cartridge includes integrity hashes for all of
the files in the cartridge. By decoding the meta-data first a program is 
able to verify the files as they decode them. By decoding the meta-data last,
a program is able to verify the files after-the-fact, as long as the program
writes them to some temporary storage.

In both cases the cartridge files can be checked for corruption. The metadata
and header blocks do not have an integrity hash, and so cannot be checked for
corruption in the same manner. Signature verification in the metadata blob
is a stronger indication of integrity, but requires the public key to be
available for testing.

Kate cartridge blobs have no self-correcting error mechanism. We expect the
underlying file storage to provide that. And in the case of network transfers
of cartridge blobs, we expect the protocol to ensure integrity, or that this
is verified with an out-of-band integrity hash of the whole cartridge binary.


Backwards compatibility and forwards evolution
""""""""""""""""""""""""""""""""""""""""""""""

Kate cartridges use a versioned LJT schema for most parts. LJT itself specifies
backwards compatibility through versioning and patching semantics, so you need
to read the LJT specification (:doc:`F0001-ljt`) to understand that in more
details.

Forwards evolution is a bit trickier. The schema version *does* tell the
program that the cartridge cannot be decoded, but it does not really tell
the user what they have to do to fix that. To address this the header is
stable across versions and contains the minimum Kate version needed to
decode the cartridge. This addresses the issue from the users' perspective,
but only for Kate itself.


