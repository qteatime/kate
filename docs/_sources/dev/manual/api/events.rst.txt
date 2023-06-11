``events`` — Event handling
===========================

.. py:module:: KateAPI.events
  :synopsis: Provides basic supports for event streams.

Some Kate APIs are event-driven, where data is pushed to you rather than
pulled from your code. The ``events`` API provides the basic support
for Kate events and exposes events that are sent from the Kernel process.


Event streams
-------------

Kate uses its own class to represent discrete event streams. You can
subscribe to events in the stream and cancel a subscription at a later
point in time.

.. py:class:: Subscription

  Represents a subscription to an event, used to cancel the subscription
  at a later point.


.. py:class:: EventStream
  
  Represents a stream of discrete events. This class is not exposed, so it's
  not possible to create instances of it yourself.

.. py:method:: EventStream.listen(fn: Type -> void) -> Subscription
  
  :param fn: The function to call when an event happens.

  Subscribes to events from this stream. ``fn`` will be called with the event
  data each time an event happens until the subscription is cancelled.

.. py:method:: EventStream.remove(subscription: Subscription) -> EventStream

  :param subscription: The subscription to cancel.

  Cancels a previously registered subscription, if it's still active, otherwise
  this does nothing. After it's called the subscription will not receive further
  events from the stream.

.. py:method:: EventStream.once(fn: Type -> void) -> Subscription

  :param fn: The function to call when an event happens.

  A convenience to :py:meth:`listen` which automatically cancels the
  subscription after it receives one event.