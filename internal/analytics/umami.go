package analytics

import (
	"net/http"

	"github.com/yuriizinets/umago"
)

// UmamiTracker is a Tracker backed by an Umami analytics instance.
type UmamiTracker struct {
	middleware umago.Middleware
}

func NewUmamiTracker(href, websiteID string) *UmamiTracker {
	return &UmamiTracker{
		middleware: umago.NewMiddleware(umago.Configuration{
			Href:    href,
			Website: websiteID,
		}),
	}
}

func (t *UmamiTracker) Middleware(next http.Handler) http.Handler {
	return t.middleware(next.ServeHTTP)
}
