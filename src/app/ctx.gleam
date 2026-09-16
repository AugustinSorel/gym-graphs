import app/email.{type Email}
import pog

pub type Ctx {
  Ctx(db: pog.Connection, email: Email)
}
