package config

import (
	"errors"
	"fmt"
	"os"
	"strconv"
)

type Config struct {
	Port           int
	DatabaseURL    string
	AWSRegion      string
	AWSAccessKeyID string
	AWSSecretKey   string
	SESFromAddress string
}

func Load() (*Config, error) {
	var errs []error

	port, err := requireInt("PORT")
	if err != nil {
		errs = append(errs, err)
	}

	databaseURL, err := require("DATABASE_URL")
	if err != nil {
		errs = append(errs, err)
	}

	awsRegion, err := require("AWS_REGION")
	if err != nil {
		errs = append(errs, err)
	}

	awsAccessKeyID, err := require("AWS_ACCESS_KEY_ID")
	if err != nil {
		errs = append(errs, err)
	}

	awsSecretKey, err := require("AWS_SECRET_ACCESS_KEY")
	if err != nil {
		errs = append(errs, err)
	}

	sesFromAddress, err := require("SES_FROM_ADDRESS")
	if err != nil {
		errs = append(errs, err)
	}

	if len(errs) > 0 {
		return nil, errors.Join(errs...)
	}

	return &Config{
		Port:           port,
		DatabaseURL:    databaseURL,
		AWSRegion:      awsRegion,
		AWSAccessKeyID: awsAccessKeyID,
		AWSSecretKey:   awsSecretKey,
		SESFromAddress: sesFromAddress,
	}, nil
}

func require(key string) (string, error) {
	v, ok := os.LookupEnv(key)
	if !ok {
		return "", fmt.Errorf("env var %q is not set", key)
	}
	if v == "" {
		return "", fmt.Errorf("env var %q is set but empty", key)
	}
	return v, nil
}

func requireInt(key string) (int, error) {
	s, err := require(key)
	if err != nil {
		return 0, err
	}
	n, err := strconv.Atoi(s)
	if err != nil {
		return 0, fmt.Errorf("env var %q must be an integer, got %q", key, s)
	}
	return n, nil
}
