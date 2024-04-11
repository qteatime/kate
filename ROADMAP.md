# Kate's roadmap

This is a more structured and detailed description of the planned features.
They're divided into a few classes:

- Kernel --- Changes to the core OS (but not the visual parts);
- Core Services --- Changes to core services around Kate;
- Core Apps --- Changes to built-in applications/cartridges/tooling;
- Core APIs --- Changes to APIs provided to user cartridges;
- Runtimes --- Support for specific languages/runtimes;

## Kernel

### Tag-based file system

- **Status**: not started
- **ETA**: 2024

Kate needs to be able to store data from users in order to support a rich
game-dev (and creative) tooling ecosystem. To this end we want a file system
that is more modern and in-line with other Kate design choices (such as being
capability-secure). A flat, tag-based file system is the best fitting choice.

We want to allow users to:

- Add arbitrary tags/metadata to files and query for them;
- Control how each file (or group of files) is shared per application;

Most file systems in use today fulfill only one or the other (if they fulfill
any of them). Tag-based file systems mostly vanished after the late 2000s, but
it's what makes the most sense for Kate given how "flexible" collections need
to be and the need for less fine-grained control over these collections.

E.g.: if you're going to create several sprites and sounds for making a game,
you don't want to have to individually select each of them to share with every
game-dev application you use --- this would require all applications to be
monolithic and do everything, which is something we want to move away from.

### Multiple processes support

- **Status**: some ground-work done
- **ETA**: 2024

In order to support a more modular operating system where people can have
small tools that do just one thing, we need to allow users to have more than
one application open at the same time. Some of the ground work for this was
already done when rewriting the process spawning and handling code, but
there's still some assumptions about only one process in other portions of
the code, and in the UI (e.g.: there's no support for "switching" to another
process, no indication of other processes being open, etc.)

Besides spawning processes it should also be easy and quick to switch between
them so users can switch to a different small tool for specific parts of their
process. We also want to be able to support showing multiple processes on the
screen at the same time, but this requires more thought --- security hints
are currently relying on single active processes, and processes assume a
rendering canvas of 800x480 which wouldn't hold in case of multiple processes
being shown.

### Capability-secure inter-process communication

- **Status**: some design work done
- **ETA**: 2024

