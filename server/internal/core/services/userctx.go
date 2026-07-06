package services

import (
	"context"

	"vvs-server/internal/core/auth"
)

func userIDFrom(ctx context.Context) string {
	if id := auth.UserIDFromContext(ctx); id != "" {
		return id
	}
	return auth.DevUserID
}
