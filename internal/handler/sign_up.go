package handler

import (
	"log/slog"
	"net/http"

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

func (h *SignUpHandler) Get(w http.ResponseWriter, r *http.Request) {
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

func (h *SignUpHandler) Post(w http.ResponseWriter, r *http.Request) {
	//TODO: auth
	var input schema.SignUpSchema

	errs := schema.SignUp.Parse(zhttp.Request(r), &input)

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

		if renderErr := signup.SignUpForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error(renderErr.Error())
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

	_, err = h.signUpSvc.Create(r.Context(), input.Email)

	if err != nil {
		slog.Error("failed to create sign up session", "error", err)
		w.WriteHeader(http.StatusInternalServerError)

		formErrs := signup.SignUpFormErr{
			Root: "something went wrong, please try again",
		}

		formValues := signup.SignUpFormValues{Email: input.Email}

		if renderErr := signup.SignUpForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error(renderErr.Error())
		}

		return
	}

	//TODO: send email

	w.Header().Set("HX-Redirect", "/sign-up/verify-email")
	w.WriteHeader(http.StatusCreated)
}
