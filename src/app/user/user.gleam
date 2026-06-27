import app/auth_session/auth_session
import app/ctx.{type Ctx}
import app/user/sql as user_sql
import app/user/ui.{type EditNameForm}
import app/web
import formal/form.{type Form}
import gleam/bool
import gleam/result
import gleam/string
import pog.{type QueryError}
import wisp.{type Request, type Response}

pub fn view_account_page(req: Request, ctx: Ctx) -> Response {
  use _session, user <- auth_session.require(req, ctx)

  ui.account_details(user)
  |> ui.account_page(req)
  |> web.html(200)
}

type UpdateNameError {
  UpdateNameFormError(Form(EditNameForm))
  UpdateNameDatabaseError(QueryError)
  UpdateNameNotFound
}

pub fn view_edit_name_page(req: Request, ctx: Ctx) -> Response {
  use _session, user <- auth_session.require(req, ctx)

  ui.get_edit_name_form()
  |> form.add_values([#("name", user.name)])
  |> ui.edit_name_form()
  |> ui.edit_name_page(req)
  |> web.html(200)
}

pub fn update_name(req: Request, ctx: Ctx) -> Response {
  use _session, user <- auth_session.require(req, ctx)
  use form_data <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      ui.get_edit_name_form()
      |> form.add_values(form_data.values)
      |> form.run()
      |> result.map_error(UpdateNameFormError),
    )

    use <- bool.guard(when: input.name == user.name, return: Ok(Nil))

    case user_sql.update_user_name(ctx.db, input.name, user.id) {
      Ok(pog.Returned(_, [_, ..])) -> Ok(Nil)
      Ok(pog.Returned(_, [])) -> Error(UpdateNameNotFound)
      Error(err) -> Error(UpdateNameDatabaseError(err))
    }
  }

  case result {
    Ok(_) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/account")

    Error(UpdateNameFormError(invalid_form)) ->
      invalid_form
      |> ui.edit_name_form()
      |> web.html(422)

    Error(UpdateNameNotFound) -> {
      ui.get_edit_name_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("user not found"))
      |> ui.edit_name_form()
      |> web.html(404)
    }

    Error(UpdateNameDatabaseError(err)) -> {
      wisp.log_error(req.path <> " database error: " <> string.inspect(err))
      ui.get_edit_name_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> ui.edit_name_form()
      |> web.html(500)
    }
  }
}

type UpdateWeightUnitError {
  UpdateWeightUnitInvalidValue(form: Form(user_sql.WeightUnit))
  UpdateWeightUnitDatabaseError(QueryError)
  UpdateWeightUnitNotFound
}

pub fn update_weight_unit(req: Request, ctx: Ctx) -> Response {
  use _session, user <- auth_session.require(req, ctx)
  use form_data <- wisp.require_form(req)

  let result = {
    use weight_unit <- result.try(
      ui.get_weight_unit_form()
      |> form.add_values(form_data.values)
      |> form.run()
      |> result.map_error(UpdateWeightUnitInvalidValue),
    )

    use <- bool.guard(when: weight_unit == user.weight_unit, return: Ok(Nil))

    case user_sql.update_weight_unit(ctx.db, weight_unit, user.id) {
      Ok(pog.Returned(_, [_, ..])) -> Ok(Nil)
      Ok(pog.Returned(_, [])) -> Error(UpdateWeightUnitNotFound)
      Error(err) -> Error(UpdateWeightUnitDatabaseError(err))
    }
  }

  case result {
    Ok(_) -> {
      ui.get_weight_unit_form()
      |> form.add_values(form_data.values)
      |> ui.weight_unit_form()
      |> web.html(200)
      |> wisp.set_header("HX-Reswap", "none")
    }

    Error(UpdateWeightUnitInvalidValue(form)) -> {
      form
      |> ui.weight_unit_form()
      |> web.html(422)
    }

    Error(UpdateWeightUnitNotFound) -> {
      ui.get_weight_unit_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("weight unit not found"))
      |> ui.weight_unit_form()
      |> web.html(404)
    }

    Error(UpdateWeightUnitDatabaseError(err)) -> {
      wisp.log_error(req.path <> " database error: " <> string.inspect(err))
      ui.get_weight_unit_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> ui.weight_unit_form()
      |> web.html(500)
    }
  }
}
