package handler

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/Oudwins/zog"
	"github.com/Oudwins/zog/zhttp"
	"github.com/a-h/templ"
	"github.com/augustinsorel/gym-graphs/internal/cookies"
	"github.com/augustinsorel/gym-graphs/internal/email"
	"github.com/augustinsorel/gym-graphs/internal/middleware"
	"github.com/augustinsorel/gym-graphs/internal/password"
	"github.com/augustinsorel/gym-graphs/internal/schema"
	"github.com/augustinsorel/gym-graphs/internal/service"
	"github.com/augustinsorel/gym-graphs/internal/session"
	"github.com/augustinsorel/gym-graphs/web/resetpassword"
	"github.com/augustinsorel/gym-graphs/web/ui/layout"
)

type ResetPasswordHandler struct {
	userSvc          *service.UserService
	passwordResetSvc *service.PasswordResetService
	emailSvc         *email.Service
}

func NewResetPasswordHandler(userSvc *service.UserService, passwordResetSvc *service.PasswordResetService, emailSvc *email.Service) *ResetPasswordHandler {
	return &ResetPasswordHandler{userSvc: userSvc, passwordResetSvc: passwordResetSvc, emailSvc: emailSvc}
}

func (h *ResetPasswordHandler) VerifyEmail(w http.ResponseWriter, r *http.Request) {
	resetSession, _ := middleware.GetPasswordResetSession(r.Context())

	var input schema.VerifyPasswordResetCode

	errs := schema.VerifyPasswordResetCodeInput.Parse(zhttp.Request(r), &input)

	if errs != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)

		fieldErrors := zog.Issues.Flatten(errs)

		formErrs := resetpassword.VerifyEmailFormErr{
			Code: firstErr(fieldErrors, "code"),
			Root: firstErr(fieldErrors, "root"),
		}

		formValues := resetpassword.VerifyEmailFormValues{Code: input.Code}

		if renderErr := resetpassword.VerifyEmailForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render verify email form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	if !password.Verify(input.Code, resetSession.EmailCodeHash, resetSession.EmailCodeSalt) {
		w.WriteHeader(http.StatusUnprocessableEntity)

		formErrs := resetpassword.VerifyEmailFormErr{Code: "invalid verification code"}
		formValues := resetpassword.VerifyEmailFormValues{Code: input.Code}

		if renderErr := resetpassword.VerifyEmailForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render verify email form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	if _, err := h.passwordResetSvc.MarkAsVerified(r.Context(), resetSession.ID); err != nil {
		slog.Error("failed to mark password reset session as verified", "error", err)
		w.WriteHeader(http.StatusInternalServerError)

		formErrs := resetpassword.VerifyEmailFormErr{Root: "something went wrong, please try again"}
		formValues := resetpassword.VerifyEmailFormValues{Code: input.Code}

		if renderErr := resetpassword.VerifyEmailForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render verify email form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	w.Header().Set("HX-Redirect", "/reset-password/set-new-password")
	w.WriteHeader(http.StatusOK)
}

func (h *ResetPasswordHandler) CancelVerifyEmail(w http.ResponseWriter, r *http.Request) {
	resetSession, _ := middleware.GetPasswordResetSession(r.Context())

	if err := h.passwordResetSvc.Cancel(r.Context(), resetSession.ID); err != nil {
		//FIX
		slog.Error("failed to cancel password reset session", "error", err)
	}

	cookies.ClearPasswordResetSession(w)

	w.Header().Set("HX-Redirect", "/reset-password")
	w.WriteHeader(http.StatusOK)
}

func (h *ResetPasswordHandler) SetPassword(w http.ResponseWriter, r *http.Request) {
	resetSession, _ := middleware.GetPasswordResetSession(r.Context())

	var input schema.SetPassword

	errs := schema.SetPasswordInput.Parse(zhttp.Request(r), &input)

	if errs != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)

		fieldErrors := zog.Issues.Flatten(errs)

		formErrs := resetpassword.SetPasswordFormErr{
			Password: firstErr(fieldErrors, "password"),
			Root:     firstErr(fieldErrors, "root"),
		}

		formValues := resetpassword.SetPasswordFormValues{
			Email:    r.FormValue("email"),
			Password: input.Password,
		}

		if renderErr := resetpassword.SetPasswordForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render set password form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	authSession, err := h.passwordResetSvc.Complete(r.Context(), resetSession.ID, resetSession.UserID, input.Password)

	if err != nil {
		slog.Error("failed to complete password reset", "error", err)
		w.WriteHeader(http.StatusInternalServerError)

		formErrs := resetpassword.SetPasswordFormErr{Root: "something went wrong, please try again"}
		formValues := resetpassword.SetPasswordFormValues{
			Email:    r.FormValue("email"),
			Password: input.Password,
		}

		if renderErr := resetpassword.SetPasswordForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render set password form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	cookies.ClearPasswordResetSession(w)
	cookies.SetAuthSession(w, session.CreateToken(authSession.ID, authSession.RawSecret))

	w.Header().Set("HX-Redirect", "/")
	w.WriteHeader(http.StatusCreated)
}

func (h *ResetPasswordHandler) ViewSetPasswordPage(w http.ResponseWriter, r *http.Request) {
	resetSession, _ := middleware.GetPasswordResetSession(r.Context())

	user, err := h.userSvc.GetByPasswordResetSessionID(r.Context(), resetSession.ID)

	if err != nil {
		slog.Error("failed to get user by password reset session id", "error", err)
		w.WriteHeader(http.StatusInternalServerError)

		page := resetpassword.SetPasswordPage(
			resetpassword.SetPasswordFormValues{},
			resetpassword.SetPasswordFormErr{Root: "something went wrong, please try again"},
		)
		ctx := templ.WithChildren(r.Context(), page)

		if renderErr := layout.Layout().Render(ctx, w); renderErr != nil {
			slog.Error("failed to render set password page", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	page := resetpassword.SetPasswordPage(
		resetpassword.SetPasswordFormValues{Email: user.EmailAddress},
		resetpassword.SetPasswordFormErr{},
	)
	ctx := templ.WithChildren(r.Context(), page)

	if renderErr := layout.Layout().Render(ctx, w); renderErr != nil {
		slog.Error("failed to render set password page", "error", renderErr)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

func (h *ResetPasswordHandler) ViewVerifyEmailPage(w http.ResponseWriter, r *http.Request) {
	page := resetpassword.VerifyEmailPage()

	ctx := templ.WithChildren(r.Context(), page)

	err := layout.Layout().Render(ctx, w)

	if err != nil {
		slog.Error("failed to render reset password verify email page", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
}

func (h *ResetPasswordHandler) ViewPage(w http.ResponseWriter, r *http.Request) {
	page := resetpassword.ResetPasswordPage()

	ctx := templ.WithChildren(r.Context(), page)

	err := layout.Layout().Render(ctx, w)

	if err != nil {
		slog.Error("failed to render reset password page", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
}

func (h *ResetPasswordHandler) Start(w http.ResponseWriter, r *http.Request) {
	var input schema.ResetPassword

	errs := schema.ResetPasswordInput.Parse(zhttp.Request(r), &input)

	if errs != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)

		fieldErrors := zog.Issues.Flatten(errs)

		formErrs := resetpassword.ResetPasswordFormErr{
			Email: firstErr(fieldErrors, "email"),
			Root:  firstErr(fieldErrors, "root"),
		}

		formValues := resetpassword.ResetPasswordFormValues{Email: input.Email}

		if renderErr := resetpassword.ResetPasswordForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render reset password form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	user, err := h.userSvc.GetByEmail(r.Context(), input.Email)

	if errors.Is(err, service.ErrUserNotFound) {
		w.WriteHeader(http.StatusNotFound)

		formErrs := resetpassword.ResetPasswordFormErr{Root: "account not found"}
		formValues := resetpassword.ResetPasswordFormValues{Email: input.Email}

		if renderErr := resetpassword.ResetPasswordForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render reset password form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	if err != nil {
		slog.Error("failed to get user by email during password reset", "error", err)
		w.WriteHeader(http.StatusInternalServerError)

		formErrs := resetpassword.ResetPasswordFormErr{Root: "something went wrong, please try again"}
		formValues := resetpassword.ResetPasswordFormValues{Email: input.Email}

		if renderErr := resetpassword.ResetPasswordForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render reset password form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	resetSession, err := h.passwordResetSvc.Create(r.Context(), user.EmailAddress)

	if err != nil {
		slog.Error("failed to create password reset session", "error", err)
		w.WriteHeader(http.StatusInternalServerError)

		formErrs := resetpassword.ResetPasswordFormErr{Root: "something went wrong, please try again"}
		formValues := resetpassword.ResetPasswordFormValues{Email: input.Email}

		if renderErr := resetpassword.ResetPasswordForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render reset password form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	if err := h.emailSvc.SendPasswordResetCode(r.Context(), input.Email, resetSession.EmailCode); err != nil {
		slog.Error("failed to send password reset email", "error", err)
		w.WriteHeader(http.StatusInternalServerError)

		formErrs := resetpassword.ResetPasswordFormErr{Root: "something went wrong, please try again"}
		formValues := resetpassword.ResetPasswordFormValues{Email: input.Email}

		if renderErr := resetpassword.ResetPasswordForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render reset password form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	cookies.SetPasswordResetSession(w, session.CreateToken(resetSession.ID, resetSession.Secret))

	w.Header().Set("HX-Redirect", "/reset-password/verify-email-code")
	w.WriteHeader(http.StatusCreated)
}
