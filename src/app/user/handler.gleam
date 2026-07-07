import app/auth_session/auth_session
import app/ctx.{type Ctx}
import app/db
import app/one_rep_max
import app/tag/tag
import app/user/ui.{type EditNameForm}
import app/user/user
import app/web
import formal/form.{type Form}
import gleam/bool
import gleam/int
import gleam/list
import gleam/result
import gleam/string
import wisp.{type Request, type Response}

pub fn view_one_rep_max_algorithm_graph(req: Request, ctx: Ctx) -> Response {
  use _session, user <- auth_session.require(req, ctx)

  let query = wisp.get_query(req)

  let width =
    list.key_find(query, "width")
    |> result.try(int.parse)
    |> result.unwrap(400)

  let height =
    list.key_find(query, "height")
    |> result.try(int.parse)
    |> result.unwrap(200)

  ui.one_rep_max_algorithm_graph(
    width:,
    height:,
    algorithm: user.one_rep_max_algorithm,
  )
  |> web.svg(200)
}

pub fn view_account_page(req: Request, ctx: Ctx) -> Response {
  use _session, user <- auth_session.require(req, ctx)

  let tags = tag.select_by_user_id(ctx.db, user.id) |> result.unwrap([])

  ui.account_details(user, tags)
  |> ui.account_page(req)
  |> web.html(200)
}

pub fn view_edit_name_page(req: Request, ctx: Ctx) {
  use _session, user <- auth_session.require(req, ctx)

  ui.get_edit_name_form()
  |> form.add_values([#("name", user.name)])
  |> ui.edit_name_form()
  |> ui.edit_name_page(req)
  |> web.html(200)
}

type UpdateNameError {
  UpdateNameValidation(Form(EditNameForm))
  UpdateNameFailed(db.DatabaseError)
}

pub fn update_name(req: Request, ctx: Ctx) -> Response {
  use _session, user <- auth_session.require(req, ctx)
  use form_data <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      ui.get_edit_name_form()
      |> form.add_values(form_data.values)
      |> form.run()
      |> result.map_error(UpdateNameValidation),
    )

    use <- bool.guard(when: input.name == user.name, return: Ok(Nil))

    user.update_name(ctx.db, input.name, user.id)
    |> result.map_error(UpdateNameFailed)
    |> result.replace(Nil)
  }

  case result {
    Ok(Nil) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/account")

    Error(UpdateNameValidation(invalid_form)) ->
      invalid_form
      |> ui.edit_name_form()
      |> web.html(422)

    Error(UpdateNameFailed(db.DatabaseFailure(error))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_edit_name_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> ui.edit_name_form()
      |> web.html(500)
    }
    Error(UpdateNameFailed(db.RowNotFound)) -> {
      ui.get_edit_name_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("user not found"))
      |> ui.edit_name_form()
      |> web.html(404)
    }
  }
}

type UpdateWeightUnitError {
  UpdateWeightUnitInvalidValue(Form(user.WeightUnit))
  UpdateWeightUnitFailed(db.DatabaseError)
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

    user.update_weight_unit(ctx.db, weight_unit, user.id)
    |> result.replace(Nil)
    |> result.map_error(UpdateWeightUnitFailed)
  }

  case result {
    Ok(Nil) -> {
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

    Error(UpdateWeightUnitFailed(db.DatabaseFailure(error))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_weight_unit_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> ui.weight_unit_form()
      |> web.html(500)
    }
    Error(UpdateWeightUnitFailed(db.RowNotFound)) -> {
      ui.get_weight_unit_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("weight unit not found"))
      |> ui.weight_unit_form()
      |> web.html(404)
    }
  }
}

type UpdateOneRepMaxAlgorithmError {
  UpdateOneRepMaxAlgorithmInvalidValue(Form(one_rep_max.Algorithm))
  UpdateOneRepMaxAlgorithmFailed(db.DatabaseError)
}

pub fn update_one_rep_max_algorithm(req: Request, ctx: Ctx) -> Response {
  use _session, current_user <- auth_session.require(req, ctx)
  use form_data <- wisp.require_form(req)

  let result = {
    use algorithm <- result.try(
      ui.get_one_rep_max_algorithm_form()
      |> form.add_values(form_data.values)
      |> form.run()
      |> result.map_error(UpdateOneRepMaxAlgorithmInvalidValue),
    )

    use <- bool.guard(
      when: algorithm == current_user.one_rep_max_algorithm,
      return: Ok(Nil),
    )

    user.update_one_rep_max_algorithm(ctx.db, algorithm, current_user.id)
    |> result.replace(Nil)
    |> result.map_error(UpdateOneRepMaxAlgorithmFailed)
  }

  case result {
    Ok(Nil) -> {
      ui.get_one_rep_max_algorithm_form()
      |> form.add_values(form_data.values)
      |> ui.one_rep_max_algorithm_form()
      |> web.html(200)
      |> wisp.set_header("HX-Reswap", "none")
      |> wisp.set_header("HX-Trigger", "one-rep-max-algorithm-changed")
    }

    Error(UpdateOneRepMaxAlgorithmInvalidValue(invalid_form)) -> {
      invalid_form
      |> ui.one_rep_max_algorithm_form()
      |> web.html(422)
    }

    Error(UpdateOneRepMaxAlgorithmFailed(db.DatabaseFailure(error))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_one_rep_max_algorithm_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> ui.one_rep_max_algorithm_form()
      |> web.html(500)
    }

    Error(UpdateOneRepMaxAlgorithmFailed(db.RowNotFound)) -> {
      ui.get_one_rep_max_algorithm_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("user not found"))
      |> ui.one_rep_max_algorithm_form()
      |> web.html(404)
    }
  }
}
