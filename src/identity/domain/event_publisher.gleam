import identity/domain/events.{type IdentityEvent}

pub type EventPublisher {
  EventPublisher(publish: fn(IdentityEvent) -> Nil)
}
