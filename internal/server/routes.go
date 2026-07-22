package server

import (
	"log/slog"
	"net/http"

	"github.com/Oudwins/zog"
	zhttp "github.com/Oudwins/zog/zhttp"
	"github.com/a-h/templ"
	"github.com/augustinsorel/gym-graphs/internal/domain"
	"github.com/augustinsorel/gym-graphs/web"
	"github.com/augustinsorel/gym-graphs/web/signup"
	"github.com/augustinsorel/gym-graphs/web/ui/layout"
)

func (s *Server) RegisterRoutes() http.Handler {
	mux := http.NewServeMux()

	fileServer := http.FileServer(http.FS(web.Files))

	mux.Handle("/assets/", fileServer)
	mux.HandleFunc("GET /sign-up", func(w http.ResponseWriter, r *http.Request) {
		page := signup.SignUpPage()

		ctx := templ.WithChildren(r.Context(), page)

		err := layout.Layout().Render(ctx, w)

		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			slog.Error(err.Error())
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
	})

	mux.HandleFunc("POST /sign-up", func(w http.ResponseWriter, r *http.Request) {
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
		}

		slog.Info("sign-up form submitted", "email", input.Email)

		w.Header().Set("HX-Redirect", "/sign-up/verify-email")
		w.WriteHeader(http.StatusCreated)
	})

	return s.corsMiddleware(mux)
}

func (s *Server) corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*") // Replace "*" with specific origins if needed
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type, X-CSRF-Token")
		w.Header().Set("Access-Control-Allow-Credentials", "false") // Set to "true" if credentials are required

		// Handle preflight OPTIONS requests
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		// Proceed with the next handler
		next.ServeHTTP(w, r)
	})
}
