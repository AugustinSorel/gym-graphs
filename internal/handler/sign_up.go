package handler

import (
	"log/slog"
	"net/http"

	"github.com/Oudwins/zog"
	zhttp "github.com/Oudwins/zog/zhttp"
	"github.com/a-h/templ"
	"github.com/augustinsorel/gym-graphs/internal/domain"
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
	var input domain.SignUpInput

	err := domain.SignUpSchema.Parse(zhttp.Request(r), &input)

	if err != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)

		form := signup.SignUpFormValues{
			Email: r.FormValue("email"),
		}

		fieldErrors := zog.Issues.Flatten(err)

		errs := signup.SignUpFormErr{
			Email: fieldErrors["email"][0],
		}

		err := signup.SignUpForm(form, errs).Render(r.Context(), w)

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
