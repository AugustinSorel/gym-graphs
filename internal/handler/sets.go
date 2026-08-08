package handler

import (
	"fmt"
	"log/slog"
	"math"
	"net/http"
	"strconv"

	zog "github.com/Oudwins/zog"
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

	page := exercises.NewSetPageWithForm(
		int32(id),
		[]exercises.NewSetRowValues{{}},
		[]exercises.NewSetRowErr{{}},
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

	user, err := h.userSvc.GetByID(r.Context(), authSession.UserID)
	if err != nil {
		slog.Error("failed to fetch user for new set row", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	if err := exercises.NewSetRow(exercises.NewSetRowValues{}, exercises.NewSetRowErr{}, user.WeightUnit).Render(r.Context(), w); err != nil {
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

	weightValues := r.Form["weight"]
	repValues := r.Form["repetitions"]

	if len(weightValues) == 0 {
		w.Header().Set("HX-Redirect", fmt.Sprintf("/exercises/%d", id))
		w.WriteHeader(http.StatusOK)
		return
	}

	count := min(len(weightValues), len(repValues))

	rowValues := make([]exercises.NewSetRowValues, count)
	rowErrs := make([]exercises.NewSetRowErr, count)
	hasErr := false

	type parsedSet struct {
		weightInG   int32
		repetitions int32
	}
	parsed := make([]parsedSet, count)

	for i := range count {
		rowValues[i] = exercises.NewSetRowValues{
			Weight:      weightValues[i],
			Repetitions: repValues[i],
		}

		var input schema.CreateSetInput
		errs := schema.CreateSet.Parse(map[string]any{
			"weight":      weightValues[i],
			"repetitions": repValues[i],
		}, &input)

		if errs != nil {
			fieldErrs := zog.Issues.Flatten(errs)
			rowErrs[i] = exercises.NewSetRowErr{
				Weight:      firstErr(fieldErrs, "weight"),
				Repetitions: firstErr(fieldErrs, "repetitions"),
			}
			hasErr = true
			continue
		}

		parsed[i] = parsedSet{
			weightInG:   int32(math.Round(weightunit.ToGrams(float64(input.Weight), user.WeightUnit))),
			repetitions: input.Repetitions,
		}
	}

	if hasErr {
		w.WriteHeader(http.StatusUnprocessableEntity)
		if renderErr := exercises.NewSetForm(int32(id), rowValues, rowErrs, exercises.NewSetFormErr{}, user.WeightUnit).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render new set form with errors", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
		return
	}

	inputs := make([]service.CreateSetInput, count)
	for i, p := range parsed {
		inputs[i] = service.CreateSetInput{
			ExerciseID:  int32(id),
			Repetitions: p.repetitions,
			WeightInG:   p.weightInG,
		}
	}

	if _, err := h.setSvc.CreateSets(r.Context(), inputs); err != nil {
		slog.Error("failed to create sets", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		if renderErr := exercises.NewSetForm(int32(id), rowValues, rowErrs, exercises.NewSetFormErr{Root: "something went wrong, please try again."}, user.WeightUnit).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render new set form after db error", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("HX-Redirect", fmt.Sprintf("/exercises/%d", id))
	w.WriteHeader(http.StatusCreated)
}
