package server

import (
	"net/http"

	"github.com/augustinsorel/gym-graphs/internal/handler"
	"github.com/augustinsorel/gym-graphs/internal/middleware"
	"github.com/augustinsorel/gym-graphs/internal/service"
	"github.com/augustinsorel/gym-graphs/web"
)

func (s *Server) RegisterRoutes() http.Handler {
	mux := http.NewServeMux()

	fileServer := http.FileServer(http.FS(web.Files))

	userSvc := service.NewUserService(s.queries)
	authSessionSvc := service.NewAuthSessionService(s.queries)
	signUpSessionSvc := service.NewSignUpService(s.queries, s.pool)
	signUp := handler.NewSignUpHandler(userSvc, signUpSessionSvc)
	signIn := handler.NewSignInHandler()

	guestOnly := func(next http.Handler) http.Handler {
		return middleware.GuestOnly(authSessionSvc, next)
	}

	requireUnverifiedSignUpSession := func(next http.Handler) http.Handler {
		return middleware.RequireUnverifiedSignUpSession(signUpSessionSvc, next)
	}

	requireVerifiedSignUpSession := func(next http.Handler) http.Handler {
		return middleware.RequireVerifiedSignUpSession(signUpSessionSvc, next)
	}

	mux.Handle("/assets/", fileServer)

	mux.Handle("GET /sign-in", guestOnly(http.HandlerFunc(signIn.ViewPage)))
	mux.Handle("POST /sign-in", guestOnly(http.HandlerFunc(signIn.SignIn)))

	mux.Handle("GET /sign-up", guestOnly(http.HandlerFunc(signUp.ViewStartPage)))
	mux.Handle("POST /sign-up", guestOnly(http.HandlerFunc(signUp.Start)))
	mux.Handle("GET /sign-up/verify-email-address", guestOnly(requireUnverifiedSignUpSession(http.HandlerFunc(signUp.ViewVerifyEmailPage))))
	mux.Handle("POST /sign-up/verify-email-address", guestOnly(requireUnverifiedSignUpSession(http.HandlerFunc(signUp.VerifyEmail))))
	mux.Handle("POST /sign-up/verify-email-address/resend", guestOnly(requireUnverifiedSignUpSession(http.HandlerFunc(signUp.ResendVerificationCode))))
	mux.Handle("POST /sign-up/verify-email-address/cancel", guestOnly(requireUnverifiedSignUpSession(http.HandlerFunc(signUp.CancelVerifyEmail))))
	mux.Handle("GET /sign-up/set-password", guestOnly(requireVerifiedSignUpSession(http.HandlerFunc(signUp.ViewSetPasswordPage))))
	mux.Handle("POST /sign-up/set-password", guestOnly(requireVerifiedSignUpSession(http.HandlerFunc(signUp.SetPassword))))

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
