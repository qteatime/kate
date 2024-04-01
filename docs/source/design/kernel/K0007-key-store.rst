#K0006 — Cartridge signatures
=============================

:Author: Niini
:Started: 2024-01-23
:Last updated: 2024-01-23
:Status: Design in progress


Timeline
--------

=========== ================ =====================
First draft Proof of Concept Stable implementation
=========== ================ =====================
2023-01-23  —                —
=========== ================ =====================


Summary
-------

Kate maintains an internal key store that holds parties the player has
trusted before, as well as their own sets of keys, if they happen to be
a developer.

See :doc:`K0006-cartridge-signatures`.


Formal semantics
----------------

A key store is a set of keys stored by domain. Public keys are stored
in SPKI format, while private keys are stored in PKCS8 format, encrypted
using a AES-GCM key derived from the user's master password.

This gives rise to the following language:

.. code-block:: haskell

  Key k :: Private {key, iv, pair_fp}
         | Public {key}

  Trust t :: personal | publisher | trusted

  Domain d :: a kate developer domain (`subdomain*.domain.tld`)

  Store s :: {salt, check, {{t, d, k}, ...}}

  Operation op ::
    | s.add(t, d, k)
    | s.delete(t, d, k)
    | s.get(d)
    | s.export(k)
    | s.sign(k, m)
    | s.verify(k, m)

The primitive operations on the store are adding, deleting, and retrieving
keys, as well as exporting keys (which pushes them to an external format).
Stores have their own salt and a byte check hash value so we can both derive the
same encryption key from the user's password and verify that the password
is correct (by decrypting byte check hash).


``s.add(k)``
""""""""""""

.. code-block:: haskell

  s.add(t, d, k) when {t, d, fp(k)} is not in the store =
    {{t, d, pack(k, s.salt)}, ...s}

  pack(Private {key, pair_id}, salt) =
    let iv = csprng(12 bytes)
    let secret = ask for the user master password
    let crypt-key = derive an AES-GCM key from {PBKDF2 secret, salt}
    wrap 'key' using 'crypt-key', PKCS8 format, and iv
    Private {key, iv, pair_id}

  pack(Public {key}, _) =
    export 'key' using SPKI format

  fp(k) = SHA-1 of k

That is, to add a key to the store we make sure that we don't yet have that
key in the store (matching the trust level, the domain, and fingerprint),
then we export the key to a binary format and, in the case of private keys,
encrypt it with an AES key derived from the store's master password.

Private keys have their initialisation vector generated anew every time
they're stored, and they also hold a pointer to the public key through its
stable fingerprint.


``s.delete(k)``
"""""""""""""""

.. code-block:: haskell

  s.delete(t, d, k) =
    s without {t, d, k}

That is, delete is a filter operation that simply gets rid of the key at
that trust/domain level.


``s.get(d)``
""""""""""""

.. code-block:: haskell

  s.get(d) =
    s with only {_, d, _}

That is, get is a filter operation that leaves only keys at the given
domain.


``s.export(k)``
"""""""""""""""

.. code-block:: haskell

  s.export(Public {key}) =
    pem(export-spki(key))

  s.export(Private {key, stored-iv, _}) =
    let secret = ask for the user master password
    let crypt-key = derive an AES-GCM key from {PBKDF2 secret, s.salt}
    let raw-key = unwrap 'key' using 'crypt-key', PKCS8 format, and stored-iv

    let iv = csprng(12 bytes)
    let salt = crprng(16 bytes)
    let export-secret = ask for an export encryption password
    let export-key = derive an AES-GCM key from {PBKDF2 secret, salt}
    let bkp-key = wrap 'raw-key' using 'export-key', PKCS8 format, and iv
    {iv, salt, bkp-key}

That is, exporting a public key is straightforward, as we just take the
binary representation in SPKI and turn that into its PEM representation.

Exporting a private key is a bit more involved: we decrypt the key with
the store's master password, then re-encrypt the key with a newly provided
password. The exported key is then stored alongside its initialisation vector
and password salt so it the encryption key can be re-derived from the storage.


``s.sign(key, m)``
""""""""""""""""""

.. code-block:: haskell

  s.sign(Private {key, iv}, m) =
    let secret = ask for the store's master password
    let crypt-key = derive an AES-GCM key from {PBKDF2 secret, s.salt}
    let sign-key = unwrap 'key' using 'crypt-key', PKCS8 format, and iv
    ecdsa-sign("P-384", sign-key, m)

That is, in order to sign a message with a key, we first decrypt it using
the store's master password, then we sign the message with the underlying
key.

The store only supports keys for ECDSA with P-384 curves, so no additional
algorithm information is present in the message signing itself.


``s.verify(key, m)``
""""""""""""""""""""

.. code-block:: haskell

  s.verify(Public {key}, m) =
    ecdsa-verify("P-384", key, m)

Verifying a message with a public key has straightforward: we perform the
necessary ECDSA signature verification using the underlying cryptographic
algorithm.

The store only supports keys for ECDSA with P-384 curves, so no additional
algorithm information is present in the message verification itself.