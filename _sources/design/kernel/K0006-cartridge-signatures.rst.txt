#K0006 — Cartridge signatures
=============================

:Author: Niini
:Started: 2023-12-31
:Last updated: 2024-01-20
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
""""""""""""

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
    last-update: ISO-8601 date/time string
    entries: Entry[]
    signature: sign({previous, last-update, entries}) with registry key
  }

  type Entry =
    | Key-added
    | Key-invalidated

  type Key-added = {
    type: "key-added"
    key: JWK public key
    domain: domain part string
    registered_at: ISO-8601 UTC date/time string
    hash: sha256-hash({type, key, domain, registered_at})
  }

  type Key-invalidated = {
    type: "key-invalidated"
    reason: "compromised-key" | "compromised-domain"
    key: JWK public key
    domain: domain part string
    invalidated_at: ISO-8601 UTC date/time string
    proof: sign({key, domain, reason, invalidated_at}) with publisher key
    hash: sha256-hash({type, reason, key, domain, invalidated_at, proof})
  }

Wherever ``sign`` is specified here, we assume the signature of those fields
encoded as JSON with no spaces or indentation.

The registry is a *trusted* service. One must trust that the keys added or
invalidated in the registry come from legit requests from publishers, and that
the correct validation has been performed on the registry side when associating
a key with a domain (i.e.: to ensure the owner of the key also owns the domain).

Entries in the registry have **set** semantics. That is, their particular
ordering is irrelevant. A client consuming the registry will know they have
the latest state when they've applied the whole set of entry hashes, in any
order. The addition and invalidation work in a similar way to a
`2P-Set CRDT <https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type#2P-Set_(Two-Phase_Set)>`_,
so additions and invalidations are tracked as separate sets you can only
add data to, but never remove.

Since, unlike in signed chain registries, the Kate key registry does not
have a total order or signatures on this total order, entries can be
added or removed anywhere, at any point in time, as long as they're
signed with the registry's key. To address the auditing concerns,
the public registry *must* have an open source implementation and have
all changes to the registry committed to a public git repository.
This makes it possible for third parties to independently audit changes
to the registry.


The registry server
"""""""""""""""""""

A registry server is any service that allows publishers to register their
public keys and verify that those public keys do indeed belong to the
publisher, so that they can add or invalidate the keys in the registry
records.

In essence, a registry server can be thought of as follows:

.. code-block:: haskell

  Server s :: { signing-key
              , work-queue
              , registry
              }

  Operation op ::
    | register-domain(domain)
    | invalidate-key(request)
    | commit()
    | all-keys()
    | all-keys-for(domain)

And the operations can be defined as follows:

``s.register-domain(d)``
''''''''''''''''''''''''

.. code-block:: haskell

  s.register-domain(d) when d is not in s.work-queue =
    add d to s.work-queue

When someone registers a domain update, we simply add it to the server's
work queue. We'll get to that domain eventually once the server's
``commit`` operation runs.


``s.commit()``
''''''''''''''

.. code-block:: haskell

  s{work-queue = []}.commit() =
    nothing

  s{work-queue = [d, ...]}.commit() =
    let page = first-of (fetch(d / kate.txt) | fetch(d))
    let key = extract public key in PEM format from page's text
    ensure the key is unique within the registry
      -- if the key belongs to another domain, this is an error
      -- if the key is already associated with the domain, do nothing
    add key to the registry, associating it with d
    s{work-queue = [...]}.commit()

That is, within a commit loop we'll process the work-queue and fetch the
public key either from a dedicated place in the remote server, or by parsing
the HTML response from the server and looking for a public key in PEM format.

In case this key is an actual addition to the registry, we'll add a new
signed entry to the registry for that key, and continue processing the queue.


``s.invalidate-key(r)``
'''''''''''''''''''''''

.. code-block:: haskell

  s.invalidate-key({key, domain, time, reason, proof}) =
    ensure key has not yet been invalidated and exists in the registry
    verify the proof signature against our known key for that domain
    add an invalidated entry for the key to the registry

That is, in a key invalidation request we just make sure that the proof
provided is valid and actually refers to a key/domain entry that we have
in the registry. If that's the case, the entry is added to the registry
mostly as-is.


``s.all-keys()`` and ``s.all-keys-for(domain)``
'''''''''''''''''''''''''''''''''''''''''''''''

.. code-block:: haskell
  
  s.all-keys() =
    registry paginated in 1024 entries chunks

  s.all-keys-for(domain) =
    (registry filtered by domain) in 1024 entries chunks

Both ``all-keys`` and ``all-keys-for`` return a complete registry in the
format specified above. The only difference is that ``all-keys-for`` only
returns entries that are associated with the provided domain.


How is this feature dangerous?
------------------------------

Kate relies on signatures to tell users about provenance and allow them to
tie their risk assessment decisions to a known entity. Therefore it's
important that these signatures *can* be used to provide that kind of link
between the cartridge and the publisher. Here we consider risks from users',
publishers, the registry, and Kate's perspectives.


