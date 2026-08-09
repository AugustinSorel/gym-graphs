package handler

import (
	"fmt"
	"log/slog"
	"net/http"
	"strconv"

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

	formValues := exercises.NewSetFormValues{Weight: "0", Repetitions: "0"}
	if lastSet, err := h.setSvc.GetLastByExerciseID(r.Context(), int32(id)); err == nil {
		weightDisplay := weightunit.Convert(float64(lastSet.WeightInG), user.WeightUnit)
		formValues = exercises.NewSetFormValues{
			Weight:      strconv.FormatFloat(weightDisplay, 'f', -1, 64),
			Repetitions: strconv.Itoa(int(lastSet.Repetitions)),
		}
	}

	page := exercises.NewSetPageWithForm(
		int32(id),
		formValues,
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

	rowValues := exercises.NewSetFormValues{Weight: "0", Repetitions: "0"}
	if lastSet, err := h.setSvc.GetLastByExerciseID(r.Context(), int32(id)); err == nil {
		weightDisplay := weightunit.Convert(float64(lastSet.WeightInG), user.WeightUnit)
		rowValues = exercises.NewSetFormValues{
			Weight:      strconv.FormatFloat(weightDisplay, 'f', -1, 64),
			Repetitions: strconv.Itoa(int(lastSet.Repetitions)),
		}
	}

	if err := exercises.NewSetRow(rowValues, exercises.NewSetFormErr{}, user.WeightUnit).Render(r.Context(), w); err != nil {
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

	formValues := exercises.NewSetFormValues{Weight: r.FormValue("weight"), Repetitions: r.FormValue("repetitions")}

	var parsed schema.CreateSet
	errs := schema.CreateSetInput.Parse(zhttp.Request(r), &parsed)
	if errs != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)
		fieldErrors := zog.Issues.Flatten(errs)
		formErr := exercises.NewSetFormErr{
			Weight:      firstErr(fieldErrors, "weight"),
			Repetitions: firstErr(fieldErrors, "repetitions"),
		}
		if renderErr := exercises.NewSetForm(int32(id), formValues, formErr, user.WeightUnit).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render new set form with errors", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
		return
	}

	input := service.CreateSetInput{
		ExerciseID:  int32(id),
		Repetitions: parsed.Repetitions,
		WeightInG:   int32(weightunit.ToGrams(float64(parsed.Weight), user.WeightUnit)),
	}

	if _, err := h.setSvc.CreateSets(r.Context(), []service.CreateSetInput{input}); err != nil {
		slog.Error("failed to create set", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		formErr := exercises.NewSetFormErr{Root: "something went wrong, please try again."}
		if renderErr := exercises.NewSetForm(int32(id), formValues, formErr, user.WeightUnit).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render new set form after db error", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("HX-Redirect", fmt.Sprintf("/exercises/%d", id))
	w.WriteHeader(http.StatusCreated)
}
