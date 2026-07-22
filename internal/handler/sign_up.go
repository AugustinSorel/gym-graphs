package handler

import (
	"log/slog"
	"net/http"

	"github.com/Oudwins/zog"
	"github.com/Oudwins/zog/zhttp"
	"github.com/a-h/templ"
	"github.com/augustinsorel/gym-graphs/internal/schema"
	"github.com/augustinsorel/gym-graphs/web/signup"
	"github.com/augustinsorel/gym-graphs/web/ui/layout"
)

type SignUpHandler struct{}

func NewSignUpHandler() *SignUpHandler {
	return &SignUpHandler{}
}

func (h *SignUpHandler) Get(w http.ResponseWriter, r *http.Request) {
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

	slog.Info("sign-up form submitted", "email", input.Email)

	w.Header().Set("HX-Redirect", "/sign-up/verify-email")
	w.WriteHeader(http.StatusCreated)
}
