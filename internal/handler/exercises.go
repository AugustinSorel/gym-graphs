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
	"github.com/augustinsorel/gym-graphs/web/exercises"
	"github.com/augustinsorel/gym-graphs/web/ui/layout"
)

type ExercisesHandler struct {
	tagSvc      *service.TagService
	exerciseSvc *service.ExerciseService
	userSvc     *service.UserService
}

func NewExercisesHandler(tagSvc *service.TagService, exerciseSvc *service.ExerciseService, userSvc *service.UserService) *ExercisesHandler {
	return &ExercisesHandler{tagSvc: tagSvc, exerciseSvc: exerciseSvc, userSvc: userSvc}
}

func (h *ExercisesHandler) ViewPage(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	user, err := h.userSvc.GetByID(r.Context(), authSession.UserID)
	if err != nil {
		slog.Error("failed to fetch user", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	if r.Header.Get("HX-Request") == "true" {
		var cursor int32 = service.InitialCursor
		if raw := r.URL.Query().Get("cursor"); raw != "" {
			if v, err := strconv.ParseInt(raw, 10, 32); err == nil {
				cursor = int32(v)
			}
		}

		exercisesPage, err := h.exerciseSvc.GetPage(r.Context(), user, cursor)
		if err != nil {
			slog.Error("failed to fetch exercises rows", "error", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}

		if err := exercises.ExerciseRows(exercisesPage).Render(r.Context(), w); err != nil {
			slog.Error("failed to render exercises rows", "error", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
		return
	}

	exercisesPage, err := h.exerciseSvc.GetPage(r.Context(), user, service.InitialCursor)
	if err != nil {
		slog.Error("failed to fetch exercises", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	page := exercises.ExercisesPage(exercisesPage)
	ctx := templ.WithChildren(r.Context(), page)

	if err := layout.Layout(r.URL.Path).Render(ctx, w); err != nil {
		slog.Error("failed to render exercises page", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

func (h *ExercisesHandler) ViewNewPage(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	tags, err := h.tagSvc.GetByUserID(r.Context(), authSession.UserID)
	if err != nil {
		slog.Error("failed to fetch tags for new exercise page", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	page := exercises.NewExercisePageWithForm(
		exercises.NewExerciseFormValues{},
		exercises.NewExerciseFormErr{},
		tags,
	)
	ctx := templ.WithChildren(r.Context(), page)

	if err := layout.Layout(r.URL.Path).Render(ctx, w); err != nil {
		slog.Error("failed to render new exercise page", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

func (h *ExercisesHandler) Create(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	var input schema.CreateExercise
	errs := schema.CreateExerciseInput.Parse(zhttp.Request(r), &input)
	if errs != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)
		fieldErrors := zog.Issues.Flatten(errs)

		tags, _ := h.tagSvc.GetByUserID(r.Context(), authSession.UserID)

		formErrs := exercises.NewExerciseFormErr{
			Name: firstErr(fieldErrors, "name"),
			Root: firstErr(fieldErrors, "root"),
		}
		formValues := exercises.NewExerciseFormValues{Name: r.FormValue("name")}

		if renderErr := exercises.NewExerciseForm(formValues, formErrs, tags).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render new exercise form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
		return
	}

	tagIDs := parseTagIDs(r.Form["tag_ids"])

	if _, err := h.exerciseSvc.Create(r.Context(), authSession.UserID, input.Name, tagIDs); err != nil {
		w.WriteHeader(http.StatusInternalServerError)

		tags, _ := h.tagSvc.GetByUserID(r.Context(), authSession.UserID)

		formErrs := exercises.NewExerciseFormErr{Root: "something went wrong, please try again."}
		formValues := exercises.NewExerciseFormValues{Name: input.Name}

		if renderErr := exercises.NewExerciseForm(formValues, formErrs, tags).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render new exercise form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("HX-Redirect", "/exercises")
	w.WriteHeader(http.StatusCreated)
}

func parseTagIDs(raw []string) []int32 {
	ids := make([]int32, 0, len(raw))
	for _, s := range raw {
		id, err := strconv.ParseInt(s, 10, 32)
		if err == nil {
			ids = append(ids, int32(id))
		}
	}
	return ids
}