**Signatures only prove domain ownership**:
  When a user makes a risk assessment for granting capabilities to a
  cartridge, they need to know who they're trusting, but signatures in
  Kate only prove domain ownership, which is not sufficient for this
  assessment.

  Kate communicates what is verified (the domain) by showing the whole
  domain on the capability grant screen. Capability risks are described
  independently. This doesn't provide an actual entity for trust, but
  it helps users focus on the capability risks rather than the
  domain itself.

  Because indie games are generally self-published by smaller developers
  attaching a person or studio's name would not improve much over the
  domain verification, but would significantly raise the bar for anyone
  wanting to publish to Kate.

**Compromised publisher keys**:
  If the private key of a publisher is compromised, then we cannot attest
  that cartridges signed with it must come from that publisher anymore.
  Users installing such cartridges risk being tricked into giving
  stronger capabilities to attackers based on previous good experiences
  with the publisher.

  The registry allows for key invalidation. A publisher may notify the registry
  that their key was compromised by signing an invalidation request, which is
  then propagated to all Kate devices. When a cartridge signed with an
  invalidated key is installed, the user will be notified that the cartridge
  cannot be verified and specify the invalidation reason, which the user
  can then rely on for risk assessment.

**Compromised publisher domain**:
  Because Kate associates keys with domains, and because domain ownership is
  ephemeral, a publisher's verified domain may be compromised for several
  different reasons. For each of these reasons we risk a third party
  registering keys that are otuside of the publisher's control. These can
  then be used to publish cartridges that abuse the publisher's reputation
  for privilege escalation, tricking the user into granting more capabilities
  than the attacker would generally enjoy.

  The registry allows for domain invalidation. A publisher may notify the
  registry that their domain was compromised by signing an invalidation
  request, which is then propagated to all Kate devices. When a cartridge
  with an invalidated domain is installed, regardless of being signed,
  the user will be notified that the cartridge cannot be verified because
  the domain has been compromised; the user can then rely on that additional
  information when making their own risk assessment.

**Complicated publisher onboarding**:
  In order to publish cartridges for Kate, a publisher needs to:

  * Own an internet domain;
  * Generate a cryptographic private/public signing key pair;
  * Upload the public signing key to their internet domain;
  * Sign all cartridges with their private key;
  * Keep their private key safe and backed up.

  Given Kate's developer audience are neither cryptographers nor computer
  science students, this is a very involved process which makes it hard for
  regular people to publish their small games.

  To mitigate this there will be a separate onboarding effort where most of
  the steps here can be automated. To make it more financially accessible,
  we also allow people to use their existing online accounts in publishing
  platforms as an "internet domain they own", so long as they can provide
  their public key there.

**Unavailability of the registry**:
  Because the registry is an online service, it's possible that it becomes
  unreachable by Kate clients for a host of reasons (including the client
  itself not having public internet connection).

  All clients synchronise data from the registry to their own local database,
  so signature verifications happens entirely locally. A client will always
  be able to verify a signature without having a connection to the registry,
  however it might not have the latest state at that point in time and
  report that the signature cannot be verified if its key addition has not
  yet been sync'd. This is an acceptable risk in a decentralised system.

**Unbounded registry growth**:
  Because the registry accepts an association of any domain with any number
  of keys, it can grow to unbounded lengths and is particularly susceptible
  to attacks that aim to make it unusable by overloading the registry with
  junk data.

  Since the only entry-point for new data in the registry is the
  ``register-domain`` operation, we can control which entries we allow
  by either manual (e.g.: through an invite queue system) or automatic veto
  (e.g.: by checking that the domain is "reasonably publisher-ish"). These
  must be considered if domain registration is open to anyone.

**Malicious key invalidation/addition requests**:
  If a key or domain is compromised, then the attacker may register or
  invalidate keys in the registry as if they were the publisher who previously
  owned that domain.

  Kate errs on the side of being cautious here and therefore cannot mitigate
  this issue. This means that once a publisher's key/domain has been
  compromised, there's no way to mark it as "un-compromised", and the
  publisher must choose a new key/domain.

**Registry compromised**:
  The registry is signed with the registry server's key, which is trusted
  by all Kate clients by default. If this key or ther registry are compromised,
  then an attacker would be able to fabricate publisher key entries that would
  be then trusted by the Kate clients.

  There's no provision in the registry or Kate to handle this. Rather, the
  registry's key must be rotated, a new Kate client must be published trusting
  the new public key, and the existing publisher keys in the key store must be
  flushed in favour of re-sync'ing them from the registry.

**Unreasonable registry sizes for sync'ing**:
  Even if the registry grows in a manageable pace, it may still become too
  big for Kate clients to hold the state locally. A registry taking gigabytes
  of storage space is unreasonable if most users will only need a few keys
  from it.

  Clients should allow users to switch from locally-stored complete registries
  to on-demand sync'ing. In this sense the client queries the registry for
  keys of a specific domain upon cartridge installation, rather than before.
  This means  that verification requires users to be online.