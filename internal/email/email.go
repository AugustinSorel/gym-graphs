package email

import (
	"context"
	"fmt"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/sesv2"
	"github.com/aws/aws-sdk-go-v2/service/sesv2/types"
)

type Service struct {
	client      *sesv2.Client
	fromAddress string
}

func NewService() (*Service, error) {
	region := os.Getenv("AWS_REGION")
	accessKeyID := os.Getenv("AWS_ACCESS_KEY_ID")
	secretAccessKey := os.Getenv("AWS_SECRET_ACCESS_KEY")
	fromAddress := os.Getenv("SES_FROM_ADDRESS")

	cfg, err := config.LoadDefaultConfig(
		context.Background(),
		config.WithRegion(region),
		config.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(accessKeyID, secretAccessKey, ""),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to load aws config: %w", err)
	}

	return &Service{
		client:      sesv2.NewFromConfig(cfg),
		fromAddress: fromAddress,
	}, nil
}

func (s *Service) SendSignUpVerificationCode(ctx context.Context, to, code string) error {
	subject := "Your Verification Code"
	body := signUpVerificationCodeHTML(code)

	return s.send(ctx, to, subject, body)
}

func (s *Service) SendPasswordResetCode(ctx context.Context, to, code string) error {
	subject := "Your Password Reset Code"
	body := passwordResetCodeHTML(code)

	return s.send(ctx, to, subject, body)
}

func (s *Service) send(ctx context.Context, to, subject, htmlBody string) error {
	_, err := s.client.SendEmail(ctx, &sesv2.SendEmailInput{
		FromEmailAddress: aws.String(s.fromAddress),
		Destination: &types.Destination{
			ToAddresses: []string{to},
		},
		Content: &types.EmailContent{
			Simple: &types.Message{
				Subject: &types.Content{
					Data:    aws.String(subject),
					Charset: aws.String("UTF-8"),
				},
				Body: &types.Body{
					Html: &types.Content{
						Data:    aws.String(htmlBody),
						Charset: aws.String("UTF-8"),
					},
				},
			},
		},
	})
	if err != nil {
		return fmt.Errorf("failed to send email to %s: %w", to, err)
	}

	return nil
}

func signUpVerificationCodeHTML(code string) string {
	return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>*{margin:0;padding:0}body{font-family:Arial,sans-serif}.container{margin:3rem auto;padding:3rem;text-align:center}h1{font-size:3rem;color:#000;font-weight:normal;margin-bottom:16px}.code{display:inline-block;font-weight:bold;font-size:2rem;background-color:#000;color:#fff;padding:2rem;margin:2rem 0}.footer{font-size:.75rem;color:#aaaaaa;margin-top:32px}</style></head><body><div class="container"><h1>Your Verification Code</h1><strong class="code">` + code + `</strong><footer class="footer"><p>If you did not request this code, you can safely ignore this email.</p><p>This is an automated message. Please do not reply.</p></footer></div></body></html>`
}

func passwordResetCodeHTML(code string) string {
	return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>*{margin:0;padding:0}body{font-family:Arial,sans-serif}.container{margin:3rem auto;padding:3rem;text-align:center}h1{font-size:3rem;color:#000;font-weight:normal;margin-bottom:16px}.code{display:inline-block;font-weight:bold;font-size:2rem;background-color:#000;color:#fff;padding:2rem;margin:2rem 0}.footer{font-size:.75rem;color:#aaaaaa;margin-top:32px}</style></head><body><div class="container"><h1>Your password reset Code</h1><strong class="code">` + code + `</strong><footer class="footer"><p>If you did not request this code, you can safely ignore this email.</p><p>This is an automated message. Please do not reply.</p></footer></div></body></html>`
}
