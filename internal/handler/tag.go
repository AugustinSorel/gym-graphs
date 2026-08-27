package handler

import (
	"log/slog"
	"net/http"
	"strconv"

	"github.com/Oudwins/zog"
	"github.com/Oudwins/zog/zhttp"
	"github.com/a-h/templ"
	"github.com/augustinsorel/gym-graphs/internal/middleware"
	"github.com/augustinsorel/gym-graphs/internal/schema"
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

func (h *TagHandler) Create(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	var input schema.CreateTag
	errs := schema.CreateTagInput.Parse(zhttp.Request(r), &input)
	if errs != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)
		fieldErrors := zog.Issues.Flatten(errs)
		formErrs := tag.CreateTagFormErr{
			Name: firstErr(fieldErrors, "name"),
			Root: firstErr(fieldErrors, "root"),
		}
		formValues := tag.CreateTagFormValues{Name: r.FormValue("name")}
		if renderErr := tag.CreateTagForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render create tag form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
		return
	}

	if _, err := h.tagSvc.Create(r.Context(), authSession.UserID, input.Name); err != nil {
		errMsg := "something went wrong, please try again."
		if isDuplicateError(err) {
			errMsg = "a tag with this name already exists."
		}

		w.WriteHeader(http.StatusInternalServerError)
		formErrs := tag.CreateTagFormErr{Root: errMsg}
		formValues := tag.CreateTagFormValues{Name: input.Name}
		if renderErr := tag.CreateTagForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render create tag form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("HX-Redirect", "/account")
	w.WriteHeader(http.StatusCreated)
}

func (h *TagHandler) ViewRemovePage(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	tagID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	existingTag, err := h.tagSvc.GetByID(r.Context(), int32(tagID))
	if err != nil {
		page := tag.RemoveTagErrorPage("loading the remove tag page failed")
		ctx := templ.WithChildren(r.Context(), page)
		if renderErr := layout.Layout(r.URL.Path).Render(ctx, w); renderErr != nil {
			slog.Error("failed to render remove tag error page", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
		return
	}

	if existingTag.UserID != authSession.UserID {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	page := tag.RemoveTagPage(existingTag.ID, existingTag.Name)
	ctx := templ.WithChildren(r.Context(), page)
	if renderErr := layout.Layout(r.URL.Path).Render(ctx, w); renderErr != nil {
		page := tag.RemoveTagErrorPage("loading the remove tag page failed")
		ctx := templ.WithChildren(r.Context(), page)
		if renderErr := layout.Layout(r.URL.Path).Render(ctx, w); renderErr != nil {
			slog.Error("failed to render remove tag page", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
	}
}

func (h *TagHandler) Remove(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	tagID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	if err := h.tagSvc.Delete(r.Context(), int32(tagID), authSession.UserID); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		if renderErr := tag.RemoveTagFormErr("something went wrong, please try again.").Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render remove tag error", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("HX-Redirect", "/account")
	w.WriteHeader(http.StatusOK)
}

func (h *TagHandler) ViewRenamePage(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	tagID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	existingTag, err := h.tagSvc.GetByID(r.Context(), int32(tagID))
	if err != nil {
		page := tag.RenameTagErrorPage("loading the rename tag page failed")
		ctx := templ.WithChildren(r.Context(), page)
		if renderErr := layout.Layout(r.URL.Path).Render(ctx, w); renderErr != nil {
			slog.Error("failed to render rename tag error page", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
		return
	}

	if existingTag.UserID != authSession.UserID {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	page := tag.RenameTagPageWithForm(existingTag.ID, tag.RenameTagFormValues{Name: existingTag.Name}, tag.RenameTagFormErr{})
	ctx := templ.WithChildren(r.Context(), page)
	if renderErr := layout.Layout(r.URL.Path).Render(ctx, w); renderErr != nil {
		page := tag.RenameTagErrorPage("loading the rename tag page failed")
		ctx := templ.WithChildren(r.Context(), page)
		if renderErr := layout.Layout(r.URL.Path).Render(ctx, w); renderErr != nil {
			slog.Error("failed to render rename tag page", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
	}
}

func (h *TagHandler) Rename(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	tagID, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	var input schema.RenameTag
	errs := schema.RenameTagInput.Parse(zhttp.Request(r), &input)
	if errs != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)
		fieldErrors := zog.Issues.Flatten(errs)
		formErrs := tag.RenameTagFormErr{
			Name: firstErr(fieldErrors, "name"),
			Root: firstErr(fieldErrors, "root"),
		}
		formValues := tag.RenameTagFormValues{Name: r.FormValue("name")}
		if renderErr := tag.RenameTagForm(int32(tagID), formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render rename tag form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
		return
	}

	if _, err := h.tagSvc.UpdateName(r.Context(), int32(tagID), authSession.UserID, input.Name); err != nil {
		errMsg := "something went wrong, please try again."
		if isDuplicateError(err) {
			errMsg = "a tag with this name already exists."
		}

		w.WriteHeader(http.StatusInternalServerError)
		formErrs := tag.RenameTagFormErr{Root: errMsg}
		formValues := tag.RenameTagFormValues{Name: input.Name}
		if renderErr := tag.RenameTagForm(int32(tagID), formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render rename tag form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("HX-Redirect", "/account")
	w.WriteHeader(http.StatusOK)
}

func (h *TagHandler) ViewCreatePage(w http.ResponseWriter, r *http.Request) {
	page := tag.CreateTagPageWithForm(tag.CreateTagFormValues{}, tag.CreateTagFormErr{})
	ctx := templ.WithChildren(r.Context(), page)

	if err := layout.Layout(r.URL.Path).Render(ctx, w); err != nil {
		page := tag.CreateTagErrorPage("loading the create tag page failed")

		ctx := templ.WithChildren(r.Context(), page)

		if err := layout.Layout(r.URL.Path).Render(ctx, w); err != nil {
			slog.Error("failed to render create tag page", "error", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
	}
}
