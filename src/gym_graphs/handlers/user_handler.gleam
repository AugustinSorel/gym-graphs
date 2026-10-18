import formal/form.{type Form}
import gleam/bool
import gleam/result
import gleam/string
import gym_graphs/ctx.{type Ctx}
import gym_graphs/domains/user.{type User}
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
