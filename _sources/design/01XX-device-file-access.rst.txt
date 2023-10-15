#01XX — Device file access
==========================

:Author: Q\.
:Started: 2023-08-12
:Last updated: 2023-08-12
:Status: PoC in progress


Timeline
--------

=========== ================ =====================
First draft Proof of Concept Stable implementation
=========== ================ =====================
2023-08-12  —                —
=========== ================ =====================


Summary
-------

While games don't need access to files outside of what's included in the
cartridge, Kate is also a platform for running regular applications and
game development tools (such as Kate Importer or Kate Studio) need
to read files from the device's file system.

We want to make sure that any operations accessing user data has the
proper security and privacy controls and feedback in place, and they
also allow users to revoke access immediately at any time. To that end
all such accesses must go through a Kate-controlled API. In the case
of device files, this document introduces the Device File Access API.

The Device File Access API provides a baseline of operations on files
and directories. It's guided by the same principles of active and informed
consent that permeate other Kate features: processes are only granted
restricted access to files users agree to let them read.


Technical implementation
------------------------

The Device File Access API is similar to the web's File Access API and
Crochet's file system package, in that we rely on contextual grants for
file capabilities and provide individual file objects that can be used
to further access objects under them.

Cartridges and Kate processes can ask for the API object, which is a
passive grant if they have the Device File Access capability granted.
They can then use any of the entry-point methods in this API to request
access to a specific node in the file system tree. Nodes can be directories
or files — the API does not provide any concept of links or devices.

Nodes are represented as either a file or a directory object. These are
membranes exposed to outside processes, and all actual operations happen
within the Device File Access API. This means that capabilities are still
checked upon each read, write, or similar operation; users must have both
the object capability to the node **and** the general capability to use
the Device File Access API for all operations to succeed.

Handles are not persistent: they're gone as soon as the process is closed.
Every time the process is re-opened, it needs to request the capabilities
to the nodes again.

For this implementation, all file operations are atomic and synchronous.
This increases the memory requirements of Kate, but streaming and random
access APIs require more thought.


Formal semantics
----------------

The entire Device File Access API is governed by a simple core language
based on a file system tree. This language is described as follows:

.. code-block:: haskell

  type File f { path :: Pathname, data }

  type Pathname p ::
    | Root
    | Join { segment :: string, parent :: p }

  type FileFilter = {
    multiple: boolean = false;
    strict: boolean = true;
    types: {
      description: string;
      accept: {[mime: string]: string[]}
    }[]
  }
  
  DeviceFiles fs ::
    | fs.request-file(FileFilter) -> {ok, [f1, ..., fN]} | error
    | fs.request-directory() -> {ok, [f1, ..., fN]} | error

  File f ::
    | n.relative-path() -> Pathname
    | f.read() -> Bytes

Thus a user of this API starts by getting access to a `DeviceFiles` instance.
From there they may request access to a collection of files, or to a 
directory. These result in File handles which then allow the user to read
files in the underlying device file system — the files are a snapshot at
the time they're requested.

Symbolic and hard links are followed during this navigation. However, users
only have access to the path of the file relative to the top-most directory
they have been given access to.


Requesting capabilities
"""""""""""""""""""""""

Users start with no access to any file. They must first request contextual
grants to specific file or directory nodes.


``fs.request-file(filter)``
'''''''''''''''''''''''''''

  * Show a file picker where:

    * Users can select multiple entries if ``filter.multiple`` is true;
    * Users can select files matching the provided mime-type filters; and
    * Users may select any non-mime-type matching file if ``filter.strict`` is false;
    * The selectable files does not include system data — only user data must be selectable.

  * If the user selects a file:

    * Return a list of File handles for the selected files.

  * Otherwise:

    * Return a generic access failure.


``fs.request-directory()``
''''''''''''''''''''''''''

  * Show a directory picker where selectable directories do not include system
    data — only user data must be selectable.
  * If the user selects a directory:

    * Return a list of File handles for all files contained within the selected
      directory which are not system data;

  * Otherwise:

    * Return a generic access failure.


File metadata
"""""""""""""

Given any File handle we can get some metadata about it. Metadata from a file
will **never** allow one to get a more privileged node than the one the
operation was called on.


``f.relative-path()``
'''''''''''''''''''''

.. code-block:: haskell

  File{path = P}.relative-path() = P;

A relative path is just a sequence of segments starting from the node
we're in, and following the parent chain until the root directory that granted
access to this file. This means that pathnames are canonically in reverse form.
E.g.: a path like ``some/directory/file.txt`` would be represented as
``Join {"file.txt", Join {"directory", Join {"some", Root}}}``.


File operations
"""""""""""""""

Given a File handle, the user can only retrieve its contents.

``f.read()``
''''''''''''

.. code-block:: haskell

  File{data = D}.read() when has(file_access) = D

That is, if we read from a file handle then we synchronously get access to all
of the binary data stored at that node, as long as we still have the file_access
capability.


How is this feature dangerous?
------------------------------

Device File Access API is a high risk API which provides cartridges with
read-only access to files or directories selected by the user. In that sense
it poses considerable privacy and security risks in the hands of a malicious
cartridge. We consider risks from the Kernel, Device, Cartridge, and Users'
perspective here.


**Leaking sensitive data:**
  The API provides access to user data and cannot make any guarantees about
  contents. Further, as it relies on browser file pickers in the web, it
  cannot show the user a preview of the contents before they're shared. This
  means that a malicious cartridge can trick users into giving them access
  to sensitive data, if the user cannot understand what they're sharing.

  This is particularly a problem with directory requests, where all files
  inside of a directory are shared. For people who primarily grew up with
  mobile operating systems, the concept of directory trees might even be
  entirely foreign, further making it hard for them to make any reasonable
  risk assessment.

  For web Kate we rely on the browser's mitigations. For native Kate we
  mitigate with a separate confirmation step in the directory access case.

**Tree privilege escalation:**
  Because the API provides access to directories, symbolic links within
  it could be used to escalate access to a directory outside of the
  subtree that the user granted access to.

  We rely on the browser's mitigation for symbolic links and do not include
  grants to links in native Kate.

**Access to hidden files:**
  Because OS file pickers may not show hidden files by default, it's possible
  that a user grants access to a directory that contains files they never
  meant to grant access to.

  We rely on the same mitigation as that for sensitive data to cover hidden
  files.

**Direct access to devices:**
  Because some OSs (e.g.: Linux) expose devices as files, it's possible that
  a user grants access to a file or directory that is backed by a device,
  and hence grant the cartridge direct read access to that device's data.

  We mitigate this by only allowing users to select user-data files and
  directories. Browsers have a similar mitigation for device files.


Additional references
---------------------

* `File System Access API (WICG draft spec) <https://wicg.github.io/file-system-access/>`_
* `File API (WICG spec) <https://w3c.github.io/FileAPI/>`_
* `Chrome's File System API blogpost <https://developer.chrome.com/articles/file-system-access/>`_
