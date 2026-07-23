package server

import (
	"net/http"

	"github.com/augustinsorel/gym-graphs/internal/handler"
	"github.com/augustinsorel/gym-graphs/internal/service"
	"github.com/augustinsorel/gym-graphs/web"
)

func (s *Server) RegisterRoutes() http.Handler {
	mux := http.NewServeMux()

	fileServer := http.FileServer(http.FS(web.Files))

	userSvc := service.NewUserService(s.queries)
	signUpSessionSvc := service.NewSignUpService(s.queries)
	signUp := handler.NewSignUpHandler(userSvc, signUpSessionSvc)

	mux.Handle("/assets/", fileServer)
	mux.HandleFunc("GET /sign-up", signUp.ViewStartPage)
	mux.HandleFunc("POST /sign-up", signUp.Start)
	mux.HandleFunc("GET /sign-up/verify-email-address", signUp.ViewVerifyEmailPage)

	mux.HandleFunc("POST /sign-up/verify-email-address", signUp.VerifyEmail)
	mux.HandleFunc("POST /sign-up/verify-email-address/resend", signUp.ResendVerificationCode)
	mux.HandleFunc("POST /sign-up/verify-email-address/cancel", signUp.CancelVerifyEmail)
	mux.HandleFunc("GET /sign-up/set-password", signUp.ViewSetPasswordPage)

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
