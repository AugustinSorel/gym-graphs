package handler

import (
	"log/slog"
	"net/http"

	"github.com/Oudwins/zog"
	"github.com/Oudwins/zog/zhttp"
	"github.com/a-h/templ"
	"github.com/augustinsorel/gym-graphs/internal/cookies"
	"github.com/augustinsorel/gym-graphs/internal/middleware"
	"github.com/augustinsorel/gym-graphs/internal/password"
	"github.com/augustinsorel/gym-graphs/internal/schema"
	"github.com/augustinsorel/gym-graphs/internal/service"
	"github.com/augustinsorel/gym-graphs/internal/session"
	"github.com/augustinsorel/gym-graphs/web/account"
	"github.com/augustinsorel/gym-graphs/web/ui/layout"
	"github.com/augustinsorel/gym-graphs/web/updatepassword"
)

type UpdatePasswordHandler struct {
	userSvc           *service.UserService
	passwordUpdateSvc *service.PasswordUpdateService
}

func NewUpdatePasswordHandler(userSvc *service.UserService, passwordUpdateSvc *service.PasswordUpdateService) *UpdatePasswordHandler {
	return &UpdatePasswordHandler{userSvc: userSvc, passwordUpdateSvc: passwordUpdateSvc}
}

func (h *UpdatePasswordHandler) Start(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	updateSession, err := h.passwordUpdateSvc.Create(r.Context(), authSession.ID)
	if err != nil {
		slog.Error("failed to create password update session", "path", r.URL.Path, "error", err)
		w.WriteHeader(http.StatusInternalServerError)

		if renderErr := account.UpdatePasswordRow("something went wrong").Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render update password row", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	cookies.SetPasswordUpdateSession(w, session.CreateToken(updateSession.ID, updateSession.Secret))

	w.Header().Set("HX-Redirect", "/update-password/verify-password")
	w.WriteHeader(http.StatusCreated)
}

func (h *UpdatePasswordHandler) ViewVerifyPasswordPage(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	user, err := h.userSvc.GetByID(r.Context(), authSession.UserID)
	if err != nil {
		slog.Error("failed to get user for verify password page", "error", err)
		w.WriteHeader(http.StatusInternalServerError)

		page := updatepassword.VerifyPasswordPage(
			updatepassword.VerifyPasswordFormValues{},
			updatepassword.VerifyPasswordFormErr{Root: "something went wrong, please try again"},
		)
		ctx := templ.WithChildren(r.Context(), page)

		if renderErr := layout.Layout(r.URL.Path).Render(ctx, w); renderErr != nil {
			slog.Error("failed to render verify password page", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	page := updatepassword.VerifyPasswordPage(
		updatepassword.VerifyPasswordFormValues{Email: user.EmailAddress},
		updatepassword.VerifyPasswordFormErr{},
	)
	ctx := templ.WithChildren(r.Context(), page)

	if renderErr := layout.Layout(r.URL.Path).Render(ctx, w); renderErr != nil {
		slog.Error("failed to render verify password page", "error", renderErr)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

func (h *UpdatePasswordHandler) ViewSetNewPasswordPage(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	user, err := h.userSvc.GetByID(r.Context(), authSession.UserID)
	if err != nil {
		slog.Error("failed to get user for set new password page", "error", err)
		w.WriteHeader(http.StatusInternalServerError)

		page := updatepassword.SetNewPasswordPage(
			updatepassword.SetNewPasswordFormValues{},
			updatepassword.SetNewPasswordFormErr{Root: "something went wrong, please try again"},
		)
		ctx := templ.WithChildren(r.Context(), page)

		if renderErr := layout.Layout(r.URL.Path).Render(ctx, w); renderErr != nil {
			slog.Error("failed to render set new password page", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	page := updatepassword.SetNewPasswordPage(
		updatepassword.SetNewPasswordFormValues{Email: user.EmailAddress},
		updatepassword.SetNewPasswordFormErr{},
	)
	ctx := templ.WithChildren(r.Context(), page)

	if renderErr := layout.Layout(r.URL.Path).Render(ctx, w); renderErr != nil {
		slog.Error("failed to render set new password page", "error", renderErr)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

func (h *UpdatePasswordHandler) VerifyPassword(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())
	updateSession, _ := middleware.GetPasswordUpdateSession(r.Context())

	var input schema.VerifyCurrentPassword

	errs := schema.VerifyCurrentPasswordInput.Parse(zhttp.Request(r), &input)

	if errs != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)

		fieldErrors := zog.Issues.Flatten(errs)

		formErrs := updatepassword.VerifyPasswordFormErr{
			Password: firstErr(fieldErrors, "password"),
			Root:     firstErr(fieldErrors, "root"),
		}
		formValues := updatepassword.VerifyPasswordFormValues{
			Email:    r.FormValue("email"),
			Password: input.Password,
		}

		if renderErr := updatepassword.VerifyPasswordForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render verify password form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	user, err := h.userSvc.GetByID(r.Context(), authSession.UserID)

	if err != nil {
		slog.Error("failed to get user during password verification", "error", err)
		w.WriteHeader(http.StatusInternalServerError)

		formErrs := updatepassword.VerifyPasswordFormErr{Root: "something went wrong, please try again"}
		formValues := updatepassword.VerifyPasswordFormValues{
			Email:    r.FormValue("email"),
			Password: input.Password,
		}

		if renderErr := updatepassword.VerifyPasswordForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render verify password form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	if !password.Verify(input.Password, user.PasswordHash, user.PasswordSalt) {
		w.WriteHeader(http.StatusUnprocessableEntity)

		formErrs := updatepassword.VerifyPasswordFormErr{Root: "incorrect password"}
		formValues := updatepassword.VerifyPasswordFormValues{
			Email:    r.FormValue("email"),
			Password: input.Password,
		}

		if renderErr := updatepassword.VerifyPasswordForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render verify password form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	if _, err := h.passwordUpdateSvc.MarkAsVerified(r.Context(), updateSession.ID); err != nil {
		slog.Error("failed to mark password update session as verified", "error", err)
		w.WriteHeader(http.StatusInternalServerError)

		formErrs := updatepassword.VerifyPasswordFormErr{Root: "something went wrong, please try again"}
		formValues := updatepassword.VerifyPasswordFormValues{
			Email:    r.FormValue("email"),
			Password: input.Password,
		}

		if renderErr := updatepassword.VerifyPasswordForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render verify password form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	w.Header().Set("HX-Redirect", "/update-password/set-new-password")
	w.WriteHeader(http.StatusCreated)
}

func (h *UpdatePasswordHandler) Cancel(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())
	updateSession, _ := middleware.GetPasswordUpdateSession(r.Context())

	if authSession.ID != updateSession.AuthSessionID {
		cookies.ClearPasswordUpdateSession(w)
		w.Header().Set("HX-Redirect", "/account")
		w.WriteHeader(http.StatusOK)
		return
	}

	if err := h.passwordUpdateSvc.Cancel(r.Context(), updateSession.ID); err != nil {
		slog.Error("failed to cancel password update session", "path", r.URL.Path, "error", err)
		w.WriteHeader(http.StatusInternalServerError)

		formErrs := updatepassword.SetNewPasswordFormErr{Root: "something went wrong, please try again"}
		formValues := updatepassword.SetNewPasswordFormValues{Email: r.FormValue("email")}

		if renderErr := updatepassword.SetNewPasswordForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render set new password form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	cookies.ClearPasswordUpdateSession(w)
	w.Header().Set("HX-Redirect", "/account")
	w.WriteHeader(http.StatusOK)
}

func (h *UpdatePasswordHandler) SetNewPassword(w http.ResponseWriter, r *http.Request) {
	updateSession, _ := middleware.GetPasswordUpdateSession(r.Context())

	var input schema.SetNewPassword

	errs := schema.SetNewPasswordInput.Parse(zhttp.Request(r), &input)

	if errs != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)

		fieldErrors := zog.Issues.Flatten(errs)

		formErrs := updatepassword.SetNewPasswordFormErr{
			Password: firstErr(fieldErrors, "password"),
			Root:     firstErr(fieldErrors, "root"),
		}
		formValues := updatepassword.SetNewPasswordFormValues{
			Email:    r.FormValue("email"),
			Password: input.Password,
		}

		if renderErr := updatepassword.SetNewPasswordForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render set new password form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	if err := h.passwordUpdateSvc.Complete(r.Context(), updateSession.ID, input.Password); err != nil {
		slog.Error("failed to complete password update", "path", r.URL.Path, "error", err)
		w.WriteHeader(http.StatusInternalServerError)

		formErrs := updatepassword.SetNewPasswordFormErr{Root: "something went wrong, please try again"}
		formValues := updatepassword.SetNewPasswordFormValues{
			Email:    r.FormValue("email"),
			Password: input.Password,
		}

		if renderErr := updatepassword.SetNewPasswordForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render set new password form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	cookies.ClearPasswordUpdateSession(w)

	w.Header().Set("HX-Redirect", "/account")
	w.WriteHeader(http.StatusCreated)
}
