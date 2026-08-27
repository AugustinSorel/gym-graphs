package handler

import (
	"errors"

	"github.com/jackc/pgx/v5/pgconn"
)

func firstErr(errs map[string][]string, field string) string {
	if len(errs[field]) > 0 {
		return errs[field][0]
	}

	return ""
}

func isDuplicateError(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}
