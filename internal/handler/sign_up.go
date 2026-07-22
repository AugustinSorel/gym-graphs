package handler

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/Oudwins/zog"
	"github.com/Oudwins/zog/zhttp"
	"github.com/a-h/templ"
	"github.com/augustinsorel/gym-graphs/internal/db/sqlc"
	"github.com/augustinsorel/gym-graphs/internal/schema"
	"github.com/augustinsorel/gym-graphs/web/signup"
	"github.com/augustinsorel/gym-graphs/web/ui/layout"
	"github.com/jackc/pgx/v5"
)

type SignUpHandler struct {
	queries *sqlc.Queries
}

func NewSignUpHandler(queries *sqlc.Queries) *SignUpHandler {
	return &SignUpHandler{queries: queries}
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

	slog.Info("sign-up form submitted", "email", input.Email)

	_, err := h.queries.GetUserByEmail(r.Context(), input.Email)

	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		slog.Error("failed to check email availability", "error", err)
		w.WriteHeader(http.StatusInternalServerError)

		formErrs := signup.SignUpFormErr{
			Root: "something went wrong, please try again",
		}

		input := signup.SignUpFormValues{Email: input.Email}

		err := signup.SignUpForm(input, formErrs).Render(r.Context(), w)

		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			slog.Error(err.Error())
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	if err == nil {
		w.WriteHeader(http.StatusUnprocessableEntity)

		formErrs := signup.SignUpFormErr{
			Email: "an account with this email already exists",
		}

		input := signup.SignUpFormValues{Email: input.Email}

		err := signup.SignUpForm(input, formErrs).Render(r.Context(), w)

		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			slog.Error(err.Error())
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	//TODO: create sign up
	//TODO: send email

	w.Header().Set("HX-Redirect", "/sign-up/verify-email")
	w.WriteHeader(http.StatusCreated)
}
