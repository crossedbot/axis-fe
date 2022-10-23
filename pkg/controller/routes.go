package controller

import (
	"net/http"

	"github.com/crossedbot/common/golang/server"
)

type Route struct {
	Handler          server.Handler
	Method           string
	Path             string
	ResponseSettings []server.ResponseSetting
}

var Routes = []Route{
	Route{
		GetIndexPage,
		http.MethodGet,
		"/",
		[]server.ResponseSetting{},
	},
	Route{
		GetLoginPage,
		http.MethodGet,
		"/login",
		[]server.ResponseSetting{},
	},
	Route{
		GetSignupPage,
		http.MethodGet,
		"/signup",
		[]server.ResponseSetting{},
	},
	Route{
		Get2faPage,
		http.MethodGet,
		"/two-factor",
		[]server.ResponseSetting{},
	},
	Route{
		GetPinsTable,
		http.MethodGet,
		"/pins",
		[]server.ResponseSetting{},
	},
	Route{
		GetPinStatusDetails,
		http.MethodGet,
		"/pins/:id",
		[]server.ResponseSetting{},
	},
	Route{
		ServeFiles,
		http.MethodGet,
		"/static/*filepath",
		[]server.ResponseSetting{},
	},
}
