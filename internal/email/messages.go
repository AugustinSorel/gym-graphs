package email

func NewSignUpVerificationEmail(to, code string) Message {
	return Message{
		To:      to,
		Subject: "Your Verification Code",
		HTML:    signUpVerificationCodeHTML(code),
	}
}

func NewPasswordResetEmail(to, code string) Message {
	return Message{
		To:      to,
		Subject: "Your Password Reset Code",
		HTML:    passwordResetCodeHTML(code),
	}
}

func signUpVerificationCodeHTML(code string) string {
	return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>*{margin:0;padding:0}body{font-family:Arial,sans-serif}.container{margin:3rem auto;padding:3rem;text-align:center}h1{font-size:3rem;color:#000;font-weight:normal;margin-bottom:16px}.code{display:inline-block;font-weight:bold;font-size:2rem;background-color:#000;color:#fff;padding:2rem;margin:2rem 0}.footer{font-size:.75rem;color:#aaaaaa;margin-top:32px}</style></head><body><div class="container"><h1>Your Verification Code</h1><strong class="code">` + code + `</strong><footer class="footer"><p>If you did not request this code, you can safely ignore this email.</p><p>This is an automated message. Please do not reply.</p></footer></div></body></html>`
}

func passwordResetCodeHTML(code string) string {
	return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>*{margin:0;padding:0}body{font-family:Arial,sans-serif}.container{margin:3rem auto;padding:3rem;text-align:center}h1{font-size:3rem;color:#000;font-weight:normal;margin-bottom:16px}.code{display:inline-block;font-weight:bold;font-size:2rem;background-color:#000;color:#fff;padding:2rem;margin:2rem 0}.footer{font-size:.75rem;color:#aaaaaa;margin-top:32px}</style></head><body><div class="container"><h1>Your password reset Code</h1><strong class="code">` + code + `</strong><footer class="footer"><p>If you did not request this code, you can safely ignore this email.</p><p>This is an automated message. Please do not reply.</p></footer></div></body></html>`
}
