import gleam/http.{Delete, Get, Patch, Post}
import gym_graphs/ctx.{type Ctx}
import gym_graphs/handlers/account_deletion_session_handler
import gym_graphs/handlers/auth_session_handler
import gym_graphs/handlers/data_export_handler
import gym_graphs/handlers/data_import_handler
import gym_graphs/handlers/exercise_handler
import gym_graphs/handlers/home_handler
import gym_graphs/handlers/password_reset_session_handler
import gym_graphs/handlers/password_update_session_handler
import gym_graphs/handlers/sign_up_session_handler
import gym_graphs/handlers/stats_handler
import gym_graphs/handlers/tag_handler
import gym_graphs/handlers/user_handler
import gym_graphs/handlers/workout_set_handler
import gym_graphs/middlewares/account_deletion_session_middleware
import gym_graphs/middlewares/auth_session_middleware
import gym_graphs/middlewares/password_reset_session_middleware
import gym_graphs/middlewares/password_update_session_middleware
import gym_graphs/middlewares/sign_up_session_middleware
import gym_graphs/web
import wisp.{type Request}

pub fn handle_request(req: Request, ctx: Ctx) {
  use req <- web.middleware(req)

  case req.method, wisp.path_segments(req) {
    Get, [] -> {
      use <- auth_session_middleware.require_blank(req, ctx)
      home_handler.view_page()
    }

    Get, ["sign-up"] -> {
      use <- auth_session_middleware.require_blank(req, ctx)
      sign_up_session_handler.view_start_page()
    }
    Post, ["sign-up"] -> {
      use <- auth_session_middleware.require_blank(req, ctx)
      sign_up_session_handler.start(req, ctx)
    }
    Get, ["sign-up", "verify-email-address"] -> {
      use <- auth_session_middleware.require_blank(req, ctx)
      use _sign_up_session <- sign_up_session_middleware.require_unverified(
        req,
        ctx,
      )

      sign_up_session_handler.view_verify_email_page()
    }
    Post, ["sign-up", "verify-email-address"] -> {
      use <- auth_session_middleware.require_blank(req, ctx)
      use sign_up_session <- sign_up_session_middleware.require_unverified(
        req,
        ctx,
      )

      sign_up_session_handler.verify_email(req, sign_up_session, ctx)
    }
    Post, ["sign-up", "verify-email-address", "resend"] -> {
      use <- auth_session_middleware.require_blank(req, ctx)
      use sign_up_session <- sign_up_session_middleware.require_unverified(
        req,
        ctx,
      )

      sign_up_session_handler.resend(req, sign_up_session, ctx)
    }
    Post, ["sign-up", "verify-email-address", "cancel"] -> {
      use <- auth_session_middleware.require_blank(req, ctx)
      use sign_up_session <- sign_up_session_middleware.require_unverified(
        req,
        ctx,
      )

      sign_up_session_handler.cancel(req, sign_up_session, ctx)
    }
    Get, ["sign-up", "set-password"] -> {
      use <- auth_session_middleware.require_blank(req, ctx)
      use sign_up_session <- sign_up_session_middleware.require_verified(
        req,
        ctx,
      )

      sign_up_session_handler.view_set_password_page(sign_up_session)
    }
    Post, ["sign-up", "set-password"] -> {
      use <- auth_session_middleware.require_blank(req, ctx)
      use sign_up_session <- sign_up_session_middleware.require_verified(
        req,
        ctx,
      )

      sign_up_session_handler.set_password(req, sign_up_session, ctx)
    }

    Get, ["reset-password"] -> {
      password_reset_session_handler.view_page()
    }
    Post, ["reset-password"] -> {
      password_reset_session_handler.start(req, ctx)
    }
    Get, ["reset-password", "verify-email-code"] -> {
      use _password_reset_session <- password_reset_session_middleware.require_unverified(
        req,
        ctx,
      )

      password_reset_session_handler.view_verify_page()
    }
    Post, ["reset-password", "verify-email-code"] -> {
      use password_reset_session <- password_reset_session_middleware.require_unverified(
        req,
        ctx,
      )

      password_reset_session_handler.verify(req, password_reset_session, ctx)
    }
    Post, ["reset-password", "verify-email-code", "cancel"] -> {
      use password_reset_session <- password_reset_session_middleware.require(
        req,
        ctx,
      )

      password_reset_session_handler.cancel(req, password_reset_session, ctx)
    }
    Get, ["reset-password", "set-new-password"] -> {
      use password_reset_session <- password_reset_session_middleware.require_verified(
        req,
        ctx,
      )

      password_reset_session_handler.view_set_new_password_page(
        req,
        password_reset_session,
        ctx,
      )
    }
    Post, ["reset-password", "set-new-password"] -> {
      use password_reset_session <- password_reset_session_middleware.require_verified(
        req,
        ctx,
      )
      password_reset_session_handler.set_new_password(
        req,
        password_reset_session,
        ctx,
      )
    }

    Post, ["update-password"] -> {
      use auth_session, _user <- auth_session_middleware.require(req, ctx)

      password_update_session_handler.start(req, auth_session, ctx)
    }
    Get, ["update-password", "verify-password"] -> {
      use _password_update_session, user <- password_update_session_middleware.require_unverified(
        req,
        ctx,
      )

      password_update_session_handler.view_verify_password_page(user)
    }
    Post, ["update-password", "verify-password"] -> {
      use password_update_session, user <- password_update_session_middleware.require_unverified(
        req,
        ctx,
      )

      password_update_session_handler.verify_password(
        req,
        password_update_session,
        user,
        ctx,
      )
    }
    Get, ["update-password", "set-new-password"] -> {
      use _password_update_session, user <- password_update_session_middleware.require_verified(
        req,
        ctx,
      )

      password_update_session_handler.view_set_new_password_page(user)
    }
    Post, ["update-password", "set-new-password"] -> {
      use password_update_session, _user <- password_update_session_middleware.require_verified(
        req,
        ctx,
      )

      password_update_session_handler.set_new_password(
        req,
        password_update_session,
        ctx,
      )
    }
    Post, ["update-password", "cancel"] -> {
      use auth_session, _user <- auth_session_middleware.require(req, ctx)
      use password_update_session <- password_update_session_middleware.require(
        req,
        ctx,
      )

      password_update_session_handler.cancel(
        req,
        auth_session,
        password_update_session,
        ctx,
      )
    }

    Post, ["delete-account"] -> {
      use auth_session, _user <- auth_session_middleware.require(req, ctx)

      account_deletion_session_handler.start(req, auth_session, ctx)
    }
    Get, ["delete-account", "verify-password"] -> {
      use _account_deletion_session, user <- account_deletion_session_middleware.require_unverified(
        req,
        ctx,
      )

      account_deletion_session_handler.view_verify_password_page(user)
    }
    Post, ["delete-account", "verify-password"] -> {
      use account_deletion_session, user <- account_deletion_session_middleware.require_unverified(
        req,
        ctx,
      )

      account_deletion_session_handler.verify_password(
        req,
        account_deletion_session,
        user,
        ctx,
      )
    }
    Get, ["delete-account", "confirm"] -> {
      use _account_deletion_session, _user <- account_deletion_session_middleware.require_verified(
        req,
        ctx,
      )

      account_deletion_session_handler.view_confirm_page()
    }
    Post, ["delete-account", "confirm"] -> {
      use account_deletion_session, _user <- account_deletion_session_middleware.require_verified(
        req,
        ctx,
      )

      account_deletion_session_handler.confirm(
        req,
        account_deletion_session,
        ctx,
      )
    }
    Post, ["delete-account", "cancel"] -> {
      use auth_session, _user <- auth_session_middleware.require(req, ctx)
      use account_deletion_session <- account_deletion_session_middleware.require(
        req,
        ctx,
      )

      account_deletion_session_handler.cancel(
        req,
        auth_session,
        account_deletion_session,
        ctx,
      )
    }

    Get, ["sign-in"] -> {
      use <- auth_session_middleware.require_blank(req, ctx)

      auth_session_handler.view_sign_in_page()
    }
    Post, ["sign-in"] -> {
      use <- auth_session_middleware.require_blank(req, ctx)

      auth_session_handler.sign_in(req, ctx)
    }

    Get, ["account"] -> {
      use _auth_session, user <- auth_session_middleware.require(req, ctx)

      user_handler.view_account_page(req, user, ctx)
    }
    Get, ["exercises"] -> {
      use _auth_session, user <- auth_session_middleware.require(req, ctx)

      exercise_handler.view_page(req, user, ctx)
    }
    Post, ["exercises"] -> {
      use _auth_session, user <- auth_session_middleware.require(req, ctx)

      exercise_handler.create(req, user, ctx)
    }
    Get, ["exercises", "new"] -> {
      use _auth_session, user <- auth_session_middleware.require(req, ctx)

      exercise_handler.view_new_page(req, user, ctx)
    }
    Get, ["exercises", "rows"] -> {
      use _auth_session, user <- auth_session_middleware.require(req, ctx)

      exercise_handler.view_rows(req, user, ctx)
    }
    Get, ["exercises", exercise_id] -> {
      use _auth_session, user <- auth_session_middleware.require(req, ctx)

      exercise_handler.view_detail_page(req, user, ctx, exercise_id)
    }
    Patch, ["exercises", exercise_id, "tags"] -> {
      use _auth_session, user <- auth_session_middleware.require(req, ctx)

      exercise_handler.update_tags(req, user, ctx, exercise_id)
    }
    Get, ["exercises", exercise_id, "sets"] -> {
      use _auth_session, user <- auth_session_middleware.require(req, ctx)

      exercise_handler.view_set_rows(req, user, ctx, exercise_id)
    }
    Get, ["exercises", exercise_id, "sets", "new"] -> {
      use _auth_session, user <- auth_session_middleware.require(req, ctx)

      workout_set_handler.view_new_page(req, user, ctx, exercise_id)
    }
    Post, ["exercises", exercise_id, "sets", "new"] -> {
      use _auth_session, user <- auth_session_middleware.require(req, ctx)

      workout_set_handler.create(req, user, ctx, exercise_id)
    }
    Get, ["exercises", exercise_id, "sets", "row"] -> {
      use _auth_session, user <- auth_session_middleware.require(req, ctx)

      workout_set_handler.view_new_row(req, user, ctx, exercise_id)
    }
    Get, ["exercises", exercise_id, "sets", set_id, "edit"] -> {
      use _auth_session, user <- auth_session_middleware.require(req, ctx)

      workout_set_handler.view_edit_page(req, user, ctx, exercise_id, set_id)
    }
    Patch, ["exercises", exercise_id, "sets", set_id] -> {
      use _auth_session, user <- auth_session_middleware.require(req, ctx)

      workout_set_handler.update(req, user, ctx, exercise_id, set_id)
    }
    Get, ["exercises", exercise_id, "sets", set_id, "confirm-delete"] -> {
      use _auth_session, user <- auth_session_middleware.require(req, ctx)

      workout_set_handler.view_remove_page(req, user, ctx, exercise_id, set_id)
    }
    Delete, ["exercises", exercise_id, "sets", set_id] -> {
      use _auth_session, user <- auth_session_middleware.require(req, ctx)

      workout_set_handler.remove(req, user, ctx, exercise_id, set_id)
    }
    Get, ["exercises", exercise_id, "name"] -> {
      use _auth_session, user <- auth_session_middleware.require(req, ctx)

      exercise_handler.view_rename_page(req, user, ctx, exercise_id)
    }
    Patch, ["exercises", exercise_id, "name"] -> {
      use _auth_session, user <- auth_session_middleware.require(req, ctx)

      exercise_handler.rename(req, user, ctx, exercise_id)
    }
    Get, ["exercises", exercise_id, "confirm-delete"] -> {
      use _auth_session, user <- auth_session_middleware.require(req, ctx)

      exercise_handler.view_remove_page(req, user, ctx, exercise_id)
    }
    Delete, ["exercises", exercise_id] -> {
      use _auth_session, user <- auth_session_middleware.require(req, ctx)

      exercise_handler.remove(req, user, ctx, exercise_id)
    }
    Get, ["stats"] -> {
      use _auth_session, user <- auth_session_middleware.require(req, ctx)

      stats_handler.view_page(req, user, ctx)
    }
    Get, ["account", "export"] -> {
      use _auth_session, user <- auth_session_middleware.require(req, ctx)

      data_export_handler.download(req, user, ctx)
    }
    Post, ["account", "import"] -> {
      use _auth_session, user <- auth_session_middleware.require(req, ctx)

      req
      |> wisp.set_max_body_size(64_000)
      |> wisp.set_max_files_size(5_000_000)
      |> data_import_handler.upload(user, ctx)
    }
    Get, ["account", "tags"] -> {
      use _auth_session, user <- auth_session_middleware.require(req, ctx)

      user_handler.view_tags_rows(req, user, ctx)
    }
    Get, ["account", "name"] -> {
      use _auth_session, user <- auth_session_middleware.require(req, ctx)

      user_handler.view_edit_name_page(req, user)
    }
    Patch, ["account", "name"] -> {
      use _auth_session, user <- auth_session_middleware.require(req, ctx)

      user_handler.update_name(req, user, ctx)
    }
    _, ["account", "name"] -> wisp.method_not_allowed([Get, Patch])
    Patch, ["account", "weight-unit"] -> {
      use _auth_session, user <- auth_session_middleware.require(req, ctx)

      user_handler.update_weight_unit(req, user, ctx)
    }
    Patch, ["account", "one-rep-max-algorithm"] -> {
      use _auth_session, user <- auth_session_middleware.require(req, ctx)

      user_handler.update_one_rep_max_algorithm(req, user, ctx)
    }

    Get, ["tags", "new"] -> {
      use _auth_session, _user <- auth_session_middleware.require(req, ctx)

      tag_handler.view_create_page(req)
    }
    Post, ["tags", "new"] -> {
      use _auth_session, user <- auth_session_middleware.require(req, ctx)

      tag_handler.create(req, user, ctx)
    }
    Get, ["tags", tag_id, "name"] -> {
      use _auth_session, user <- auth_session_middleware.require(req, ctx)

      tag_handler.view_rename_page(req, user, ctx, tag_id)
    }
    Patch, ["tags", tag_id, "name"] -> {
      use _auth_session, user <- auth_session_middleware.require(req, ctx)

      tag_handler.rename(req, user, ctx, tag_id)
    }
    Get, ["tags", tag_id, "confirm-delete"] -> {
      use _auth_session, user <- auth_session_middleware.require(req, ctx)

      tag_handler.view_remove_page(req, user, ctx, tag_id)
    }
    Delete, ["tags", tag_id] -> {
      use _auth_session, user <- auth_session_middleware.require(req, ctx)

      tag_handler.remove(req, user, ctx, tag_id)
    }

    Post, ["sign-out"] -> {
      use auth_session, _user <- auth_session_middleware.require(req, ctx)

      auth_session_handler.sign_out(req, auth_session, ctx)
    }

    _, _ -> wisp.not_found()
  }
}
