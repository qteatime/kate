Audit logs
==========

In any software system there's a lot happening in the background at all
times. While Kate aims to be as transparent as possible when it comes
to high-risk events, it usually needs to show you a very summarised
view of those events — there's a limited screen space and overwhelming
players with security notices helps no one.

For all times where you need details on what has happened, Kate keeps
audit logs. These are more detailed versions of the events happening
while your console and games are running. They can be accessed by
going to ``Settings -> Audit logs``.


Storage usage and retention
---------------------------

By default logs are kept for up to one year. You can change this retention
period to more or less time in the same settings screen. The reason Kate
doesn't keep audit logs forever is that they take storage space, too.
While a few log entries are not much of a concern, several months worth
of log entries on a very active console can get more demanding.

The usefulness of logs decreases as time goes on, since most issues that
would make you look at them will have more immediate effects. For example,
you might notice that a cartridge was using a dangerous resource that you
didn't expect and look at the logs to check the details on what it was
doing — and you're usually going to do that right after, rather than 6
months down the road.


Removing sensitive data
-----------------------

Kate tries it best to not add sensitive data to the logs. However, some
of the data it logs comes from cartridges, and Kate cannot determine if
they're sensitive or not.

If you notice unwanted data in your log entries you can remove them
individually from the log view screen.