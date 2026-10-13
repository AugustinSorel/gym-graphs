import pog.{type Connection}

pub type Ctx {
  Ctx(
    db: Connection,
    // mailer: Mailer,
  )
}

pub fn new(db: Connection) {
  Ctx(db:)
}
