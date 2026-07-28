package email

import "context"

type Message struct {
	To      string
	Subject string
	HTML    string
}

type Mailer interface {
	Send(ctx context.Context, msg Message) error
}
