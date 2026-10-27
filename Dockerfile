FROM node:24-alpine AS styles

WORKDIR /app

RUN npm install @tailwindcss/cli@4.1.16 tailwindcss@4.1.16

COPY src ./src
RUN npx tailwindcss -i ./src/styles.css -o ./styles.css --minify


FROM ghcr.io/gleam-lang/gleam:v1.18.1-erlang-alpine AS builder

WORKDIR /app

RUN apk add --no-cache build-base

COPY gleam.toml manifest.toml ./
RUN gleam deps download

COPY src ./src
COPY priv ./priv
COPY --from=styles /app/styles.css ./priv/static/styles.css

RUN gleam export erlang-shipment


FROM erlang:29-alpine AS runtime

RUN addgroup -S app && adduser -S -G app app

WORKDIR /app

COPY --from=builder --chown=app:app /app/build/erlang-shipment ./

USER app

ENV ENV=prod

EXPOSE 8000

CMD ["sh", "./entrypoint.sh", "run"]
