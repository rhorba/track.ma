FROM node:22-alpine AS base
RUN npm install -g pnpm
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .
WORKDIR /app/apps/api
EXPOSE 3001
CMD ["pnpm", "start:dev"]

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
WORKDIR /app/apps/api
RUN pnpm build

FROM base AS prod
COPY --from=build /app/apps/api/dist ./dist
COPY --from=deps /app/apps/api/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/main"]
