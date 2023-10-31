#K0003 — Resource band
======================

:Author: Q\.
:Started: 2023-10-31
:Last updated: 2023-10-31
:Status: Proof of concept


Timeline
--------

=========== ================ =====================
First draft Proof of Concept Stable implementation
=========== ================ =====================
2023-10-31  2023-10-18       —
=========== ================ =====================


Summary
-------

As an operating system, Kate runs applications with different trust levels,
boundaries, and parties. Kernel and first-party applications have different
guarantees about their security and privacy compared to thirdy-party
cartridges. However, all of these applications are displayed on the same
screen, so generally the user would not be able to distinguish between
them.

Phishing and other spoofing attacks rely on the attacker being able to
trick users into trusting them with sensitive information; for example,
they might create a cartridge that mimics OS-specific screens, like a
payment screen, and both collects and exfiltrates sensitive payment
information from the user. As a secure OS, we of course want to make
these attacks as impractical as possible.

The approach we take in Kate is similar to the approach web browsers
take with describing trust boundaries in web pages, by making it as
explicitly as possible where the trust boundaries are while also making
it infeasible for thirdy-party content (i.e.: webpages) to mimic
first party content (i.e.: the browser chrome itself).

In Kate we use a small band at the top right of the screen to represent
all of this information in a way that cannot be mimic'd by cartridges.


OS feedback
-----------

An operating system essentially manages running multiple applications and
background services on behalf of the user, ultimately providing them with
an unified system where all of these applications collaborate. Kate is
the same.

Because there are many things running at the same time, the OS must be
able to provide important security feedback to the user (e.g.: "there
are applications using your camera") while at the same time not
overwhelming the user, since the entire point of having an operating 
system is to allow the user to offload all this multiple-application-managing
business to something else.

Kate then elects three different things that it wishes to convey to the
user:

* **The trust boundary**: it's important for the user to know what the screen
  they're looking at is a part of — who they're trusting by interacting with
  it, essentially. Kate primarily distinguishes between "trusted" (i.e.:
  first-party) applications and "guest" (i.e.: thirdy-party) applications.

* **Immediate privacy/security-impacting features**: it's important for the
  user to know what more sensitive parts of their device is being used at
  any given point (and ideally which applications are using it). An application
  should *never* be able to use privacy-sensitive devices such as camera,
  microphone, or location without the user knowing that they're being used.

* **OS issues that require prompt attention from the user**: it's important
  for the user to be notified timely of things that require their attention
  in order for the OS to behave correctly, but which do not require the user
  to stop everything they're doing in order to address it. Things like
  "the OS cannot store save files" or "you're running very low on storage space"
  fall in this category.

Popular mobile operating systems will generally provide feedback for the user
on the latter two, in a similar way that Kate does — there will generally be
a list of icons that are shown on the screen when these require attention from
the user, possibly coupled with notifications. OSs generally do not distinguish
between applications' boundary trusts however.


Formal semantics
----------------

The resource band is made up of a trust boundary notification and a resource
usage notification. These are distinct objects in the model:

.. code-block:: haskell

  type Boundary =
    | Trusted { app }
    | Untrusted { app }

  type App :: unique app identifier

  type Resource :: unique resource identifier

  type ResourceManager {
    boundary :: Boundary,
    resources :: {r1 -> positive integer, ..., rN -> positive integer}
  }

  type Ref :: unique reference token

  ResourceManager rm ::
    | set-boundary(Boundary) -> unit
    | take(Resource) -> unit
    | release(Resource) -> unit

So a resource manager exists which holds the current boundary and the
resources that have been taken by each application. And this manager allows
one to change the boundary or indicate that a resource has been taken or
released. In order to keep track of the resources being used this manager
simply uses a reference counter, so information of who's using resources
is not handled by the resource manager and thus not provided in the
resource band.

The trust boundary on the other hand is a single setter because Kate does
not support multiple GUI applications showing on the screen at the same
time.


Manager semantics
"""""""""""""""""

``rm.set-boundary(T)``
''''''''''''''''''''''

.. code-block:: haskell

    ResourceManager {resources = R }.set-boundary(T)
      = ResourceManager {boundary = T, resources = R}

Given a current resource manager state, we replace the trust boundary with
the given one, but leave everything else as is.


``rm.take(R)``
''''''''''''''

.. code-block:: haskell

    ResourceManager {boundary = T, resources = {r1 -> N, ...R}}.take(r1)
      = ResourceManager {boundary = T, resources = {r1 -> N + 1, ...R}}

    ResourceManager {boundary = T, resources = R}.take(r1)
      = ResourceManager {boundary = T, resources = {r1 -> 1, ...R}}

Given a current resource manager state, we either insert a new resource
pair that sets the number of references to that resource to 1, or, if
there are references to it already, we increase the number of references.


``rm.release(R)``
'''''''''''''''''

.. code-block:: haskell

    ResourceManager {boundary = T, resources = {r1 -> 1, ...R}}.release(r1)
      = ResourceManager {boundary = T, resources = R}

    ResourceManager {boundary = T, resources = {r1 -> N, ...R}}.release(r1)
      if N > 1
      = ResourceManager {boundary = T, resources = {r1 -> N - 1, ...R}}

Given a current resource manager state, we either reduce the number of
references held by the given resource, or remove it from the state if
the reference goes down to 0. Trying to release a resource that has not
been taken is not a possibility, so there would be an error in the kernel
if that were to happen.


How is this feature dangerous?
------------------------------

The resource band has some potential to mislead and overwhelm users. Here
we consider risks from users', cartridges, and Kate's perspectives.

**Noisy information:**
  Because the resource band provides really important information on trust
  and privacy, it's a problem if this band is too crowded for the user to
  actually notice these sensitive privacy and trust feedback.

  Kate mitigates this by both dividing resources into categories and by
  keeping the number of possibilities small and focused on resources that
  have immediate and significant impact on security and privacy.

**Misleading trust feedback:**
  Because the resource band displays information about trust boundaries,
  there's a risk that the band would not accurately reflect what the
  user is looking at and hence mislead the user into thinking they can
  trust the current screen they're interacting with.

  Kate mitigates this by only allowing one GUI application to be displayed
  on the screen at any given time. This way there's less of a possibility
  of the user interacting with the wrong screen and leaking sensitive
  information to a party they did not want to as a result of this.

**Obscuring cartridge information:**
  Because the resource band sits at the top-right of the screen, above
  the currently displayed screen, it might end up obscuring parts of the
  cartridge information. This is particularly a risk for cartridges not
  designed for Kate, as they might not be aware that not the entire
  screen is available for them to use.

  Since the resource band provides important security and privacy feedback,
  Kate chooses to accept this risk and encourage cartridges to move important
  information more to the centre of the screen so it's not obscured by the
  resource band (or notifications/status bar).

