import formal/form.{type Form}
import gleam/result
import gleam/string
import gym_graphs/ctx.{type Ctx}
import gym_graphs/domains/user.{type User}
import gym_graphs/repos/tag_repo
import gym_graphs/schemas/tag_schema.{type CreateTagSchema}
import gym_graphs/views/tag_view
import lustre/element
import pog.{type QueryError}
import wisp.{type Request}

pub fn view_create_page(req: Request) {
  tag_schema.create()
  |> tag_view.create_tag_form()
  |> tag_view.create_tag_page(req.path)
  |> element.to_string()
  |> wisp.html_response(200)
}

type CreateTagError {
  CreateTagValidation(Form(CreateTagSchema))
  CreateTagDatabaseFailure(QueryError)
}

pub fn create(req: Request, user: User, ctx: Ctx) {
  use formdata <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      tag_schema.create()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(CreateTagValidation),
    )

    tag_repo.create(ctx.db, user.id, input.name)
    |> result.map_error(CreateTagDatabaseFailure)
  }

  case result {
    Ok(_) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/account")

    Error(CreateTagValidation(form)) ->
      form
      |> tag_view.create_tag_form()
      |> element.to_string()
      |> wisp.html_response(422)

    Error(CreateTagDatabaseFailure(pog.ConstraintViolated(
      message: _,
      constraint: "tags_user_id_name_key",
      detail: _,
    ))) ->
      tag_schema.create()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Tag name is already used."))
      |> tag_view.create_tag_form()
      |> element.to_string()
      |> wisp.html_response(409)

    Error(CreateTagDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      tag_schema.create()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> tag_view.create_tag_form()
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}
