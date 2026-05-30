import app/verify_email_address/ui
import app/web
import wisp.{type Request}

pub fn view_verify_email_address_page() {
  ui.verify_email_address_page()
  |> web.html(200)
}

pub fn verify_email_address(_req: Request) {
  //TODO: validate the verification code
  wisp.ok()
}

pub fn resend_verification_code(_req: Request) {
  //TODO: resend the verification code email
  wisp.ok()
}
