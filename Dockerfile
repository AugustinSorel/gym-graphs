FROM node:22-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./

RUN corepack enable pnpm && pnpm i --frozen-lockfile

COPY . .

RUN pnpm run build

ENV NODE_ENV=production

EXPOSE 3000

ENV PORT=3000

CMD ["node", ".output/server/index.mjs"]
