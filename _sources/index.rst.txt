Welcome to Kate's Library!
==========================

.. warning::
  
   These books are still being written, and should currently be considered
   unedited drafts. Kate has not stabilised yet, any concept covered
   here might change in future versions. Sections that are particularly
   in-flux will be marked with an admnotion like this one.

The official documentation is divided into sections and books, and cover
different aspects of the technical and practical sides of Kate.


End-user books
==============

Here you'll find books on Kate from the perspective of an end-user. These
cover aspects from how to use Kate to its philosophy and security guarantees.

:doc:`Kate's User Manual <user/manual/index>`
   New to Kate? Confused about how Kate works? This explains how to
   install the emulator, as well as the features in the console.

:doc:`Kate's Importer Manual <user/importer/index>`
   The Kate Importer lets you install and play games made for other
   platforms in Kate. This manual explains what's supported, how it
   works, and what the limitations are.

:doc:`Build Your Own Game Console <user/diy/index>`
   Ever wanted to build your own video game console? The Kate project
   was designed exactly for that. This manual will guide you step-by-step,
   from assembling the pieces of hardware, to getting your own customised
   cases, to setting up the Kate operating system.


Game developer books
====================

Here you'll find books and leaflets on Kate from the perspective of someone
making games for the console, or wanting to port existing games to it.

:doc:`Making games for Kate! <dev/manual/index>`
   Want to build a new game for Kate or port an existing one? This book
   will cover all the basics.

:doc:`Kate Porting Recipes <dev/port/index>`
   If you have an existing Ren'Py or Bitsy game, this will walk you through
   porting it to Kate.


Design and implementation
=========================

Here you'll find technical books on the design, philosophy, and implementation
of Kate. Both the physical console and the software emulator.

:doc:`Design documents <design/index>`
   Technical documents on the design of all APIs and components that make
   up Kate, including specific security threats they consider.

..
  :doc:`The Kate Threat Model <user/threats/index>`
    Wondering how Kate protects your safety and privacy? This document
    provides both summaries and in-depth technical explanations of what
    you're signing up for, using real-world examples.


Changes, Terms, and Credits
===========================

Here you'll find when features were introduced or changed in Kate, as well
as the terms of use for different components of the project.

:doc:`Kate's release notes <etc/releases/index>`
   Release notes for all Kate versions can be read here.

:doc:`Licence <etc/licence>`
   Licence terms for Kate and all projects it uses can be read here.


Indices and tables
==================

:ref:`General Index <genindex>`
   Quick access to all terms and sections.

:ref:`Module Index <modindex>`
   Quick access to API references for all modules.

:doc:`Glossary <glossary>`
   Explains all technical terms you may encounter in other books.

.. toctree::
  :caption: End-user books
  :hidden:

  user/manual/index
  user/importer/index
  user/diy/index

.. toctree::
  :caption: Game developer books
  :hidden:

  dev/manual/index
  dev/port/index

.. toctree::
  :caption: Design and implementation
  :hidden:

  design/index

.. toctree::
  :caption: Changes, Terms, and Credits
  :hidden:

  etc/releases/index
  etc/licence

.. toctree::
  :caption: Indices and Tables
  :hidden:

  glossary
  genindex
  modindex