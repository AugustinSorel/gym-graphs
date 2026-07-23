package handler

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/Oudwins/zog"
	"github.com/Oudwins/zog/zhttp"
	"github.com/a-h/templ"
	"github.com/augustinsorel/gym-graphs/internal/schema"
	"github.com/augustinsorel/gym-graphs/internal/service"
	"github.com/augustinsorel/gym-graphs/web/signup"
	"github.com/augustinsorel/gym-graphs/web/ui/layout"
)

type SignUpHandler struct {
	userSvc   *service.UserService
	signUpSvc *service.SignUpService
}

func NewSignUpHandler(userSvc *service.UserService, signUpSessionSvc *service.SignUpService) *SignUpHandler {
	return &SignUpHandler{userSvc: userSvc, signUpSvc: signUpSessionSvc}
}

func (h *SignUpHandler) ViewStartPage(w http.ResponseWriter, r *http.Request) {
	//TODO: auth
	page := signup.SignUpPage()

	ctx := templ.WithChildren(r.Context(), page)

	err := layout.Layout().Render(ctx, w)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		slog.Error(err.Error())
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
}

func (h *SignUpHandler) Start(w http.ResponseWriter, r *http.Request) {
	//TODO: auth
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
			slog.Error(err.Error())
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
			slog.Error(err.Error())
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
			slog.Error(err.Error())
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
			slog.Error(err.Error())
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	//TODO: send email

	cookie := &http.Cookie{
		Name:     "sign_up_session_token",
		Value:    service.CreateSessionToken(signUpSession.ID, signUpSession.Secret),
		Path:     "/",
		Expires:  time.Now().Add(24 * time.Hour),
		MaxAge:   86400,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
	}

	http.SetCookie(w, cookie)

	w.Header().Set("HX-Redirect", "/sign-up/verify-email-address")
	w.WriteHeader(http.StatusCreated)
}

func (h *SignUpHandler) ViewVerifyEmailPage(w http.ResponseWriter, r *http.Request) {
	//TODO: auth
	page := signup.VerifyEmailPage()

	ctx := templ.WithChildren(r.Context(), page)

	err := layout.Layout().Render(ctx, w)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		slog.Error(err.Error())
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
}

func (h *SignUpHandler) VerifyEmail(w http.ResponseWriter, r *http.Request) {
	//TODO: auth
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
			slog.Error(err.Error())
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	//TODO: verify code against session

	w.Header().Set("HX-Redirect", "/sign-up/set-password")
	w.WriteHeader(http.StatusOK)
}

func (h *SignUpHandler) ResendVerificationCode(w http.ResponseWriter, r *http.Request) {
	//TODO: auth + resend email

	form := signup.VerifyEmailFormValues{
		SuccessMsg: "a new verification code has been sent to your email address.",
	}

	err := signup.VerifyEmailForm(form, signup.VerifyEmailFormErr{}).Render(r.Context(), w)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		slog.Error(err.Error())
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

func (h *SignUpHandler) CancelVerifyEmail(w http.ResponseWriter, r *http.Request) {
	//TODO: auth + cancel session

	w.Header().Set("HX-Redirect", "/sign-up")
	w.WriteHeader(http.StatusOK)
}
