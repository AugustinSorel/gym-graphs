FROM node:22-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./

RUN corepack enable pnpm && pnpm i

COPY . .

CMD ["pnpm", "dev"]
