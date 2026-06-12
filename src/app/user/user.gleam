import app/auth_session/auth_session
import app/auth_session/sql as auth_session_sql
import app/crypto
import app/ctx.{type Ctx}
import app/password_reset_session/password_reset_session
import app/password_reset_session/sql as password_reset_session_sql
import app/sign_up_session/sign_up_session
import app/sign_up_session/sql as sign_up_session_sql
import app/user/sql as user_sql
import app/user/ui
import app/web
import formal/form.{type Form}
import gleam/bool
import gleam/option
import gleam/result
import pog.{type Connection, type QueryError}
import wisp.{type Request, type Response}

pub type UserError(form) {
  Validation(form: Form(form))
  EmailNotVerified
  EmailAlreadyTaken
  DatabaseFailure(QueryError)
  UnexpectedDatabaseResult
  NotVerified
  UserNotFound
}

pub fn view_set_password_page(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)

  use session <- sign_up_session.require(req, ctx)

  let result = {
    let not_verified = option.is_none(session.email_address_verified_at)

    use <- bool.guard(when: not_verified, return: Error(EmailNotVerified))

    Ok(session)
  }

  case result {
    Ok(session) ->
      ui.get_set_password_form()
      |> form.add_string("email_address", session.email_address)
      |> ui.set_password_form()
      |> ui.set_password_page()
      |> web.html(200)

    Error(EmailNotVerified) -> wisp.redirect("/sign-up/verify-email-address")

    Error(error) -> todo
  }
}

pub fn view_account_page(req: Request, ctx: Ctx) {
  use session <- auth_session.require(req, ctx)

  ui.account_details(session.email_address)
  |> ui.account_page()
  |> web.html(200)
}

pub fn set_password(req: Request, ctx: Ctx) -> Response {
  use <- auth_session.require_blank(req, ctx)

  use session <- sign_up_session.require(req, ctx)
  use formdata <- wisp.require_form(req)

  let result = {
    use form <- result.try(
      ui.get_set_password_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(Validation),
    )

    let not_verified = option.is_none(session.email_address_verified_at)

    use <- bool.guard(when: not_verified, return: Error(EmailNotVerified))

    use _ <- result.try(ensure_email_available(ctx.db, session.email_address))

    let salt = crypto.generate_hashing_salt()
    let password_hash = crypto.hash_user_password(form.password, salt)
    let secret = crypto.generate_session_secret()
    let secret_hash = crypto.hash_session_secret(secret)

    use auth_session <- result.try(
      pog.transaction(ctx.db, fn(tx) {
        use user <- result.try({
          create_user(tx, password_hash, salt, session.id)
        })

        use _ <- result.try(delete_sign_up_session(tx, session.id))

        use auth_session <- result.try({
          create_auth_session(tx, user.id, secret_hash)
        })

        Ok(auth_session)
      })
      |> result.map_error(fn(err) {
        case err {
          pog.TransactionRolledBack(e) -> e
          pog.TransactionQueryError(err) -> DatabaseFailure(err)
        }
      }),
    )

    Ok(#(auth_session, secret))
  }

  case result {
    Ok(#(auth_session, secret)) -> {
      let token = auth_session.encode_token(auth_session.id, secret)

      wisp.created()
      |> wisp.set_header("HX-Redirect", "/")
      |> sign_up_session.clear_cookie(req)
      |> auth_session.set_cookie(req, token)
    }

    Error(Validation(form:)) ->
      form
      |> ui.set_password_form()
      |> web.html(422)

    Error(EmailNotVerified) -> wisp.redirect("/sign-up/verify-email-address")

    Error(EmailAlreadyTaken) ->
      ui.get_set_password_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("This email address is already taken."),
      )
      |> ui.set_password_form()
      |> web.html(409)

    Error(DatabaseFailure(_)) | Error(UnexpectedDatabaseResult) ->
      ui.get_set_password_form()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> ui.set_password_form()
      |> web.html(500)

    Error(error) -> todo
  }
}

pub fn view_set_new_password_page(req: Request, ctx: Ctx) -> Response {
  use session <- password_reset_session.require(req, ctx)

  let result = {
    let not_verified = option.is_none(session.user_identity_verified_at)

    use <- bool.guard(when: not_verified, return: Error(NotVerified))

    use user <- result.try(select_user(ctx.db, session.id))

    Ok(user)
  }

  case result {
    Ok(user) ->
      ui.get_set_new_password_form()
      |> form.add_string("email_address", user.email_address)
      |> ui.set_new_password_form()
      |> ui.set_new_password_page()
      |> web.html(200)

    Error(NotVerified) -> wisp.redirect("/reset-password/verify-email-code")

    Error(e) ->
      ui.get_set_new_password_form()
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> ui.set_new_password_form()
      |> ui.set_new_password_page()
      |> web.html(500)
  }
}

