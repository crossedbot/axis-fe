package controller

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/crossedbot/common/golang/server"
)

func GetIndexPage(w http.ResponseWriter, r *http.Request, p server.Parameters) {
	b := Ctrl().GetIndexPage()
	w.Header().Set("Content-Type", "text/html")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "%s", b)
}

func GetLoginPage(w http.ResponseWriter, r *http.Request, p server.Parameters) {
	b := Ctrl().GetLoginPage()
	w.Header().Set("Content-Type", "text/html")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "%s", b)
}

func GetSignupPage(w http.ResponseWriter, r *http.Request, p server.Parameters) {
	b := Ctrl().GetSignupPage()
	w.Header().Set("Content-Type", "text/html")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "%s", b)
}

func Get2faPage(w http.ResponseWriter, r *http.Request, p server.Parameters) {
	b := Ctrl().Get2faPage()
	w.Header().Set("Content-Type", "text/html")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "%s", b)
}

func GetPinsTable(w http.ResponseWriter, r *http.Request, p server.Parameters) {
	query := r.URL.Query()
	limit := 0
	offset := 0
	token := extractToken(r)
	if token == "" {
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprintf(w, ErrNoRequestToken.Error())
		return
	}
	if v := query.Get("limit"); v != "" {
		var err error
		limit, err = strconv.Atoi(v)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			fmt.Fprintf(w, "Limit must be an integer value")
			return
		}
	}
	if v := query.Get("offset"); v != "" {
		var err error
		offset, err = strconv.Atoi(v)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			fmt.Fprintf(w, "Offset must be an integer value")
			return
		}
	}
	sortBy := ""
	if v := query.Get("sort"); v != "" {
		sortBy = v
	}
	b, err := Ctrl().GetPinsTable(token, limit, offset, sortBy)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, err.Error())
		return
	}
	w.Header().Set("Content-Type", "text/html")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "%s", b)
}

func GetPinStatusDetails(w http.ResponseWriter, r *http.Request, p server.Parameters) {
	token := extractToken(r)
	if token == "" {
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprintf(w, ErrNoRequestToken.Error())
		return
	}
	id := p.Get("id")
	if id == "" {
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprintf(w, "Request ID is required")
		return
	}
	b, err := Ctrl().GetPinStatusDetails(token, id)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprintf(w, err.Error())
		return
	}
	w.Header().Set("Content-Type", "text/html")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "%s", b)
}

func ServeFiles(w http.ResponseWriter, r *http.Request, p server.Parameters) {
	fs := http.FileServer(http.Dir("web/static"))
	r.URL.Path = p.Get("filepath")
	fs.ServeHTTP(w, r)
}

func extractToken(r *http.Request) string {
	var tkn string
	h := r.Header.Get("Authorization")
	if len(h) >= 7 && strings.EqualFold(h[:7], "BEARER ") {
		tkn = h[7:]
	}
	return tkn
}
