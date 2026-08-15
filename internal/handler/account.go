package handler

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/Oudwins/zog"
	"github.com/Oudwins/zog/zhttp"
	"github.com/a-h/templ"
	"github.com/augustinsorel/gym-graphs/internal/cookies"
	"github.com/augustinsorel/gym-graphs/internal/database/db"
	"github.com/augustinsorel/gym-graphs/internal/middleware"
	"github.com/augustinsorel/gym-graphs/internal/schema"
	"github.com/augustinsorel/gym-graphs/internal/service"
	"github.com/augustinsorel/gym-graphs/internal/session"
	"github.com/augustinsorel/gym-graphs/web/account"
	"github.com/augustinsorel/gym-graphs/web/ui/layout"
)

type AccountHandler struct {
	userSvc            *service.UserService
	authSessionSvc     *service.AuthSessionService
	tagSvc             *service.TagService
	accountDeletionSvc *service.AccountDeletionService
	exportSvc          *service.ExportService
}

func NewAccountHandler(userSvc *service.UserService, authSessionSvc *service.AuthSessionService, tagSvc *service.TagService, accountDeletionSvc *service.AccountDeletionService, exportSvc *service.ExportService) *AccountHandler {
	return &AccountHandler{userSvc: userSvc, authSessionSvc: authSessionSvc, tagSvc: tagSvc, accountDeletionSvc: accountDeletionSvc, exportSvc: exportSvc}
}

