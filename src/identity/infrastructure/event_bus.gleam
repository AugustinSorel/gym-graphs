import gleam/erlang/process.{type Name}
import gleam/list
import gleam/otp/actor
import gleam/otp/supervision
import identity/domain/event_publisher.{type EventPublisher, EventPublisher}
import identity/domain/events.{type IdentityEvent}

pub fn publisher(name: Name(IdentityEvent)) -> EventPublisher {
  let subject = process.named_subject(name)
  EventPublisher(publish: actor.send(subject, _))
}

pub fn supervised(
  name: Name(IdentityEvent),
  subscribers: List(fn(IdentityEvent) -> Nil),
) -> supervision.ChildSpecification(process.Subject(IdentityEvent)) {
  supervision.worker(fn() {
    actor.new(subscribers)
    |> actor.on_message(handle_message)
    |> actor.named(name)
    |> actor.start
  })
}

fn handle_message(subscribers: List(fn(IdentityEvent) -> Nil), event) {
  list.each(subscribers, fn(subscriber) { subscriber(event) })

  actor.continue(subscribers)
}
