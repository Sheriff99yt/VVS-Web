package auth

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const UserIDKey contextKey = "vvsUserID"

// DevUserID is used when AUTH_REQUIRED=false (local Phase 1/2 dev).
const DevUserID = "00000000-0000-0000-0000-000000000001"

// Config controls JWT verification for API and MCP routes.
type Config struct {
	Required  bool
	JWTSecret string
	DevUserID string
}

func LoadConfigFromEnv() Config {
	required := os.Getenv("AUTH_REQUIRED") == "true"
	secret := strings.TrimSpace(os.Getenv("SUPABASE_JWT_SECRET"))
	devUser := strings.TrimSpace(os.Getenv("DEV_USER_ID"))
	if devUser == "" {
		devUser = DevUserID
	}
	return Config{
		Required:  required,
		JWTSecret: secret,
		DevUserID: devUser,
	}
}

// WithUserID attaches a user id to a context (tests and internal callers).
func WithUserID(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, UserIDKey, userID)
}

// UserIDFromContext returns the authenticated user id set by Middleware or WithUserID.
func UserIDFromContext(ctx context.Context) string {
	if v, ok := ctx.Value(UserIDKey).(string); ok && v != "" {
		return v
	}
	return ""
}

// Middleware attaches a user id to the request context.
// When Required is false, uses DevUserID (or validates Bearer token when present).
func Middleware(cfg Config, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID, err := resolveUserID(r, cfg)
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}
		ctx := WithUserID(r.Context(), userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func resolveUserID(r *http.Request, cfg Config) (string, error) {
	token := bearerToken(r.Header.Get("Authorization"))
	if token != "" {
		if cfg.JWTSecret == "" {
			return "", errors.New("jwt secret not configured")
		}
		return parseSupabaseJWT(token, cfg.JWTSecret)
	}
	if cfg.Required {
		return "", errors.New("authorization required")
	}
	return cfg.DevUserID, nil
}

func bearerToken(header string) string {
	if header == "" {
		return ""
	}
	parts := strings.SplitN(header, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return ""
	}
	return strings.TrimSpace(parts[1])
}

func parseSupabaseJWT(tokenString, secret string) (string, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if token.Method.Alg() != jwt.SigningMethodHS256.Alg() {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secret), nil
	})
	if err != nil {
		return "", fmt.Errorf("invalid token: %w", err)
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return "", errors.New("invalid token claims")
	}
	sub, ok := claims["sub"].(string)
	if !ok || sub == "" {
		return "", errors.New("token missing sub claim")
	}
	return sub, nil
}