Having files be the way processes collaborate doesn't work when we want rich
and immediate feedback, and when we want both users and applications to have
more strict security boundaries. Luckily Ocap-based IPC is not a new concept,
and we can lift most of the existing research on this directly. This depends
on work on a new programming language, [Fine][], but you can see similar ideas
in things like [Cap'n Proto][capn].

One interesting effect of this is that, since Fine is a static typed language
describing process interfaces and security properties (it's still unclear if
adding [value labelling][labels] is feasible though), we can rely on this
to provide users with a very rich, very composable, and fully explorable
language for scripting their system --- unlike e.g.: Bash, or even things
like PowerShell. This is actually a big goal for the OS eventually, but
separate from the addition of the core IPC features.

[Fine]: https://github.com/qteatime/lambda-garden/blob/main/notes/fine.txt
[capn]: https://capnproto.org/

### DLC/Patch/Extension support

- **Status**: not started
- **ETA**: 2024

Currently, cartridges in Kate are required to contain all files that they
need in order to work. This makes some things a bit tricky: for example,
it's not easy for someone to make a translation of a game, since the original
author would need to release a new cartridge version with it. Likewise, if
an author wants to have optional content they need to create a whole new
cartridge version with all previous files plus the optional content.

The good thing is that, since Kate cartridge metadata is just LJT-encoded
metadata, we can have different types of cartridges (providing different
affordances) pretty straightforwardly since LJT supports tagged unions.

One thing that needs to be defined, however, is how we'll handle file updates.
Kate cartridges are stored in immutable buckets, so the simplest way of
approaching this is by using a layered file system (each DLC/Patch cartridge
"layers upon" the previously installed cartridge portion, so when resolving
a file path identifier we try from latest layer to earliest layer), though
that increases the storage requirements.

## Core services

### Decentralised catalog

- **Status**: some ground-work done
- **ETA**: 2024

In order to reduce the power of controlling the ecosystem we want to have
decentralised "stores". To avoid moral problems with recommendation systems
we want to bring back manual curation (from the web ring era). Both of these
align with Kate's goals and are fairly old concepts.

Some ground work on the OS part of this support has been done already:
cartridges can be signed and verified, and the kernel manages lists of
trusted public keys by category. This means that catalogs can be just
a database of links to these cartridges that one can subscribe to. Curation
feeds are then a database of links to catalog entries (which one can subscribe
to as well). Catalogs are fully synchronised to the local OS storage,
similar to other Linux package managers, and can be searched by any of the
catridge metadata. Feeds provide a selection of the catalog that is oriented
around creator-specific themes.

### Device data synchronisation

- **Status**: design ground-work done
- **ETA**: 2024/2025

Data in a Kate system is currently stored in an opaque format and not easily
accessible outside, so it's hard to have backups, and hard to maintain multiple
devices (e.g.: if you have a handheld console + a desktop machine and want to
share save data between them). Device data exports and synchronisation addresses
both problems.

There's some design work already done for this (though not publicly shared yet),
and while exports/impoprts are trivial, direct device synchronisation has to
deal with exchanges of public keys for authentication and device discovery,
so it's a bit more involved (although the underlying data export is similar).

## Core Apps

### Publisher

- **Status**: started
- **ETA**: 2024

Pretty much the same thing that Kart, Kart-sign, and Kate-dist do today, but
in a Kate cartridge, and with a more friendly interface. This makes generating
and signing cartridges more accessible and safe.

## Core APIs

### Badges/Achievements

- **Status**: not started
- **ETA**: unknown

Allow game cartridges to provide little local rewards to players for completing
certain challenges **without** the current leaking of data about how players
have played the game that permeates other systems' implementations of this
feature --- that is, badges are fully local and cartridge authors will never
have access to them, not even in an aggregate fashion.

(It's always important to note that "aggregates" are not sufficient
anonymization without significant number of participans and distributions
of values; It's against Kate's core goals and tenets to provide features
that cannot be properly reasoned in terms of safety and privacy from the
user's perspective).

### Networking API

- **Status**: not started
- **ETA**: unknown

Neither online nor LAN multiplayer games are currently supported in Kate,
but they should be with the proper security and privacy considerations.
Here the plan is to be able to provide public discovery servers that work
out of the box combined with a P2P multiplayer API that works for the
small-scale/indie multiplayer games.

Bring-your-own-server multiplayer games, if supported at one point, will
need a different discovery as they have very different threat model and
privacy implications.

### Haptic feedback

- **Status**: not started
- **ETA**: unknown

An extension to the current gamepad input API to support vibration actuators
as well. This depends on both proper haptic feedback support in target
browsers, though [the gamepad API is in an unfortunate state][gamepad-api].

[gamepad-api]: https://developer.mozilla.org/en-US/docs/Web/API/Gamepad/hapticActuators

### Multiple gamepad support

- **Status**: not started
- **ETA**: unknown

Another extension to the current gamepad input API. This is necessary for
properly supporting local couch co-op in the desktop version of Kate, as
currently only one gamepad can be active in the console (a limitation that
only made sense when the console was going to be fully hand-held mode).

## Runtimes

### Godot 4

- **Status**: on hold
- **ETA**: unknown

Godot 4 requires SharedArrayBuffer support. Enabling this in Kate is trivial,
and Godot 4 games exported for the web run fine in the console as of today.
However, SharedArrayBuffer support is currently explicitly disabled in Kate
for all cartridge processes because browsers cannot yet guarantee that these
cartridges will be handled in a separate process (i.e.: they will not share
the memory address space with the Kernel code).

The primary issue here is that Spectre would allow cartridges to read any
data from the Kernel memory space if SharedArrayBuffer support is granted
without an out-of-process iframe, and the Kernel holds sensitive user data.
So this is either waiting browsers provide a way of guaranteeing this, or
us finding a good way of generating them dynamically (without the need of
a separate sandbox domain).

This will still be made a capability either way.

### Twine

- **Status**: early tests done
- **ETA**: unknown

Kate's current sandbox does not handle dynamic HTML/CSS generation, and
Twine relies heavily on this. We also need to switch games away from
being mouse-only to also supporting gamepad input in some reasonable manner.

### Crochet / Meow / Kate.SDK

- **Status**: early prototypes done
- **ETA**: 2024/2025

Kate doesn't have a truly "native" way of building applications yet, we just
Frankestein web-apps together with both dynamic emulation and JIT code
translation. The Kate.SDK is meant to fix this by providing a truly native
experience for developing apps for Kate that aligns with all security,
privacy, and feedback goals (i.e.: rich and immediate feedback with
bidirectional editing and time-travelling debugging **must** be supported).

The approach here is similar to [VPRI's STEPS][steps] operating system project,
in that they had several different programming languages to build the OS to
keep its size reasonable. Early prototypes and descriptions can be seen in the
[Lambda Garden](https://github.com/qteatime/lambda-garden) repository.

Just like in Racket, the basis of the work is a new high level virtual machine
called Meow, which defines a [CEK machine][cek] in [ANF][anf] as its IR, and
a multi-language system that works on top of this same IR. The machine is
64-bit based and can be efficiently compiled to both JavaScript and WASM
(all continuations are single-shot, which aligns with both [JavaScript's][jsk]
and [WASM's delimited continuations][wasm-k] --- though WASM's isn't live yet,
but most continuations can be eliminated during compilation with the aid of
an effect system, along with the simplified model that Meow uses for its
effect handlers).

[steps]: https://tinlizzie.org/VPRIPapers/tr2012001_steps.pdf
[cek]: https://en.wikipedia.org/wiki/CEK_Machine
[wasmk]: https://www.youtube.com/watch?v=2iiVhzzvnGA
[jsk]: https://legacy.cs.indiana.edu/~sabry/papers/yield.pdf
[anf]: https://en.wikipedia.org/wiki/A-normal_form
