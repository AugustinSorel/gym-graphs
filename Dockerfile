FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run -r build
RUN pnpm deploy --filter=api --prod /prod/api
RUN pnpm deploy --filter=web --prod /prod/web
RUN pnpm deploy --filter=api --prod /prod/migration

FROM node:22-slim AS api
COPY --from=build /prod/api /prod/api
WORKDIR /prod/api
EXPOSE 5000
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]

FROM base AS migration
COPY --from=build /prod/migration /prod/migration
WORKDIR /prod/migration
RUN pnpm db:generate
CMD ["./node_modules/.bin/drizzle-kit", "migrate"]

FROM node:22-slim AS web
COPY --from=build /prod/web /prod/web
WORKDIR /prod/web
EXPOSE 3000
CMD [ "node", ".output/server/index.mjs" ]
