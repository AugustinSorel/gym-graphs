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
	setSvc      *service.SetService
}

func NewExercisesHandler(tagSvc *service.TagService, exerciseSvc *service.ExerciseService, userSvc *service.UserService, setSvc *service.SetService) *ExercisesHandler {
	return &ExercisesHandler{tagSvc: tagSvc, exerciseSvc: exerciseSvc, userSvc: userSvc, setSvc: setSvc}
}

func (h *ExercisesHandler) ViewDetailPage(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	rawID := r.PathValue("id")
	id, err := strconv.ParseInt(rawID, 10, 32)
	if err != nil {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	exercise, err := h.exerciseSvc.GetByIDAndUserID(r.Context(), int32(id), authSession.UserID)
	if err != nil {
		slog.Error("failed to fetch exercise", "error", err)
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	user, err := h.userSvc.GetByID(r.Context(), authSession.UserID)
	if err != nil {
		slog.Error("failed to fetch user", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	funFacts, err := h.exerciseSvc.FunFacts(r.Context(), exercise.ID, user.OneRepMaxAlgorithm)
	if err != nil {
		slog.Error("failed to compute exercise fun facts", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	graphPoints, err := h.exerciseSvc.GraphPoints(r.Context(), exercise.ID, user.OneRepMaxAlgorithm, user.WeightUnit)
	if err != nil {
		slog.Error("failed to compute exercise graph points", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	repsRangeBuckets, err := h.exerciseSvc.RepsRange(r.Context(), exercise.ID)
	if err != nil {
		slog.Error("failed to compute reps range buckets", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	volumePerSession, err := h.exerciseSvc.VolumePerSessionLast7Days(r.Context(), exercise.ID)
	if err != nil {
		slog.Error("failed to compute volume per session", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	allTags, err := h.tagSvc.GetByUserID(r.Context(), authSession.UserID)
	if err != nil {
		slog.Error("failed to fetch tags for exercise detail page", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	exerciseTags, err := h.tagSvc.GetByExerciseID(r.Context(), exercise.ID)
	if err != nil {
		slog.Error("failed to fetch exercise tags for exercise detail page", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	setsPage, err := h.setSvc.GetPageByExerciseID(r.Context(), exercise.ID, service.InitialSetCursor, funFacts.TotalSets)
	if err != nil {
		slog.Error("failed to fetch sets for exercise detail page", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	page := exercises.ExerciseDetailPage(exercises.ExerciseDetailData{
		ID:                 exercise.ID,
		Name:               exercise.Name,
		Best1RMInG:         funFacts.Best1RMInG,
		HighestWeightInG:   funFacts.HighestWeightInG,
		TotalVolumeInG:     funFacts.TotalVolumeInG,
		TotalSets:          funFacts.TotalSets,
		WeightUnit:         user.WeightUnit,
		OneRepMaxAlgorithm: user.OneRepMaxAlgorithm,
		GraphPoints:        graphPoints,
		RepsRangeBuckets:   repsRangeBuckets,
		VolumePerSession:   volumePerSession,
		SetsPage:           setsPage,
		AllTags:            allTags,
		ExerciseTags:       exerciseTags,
	})
	ctx := templ.WithChildren(r.Context(), page)

	if err := layout.Layout(r.URL.Path).Render(ctx, w); err != nil {
		slog.Error("failed to render exercise detail page", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
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

func (h *ExercisesHandler) ViewRenamePage(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	rawID := r.PathValue("id")
	id, err := strconv.ParseInt(rawID, 10, 32)
	if err != nil {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	exercise, err := h.exerciseSvc.GetByIDAndUserID(r.Context(), int32(id), authSession.UserID)
	if err != nil {
		slog.Error("failed to fetch exercise for rename page", "error", err)
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	page := exercises.RenameExercisePageWithForm(
		exercise.ID,
		exercises.RenameExerciseFormValues{Name: exercise.Name},
		exercises.RenameExerciseFormErr{},
	)
	ctx := templ.WithChildren(r.Context(), page)

	if err := layout.Layout(r.URL.Path).Render(ctx, w); err != nil {
		slog.Error("failed to render rename exercise page", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

func (h *ExercisesHandler) Rename(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	rawID := r.PathValue("id")
	id, err := strconv.ParseInt(rawID, 10, 32)
	if err != nil {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	var input schema.RenameExercise
	errs := schema.RenameExerciseInput.Parse(zhttp.Request(r), &input)
	if errs != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)
		fieldErrors := zog.Issues.Flatten(errs)
		formErrs := exercises.RenameExerciseFormErr{
			Name: firstErr(fieldErrors, "name"),
			Root: firstErr(fieldErrors, "root"),
		}
		formValues := exercises.RenameExerciseFormValues{Name: r.FormValue("name")}
		if renderErr := exercises.RenameExerciseForm(int32(id), formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render rename exercise form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
		return
	}

	if _, err := h.exerciseSvc.UpdateName(r.Context(), int32(id), authSession.UserID, input.Name); err != nil {
		errMsg := "something went wrong, please try again."
		if isDuplicateError(err) {
			errMsg = "an exercise with this name already exists."
		}

		w.WriteHeader(http.StatusInternalServerError)
		formErrs := exercises.RenameExerciseFormErr{Root: errMsg}
		formValues := exercises.RenameExerciseFormValues{Name: input.Name}
		if renderErr := exercises.RenameExerciseForm(int32(id), formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render rename exercise form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("HX-Redirect", "/exercises/"+rawID)
	w.WriteHeader(http.StatusOK)
}

func (h *ExercisesHandler) ViewRemovePage(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	rawID := r.PathValue("id")
	id, err := strconv.ParseInt(rawID, 10, 32)
	if err != nil {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	exercise, err := h.exerciseSvc.GetByIDAndUserID(r.Context(), int32(id), authSession.UserID)
	if err != nil {
		page := exercises.RemoveExerciseErrorPage("loading the remove exercise page failed")
		ctx := templ.WithChildren(r.Context(), page)
		if renderErr := layout.Layout(r.URL.Path).Render(ctx, w); renderErr != nil {
			slog.Error("failed to render remove exercise error page", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
		return
	}

	page := exercises.RemoveExercisePage(exercise.ID, exercise.Name)
	ctx := templ.WithChildren(r.Context(), page)
	if renderErr := layout.Layout(r.URL.Path).Render(ctx, w); renderErr != nil {
		page := exercises.RemoveExerciseErrorPage("loading the remove exercise page failed")
		ctx := templ.WithChildren(r.Context(), page)
		if renderErr := layout.Layout(r.URL.Path).Render(ctx, w); renderErr != nil {
			slog.Error("failed to render remove exercise page", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
	}
}

func (h *ExercisesHandler) Remove(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	rawID := r.PathValue("id")
	id, err := strconv.ParseInt(rawID, 10, 32)
	if err != nil {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	if err := h.exerciseSvc.Delete(r.Context(), int32(id), authSession.UserID); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		if renderErr := exercises.RemoveExerciseFormErr("something went wrong, please try again.").Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render remove exercise error", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("HX-Redirect", "/exercises")
	w.WriteHeader(http.StatusOK)
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
		tags, _ := h.tagSvc.GetByUserID(r.Context(), authSession.UserID)

		errMsg := "something went wrong, please try again."
		if isDuplicateError(err) {
			errMsg = "an exercise with this name already exists."
		}

		w.WriteHeader(http.StatusInternalServerError)
		formErrs := exercises.NewExerciseFormErr{Root: errMsg}
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

func (h *ExercisesHandler) UpdateTags(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	rawID := r.PathValue("id")
	id, err := strconv.ParseInt(rawID, 10, 32)
	if err != nil {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	if _, err := h.exerciseSvc.GetByIDAndUserID(r.Context(), int32(id), authSession.UserID); err != nil {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	if err := r.ParseForm(); err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	tagIDs := parseTagIDs(r.Form["tag_ids"])

	if err := h.exerciseSvc.SetTags(r.Context(), int32(id), tagIDs); err != nil {
		slog.Error("failed to update exercise tags", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	allTags, err := h.tagSvc.GetByUserID(r.Context(), authSession.UserID)
	if err != nil {
		slog.Error("failed to fetch tags after update", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	exerciseTags, err := h.tagSvc.GetByExerciseID(r.Context(), int32(id))
	if err != nil {
		slog.Error("failed to fetch exercise tags after update", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	if err := exercises.ExerciseTagsSection(int32(id), allTags, exerciseTags).Render(r.Context(), w); err != nil {
		slog.Error("failed to render exercise tags section", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
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
