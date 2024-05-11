============
Terms of use
============

Kate is made possible thanks to the amazing work of other people
shared under permissive licences. The software and assets that
make up the entirety of the Kate project are listed here.


The Kate project licence and your rights
----------------------------------------

The primary goal of the Kate project is to provide you, the user, with a
platform that is secure and respects your privacy, and for which you can
always verify these security and privacy guarantees, rather than just trust
the authors. To this end, we rely on specific software licences to
ensure that you *can* verify the software you're running.

In essence, the Kate project is divided into layers, and each layer has
more strict or more lax licensing depending on how important it is to
the security and privacy guarantees we provide to you. The layers are:

- **The Kate operating system and its components**, what is made available to
  you either online (e.g.: on https://kate.qteati.me), or through a native
  application/kernel distribution. This is always licensed to you under
  the GNU General Public License version 2 (or, at your choice, a later
  version). This guarantees that you'll always be able to verify the
  security and privacy guarantees of your copy of Kate.

- **The Kate Importer and Kate Publisher cartridges**, as well as the Kate
  command line tools, are also licensed to you under the GNU General
  Publice License version 2 (or, at your choice, a later version).
  This is done so cartridge authors can make sure the tool is not *changing*
  their game/app code in any way they don't expect to, which indirectly
  impacts the security/privacy guarantees a thirdy-party author provides to
  you.

- **The Kate documentation (these books)** are released under a
  Creative Commons 4.0 No-Derivatives licence. They're free to copy and
  share, but you can't modify them without the Kate project authors' approval.
  If we allowed any unvetted modification we would open up the possibility of
  copies of the documentation existing with misleading or incorrect statements
  about the security guarantees and privacy you get. This is particularly true
  with translations, as even when translators have no intention of misleading,
  their choice of phrasing might still cause confusion among readers. Note
  that illustrations and designs contained in the books might have different
  licences (this will be noted where it's the case).

- **Any thirdy-party cartridge released for Kate** is bound to the licence the
  authors of that cartridge have chosen (and communicated to you). This
  licence can be read from within Kate. Thirdy-party cartridges that don't
  extend or modify the Kate operating system are not subject to the GPL
  (there's a special exception for them) because they cannot subvert any of
  the security and privacy guarantees the Kate operating system communicates
  to you, thus there's no real need to verify the cartridge's code.

- Other components of the Kate project such as images and thirdy-party
  dependencies are subject to their own licences. Such cases are specified
  later in this document.

In order to allow you to verify the security and privacy guarantees that
the Kate project gives you, you should have received a copy of the source
code for Kate program you're running. The original source code by the
Kate project authors can always be found at https://github.com/qteatime/kate,
but if you've received a modified copy, the person who shared the copy with
you must tell you where to get the exact source code for their modified version.

Official binary releases by the Kate project authors will always be
distributed at https://github.com/qteatime/kate. You're encouraged to audit
and verify any modifications if you've got your copy from elsewhere.

For more details and clarifications on these licences and how they affect
you, see the :doc:`licence-faq`.


--------------------------------------------------------------------------------

This software contains portions of code, fonts, images, and sounds by
third-parties, specified below.

Full text for all relevant licences is included here, after attributions,
in the goal of making them offline-friendly.


Fonts
-----

**Font Awesome 6 Free**
   | (c) 2023 Fonticons, Inc.
   | (https://fontawesome.com)
   | Licensed under the SIL Open Font License (font files),
     Creative Commons 4.0 Attribution International license (icons), and
     MIT (CSS source code).

**Poppins**
  | (c) 2020 The Poppins Project Authors
  | (https://github.com/itfoundry/Poppins)
  | Licensed under the SIL Open Font License.

**Roboto and Roboto Mono**
  | (c) Google
  | (https://fonts.google.com/specimen/Roboto/about)
  | Licensed under the Apache License 2.0.


Code dependencies
-----------------

**Kate Tools**
   The Kate Tools package uses:

   * `Glob <https://www.npmjs.com/package/glob>`_
        | Copyright (c) 2009-2023 Isaac Z. Schlueter and Contributors
        | ISC licence

**Kate Importer**
  The Kate Importer cartridge uses:

  * `Ren'Py <https://www.renpy.org/>`_
      | Copyright (c) Tom Rothamel and Contributors
      | Largely MIT licensed
      | (Ren'Py includes dependencies under other licences as well.
        The `Ren'Py licence page <https://www.renpy.org/doc/html/license.html>`_
        includes all details)

  * `JSZip <https://github.com/Stuk/jszip>`_
      | Copyright (c) 2009-2016 Stuart Knightley, David Duponchel, Franz Buchinger, António Afonso
      | Dual licensed under MIT or GPLv3.

**Kate Native**
   The Kate Native application uses:

   * `Electron <https://www.electronjs.org/>`_
        | Copyright (c) Electron contributors
        | Copyright (c) 2013-2020 GitHub Inc.
        | MIT licence
        | (Electron itself uses Chromium and Node.js, the licences are included
          with the pre-built binaries)


Themes
------

The Candy Pop colour theme for Kate is based on a the Pollen8 palette
by Conker (https://lospec.com/palette-list/pollen8)


Licence texts
-------------

SIL Open Font License
'''''''''''''''''''''

This license is copied below, and is also available with a FAQ at:
http://scripts.sil.org/OFL

.. include:: ../../../support/licences/SIL.txt
   :literal:


GNU General Public Licence version 2
''''''''''''''''''''''''''''''''''''

.. include:: ../../../support/licences/GPL2.txt
  :literal:


Linking exception for cartridges
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. include:: ../../../COPYING
  :literal:


Apache License 2.0
''''''''''''''''''

.. include:: ../../../support/licences/Apache2.txt
   :literal:


Creative Commons 4.0 Attribution International
''''''''''''''''''''''''''''''''''''''''''''''

.. include:: ../../../support/licences/CC4-BY.txt
   :literal:


CC0 1.0 Universal Licence
'''''''''''''''''''''''''

.. include:: ../../../support/licences/CC0.txt
   :literal:


.. _mit licence:

MIT licence
'''''''''''

.. include:: ../../../support/licences/MIT.txt
   :literal:


ISC licence
'''''''''''

.. include:: ../../../support/licences/ISC.txt
   :literal:

Mozilla Public Licence v2.0
'''''''''''''''''''''''''''

.. include:: ../../../support/licences/MPL2.txt
  :literal: