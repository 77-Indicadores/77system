FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build && pnpm prune --prod

FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["sh", "-c", "pnpm db:generate && pnpm db:push && pnpm db:seed || exit 1; { while true; do pnpm data:worker; sleep 60; done; } & exec pnpm dev"]

FROM base AS prod
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY . .
COPY --from=builder /app/.next-build ./.next-build
EXPOSE 3000
CMD ["sh", "-c", "pnpm db:generate && pnpm db:push && pnpm db:seed || exit 1; { while true; do pnpm data:worker; sleep 60; done; } & exec pnpm start"]
