# ─── Stage 1: build ──────────────────────────────────────────────────────────
FROM golang:1.26.4-alpine AS builder

# Add tzdata, Tailwind dependencies, and create a non-root user
RUN apk add --no-cache tzdata libstdc++ libgcc && \
  adduser -D -g '' appuser

WORKDIR /app

# Download the Tailwind CSS v4 standalone binary (architecture-aware)
ARG TARGETARCH
RUN ARCH=$([ "$TARGETARCH" = "amd64" ] && echo "x64" || echo "$TARGETARCH") && \
  wget -qO /usr/local/bin/tailwindcss \
  https://github.com/tailwindlabs/tailwindcss/releases/download/v4.3.3/tailwindcss-linux-${ARCH}-musl \
  && chmod +x /usr/local/bin/tailwindcss

# Install goose migration tool
RUN --mount=type=cache,target=/go/pkg/mod \
  --mount=type=cache,target=/root/.cache/go-build \
  go install github.com/pressly/goose/v3/cmd/goose@latest

# Download dependencies (Leverage BuildKit cache mounts for speed)
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod \
  go mod download

# Copy source
COPY . .

# Compile CSS
RUN tailwindcss -i web/styles/styles.css -o web/assets/css/styles.css --minify

# Build the binary with Go build caching
RUN --mount=type=cache,target=/go/pkg/mod \
  --mount=type=cache,target=/root/.cache/go-build \
  CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /gym-graphs ./cmd/api/main.go


# ─── Stage 2: minimal runtime image ──────────────────────────────────────────
FROM scratch

# Copy CA certificates for HTTPS/TLS
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy Timezone data
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo

# Copy the non-root user configuration
COPY --from=builder /etc/passwd /etc/passwd

# Copy the binary
COPY --from=builder /gym-graphs /gym-graphs

# Copy goose
COPY --from=builder /go/bin/goose /goose

# Run as the non-root user
USER appuser

EXPOSE 8000

ENTRYPOINT ["/gym-graphs"]
