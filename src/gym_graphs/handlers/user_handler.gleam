import formal/form.{type Form}
import gleam/bool
import gleam/result
import gleam/string
import gym_graphs/ctx.{type Ctx}
import gym_graphs/domains/user.{
  type OneRepMaxAlgorithm, type User, type WeightUnit,
}
import gym_graphs/repos/user_repo
import gym_graphs/schemas/user_schema.{type EditNameSchema}
import gym_graphs/views/user_view
import lustre/element
import pog.{type QueryError}
import wisp.{type Request}

pub fn view_account_page(req: Request, user: User) {
  user_view.account_details(user)
  |> user_view.account_page(req.path)
  |> element.to_string()
  |> wisp.html_response(200)
}

pub fn view_edit_name_page(req: Request, user: User) {
  user_schema.edit_name()
  |> form.add_values([#("name", user.name.value)])
  |> user_view.edit_name_form()
  |> user_view.edit_name_page(req.path, user.name.value)
  |> element.to_string()
  |> wisp.html_response(200)
}

type UpdateNameError {
  UpdateNameValidation(Form(EditNameSchema))
  UpdateNameDatabaseFailure(QueryError)
}

pub fn update_name(req: Request, user: User, ctx: Ctx) {
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      user_schema.edit_name()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(UpdateNameValidation),
    )

    use <- bool.guard(when: input.name == user.name, return: Ok(Nil))

    user_repo.update_name_by_id(ctx.db, input.name, user.id)
    |> result.map_error(UpdateNameDatabaseFailure)
    |> result.replace(Nil)
  }

  case result {
    Ok(Nil) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/account")

    Error(UpdateNameValidation(form)) ->
      form
      |> user_view.edit_name_form()
      |> element.to_string()
      |> wisp.html_response(422)

    Error(UpdateNameDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      user_schema.edit_name()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> user_view.edit_name_form()
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}

type UpdateWeightUnitError {
  UpdateWeightUnitValidation(Form(WeightUnit))
  UpdateWeightUnitDatabaseFailure(QueryError)
}

pub fn update_weight_unit(req: Request, user: User, ctx: Ctx) {
  use formdata <- wisp.require_form(req)

  let result = {
    use weight_unit <- result.try(
      user_schema.weight_unit()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(UpdateWeightUnitValidation),
    )

    use <- bool.guard(when: weight_unit == user.weight_unit, return: Ok(Nil))

    user_repo.update_weight_unit_by_id(ctx.db, weight_unit, user.id)
    |> result.map_error(UpdateWeightUnitDatabaseFailure)
    |> result.replace(Nil)
  }

  case result {
    Ok(Nil) ->
      user_schema.weight_unit()
      |> form.add_values(formdata.values)
      |> user_view.weight_unit_form()
      |> element.to_string()
      |> wisp.html_response(200)

    Error(UpdateWeightUnitValidation(form)) ->
      form
      |> user_view.weight_unit_form()
      |> element.to_string()
      |> wisp.html_response(422)

    Error(UpdateWeightUnitDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      user_schema.weight_unit()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> user_view.weight_unit_form()
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}

type UpdateOneRepMaxAlgorithmError {
  UpdateOneRepMaxAlgorithmValidation(Form(OneRepMaxAlgorithm))
  UpdateOneRepMaxAlgorithmDatabaseFailure(QueryError)
}

pub fn update_one_rep_max_algorithm(req: Request, user: User, ctx: Ctx) {
  use formdata <- wisp.require_form(req)

  let result = {
    use algorithm <- result.try(
      user_schema.one_rep_max_algorithm()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(UpdateOneRepMaxAlgorithmValidation),
    )

    use <- bool.guard(
      when: algorithm == user.one_rep_max_algorithm,
      return: Ok(Nil),
    )

    user_repo.update_one_rep_max_algorithm_by_id(ctx.db, algorithm, user.id)
    |> result.map_error(UpdateOneRepMaxAlgorithmDatabaseFailure)
    |> result.replace(Nil)
  }

  case result {
    Ok(Nil) ->
      user_schema.one_rep_max_algorithm()
      |> form.add_values(formdata.values)
      |> user_view.one_rep_max_algorithm_form()
      |> element.to_string()
      |> wisp.html_response(200)

    Error(UpdateOneRepMaxAlgorithmValidation(form)) ->
      form
      |> user_view.one_rep_max_algorithm_form()
      |> element.to_string()
      |> wisp.html_response(422)

    Error(UpdateOneRepMaxAlgorithmDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      user_schema.one_rep_max_algorithm()
      |> form.add_values([
        #(
          "one_rep_max_algorithm",
          user.one_rep_max_algorithm |> user.one_rep_max_algorithm_to_string(),
        ),
      ])
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> user_view.one_rep_max_algorithm_form()
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}
