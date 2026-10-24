import gym_graphs/mailers/mailer.{type Mailer}
import pog.{type Connection}

pub type Ctx {
  Ctx(db: Connection, mailer: Mailer)
}

pub fn new(db: Connection, mailer: Mailer) {
  Ctx(db:, mailer:)
}
