import kernel/email.{type Email}

pub opaque type Ctx {
  Ctx(email: Email)
}

pub fn new(email: Email) {
  Ctx(email:)
}
