#K0006 — Cartridge signatures
=============================

:Author: Niini
:Started: 2023-12-31
:Last updated: 2023-01-20
:Status: Design in progress


Timeline
--------

=========== ================ =====================
First draft Proof of Concept Stable implementation
=========== ================ =====================
2023-12-31  —                —
=========== ================ =====================


Summary
-------

Kate cartridges are not distributed via a centrally veto-ed place, but rather
can be distributed through any medium, by any party. That said, security
properties in Kate directly depend on asking the player to make a risk and
trust assessment of the developer of the cartridge, and thus we need to be
able to provide enough assurance on the provenance of the cartridge.

To this end Kate relies on digital signatures. Cartridges are signed by
at least the developer, and may be further vouched for by other parties.
A centrally veto-ed and publicly available repository of public signatures
then handles the additional tying of a public key to a verified identity,
so the information can be provided to players when making risk decisions
about what capabilities to grant and which cartridges to trust.

The lifecycle of a cartridge goes roughly as follows:

1. The publisher registers their ownership of a domain by uploading their public
   key;
2. The Kate Signature Repository service downloads the public key from the
   publisher's domain and signs it into the set of publicly known publisher
   keys, as ownership of the domain has been proven.
3. The publisher creates a cartridge and signs it with their private key. This
   provides to the players a way of assuring that the cartridge comes from the
   domain it specifies;
4. The player installs the cartridge. Kate verifies the signature in the
   cartridge using the public key associated with that domain.

   a. If there's no signature in the cartridge, the player is notified that
      the cartridge is not signed, and higher-risk capabilities cannot be
      granted without additional confirmation.
   b. If the public key that verifies the signature has been invalidated,
      the player is notified that the cartridge might have been compromised,
      and any capability cannot be granted without additional confirmation.

5. If the domain or private key are compromised, the publisher signs a key
   invalidation request so players are aware of the issue.


Technical details
-----------------

Kate uses a binary cartridge format (documented in :doc:`../formats/F0002-kart`),
and this format allows embedding multiple signatures by specifying the signee
and the public key identifier of that signee. When accepting cartridges
(e.g.: installing in the console, submitting to the store), they **must** be
verified against the public repository of digital signatures for the validity
of the stated identities vouching for the cartridge.

Cartridges are signed with ECDSA keys (using a P-384 curve and SHA-512 hashing).
When signing and verifying a cartridge, we consider only the Metadata binary
blob, as encoded from LJT, without taking into account any signatures. That is
the metadata is considered with its ``signature`` field set to the empty list.
That means that all signees would sign the same binary representation. Note
that it's important that the binary encoding of the metadata is not changed,
and thus for signing and verification LJT's automatic patches **must** be
disabled.

Kate requires at least the developer of the cartridge to vouch for it. This
is done by considering the namespace part of the cartridge identifier, which
points to a domain name. A separate service **must** keep track of public keys
made available in the known domain names used to publish Kate cartridges, and
it **must** make those public keys available in a centrally veto-ed and
publicly available repository. This repository must be accessible via CORS, as
it needs to be accessible in the web version of Kate as well. Notwithstanding,
**critical keys** (i.e.: those used to sign cartridges using critical-risk
capabilities and Kernel resources) must be distributed within the console's
trusted code and not depend on external network connections.

