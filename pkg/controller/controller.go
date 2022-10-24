package controller

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"math"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"

	axisModels "github.com/crossedbot/axis/pkg/pins/models"
	"github.com/crossedbot/common/golang/config"

	"github.com/crossedbot/axis-fe/web/templates"
)

type Controller interface {
	GetIndexPage() []byte

	GetLoginPage() []byte

	GetSignupPage() []byte

	Get2faPage() []byte

	GetPinsTable(token string, limit, offset int, sortBy string) ([]byte, error)

	GetPinStatusDetails(token, requestId string) ([]byte, error)

	CreatePin(token string, pin axisModels.Pin) ([]byte, error)
}

type controller struct {
	ctx          context.Context
	client       *http.Client
	axisEndpoint string
}

type Config struct {
	AxisEndpoint string `toml:"axis_endpoint"`
	AxisTimeout  int64  `toml:"axis_timeout"`
}

var control Controller
var controllerOnce sync.Once
var Ctrl = func() Controller {
	controllerOnce.Do(func() {
		var cfg Config
		if err := config.Load(&cfg); err != nil {
			panic(fmt.Errorf(
				"Controller: failed to load configuration, %s",
				err,
			))
		}
		if cfg.AxisEndpoint == "" {
			panic(fmt.Errorf("Controller: Axis endpoint is" +
				" missing from configuration"))
		}
		ctx := context.Background()
		client := &http.Client{
			Timeout: time.Duration(cfg.AxisTimeout) * time.Second,
		}
		control = New(ctx, client, cfg.AxisEndpoint)
	})
	return control
}

func New(ctx context.Context, client *http.Client, axisEndpoint string) Controller {
	return &controller{
		ctx:          ctx,
		client:       client,
		axisEndpoint: axisEndpoint,
	}
}

func (c *controller) GetIndexPage() []byte {
	return []byte(strings.TrimSpace(templates.IndexPage()))
}

func (c *controller) GetLoginPage() []byte {
	return []byte(strings.TrimSpace(templates.LoginPage()))
}

func (c *controller) GetSignupPage() []byte {
	return []byte(strings.TrimSpace(templates.SignupPage()))
}

func (c *controller) Get2faPage() []byte {
	return []byte(strings.TrimSpace(templates.TwofaPage()))
}

func (c *controller) GetPinsTable(token string, limit, offset int, sortBy string) ([]byte, error) {
	u, err := url.Parse(c.axisEndpoint)
	if err != nil {
		return nil, err
	}
	u = u.JoinPath("pins")
	query := make(url.Values)
	if limit > 0 {
		query.Set("limit", strconv.Itoa(limit))
	}
	if offset > 0 {
		query.Set("offset", strconv.Itoa(offset))
	}
	if sortBy != "" {
		query.Set("sort", sortBy)
	}
	u.RawQuery = query.Encode()
	req, err := http.NewRequest(http.MethodGet, u.String(), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	resp, _, err := sendRequest(c.client, req)
	if err != nil {
		return nil, err
	}
	var pins axisModels.Pins
	if err := json.Unmarshal(resp, &pins); err != nil {
		return nil, err
	}
	index := 1
	nPages := 1
	if limit > 0 {
		nPages = pins.Total / limit
		if math.Remainder(float64(pins.Total), float64(limit)) > 0 {
			nPages += 1
		}
		index = (offset / limit) + 1
	}
	return []byte(strings.TrimSpace(templates.Pins(pins, index, nPages,
		sortBy))), nil
}

func (c *controller) GetPinStatusDetails(token, requestId string) ([]byte, error) {
	u, err := url.Parse(c.axisEndpoint)
	if err != nil {
		return nil, err
	}
	u = u.JoinPath("pins", requestId)
	req, err := http.NewRequest(http.MethodGet, u.String(), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	resp, _, err := sendRequest(c.client, req)
	if err != nil {
		return nil, err
	}
	var pinStatus axisModels.PinStatus
	if err := json.Unmarshal(resp, &pinStatus); err != nil {
		return nil, err
	}
	return []byte(strings.TrimSpace(templates.PinStatus(pinStatus))), nil
}

func (c *controller) CreatePin(token string, pin axisModels.Pin) ([]byte, error) {
	data, err := json.Marshal(pin)
	if err != nil {
		return nil, err
	}
	u, err := url.Parse(c.axisEndpoint)
	if err != nil {
		return nil, err
	}
	u = u.JoinPath("pins")
	req, err := http.NewRequest(http.MethodPost, u.String(), bytes.NewBuffer(data))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	resp, _, err := sendRequest(c.client, req)
	if err != nil {
		return nil, err
	}
	var pinStatus axisModels.PinStatus
	if err := json.Unmarshal(resp, &pinStatus); err != nil {
		return nil, err
	}
	return []byte(strings.TrimSpace(templates.PinStatus(pinStatus))), nil
}

func sendRequest(client *http.Client, req *http.Request) ([]byte, int, error) {
	resp, err := client.Do(req)
	if err != nil {
		return nil, -1, err
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	return body, resp.StatusCode, err
}
