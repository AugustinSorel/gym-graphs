package handler

import (
	"log/slog"
	"net/http"

	"github.com/Oudwins/zog"
	"github.com/Oudwins/zog/zhttp"
	"github.com/a-h/templ"
	"github.com/augustinsorel/gym-graphs/internal/cookies"
	"github.com/augustinsorel/gym-graphs/internal/email"
	"github.com/augustinsorel/gym-graphs/internal/middleware"
	"github.com/augustinsorel/gym-graphs/internal/schema"
	"github.com/augustinsorel/gym-graphs/internal/service"
	"github.com/augustinsorel/gym-graphs/internal/session"
	"github.com/augustinsorel/gym-graphs/web/signup"
	"github.com/augustinsorel/gym-graphs/web/ui/layout"
)

type SignUpHandler struct {
	userSvc   *service.UserService
	signUpSvc *service.SignUpService
	mailer    email.Mailer
}

func NewSignUpHandler(userSvc *service.UserService, signUpSessionSvc *service.SignUpService, mailer email.Mailer) *SignUpHandler {
	return &SignUpHandler{userSvc: userSvc, signUpSvc: signUpSessionSvc, mailer: mailer}
}

func (h *SignUpHandler) ViewStartPage(w http.ResponseWriter, r *http.Request) {
	page := signup.SignUpPage()

	ctx := templ.WithChildren(r.Context(), page)

	err := layout.Layout().Render(ctx, w)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		slog.Error("failed to render sign up page", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
}

func (h *SignUpHandler) Start(w http.ResponseWriter, r *http.Request) {
	var input schema.Start

	errs := schema.StartInput.Parse(zhttp.Request(r), &input)

	if errs != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)

		form := signup.SignUpFormValues{
			Email: input.Email,
		}

		fieldErrors := zog.Issues.Flatten(errs)

		formErrs := signup.SignUpFormErr{
			Email: firstErr(fieldErrors, "email"),
			Root:  firstErr(fieldErrors, "root"),
		}

		err := signup.SignUpForm(form, formErrs).Render(r.Context(), w)

		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			slog.Error("failed to render sign up form", "error", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	taken, err := h.userSvc.IsEmailTaken(r.Context(), input.Email)

	if err != nil {
		slog.Error("failed to check email availability", "error", err)
		w.WriteHeader(http.StatusInternalServerError)

		formErrs := signup.SignUpFormErr{
			Root: "something went wrong, please try again",
		}

		formValues := signup.SignUpFormValues{Email: input.Email}

		err := signup.SignUpForm(formValues, formErrs).Render(r.Context(), w)

		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			slog.Error("failed to render sign up form", "error", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	if taken {
		w.WriteHeader(http.StatusUnprocessableEntity)

		formErrs := signup.SignUpFormErr{
			Root: "an account with this email already exists",
		}

		formValues := signup.SignUpFormValues{Email: input.Email}

		err := signup.SignUpForm(formValues, formErrs).Render(r.Context(), w)

		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			slog.Error("failed to render sign up form", "error", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	signUpSession, err := h.signUpSvc.Create(r.Context(), input.Email)

	if err != nil {
		slog.Error("failed to create sign up session", "error", err)
		w.WriteHeader(http.StatusInternalServerError)

		formErrs := signup.SignUpFormErr{
			Root: "something went wrong, please try again",
		}

		formValues := signup.SignUpFormValues{Email: input.Email}

		err := signup.SignUpForm(formValues, formErrs).Render(r.Context(), w)

		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			slog.Error("failed to render sign up form", "error", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	if err := h.mailer.Send(r.Context(), email.NewSignUpVerificationEmail(input.Email, signUpSession.VerificationCode)); err != nil {
		slog.Error("failed to send sign up verification email", "error", err)
		w.WriteHeader(http.StatusInternalServerError)

		formErrs := signup.SignUpFormErr{
			Root: "something went wrong, please try again",
		}

		formValues := signup.SignUpFormValues{Email: input.Email}

		if renderErr := signup.SignUpForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render sign up form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	cookies.SetSignUpSession(w, session.CreateToken(signUpSession.ID, signUpSession.Secret))

	w.Header().Set("HX-Redirect", "/sign-up/verify-email-address")
	w.WriteHeader(http.StatusCreated)
}

func (h *SignUpHandler) ViewVerifyEmailPage(w http.ResponseWriter, r *http.Request) {
	page := signup.VerifyEmailPage()

	ctx := templ.WithChildren(r.Context(), page)

	err := layout.Layout().Render(ctx, w)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		slog.Error("failed to render verify email page", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
}

func (h *SignUpHandler) VerifyEmail(w http.ResponseWriter, r *http.Request) {
	signUpSession, _ := middleware.GetSignUpSession(r.Context())

	var input schema.VerifyEmail

	errs := schema.VerifyEmailInput.Parse(zhttp.Request(r), &input)

	if errs != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)

		form := signup.VerifyEmailFormValues{
			Code: input.Code,
		}

		fieldErrors := zog.Issues.Flatten(errs)

		formErrs := signup.VerifyEmailFormErr{
			Code: firstErr(fieldErrors, "code"),
			Root: firstErr(fieldErrors, "root"),
		}

		err := signup.VerifyEmailForm(form, formErrs).Render(r.Context(), w)

		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			slog.Error("failed to render verify email form", "error", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	if err := h.signUpSvc.VerifyCode(signUpSession.EmailAddressVerificationCode, input.Code); err != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)

		formErrs := signup.VerifyEmailFormErr{
			Code: "invalid verification code",
		}

		formValues := signup.VerifyEmailFormValues{Code: input.Code}

		if renderErr := signup.VerifyEmailForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render verify email form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	if _, err := h.signUpSvc.MarkEmailAsVerified(r.Context(), signUpSession.ID); err != nil {
		slog.Error("failed to mark email as verified", "error", err)
		w.WriteHeader(http.StatusInternalServerError)

		formErrs := signup.VerifyEmailFormErr{
			Root: "something went wrong, please try again",
		}

		formValues := signup.VerifyEmailFormValues{Code: input.Code}

		if renderErr := signup.VerifyEmailForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render verify email form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	w.Header().Set("HX-Redirect", "/sign-up/set-password")
	w.WriteHeader(http.StatusOK)
}

func (h *SignUpHandler) ResendVerificationCode(w http.ResponseWriter, r *http.Request) {
	signUpSession, _ := middleware.GetSignUpSession(r.Context())

	if err := h.mailer.Send(r.Context(), email.NewSignUpVerificationEmail(signUpSession.EmailAddress, signUpSession.EmailAddressVerificationCode)); err != nil {
		slog.Error("failed to resend sign up verification email", "error", err)
		w.WriteHeader(http.StatusInternalServerError)

		formErrs := signup.VerifyEmailFormErr{
			Root: "failed to resend verification code, please try again",
		}

		formValues := signup.VerifyEmailFormValues{Code: r.FormValue("code")}

		if renderErr := signup.VerifyEmailForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render verify email form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	form := signup.VerifyEmailFormValues{
		SuccessMsg: "a new verification code has been sent to your email address.",
		Code:       r.FormValue("code"),
	}

	err := signup.VerifyEmailForm(form, signup.VerifyEmailFormErr{}).Render(r.Context(), w)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		slog.Error("failed to render verify email form", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

func (h *SignUpHandler) ViewSetPasswordPage(w http.ResponseWriter, r *http.Request) {
	page := signup.SetPasswordPage()

	ctx := templ.WithChildren(r.Context(), page)

	err := layout.Layout().Render(ctx, w)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		slog.Error("failed to render set password page", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
}

func (h *SignUpHandler) SetPassword(w http.ResponseWriter, r *http.Request) {
	signUpSession, _ := middleware.GetSignUpSession(r.Context())

	var input schema.SetPassword

	errs := schema.SetPasswordInput.Parse(zhttp.Request(r), &input)
	if errs != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)

		fieldErrors := zog.Issues.Flatten(errs)

		formErrs := signup.SetPasswordFormErr{
			Password: firstErr(fieldErrors, "password"),
			Root:     firstErr(fieldErrors, "root"),
		}

		formValues := signup.SetPasswordFormValues{
			Email:    signUpSession.EmailAddress,
			Password: input.Password,
		}

		err := signup.SetPasswordForm(formValues, formErrs).Render(r.Context(), w)
		if err != nil {
			slog.Error("failed to render set password form", "error", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	taken, err := h.userSvc.IsEmailTaken(r.Context(), signUpSession.EmailAddress)
	if err != nil {
		slog.Error("failed to check email availability", "error", err)
		w.WriteHeader(http.StatusInternalServerError)

		formErrs := signup.SetPasswordFormErr{Root: "something went wrong, please try again"}
		formValues := signup.SetPasswordFormValues{Email: signUpSession.EmailAddress, Password: input.Password}

		if renderErr := signup.SetPasswordForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render set password form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	if taken {
		w.WriteHeader(http.StatusUnprocessableEntity)

		formErrs := signup.SetPasswordFormErr{Root: "an account with this email already exists"}
		formValues := signup.SetPasswordFormValues{Email: signUpSession.EmailAddress, Password: input.Password}

		if renderErr := signup.SetPasswordForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render set password form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	authSession, err := h.signUpSvc.Complete(r.Context(), signUpSession, input.Password)
	if err != nil {
		slog.Error("failed to complete sign up", "error", err)
		w.WriteHeader(http.StatusInternalServerError)

		formErrs := signup.SetPasswordFormErr{Root: "something went wrong, please try again"}
		formValues := signup.SetPasswordFormValues{Email: signUpSession.EmailAddress, Password: input.Password}

		if renderErr := signup.SetPasswordForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render set password form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	cookies.ClearSignUpSession(w)
	cookies.SetAuthSession(w, session.CreateToken(authSession.ID, authSession.RawSecret))

	w.Header().Set("HX-Redirect", "/")
	w.WriteHeader(http.StatusCreated)
}

func (h *SignUpHandler) CancelVerifyEmail(w http.ResponseWriter, r *http.Request) {
	signUpSession, _ := middleware.GetSignUpSession(r.Context())

	err := h.signUpSvc.Cancel(r.Context(), signUpSession.ID)

	if err != nil {
		slog.Error("failed to cancel sign up session", "error", err)
	}

	cookies.ClearSignUpSession(w)

	w.Header().Set("HX-Redirect", "/sign-up")
	w.WriteHeader(http.StatusOK)
}
