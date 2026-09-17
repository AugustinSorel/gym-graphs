import app/web
import domains/user/user.{type User}
import features/user/ui
import wisp.{type Request}

pub fn view_account_page(req: Request, user: User) {
  ui.account_details(user)
  |> ui.account_page(req.path)
  |> web.send_html(200)
}
