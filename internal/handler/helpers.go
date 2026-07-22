package handler

func firstErr(errs map[string][]string, field string) string {
	if len(errs[field]) > 0 {
		return errs[field][0]
	}

	return ""
}
