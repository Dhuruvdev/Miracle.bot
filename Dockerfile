FROM node:22.20-alpine3.22 AS build

WORKDIR /app

# Copy manifests first for layer caching
COPY package.json yarn.lock .yarnrc.yml ./
COPY frontend/package.json ./frontend/
COPY frontend/packages/components-sdk/package.json ./frontend/packages/components-sdk/
COPY backend/package.json ./backend/
COPY database/package.json ./database/

RUN corepack enable && yarn install --immutable

# Copy source and build
COPY frontend ./frontend
COPY backend  ./backend
COPY database ./database

RUN yarn workspace components-sdk build && yarn workspace frontend build

# ── Production image ──────────────────────────────────────────────────────────
FROM node:22.20-alpine3.22

WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
COPY backend/package.json ./backend/
COPY database/package.json ./database/

RUN corepack enable && yarn workspaces focus backend database --production 2>/dev/null || yarn install --immutable

COPY backend  ./backend
COPY database ./database
COPY --from=build /app/frontend/dist ./frontend/dist

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "backend/src/index.js"]
