package cookies

import (
	"errors"
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
		SameSite: http.SameSiteStrictMode,
	})
}

func GetSignUpSession(r *http.Request) (string, error) {
	cookie, err := r.Cookie(signUpSessionCookieName)
	if err != nil {
		return "", errors.Join(err, http.ErrNoCookie)
	}
	return cookie.Value, nil
}

func ClearSignUpSession(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     signUpSessionCookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
	})
}
