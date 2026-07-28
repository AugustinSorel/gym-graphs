package email

import (
	"context"
	"fmt"
	"net/smtp"

	"github.com/augustinsorel/gym-graphs/internal/config"
)

type SMTPMailer struct {
	addr string
	from string
}

func NewSMTPMailer(cfg *config.Config) *SMTPMailer {
	return &SMTPMailer{
		addr: fmt.Sprintf("%s:%s", cfg.SMTPHost, cfg.SMTPPort),
		from: cfg.SMTPFrom,
	}
}

func (m *SMTPMailer) Send(_ context.Context, msg Message) error {
	raw := fmt.Appendf(nil,
		"To: %s\r\nFrom: %s\r\nSubject: %s\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n%s",
		msg.To, m.from, msg.Subject, msg.HTML,
	)

	if err := smtp.SendMail(m.addr, nil, m.from, []string{msg.To}, raw); err != nil {
		return fmt.Errorf("smtp: failed to send email to %s: %w", msg.To, err)
	}

	return nil
}
