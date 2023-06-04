Sandboxing
==========

All cartridges run in a :term:`sandboxed iframe`. This iframe runs with
no exposed web APIs (other than the ability of playing sounds and videos),
and with a very restrictive :term:`content security policy`. It also
runs with no :term:`origin`—this means no access to any web APIs that
touch storage or require a defined origin.

The biggest implication of the sandboxing is no direct access to any
web API. 