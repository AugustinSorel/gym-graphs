package analytics

import "net/http"

// NoopTracker is a Tracker that does nothing.
// It is used when analytics are not configured.
type NoopTracker struct{}

func (NoopTracker) Middleware(next http.Handler) http.Handler {
	return next
}
