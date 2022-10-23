package main

import (
	"context"
	"fmt"
	"net"
	"os"
	"strconv"
	"syscall"

	"github.com/crossedbot/common/golang/config"
	"github.com/crossedbot/common/golang/logger"
	"github.com/crossedbot/common/golang/server"
	"github.com/crossedbot/common/golang/service"

	"github.com/crossedbot/axis-fe/pkg/controller"
)

const FATAL_EXITCODE = 1

type Config struct {
	Host         string `toml:"host"`
	Port         int    `toml:"port"`
	ReadTimeout  int    `toml:"read_timeout"`
	WriteTimeout int    `toml:"write_timeout"`
}

func fatal(format string, a ...interface{}) {
	logger.Error(fmt.Errorf(format, a...))
	os.Exit(FATAL_EXITCODE)
}

func newServer(c Config) server.Server {
	hostport := net.JoinHostPort(c.Host, strconv.Itoa(c.Port))
	srv := server.New(
		hostport,
		c.ReadTimeout,
		c.WriteTimeout,
	)
	for _, route := range controller.Routes {
		srv.Add(
			route.Handler,
			route.Method,
			route.Path,
			route.ResponseSettings...,
		)
	}
	return srv
}

func run(ctx context.Context) error {
	f := ParseFlags()
	config.Path(f.ConfigFile)
	var cfg Config
	if err := config.Load(&cfg); err != nil {
		return err
	}
	controller.Ctrl()
	srv := newServer(cfg)
	if err := srv.Start(); err != nil {
		return err
	}
	logger.Info(fmt.Sprintf("Listening on %s:%d", cfg.Host, cfg.Port))
	<-ctx.Done()
	logger.Info("Received signal, shutting down...")
	return nil
}

func main() {
	ctx := context.Background()
	svc := service.New(ctx)
	if err := svc.Run(run, syscall.SIGINT, syscall.SIGTERM); err != nil {
		fatal("Error: %s", err)
	}
}
