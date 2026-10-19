import formal/form.{type Form}
import gleam/bool
import gleam/int
import gleam/option
import gleam/result
import gleam/string
import gym_graphs/ctx.{type Ctx}
import gym_graphs/domains/tag.{type TagId}
import gym_graphs/domains/user.{type User}
import gym_graphs/repos/tag_repo
import gym_graphs/schemas/tag_schema.{type CreateTagSchema, type RenameTagSchema}
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

pub type ViewRenameTagPageError {
  ViewRenameTagPageInvalidId
  ViewRenameTagPageDatabaseFailure(QueryError)
  ViewRenameTagPageTagNotFound(TagId)
}

pub fn view_rename_page(req: Request, user: User, ctx: Ctx, tag_id: String) {
  let result = {
    use id <- result.try(
      parse_tag_id(tag_id)
      |> result.replace_error(ViewRenameTagPageInvalidId),
    )

    tag_repo.select_by_id_and_user_id(ctx.db, id, user.id)
    |> result.map_error(ViewRenameTagPageDatabaseFailure)
    |> result.try(option.to_result(_, ViewRenameTagPageTagNotFound(id)))
  }

  case result {
    Ok(selected_tag) ->
      tag_schema.rename()
      |> form.add_values([#("name", selected_tag.name.value)])
      |> tag_view.rename_tag_form(option.Some(selected_tag.id))
      |> tag_view.rename_tag_page(req.path)
      |> element.to_string()
      |> wisp.html_response(200)

    Error(ViewRenameTagPageInvalidId) -> {
      tag_schema.rename()
      |> form.add_error("root", form.CustomError("tag not found"))
      |> tag_view.rename_tag_form(option.None)
      |> tag_view.rename_tag_page(req.path)
      |> element.to_string()
      |> wisp.html_response(422)
    }
    Error(ViewRenameTagPageTagNotFound(id)) -> {
      tag_schema.rename()
      |> form.add_error("root", form.CustomError("tag not found"))
      |> tag_view.rename_tag_form(option.Some(id))
      |> tag_view.rename_tag_page(req.path)
      |> element.to_string()
      |> wisp.html_response(404)
    }
    Error(ViewRenameTagPageDatabaseFailure(error)) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      tag_schema.rename()
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> tag_view.rename_tag_form(option.None)
      |> tag_view.rename_tag_page(req.path)
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}

type RenameTagError {
  RenameTagInvalidId
  RenameTagValidation(Form(RenameTagSchema))
  RenameTagNotFound
  RenameTagDatabaseFailure(QueryError)
}

pub fn rename(req: Request, user: User, ctx: Ctx, tag_id: String) {
  use formdata <- wisp.require_form(req)

  let result = {
    use id <- result.try(
      parse_tag_id(tag_id)
      |> result.replace_error(RenameTagInvalidId),
    )

    use input <- result.try(
      tag_schema.rename()
      |> form.add_values(formdata.values)
      |> form.run()
      |> result.map_error(RenameTagValidation),
    )

    tag_repo.update_name_by_id_and_user_id(ctx.db, id, user.id, input.name)
    |> result.map_error(RenameTagDatabaseFailure)
    |> result.try(option.to_result(_, RenameTagNotFound))
  }

  case result {
    Ok(_) ->
      wisp.ok()
      |> wisp.set_header("HX-Redirect", "/account")

    Error(RenameTagInvalidId) -> wisp.not_found()

    Error(RenameTagValidation(form)) -> {
      let assert Ok(id) = parse_tag_id(tag_id)
      form
      |> tag_view.rename_tag_form(option.Some(id))
      |> element.to_string()
      |> wisp.html_response(422)
    }

    Error(RenameTagNotFound) -> wisp.not_found()

    Error(RenameTagDatabaseFailure(pog.ConstraintViolated(
      message: _,
      constraint: "tags_user_id_name_key",
      detail: _,
    ))) -> {
      let assert Ok(id) = parse_tag_id(tag_id)
      tag_schema.rename()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Tag name is already used."))
      |> tag_view.rename_tag_form(option.Some(id))
      |> element.to_string()
      |> wisp.html_response(409)
    }

    Error(RenameTagDatabaseFailure(error)) -> {
      let assert Ok(id) = parse_tag_id(tag_id)
      wisp.log_error(req.path <> " " <> string.inspect(error))
      tag_schema.rename()
      |> form.add_values(formdata.values)
      |> form.add_error("root", form.CustomError("Something went wrong."))
      |> tag_view.rename_tag_form(option.Some(id))
      |> element.to_string()
      |> wisp.html_response(500)
    }
  }
}

fn parse_tag_id(value: String) -> Result(TagId, Nil) {
  use id <- result.try(int.parse(value) |> result.replace_error(Nil))
  use <- bool.guard(when: id <= 0, return: Error(Nil))

  Ok(tag.TagId(id))
}
