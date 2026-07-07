import app/auth_session/auth_session
import app/ctx.{type Ctx}
import app/db
import app/tag/tag
import app/tag/ui
import app/web
import formal/form.{type Form}
import gleam/int
import gleam/result
import gleam/string
import pog
import wisp.{type Request, type Response}

pub fn view_new_tag_page(req: Request, ctx: Ctx) -> Response {
  use _session, _user <- auth_session.require(req, ctx)

  ui.get_new_tag_form()
  |> ui.new_tag_form()
  |> ui.new_tag_page(req)
  |> web.html(200)
}

pub fn view_remove_tag_page(
  req: Request,
  ctx: Ctx,
  tag_id: String,
) -> Response {
  use _session, user <- auth_session.require(req, ctx)

  let result = {
    use id <- result.try(int.parse(tag_id) |> result.replace_error(InvalidId))

    tag.select_by_id_and_user_id(ctx.db, id, user.id)
    |> result.map_error(SelectFailed)
  }

  case result {
    Error(InvalidId) -> {
      "invalid tag id"
      |> ui.remove_tag_alert
      |> ui.remove_tag_page(req)
      |> web.html(422)
    }
    Error(SelectFailed(db.RowNotFound)) -> {
      "tag not found"
      |> ui.remove_tag_alert()
      |> ui.remove_tag_page(req)
      |> web.html(404)
    }
    Error(SelectFailed(db.DatabaseFailure(err))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(err))
      "something went wrong"
      |> ui.remove_tag_alert()
      |> ui.remove_tag_page(req)
      |> web.html(500)
    }
    Ok(t) ->
      ui.remove_tag_dialog(t)
      |> ui.remove_tag_page(req)
      |> web.html(200)
  }
}

type ViewRenameTagPageError {
  InvalidId
  SelectFailed(db.DatabaseError)
}

pub fn view_rename_tag_page(
  req: Request,
  ctx: Ctx,
  tag_id: String,
) -> Response {
  use _session, user <- auth_session.require(req, ctx)

  let result = {
    use id <- result.try(int.parse(tag_id) |> result.replace_error(InvalidId))

    tag.select_by_id_and_user_id(ctx.db, id, user.id)
    |> result.map_error(SelectFailed)
  }

  case result {
    Error(InvalidId) -> {
      ui.get_rename_form()
      |> form.add_error("root", form.CustomError("invalid tag id"))
      |> ui.rename_tag_form(tag_id)
      |> ui.rename_tag_page(req)
      |> web.html(422)
    }
    Error(SelectFailed(db.RowNotFound)) -> {
      ui.get_rename_form()
      |> form.add_error("root", form.CustomError("tag not found"))
      |> ui.rename_tag_form(tag_id)
      |> ui.rename_tag_page(req)
      |> web.html(404)
    }
    Error(SelectFailed(db.DatabaseFailure(err))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(err))
      ui.get_rename_form()
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> ui.rename_tag_form(tag_id)
      |> ui.rename_tag_page(req)
      |> web.html(500)
    }
    Ok(t) ->
      ui.get_rename_form()
      |> form.add_values([#("name", t.name)])
      |> ui.rename_tag_form(tag_id)
      |> ui.rename_tag_page(req)
      |> web.html(200)
  }
}

type RenameTagError {
  RenameTagInvalidId
  RenameTagValidation(Form(ui.RenameForm))
  RenameTagFailed(db.DatabaseError)
}

type CreateTagError {
  CreateTagValidation(Form(ui.NewTagForm))
  CreateTagFailed(db.DatabaseError)
}

pub fn rename_tag(req: Request, ctx: Ctx, tag_id: String) -> Response {
  use _session, user <- auth_session.require(req, ctx)
  use form_data <- wisp.require_form(req)

  let result = {
    use id <- result.try(
      int.parse(tag_id) |> result.replace_error(RenameTagInvalidId),
    )

    use input <- result.try(
      ui.get_rename_form()
      |> form.add_values(form_data.values)
      |> form.run()
      |> result.map_error(RenameTagValidation),
    )

    tag.rename(ctx.db, id, user.id, input.name)
    |> result.map_error(RenameTagFailed)
    |> result.replace(Nil)
  }

  case result {
    Ok(Nil) -> wisp.ok() |> wisp.set_header("HX-Redirect", "/account")

    Error(RenameTagInvalidId) ->
      ui.get_rename_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("invalid tag id"))
      |> ui.rename_tag_form(tag_id)
      |> web.html(422)

    Error(RenameTagValidation(invalid_form)) ->
      invalid_form
      |> ui.rename_tag_form(tag_id)
      |> web.html(422)

    Error(RenameTagFailed(db.RowNotFound)) ->
      ui.get_rename_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("tag not found"))
      |> ui.rename_tag_form(tag_id)
      |> web.html(404)

    Error(RenameTagFailed(db.DatabaseFailure(pog.ConstraintViolated(
      message: _,
      constraint: _,
      detail: _,
    )))) ->
      ui.get_rename_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("tag name is already used"))
      |> ui.rename_tag_form(tag_id)
      |> web.html(422)

    Error(RenameTagFailed(db.DatabaseFailure(error))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_rename_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> ui.rename_tag_form(tag_id)
      |> web.html(500)
    }
  }
}

pub fn create_tag(req: Request, ctx: Ctx) -> Response {
  use _session, user <- auth_session.require(req, ctx)
  use form_data <- wisp.require_form(req)

  let result = {
    use input <- result.try(
      ui.get_new_tag_form()
      |> form.add_values(form_data.values)
      |> form.run()
      |> result.map_error(CreateTagValidation),
    )

    tag.create(ctx.db, user.id, input.name)
    |> result.map_error(CreateTagFailed)
    |> result.replace(Nil)
  }

  case result {
    Ok(Nil) ->
      wisp.created()
      |> wisp.set_header("HX-Redirect", "/tags")

    Error(CreateTagValidation(invalid_form)) ->
      invalid_form
      |> ui.new_tag_form()
      |> web.html(422)

    Error(CreateTagFailed(db.DatabaseFailure(pog.ConstraintViolated(
      message: _,
      constraint: _,
      detail: _,
    )))) ->
      ui.get_new_tag_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("tag name is already used"))
      |> ui.new_tag_form()
      |> web.html(422)

    Error(CreateTagFailed(db.DatabaseFailure(error))) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      ui.get_new_tag_form()
      |> form.add_values(form_data.values)
      |> form.add_error("root", form.CustomError("something went wrong"))
      |> ui.new_tag_form()
      |> web.html(500)
    }

    Error(CreateTagFailed(db.RowNotFound)) -> wisp.internal_server_error()
  }
}
