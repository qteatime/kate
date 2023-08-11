# 00XX - Live auditing
======================

:Author: Q\.
:Started: 2023-08-11
:Last updated: 2023-08-11
:Status: Design in progress


Timeline
--------

=========== ================ =====================
First draft Proof of Concept Stable implementation
=========== ================ =====================
2023-08-11  —                —
=========== ================ =====================


Summary
-------

An important aspect of secure systems is the ability of being auditable.
By making all actions happening in the console available for auditing
Kate makes it less likely that security violations would go unnoticed.
It also provides supporting data for taking follow-up actions after a
security incident.


Technical implementation
------------------------

All persistent or externally observable effect-bearing actions, as well as
all errors that happen while the console is in use, are persisted to a
database. This means that all log entries in Kate are structured and
amenable to programmatic queries and auditing.

This log database is managed by the **Audit Supervisor** process. This
process provides a way of storing log entries, and also handles the log
retention on its own. Every other API that is subject to auditing is
expected to ask the **Audit Supervisor** for storing their actions.

A log entry contains the following fields:

  - **The set of resources this action affected**. E.g.: a change to gamepad
    input mappings will affect the "settings" resource.

  - **The risk category for this action**. This is the same risk categories
    as in :doc:`00X-capabilities`, but here we want to highlight specific
    log entries based on their potential auditing value.

  - **The process responsible for this action**. That is, on whose behalf was
    this action executed in Kate?
    
  - **A type identifier**. This is a unique identifier for the action or
    event itself. Kate does not use this currently, but it will be necessary
    for providing more auditing tools later.

  - The time when the action or event occurred.

  - A plain text message to display to the user and additional structured
    details. For example, an error entry might store the error object. Whereas
    a setting update entry might store the changes performed. Details can
    sometimes work for undoing the action.


How is this feature dangerous?
------------------------------

Though the audit log is strictly a repository of structured actions and events
that have taken place, there are a few risks that we need to consider. We
consider here risks from users' and Kate's perspectives.


**Unreasonable use of storage:**
  Log messages are small, but if the user performs a lot of actions in bursts,
  or if the device/cartridge/kernel misbehaves, it's possible that the amount
  of generated log entries eventually floods the storage. We do not have to
  worry at the amount of storage needed for large distributed systems, since
  there's only one user of the device in this case, but we cannot keep the
  log entries forever.

  Kate mitigates this with a log retention configuration and periodically
  performing garbage collection on older logs.


**Storage of unwanted or sensitive data:**
  Because Kate will never have full control over the data that ends up in
  logs, even when they are fully local and concern a single user, it's
  possible that unwanted or sensitive data ends up in the audit log in
  a persistent and readable form.

  Kate mitigates this by allowing individual log entries to have their
  non-Kate-controlled details erased.


**Denial of service attacks:**
  Because Kate's audit logging also happens in response to cartridge
  actions, it's possible that a cartridge behaves in one or other way
  to intentionally flood the Audit Supervisor with logging requests,
  filling the storage space and degrading the storage device.

  Kate does not mitigate this in the audit supervisor, but a fairness
  supervisor will allow processes misbehaving in ways that put the
  system's resources in jeopardy to be terminated, thus limiting the
  damage they can cause.


**Noisy logs:**
  Because the audit logs will store all actions and events that have any 
  kind of persistent/outside-observable effect there's a risk that important
  log entries get lost in a sea of less-important log entries.

  Kate mitigates this by storing all logs in a structured format, and giving
  them a risk category. This allows them to be visually distinguished in the
  interface and also filtered and searched for more easily.