pub fn set_new_password(req: Request, ctx: Ctx) -> Response {
  use session <- password_reset_session.require(req, ctx)
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      ui.get_set_new_password_form()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(Validation),
    )

    let not_verified = option.is_none(session.user_identity_verified_at)

    use <- bool.guard(when: not_verified, return: Error(NotVerified))

    let salt = crypto.generate_hashing_salt()
    let password_hash = crypto.hash_user_password(input.password, salt)
    let secret = crypto.generate_session_secret()
    let secret_hash = crypto.hash_session_secret(secret)

    use auth_session <- result.try(
      pog.transaction(ctx.db, fn(tx) {
        use _ <- result.try({
          update_password(tx, password_hash, salt, session.id)
        })

        use _ <- result.try(delete_reset_session(tx, session.id))

        use auth_session <- result.try({
          create_auth_session(tx, session.user_id, secret_hash)
        })

        Ok(auth_session)
      })
      |> result.map_error(fn(err) {
        case err {
          pog.TransactionRolledBack(e) -> e
          pog.TransactionQueryError(err) -> DatabaseFailure(err)
        }
      }),
    )

    Ok(#(auth_session, secret))
  }

  case result {
    Ok(#(auth_session, secret)) -> {
      let token = password_reset_session.encode_token(auth_session.id, secret)

      wisp.created()
      |> wisp.set_header("HX-Redirect", "/")
      |> password_reset_session.clear_cookie(req)
      |> auth_session.set_cookie(req, token)
    }

    Error(Validation(form:)) ->
      form
      |> ui.set_new_password_form()
      |> web.html(422)

    Error(NotVerified) -> wisp.redirect("/reset-password/verify-email-code")

    Error(e) ->
      ui.get_set_new_password_form()
      |> form.add_values(formdata.values)
      |> form.add_error(
        "root",
        form.CustomError("Something went wrong, please try again."),
      )
      |> ui.set_new_password_form
      |> web.html(500)
  }
}

fn create_user(
  db: Connection,
  raw_hash: BitArray,
  salt: BitArray,
  session_id: Int,
) {
  user_sql.create_user(db, raw_hash, salt, session_id)
  |> result.map_error(DatabaseFailure)
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [user, ..]) -> Ok(user)
      pog.Returned(_, []) -> Error(UnexpectedDatabaseResult)
    }
  })
}

fn delete_sign_up_session(db: Connection, session_id: Int) {
  sign_up_session_sql.delete_sign_up_session_by_id(db, session_id)
  |> result.map_error(DatabaseFailure)
}

fn create_auth_session(db: Connection, user_id: Int, secret_hash: BitArray) {
  auth_session_sql.create_auth_session(db, user_id, secret_hash)
  |> result.map_error(DatabaseFailure)
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [session, ..]) -> Ok(session)
      pog.Returned(_, []) -> Error(UnexpectedDatabaseResult)
    }
  })
}

pub fn ensure_email_available(db: Connection, email: String) {
  user_sql.select_user_by_email_address(db, email)
  |> result.map_error(DatabaseFailure)
  |> result.try(fn(user) {
    case user {
      pog.Returned(_, []) -> Ok(Nil)
      pog.Returned(_, [_, ..]) -> Error(EmailAlreadyTaken)
    }
  })
}

fn select_user(db: Connection, session_id: Int) {
  password_reset_session_sql.select_user_by_password_reset_session_id(
    db,
    session_id,
  )
  |> result.map_error(DatabaseFailure)
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [user, ..]) -> Ok(user)
      pog.Returned(_, []) -> Error(UserNotFound)
    }
  })
}

fn update_password(
  db: Connection,
  password_hash: BitArray,
  salt: BitArray,
  session_id: Int,
) {
  password_reset_session_sql.update_user_password_by_id(
    db,
    password_hash,
    salt,
    session_id,
  )
  |> result.map_error(DatabaseFailure)
  |> result.try(fn(returned) {
    case returned {
      pog.Returned(_, [_, ..]) -> Ok(Nil)
      pog.Returned(_, []) -> Error(UnexpectedDatabaseResult)
    }
  })
}

fn delete_reset_session(db: Connection, session_id: Int) {
  password_reset_session_sql.delete_password_reset_session_by_id(db, session_id)
  |> result.map_error(DatabaseFailure)
  |> result.map(fn(_) { Nil })
}
