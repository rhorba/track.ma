FROM node:22-alpine AS base
RUN npm install -g pnpm
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/gps-ingestion/package.json ./apps/gps-ingestion/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/gps-ingestion/node_modules ./apps/gps-ingestion/node_modules
COPY . .
WORKDIR /app/apps/gps-ingestion
EXPOSE 3002
CMD ["pnpm", "start:dev"]

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
WORKDIR /app/apps/gps-ingestion
RUN pnpm build

FROM base AS prod
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/apps/gps-ingestion/dist ./dist
COPY --from=deps --chown=app:app /app/node_modules ./node_modules
USER app
EXPOSE 3002
CMD ["node", "dist/main"]
