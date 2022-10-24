package controller

import (
	"errors"
)

var (
	ErrNoRequestToken = errors.New("No token found with request")
)