Key management is partially out of scope of this document. However, since keys
are associated with domain names, and domain names are ephemeral markers of
identity (e.g.: they might cease to be associated with the previous owner in
case they don't renew the domain), we must offer a way of marking a domain as
invalid for ownership verification purposes --- we do so by asking the previous
owner to sign a message to terminate the domain tracking after a specific date.
In this case all public keys registered after the cutoff date are invalidated,
and the domain is no longer tracked for new public keys.

Because private keys may also be compromised, we need a way of invalidating
previously published public keys when this happens. To do so a special
invalidation key **should** be generated when generating the private key and
its public key registered as the invalidation key. A message can then be
signed with this invalidation key to invalidate the pair of public keys.

Finally, cartridges may be partially verified (i.e.: not all signees could be
verified). In this case it is up to the verifying process to decide how to
communicate this failure mode to the player. Players **should** be able to
run a cartridge that has only been partially verified, but they must
acknowledge the risks first. This is necessary for video game preservation,
as keys might have been invalidated at future dates.


Key generation and distribution
"""""""""""""""""""""""""""""""

Cartridges are signed with ECDSA keys (using the P-384 curve). However these
are generated is out of scope for this document, but there are three ways in
which public keys used to verify the signatures are to be distributed.

First, keys for critical capability accesses are to be handled by a manual
review process and included directly in Kate's distribution. This means that
these keys will have a hard-coded identity and invalidation key in Kate, thus
the identity verification process is up to maintainers; this is only meant
to cover public keys maintainers themselves use to sign core Kate components,
such as core tooling applications and Kernel components.

Second, for game/application developer keys, they are to be distributed
through the domain that is associated with the game. Kate cartridge
identifiers are comprised of a ``<domain-name>/<unique-name>`` pair, so
by distributing the key through the given domain name we can verify
ownership of that namespace, which here is a weaker form of identity
verification --- we don't need to associate the cartridge with a physical
entity, we just need to inform the player if the cartridge truly comes
from the source it specifies in its identifier.

There's a risk that domain names change hands, or that keys are compromised,
so in this case too we need to be able to invalidate the domain part or the
key part of that identity.


Kate key-store
''''''''''''''

Kate maintains an internal key-store that contains private and public keys
needed by the user. Private keys are stored encrypted with a user-provided
password, whereas public keys are stored in plain form.

Keys can be retrieved from the store only by the Kernel, for a subset of
components. It is the responsibility of those components to make sure a
private key doesn't linger in memory for longer than it needs to be.

The store is divided into different *purposes*:

* **Trusted keys**: static set of keys shipped with Kate.

* **Publisher keys**: dynamic set of keys associated with domain names.

* **Invalidated keys**: dynamic set of keys built when any key is invalidated,
  for auditing and warning purposes.


Trusted keys
''''''''''''

Trusted keys are keys used to sign trusted components (e.g.: Kernel components,
applications that require critical capability access). These keys are used
for *vouching* for a cartridge or component, so they are not associated
with a domain name.

These are listed in a ``trusted-keys.json`` file along with an identification
of who the signees of that key are. We assume Kate files live in a secure
and isolated file system environment, where other applications cannot modify
its contents.


Publisher keys
''''''''''''''

Publisher keys are used to verify that the source of the cartridge can be
fully traced back to its domain name counter-part. We verify these keys
by asking owners to upload the keys to their domain and expose it under a
well-known endpoint. Once verified, they are added to a list of known
public keys that the console uses, and this list is signed with one of
the console's trusted keys.

This gives publishers freedom to maintain their online identity and associate
it with cartridges, while also giving Kate something useful to work with when
presenting publisher information to the player for risk assessments. Allowing
the list to be signed by a trusted key allows it to not be maintained
centrally, while also allowing for revocations to be issued.


Invalidated keys
''''''''''''''''

Invalidated keys are used to notify the player that a cartridge cannot be
proven to have been produced by the expected owner, even though its signature
can be verified with the public key we know, because we no longer believe
that the private key is exclusively known by the expected owner.

Publishers can invalidate keys by submitting an invalidation request by signing
the message with their private key. The invalidation request includes a
signature of the public key, the domain, and the reason for the invalidation
as an enumeration (``compromised-key`` or ``compromised-domain``).

In case of a compromised domain, the domain itself is invalidated and no new
keys are allowed to be registered for it, as well as invalidating all
registered keys for that domain.


Key registry
------------

The key registry is a repository of all keys used to sign Kate cartridges that
is available for the public domain and signed with the trusted key for the
registry (whose public key is statically known to all Kate instances).

The registry is made out of JSON files in chunks of 1024 keys, stored as
a signed linked list. A client can replay the registry by taking the latest
chunk, following all links until it finds one it has already consumed or
reach the root of the set. Then replaying all entries in sequence.

The following format is used:

.. code-block:: typescript

  type Chunk = {
    previous: null | {
      file: path,
      hash: SHA-512 signature of the previous chunk file
      hash-algorithm: "SHA-512"
    }
    entries: Entry[]
    signature: sign({previous, entries}) with registry key
  }

  type Entry =
    | Key-added
    | Key-invalidated

  type Key-added = {
    type: "key-added"
    key: JWK public key
    domain: domain part string
    registered_at: UTC timestamp
    previous: null | sha256 hash
    hash: sha256-hash({type, key, domain, registered_at, previous})
  }

  type Key-invalidated = {
    type: "key-invalidated"
    reason: "compromised-key" | "compromised-domain"
    key: JWK public key
    domain: domain part string
    invalidated_at: UTC timestamp
    proof: sign({key, domain, reason, invalidated_at}) with publisher key
    previous: null | sha256 hash
    hash: sha256-hash({type, reason, key, domain, invalidated_at, proof, previous})
  }

Wherever ``sign`` is specified here, we assume the signature of those fields
encoded as JSON with no spaces or indentation.

The registry is a *trusted* service. One must trust that the keys added or
invalidated in the registry come from legit requests from publishers, and that
the correct validation has been performed on the registry side when associating
a key with a domain (i.e.: to ensure the owner of the key also owns the domain).

Like version control systems, each "commit" or addition in this registry
includes a reference to the previous state of the registry. This means that
it's not possible to reorder entries in the registry without invalidating
the whole state of the registry, but it does not provide any assurance that
the additions are valid.

To address the addition concern, the public registry *must* have an open
source implementation and have all changes to the registry committed to
a public git repository. This makes it possible for third parties to
independently audit changes to the registry.
