package handler

import (
	"log/slog"
	"net/http"

	"github.com/a-h/templ"
	"github.com/augustinsorel/gym-graphs/internal/service"
	"github.com/augustinsorel/gym-graphs/web/tag"
	"github.com/augustinsorel/gym-graphs/web/ui/layout"
)

type TagHandler struct {
	tagSvc *service.TagService
}

func NewTagHandler(tagSvc *service.TagService) *TagHandler {
	return &TagHandler{tagSvc: tagSvc}
}

func (h *TagHandler) ViewCreatePage(w http.ResponseWriter, r *http.Request) {
	page := tag.CreateTagPageWithForm(tag.CreateTagFormValues{}, tag.CreateTagFormErr{})
	ctx := templ.WithChildren(r.Context(), page)

	if err := layout.Layout().Render(ctx, w); err != nil {
		page := tag.CreateTagErrorPage("loading the create tag page failed")

		ctx := templ.WithChildren(r.Context(), page)

		if err := layout.Layout().Render(ctx, w); err != nil {
			slog.Error("failed to render create tag page", "error", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
	}
}
