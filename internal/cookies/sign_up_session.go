package cookies

import (
	"net/http"
	"time"
)

const (
	signUpSessionCookieName = "sign_up_session_token"
	signUpSessionTTL        = 24 * time.Hour
)

func SetSignUpSession(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     signUpSessionCookieName,
		Value:    token,
		Path:     "/",
		Expires:  time.Now().Add(signUpSessionTTL),
		MaxAge:   int(signUpSessionTTL.Seconds()),
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})
}

func GetSignUpSession(r *http.Request) string {
	cookie, err := r.Cookie(signUpSessionCookieName)
	if err != nil {
		return ""
	}
	return cookie.Value
}

func ClearSignUpSession(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     signUpSessionCookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})
}
