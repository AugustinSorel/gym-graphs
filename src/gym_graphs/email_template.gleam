import gym_graphs/domains/password_reset_session
import gym_graphs/domains/sign_up_session.{type EmailVerificationCode}
import lustre/attribute
import lustre/element
import lustre/element/html

pub fn verification_code(code: EmailVerificationCode) {
  html.html([attribute.attribute("lang", "en")], [
    html.head([], [
      html.meta([attribute.attribute("charset", "UTF-8")]),
      html.meta([
        attribute.attribute("name", "viewport"),
        attribute.attribute("content", "width=device-width, initial-scale=1.0"),
      ]),
      html.style(
        [],
        "
        *{
          margin: 0;
          padding: 0;
        }
        body {
          font-family: Arial, sans-serif;
        }
        .container {
          margin: 3rem auto;
          padding: 3rem;
          text-align: center;
        }
        h1 {
          font-size: 3rem;
          color: #000;
          font-weight: normal;
          margin-bottom: 16px;
        }
        .code {
          display: inline-block;
          font-weight:bold;
          font-size: 2rem;
          background-color: #000;
          color: #fff;
          padding: 2rem;
          margin: 2rem 0;
        }
        .footer {
          font-size: 0.75rem;
          color: #aaaaaa;
          margin-top: 32px;
        }
      ",
      ),
    ]),
    html.body([], [
      html.div([attribute.class("container")], [
        html.h1([], [element.text("Your Verification Code")]),
        html.strong([attribute.class("code")], [element.text(code.value)]),
        html.footer([attribute.class("footer")], [
          html.p([], [
            element.text(
              "If you did not request this code, you can safely ignore this email.",
            ),
          ]),
          html.p([], [
            element.text("This is an automated message. Please do not reply."),
          ]),
        ]),
      ]),
    ]),
  ])
  |> fn(html) { #("Your verification code - " <> code.value, html) }
}

pub fn reset_password_code(code: password_reset_session.EmailVerificationCode) {
  html.html([attribute.attribute("lang", "en")], [
    html.head([], [
      html.meta([attribute.attribute("charset", "UTF-8")]),
      html.meta([
        attribute.attribute("name", "viewport"),
        attribute.attribute("content", "width=device-width, initial-scale=1.0"),
      ]),
      html.style(
        [],
        "
        *{
          margin: 0;
          padding: 0;
        }
        body {
          font-family: Arial, sans-serif;
        }
        .container {
          margin: 3rem auto;
          padding: 3rem;
          text-align: center;
        }
        h1 {
          font-size: 3rem;
          color: #000;
          font-weight: normal;
          margin-bottom: 16px;
        }
        .code {
          display: inline-block;
          font-weight:bold;
          font-size: 2rem;
          background-color: #000;
          color: #fff;
          padding: 2rem;
          margin: 2rem 0;
        }
        .footer {
          font-size: 0.75rem;
          color: #aaaaaa;
          margin-top: 32px;
        }
      ",
      ),
    ]),
    html.body([], [
      html.div([attribute.class("container")], [
        html.h1([], [element.text("Your password reset Code")]),
        html.strong([attribute.class("code")], [element.text(code.value)]),
        html.footer([attribute.class("footer")], [
          html.p([], [
            element.text(
              "If you did not request this code, you can safely ignore this email.",
            ),
          ]),
          html.p([], [
            element.text("This is an automated message. Please do not reply."),
          ]),
        ]),
      ]),
    ]),
  ])
  |> fn(html) { #("Your password reset code - " <> code.value, html) }
}