func (h *AccountHandler) ViewPage(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	user, err := h.userSvc.GetByID(r.Context(), authSession.UserID)
	if err != nil {
		page := account.AccountErrorPage("loading the account page failed")

		ctx := templ.WithChildren(r.Context(), page)

		if err := layout.Layout(r.URL.Path).Render(ctx, w); err != nil {
			slog.Error("failed to get user", "error", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	tags, err := h.tagSvc.GetByUserID(r.Context(), authSession.UserID)
	if err != nil {
		page := account.AccountErrorPage("loading the account page failed")

		ctx := templ.WithChildren(r.Context(), page)

		if err := layout.Layout(r.URL.Path).Render(ctx, w); err != nil {
			slog.Error("failed to get user", "error", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	page := account.AccountPage(user, tags)
	ctx := templ.WithChildren(r.Context(), page)

	if err := layout.Layout(r.URL.Path).Render(ctx, w); err != nil {
		page := account.AccountErrorPage("loading the account page failed")

		ctx := templ.WithChildren(r.Context(), page)

		if err := layout.Layout(r.URL.Path).Render(ctx, w); err != nil {
			slog.Error("failed to get user", "error", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}
}

func (h *AccountHandler) ViewEditNamePage(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	user, err := h.userSvc.GetByID(r.Context(), authSession.UserID)
	if err != nil {
		page := account.EditNamePageError("loading the edit name page failed")

		ctx := templ.WithChildren(r.Context(), page)

		if err := layout.Layout(r.URL.Path).Render(ctx, w); err != nil {
			slog.Error("failed to render edit name page", "error", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	page := account.EditNamePageWithForm(account.EditNameFormValues{Name: user.Name}, account.EditNameFormErr{})
	ctx := templ.WithChildren(r.Context(), page)

	if err := layout.Layout(r.URL.Path).Render(ctx, w); err != nil {
		page := account.EditNamePageError("loading the edit name page failed")

		ctx := templ.WithChildren(r.Context(), page)

		if err := layout.Layout(r.URL.Path).Render(ctx, w); err != nil {
			slog.Error("failed to render edit name page", "error", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}
}

func (h *AccountHandler) UpdateName(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	var input schema.UpdateName
	errs := schema.UpdateNameInput.Parse(zhttp.Request(r), &input)
	if errs != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)
		fieldErrors := zog.Issues.Flatten(errs)
		formErrs := account.EditNameFormErr{
			Name: firstErr(fieldErrors, "name"),
			Root: firstErr(fieldErrors, "root"),
		}
		formValues := account.EditNameFormValues{Name: r.FormValue("name")}
		if renderErr := account.EditNameForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render edit name form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
		return
	}

	if err := h.userSvc.UpdateName(r.Context(), authSession.UserID, input.Name); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		formErrs := account.EditNameFormErr{Root: "something went wrong, please try again."}
		formValues := account.EditNameFormValues{Name: input.Name}
		if renderErr := account.EditNameForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render edit name form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("HX-Redirect", "/account")
	w.WriteHeader(http.StatusOK)
}

func (h *AccountHandler) UpdateWeightUnit(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	var input schema.UpdateWeightUnit
	errs := schema.UpdateWeightUnitInput.Parse(zhttp.Request(r), &input)
	if errs != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)
		fieldErrors := zog.Issues.Flatten(errs)
		formErrs := account.WeightUnitFormErr{Root: firstErr(fieldErrors, "weightUnit")}
		formValues := account.WeightUnitFormValues{WeightUnit: r.FormValue("weight_unit")}
		if renderErr := account.WeightUnitForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render weight unit form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
		return
	}

	if err := h.userSvc.UpdateWeightUnit(r.Context(), authSession.UserID, db.WeightUnit(input.WeightUnit)); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		formErrs := account.WeightUnitFormErr{Root: "something went wrong, please try again."}
		formValues := account.WeightUnitFormValues{WeightUnit: input.WeightUnit}
		if renderErr := account.WeightUnitForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render weight unit form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("HX-Reswap", "none")

	if renderErr := account.WeightUnitForm(account.WeightUnitFormValues{WeightUnit: input.WeightUnit}, account.WeightUnitFormErr{}).Render(r.Context(), w); renderErr != nil {
		slog.Error("failed to render weight unit form", "error", renderErr)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

func (h *AccountHandler) UpdateOneRepMaxAlgorithm(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	var input schema.UpdateOneRepMaxAlgorithm
	errs := schema.UpdateOneRepMaxAlgorithmInput.Parse(zhttp.Request(r), &input)
	if errs != nil {
		w.WriteHeader(http.StatusUnprocessableEntity)
		fieldErrors := zog.Issues.Flatten(errs)
		formErrs := account.OneRepMaxAlgorithmFormErr{Root: firstErr(fieldErrors, "oneRepMaxAlgorithm")}
		formValues := account.OneRepMaxAlgorithmFormValues{Algorithm: r.FormValue("one_rep_max_algorithm")}
		if renderErr := account.OneRepMaxAlgorithmForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render one rep max algorithm form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
		return
	}

	if err := h.userSvc.UpdateOneRepMaxAlgorithm(r.Context(), authSession.UserID, db.OneRepMaxAlgorithm(input.OneRepMaxAlgorithm)); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		formErrs := account.OneRepMaxAlgorithmFormErr{Root: "something went wrong, please try again."}
		formValues := account.OneRepMaxAlgorithmFormValues{Algorithm: input.OneRepMaxAlgorithm}
		if renderErr := account.OneRepMaxAlgorithmForm(formValues, formErrs).Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render one rep max algorithm form", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("HX-Trigger", `{"one-rep-max-algorithm-changed":"`+input.OneRepMaxAlgorithm+`"}`)

	if renderErr := account.OneRepMaxAlgorithmForm(
		account.OneRepMaxAlgorithmFormValues{Algorithm: input.OneRepMaxAlgorithm},
		account.OneRepMaxAlgorithmFormErr{},
	).Render(r.Context(), w); renderErr != nil {
		slog.Error("failed to render one rep max algorithm form", "error", renderErr)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
}

func (h *AccountHandler) DownloadData(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	user, err := h.userSvc.GetByID(r.Context(), authSession.UserID)
	if err != nil {
		slog.Error("failed to get user for data export", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	export, err := h.exportSvc.ExportUserData(r.Context(), user)
	if err != nil {
		slog.Error("failed to build user data export", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	filename := fmt.Sprintf("gym-graphs-%s.json", time.Now().UTC().Format("2006-01-02"))

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))

	enc := json.NewEncoder(w)
	enc.SetIndent("", "  ")
	if err := enc.Encode(export); err != nil {
		slog.Error("failed to encode user data export", "error", err)
	}
}

func (h *AccountHandler) DeleteAccount(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	deletionSession, err := h.accountDeletionSvc.Create(r.Context(), authSession.ID)
	if err != nil {
		slog.Error("failed to create account deletion session", "path", r.URL.Path, "error", err)
		w.WriteHeader(http.StatusInternalServerError)

		if renderErr := account.RemoveAccountRow("something went wrong").Render(r.Context(), w); renderErr != nil {
			slog.Error("failed to render remove account row", "error", renderErr)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	cookies.SetAccountDeletionSession(w, session.CreateToken(deletionSession.ID, deletionSession.Secret))

	w.Header().Set("HX-Redirect", "/delete-account/verify-password")
	w.WriteHeader(http.StatusCreated)
}

func (h *AccountHandler) SignOut(w http.ResponseWriter, r *http.Request) {
	authSession, _ := middleware.GetAuthSession(r.Context())

	if err := h.authSessionSvc.Delete(r.Context(), authSession.ID); err != nil {
		page := account.SignOutRow("something went wrong")

		ctx := templ.WithChildren(r.Context(), page)

		if err := layout.Layout(r.URL.Path).Render(ctx, w); err != nil {
			slog.Error("failed to delete auth session", "error", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}

		return
	}

	cookies.ClearAuthSession(w)
	w.Header().Set("HX-Redirect", "/sign-in")
}
