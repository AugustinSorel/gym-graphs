import gleam/bytes_tree
import gleam/option
import gleam/string
import gleam/time/timestamp
import gym_graphs/ctx.{type Ctx}
import gym_graphs/domains/user.{type User}
import gym_graphs/services/export_data_service
import gym_graphs/views/user_view
import lustre/element
import wisp.{type Request}

pub fn download(req: Request, user: User, ctx: Ctx) {
  case export_data_service.prepare(ctx.db, user.id, timestamp.system_time()) {
    Ok(export) -> {
      let body = bytes_tree.from_string(export.content)
      wisp.response(200)
      |> wisp.file_download_from_memory(
        named: export.filename,
        containing: body,
      )
      |> wisp.set_header("content-type", "application/json; charset=utf-8")
      |> wisp.set_header("cache-control", "private, no-store")
      |> wisp.set_header("x-content-type-options", "nosniff")
    }

    Error(error) -> {
      wisp.log_error(req.path <> " " <> string.inspect(error))
      user_view.export_data_row(option.Some("something went wrong"))
      |> element.to_string()
      |> wisp.html_response(500)
      |> wisp.set_header("cache-control", "private, no-store")
    }
  }
}
