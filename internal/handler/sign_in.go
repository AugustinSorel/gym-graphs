package handler

import (
	"errors"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/Oudwins/zog"
	"github.com/Oudwins/zog/zhttp"
	"github.com/a-h/templ"
	"github.com/augustinsorel/gym-graphs/internal/cookies"
	"github.com/augustinsorel/gym-graphs/internal/password"
	"github.com/augustinsorel/gym-graphs/internal/ratelimit"
	"github.com/augustinsorel/gym-graphs/internal/schema"
	"github.com/augustinsorel/gym-graphs/internal/service"
	"github.com/augustinsorel/gym-graphs/internal/session"
	"github.com/augustinsorel/gym-graphs/web/signin"
	"github.com/augustinsorel/gym-graphs/web/ui/layout"
)

type SignInHandler struct {
	userSvc               *service.UserService
	authSessionSvc        *service.AuthSessionService
	passwordAuthRateLimit *ratelimit.Limit
}

func NewSignInHandler(userSvc *service.UserService, authSessionSvc *service.AuthSessionService, passwordAuthRateLimit *ratelimit.Limit) *SignInHandler {
	return &SignInHandler{userSvc: userSvc, authSessionSvc: authSessionSvc, passwordAuthRateLimit: passwordAuthRateLimit}
}

func (h *SignInHandler) ViewPage(w http.ResponseWriter, r *http.Request) {
	page := signin.SignInPage()

	ctx := templ.WithChildren(r.Context(), page)

	err := layout.Layout().Render(ctx, w)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		slog.Error("failed to render sign in page", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
}

func (h *SignInHandler) SignIn(w http.ResponseWriter, r *http.Request) {
	var input schema.SignIn

	errs := schema.SignInInput.Parse(zhttp.Request(r), &input)

	if errs != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)

		fieldErrors := zog.Issues.Flatten(errs)

		formErrs := signin.SignInFormErr{
			Email:    firstErr(fieldErrors, "email"),
			Password: firstErr(fieldErrors, "password"),
			Root:     firstErr(fieldErrors, "root"),
		}

		formValues := signin.SignInFormValues{
			Email:    input.Email,
			Password: input.Password,
		}

		err := signin.SignInForm(formValues, formErrs).Render(r.Context(), w)

		if err != nil {
			slog.Error("failed to render sign in form", "error", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	user, err := h.userSvc.GetByEmail(r.Context(), input.Email)

	if err == nil && !h.passwordAuthRateLimit.Consume(fmt.Sprintf("%d", user.ID)) {
		w.WriteHeader(http.StatusTooManyRequests)

		formErrs := signin.SignInFormErr{
			Root: "too many attempts, please try again later",
		}

		formValues := signin.SignInFormValues{
			Email:    input.Email,
			Password: input.Password,
		}

		if renderErr := signin.SignInForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render sign in form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	if errors.Is(err, service.ErrUserNotFound) || (err == nil && !password.Verify(input.Password, user.PasswordHash, user.PasswordSalt)) {
		w.WriteHeader(http.StatusUnprocessableEntity)

		formErrs := signin.SignInFormErr{
			Root: "invalid email or password",
		}

		formValues := signin.SignInFormValues{
			Email:    input.Email,
			Password: input.Password,
		}

		if renderErr := signin.SignInForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render sign in form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	if err != nil {
		slog.Error("failed to get user by email", "error", err)
		w.WriteHeader(http.StatusInternalServerError)

		formErrs := signin.SignInFormErr{
			Root: "something went wrong, please try again",
		}

		formValues := signin.SignInFormValues{
			Email:    input.Email,
			Password: input.Password,
		}

		if renderErr := signin.SignInForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render sign in form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	authSession, err := h.authSessionSvc.Create(r.Context(), user.ID)

	if err != nil {
		slog.Error("failed to create auth session", "error", err)
		w.WriteHeader(http.StatusInternalServerError)

		formErrs := signin.SignInFormErr{
			Root: "something went wrong, please try again",
		}

		formValues := signin.SignInFormValues{
			Email:    input.Email,
			Password: input.Password,
		}

		if renderErr := signin.SignInForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render sign in form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	cookies.SetAuthSession(w, session.CreateToken(authSession.ID, authSession.RawSecret))

	w.Header().Set("HX-Redirect", "/exercises")
	w.WriteHeader(http.StatusOK)
}
