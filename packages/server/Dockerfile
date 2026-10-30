# Legacy package-local Dockerfile. Prefer the root Dockerfile.server with docker compose.
FROM node:26-alpine AS builder

WORKDIR /usr/src/app

RUN npm install -g corepack@0.36.0 && corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/server/package.json ./packages/server/
COPY packages/core/package.json ./packages/core/

RUN pnpm install --frozen-lockfile --filter @crypt.fyi/server...

COPY packages/server ./packages/server
COPY packages/core ./packages/core

RUN pnpm --filter @crypt.fyi/server build

FROM node:26-alpine

ENV NODE_ENV=production
USER node

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/packages/server/dist ./dist
COPY --from=builder /usr/src/app/packages/server/package.json ./package.json

ENV PORT=3000
EXPOSE $PORT

CMD [ "node", "dist/index.js" ]
