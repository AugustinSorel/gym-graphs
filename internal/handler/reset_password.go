package handler

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/Oudwins/zog"
	"github.com/Oudwins/zog/zhttp"
	"github.com/a-h/templ"
	"github.com/augustinsorel/gym-graphs/internal/cookies"
	"github.com/augustinsorel/gym-graphs/internal/middleware"
	"github.com/augustinsorel/gym-graphs/internal/schema"
	"github.com/augustinsorel/gym-graphs/internal/service"
	"github.com/augustinsorel/gym-graphs/internal/session"
	"github.com/augustinsorel/gym-graphs/web/resetpassword"
	"github.com/augustinsorel/gym-graphs/web/ui/layout"
)

type ResetPasswordHandler struct {
	userSvc          *service.UserService
	passwordResetSvc *service.PasswordResetService
}

func NewResetPasswordHandler(userSvc *service.UserService, passwordResetSvc *service.PasswordResetService) *ResetPasswordHandler {
	return &ResetPasswordHandler{userSvc: userSvc, passwordResetSvc: passwordResetSvc}
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

	// TODO: send email with resetSession.EmailCode
	slog.Info("password reset code created", "code", resetSession.EmailCode)

	cookies.SetPasswordResetSession(w, session.CreateToken(resetSession.ID, resetSession.Secret))

	w.Header().Set("HX-Redirect", "/reset-password/verify-email")
	w.WriteHeader(http.StatusCreated)
}
