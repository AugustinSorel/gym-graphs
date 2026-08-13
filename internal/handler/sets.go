package handler

import (
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	zog "github.com/Oudwins/zog"
	"github.com/Oudwins/zog/zhttp"
	"github.com/a-h/templ"
	"github.com/augustinsorel/gym-graphs/internal/middleware"
	"github.com/augustinsorel/gym-graphs/internal/schema"
	"github.com/augustinsorel/gym-graphs/internal/service"
	"github.com/augustinsorel/gym-graphs/internal/weightunit"
	"github.com/augustinsorel/gym-graphs/web/exercises"
	"github.com/augustinsorel/gym-graphs/web/ui/layout"
)

type SetsHandler struct {
	exerciseSvc *service.ExerciseService
	setSvc      *service.SetService
	userSvc     *service.UserService
}

func NewSetsHandler(exerciseSvc *service.ExerciseService, setSvc *service.SetService, userSvc *service.UserService) *SetsHandler {
	return &SetsHandler{exerciseSvc: exerciseSvc, setSvc: setSvc, userSvc: userSvc}
}

func (h *SetsHandler) ViewSetsRows(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	rawID := r.PathValue("id")
	id, err := strconv.ParseInt(rawID, 10, 32)
	if err != nil {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	exercise, err := h.exerciseSvc.GetByIDAndUserID(r.Context(), int32(id), authSession.UserID)
	if err != nil {
		slog.Error("failed to fetch exercise for sets rows", "error", err)
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	user, err := h.userSvc.GetByID(r.Context(), authSession.UserID)
	if err != nil {
		slog.Error("failed to fetch user for sets rows", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	funFacts, err := h.exerciseSvc.FunFacts(r.Context(), exercise.ID, user.OneRepMaxAlgorithm)
	if err != nil {
		slog.Error("failed to fetch fun facts for sets rows", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	var cursor int32 = service.InitialSetCursor
	if raw := r.URL.Query().Get("cursor"); raw != "" {
		if v, err := strconv.ParseInt(raw, 10, 32); err == nil {
			cursor = int32(v)
		}
	}

	setsPage, err := h.setSvc.GetPageByExerciseID(r.Context(), exercise.ID, cursor, funFacts.TotalSets)
	if err != nil {
		slog.Error("failed to fetch sets rows", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	if err := exercises.ExerciseSetsRows(int32(id), setsPage, user.WeightUnit, user.OneRepMaxAlgorithm).Render(r.Context(), w); err != nil {
		slog.Error("failed to render sets rows", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

func (h *SetsHandler) ViewNewPage(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	rawID := r.PathValue("id")
	id, err := strconv.ParseInt(rawID, 10, 32)
	if err != nil {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	if _, err := h.exerciseSvc.GetByIDAndUserID(r.Context(), int32(id), authSession.UserID); err != nil {
		slog.Error("failed to fetch exercise for new set page", "error", err)
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	user, err := h.userSvc.GetByID(r.Context(), authSession.UserID)
	if err != nil {
		slog.Error("failed to fetch user for new set page", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	row := exercises.NewSetRowValues{Weight: "10", Repetitions: "1"}
	if lastSet, err := h.setSvc.GetLastByExerciseID(r.Context(), int32(id)); err == nil {
		row = exercises.NewSetRowValues{
			Weight:      weightunit.Format(float64(lastSet.WeightInG), user.WeightUnit),
			Repetitions: strconv.Itoa(int(lastSet.Repetitions)),
		}
	}

	page := exercises.NewSetPageWithForm(
		int32(id),
		[]exercises.NewSetRowValues{row},
		exercises.NewSetFormErr{},
		user.WeightUnit,
	)
	ctx := templ.WithChildren(r.Context(), page)

	if err := layout.Layout(r.URL.Path).Render(ctx, w); err != nil {
		slog.Error("failed to render new set page", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

func (h *SetsHandler) NewSetRow(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	rawID := r.PathValue("id")
	id, err := strconv.ParseInt(rawID, 10, 32)
	if err != nil {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	if _, err := h.exerciseSvc.GetByIDAndUserID(r.Context(), int32(id), authSession.UserID); err != nil {
		slog.Error("failed to fetch exercise for new set row", "error", err)
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	user, err := h.userSvc.GetByID(r.Context(), authSession.UserID)
	if err != nil {
		slog.Error("failed to fetch user for new set row", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	row := exercises.NewSetRowValues{Weight: "10", Repetitions: "1"}
	if lastSet, err := h.setSvc.GetLastByExerciseID(r.Context(), int32(id)); err == nil {
		row = exercises.NewSetRowValues{
			Weight:      weightunit.Format(float64(lastSet.WeightInG), user.WeightUnit),
			Repetitions: strconv.Itoa(int(lastSet.Repetitions)),
		}
	}

	if err := exercises.NewSetRow(0, row, exercises.NewSetRowErr{}, user.WeightUnit).Render(r.Context(), w); err != nil {
		slog.Error("failed to render new set row", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

func (h *SetsHandler) Create(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	rawID := r.PathValue("id")
	id, err := strconv.ParseInt(rawID, 10, 32)
	if err != nil {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	if _, err := h.exerciseSvc.GetByIDAndUserID(r.Context(), int32(id), authSession.UserID); err != nil {
		slog.Error("failed to fetch exercise for create set", "error", err)
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	user, err := h.userSvc.GetByID(r.Context(), authSession.UserID)
	if err != nil {
		slog.Error("failed to fetch user for create set", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	if err := r.ParseForm(); err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	rawWeights := r.Form["weight"]
	rawReps := r.Form["repetitions"]
	rows := make([]exercises.NewSetRowValues, max(len(rawWeights), len(rawReps)))
	for i := range rows {
		row := exercises.NewSetRowValues{}
		if i < len(rawWeights) {
			row.Weight = rawWeights[i]
		}
		if i < len(rawReps) {
			row.Repetitions = rawReps[i]
		}
		rows[i] = row
	}

	var parsed schema.CreateSets
	errs := schema.CreateSetsInput.Parse(zhttp.Request(r), &parsed)
	if errs != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)
		fieldErrors := zog.Issues.Flatten(errs)

		rowErrs := make([]exercises.NewSetRowErr, len(rows))
		for i := range rows {
			rowErrs[i] = exercises.NewSetRowErr{
				Weight:      firstErr(fieldErrors, fmt.Sprintf("weight[%d]", i)),
				Repetitions: firstErr(fieldErrors, fmt.Sprintf("repetitions[%d]", i)),
			}
		}

		formErr := exercises.NewSetFormErr{
			Rows: rowErrs,
			Root: firstErr(fieldErrors, "weight") + firstErr(fieldErrors, "repetitions"),
		}
		if renderErr := exercises.NewSetForm(int32(id), rows, formErr, user.WeightUnit).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render new set form with errors", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
		return
	}

	count := min(len(parsed.Weight), len(parsed.Repetitions))
	inputs := make([]service.CreateSetInput, count)
	for i := range count {
		inputs[i] = service.CreateSetInput{
			ExerciseID:  int32(id),
			Repetitions: parsed.Repetitions[i],
			WeightInG:   int32(weightunit.ToGrams(float64(parsed.Weight[i]), user.WeightUnit)),
		}
	}

	if _, err := h.setSvc.CreateSets(r.Context(), inputs); err != nil {
		slog.Error("failed to create sets", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		formErr := exercises.NewSetFormErr{Root: "something went wrong, please try again."}
		if renderErr := exercises.NewSetForm(int32(id), rows, formErr, user.WeightUnit).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render new set form after db error", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("HX-Redirect", fmt.Sprintf("/exercises/%d", id))
	w.WriteHeader(http.StatusCreated)
}

func (h *SetsHandler) parseExerciseAndSetIDs(r *http.Request) (int32, int32, error) {
	rawExID := r.PathValue("id")
	exID, err := strconv.ParseInt(rawExID, 10, 32)
	if err != nil {
		return 0, 0, err
	}
	rawSetID := r.PathValue("setID")
	setID, err := strconv.ParseInt(rawSetID, 10, 32)
	if err != nil {
		return 0, 0, err
	}
	return int32(exID), int32(setID), nil
}

func (h *SetsHandler) ViewEditSetPage(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	exID, setID, err := h.parseExerciseAndSetIDs(r)
	if err != nil {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	set, err := h.setSvc.GetByIDAndUserID(r.Context(), setID, authSession.UserID)
	if err != nil {
		slog.Error("failed to fetch set for edit page", "error", err)
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	user, err := h.userSvc.GetByID(r.Context(), authSession.UserID)
	if err != nil {
		slog.Error("failed to fetch user for edit set page", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	doneAt := ""
	if set.CreatedAt.Valid {
		doneAt = set.CreatedAt.Time.UTC().Format("2006-01-02T15:04")
	}

	form := exercises.EditSetFormValues{
		Weight:      weightunit.Format(float64(set.WeightInG), user.WeightUnit),
		Repetitions: strconv.Itoa(int(set.Repetitions)),
		DoneAt:      doneAt,
	}

	page := exercises.EditSetPageWithForm(exID, setID, form, exercises.EditSetFormErr{}, user.WeightUnit)
	ctx := templ.WithChildren(r.Context(), page)

	if err := layout.Layout(r.URL.Path).Render(ctx, w); err != nil {
		slog.Error("failed to render edit set page", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

func (h *SetsHandler) UpdateSet(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	exID, setID, err := h.parseExerciseAndSetIDs(r)
	if err != nil {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	user, err := h.userSvc.GetByID(r.Context(), authSession.UserID)
	if err != nil {
		slog.Error("failed to fetch user for update set", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	var parsed schema.UpdateSet
	errs := schema.UpdateSetInput.Parse(zhttp.Request(r), &parsed)

	formValues := exercises.EditSetFormValues{
		Weight:      r.FormValue("weight"),
		Repetitions: r.FormValue("repetitions"),
		DoneAt:      r.FormValue("done_at"),
	}

	if errs != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)
		fieldErrors := zog.Issues.Flatten(errs)
		formErr := exercises.EditSetFormErr{
			Weight:      firstErr(fieldErrors, "weight"),
			Repetitions: firstErr(fieldErrors, "repetitions"),
			DoneAt:      firstErr(fieldErrors, "done_at"),
			Root:        firstErr(fieldErrors, "root"),
		}
		if renderErr := exercises.EditSetForm(exID, setID, formValues, formErr, user.WeightUnit).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render edit set form with errors", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
		return
	}

	doneAt := parsed.Done_at
	if doneAt.IsZero() {
		doneAt = time.Now()
	}

	if _, err := h.setSvc.UpdateSet(r.Context(), service.UpdateSetInput{
		ID:          setID,
		UserID:      authSession.UserID,
		Repetitions: parsed.Repetitions,
		WeightInG:   int32(weightunit.ToGrams(float64(parsed.Weight), user.WeightUnit)),
		DoneAt:      doneAt,
	}); err != nil {
		slog.Error("failed to update set", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		formErr := exercises.EditSetFormErr{Root: "something went wrong, please try again."}
		if renderErr := exercises.EditSetForm(exID, setID, formValues, formErr, user.WeightUnit).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render edit set form after db error", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("HX-Redirect", fmt.Sprintf("/exercises/%d", exID))
	w.WriteHeader(http.StatusOK)
}

func (h *SetsHandler) ViewRemoveSetPage(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	exID, setID, err := h.parseExerciseAndSetIDs(r)
	if err != nil {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	if _, err := h.setSvc.GetByIDAndUserID(r.Context(), setID, authSession.UserID); err != nil {
		slog.Error("failed to fetch set for remove page", "error", err)
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	page := exercises.RemoveSetPage(exID, setID)
	ctx := templ.WithChildren(r.Context(), page)

	if err := layout.Layout(r.URL.Path).Render(ctx, w); err != nil {
		slog.Error("failed to render remove set page", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

func (h *SetsHandler) RemoveSet(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	exID, setID, err := h.parseExerciseAndSetIDs(r)
	if err != nil {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	if err := h.setSvc.DeleteSet(r.Context(), setID, authSession.UserID); err != nil {
		slog.Error("failed to delete set", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		if renderErr := exercises.RemoveSetFormErr("something went wrong, please try again.").Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render remove set error", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("HX-Redirect", fmt.Sprintf("/exercises/%d", exID))
	w.WriteHeader(http.StatusOK)
}
