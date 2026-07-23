package cookies

import (
	"errors"
	"net/http"
	"time"
)

const (
	authSessionCookieName = "auth_session_token"
	authSessionTTL        = 30 * 24 * time.Hour
)

func SetAuthSession(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     authSessionCookieName,
		Value:    token,
		Path:     "/",
		Expires:  time.Now().Add(authSessionTTL),
		MaxAge:   int(authSessionTTL.Seconds()),
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
	})
}

func GetAuthSession(r *http.Request) (string, error) {
	cookie, err := r.Cookie(authSessionCookieName)
	if err != nil {
		return "", errors.Join(err, http.ErrNoCookie)
	}
	return cookie.Value, nil
}

func ClearAuthSession(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     authSessionCookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
	})
}
