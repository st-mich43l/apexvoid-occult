FROM node:24-alpine AS build

WORKDIR /app
# .npmrc carries legacy-peer-deps (openapi-typescript peers TS5; repo uses TS6).
COPY package.json package-lock.json .npmrc ./
RUN npm ci

COPY index.html tsconfig*.json vite.config.ts ./
COPY src ./src
RUN npm run build

FROM nginx:alpine

# Version metadata — set by CI (build-args), overridable locally.
ARG VERSION=dev
ARG REVISION=unknown
ARG CREATED=unknown
LABEL org.opencontainers.image.title="apexvoid-occult-frontend" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.revision="${REVISION}" \
      org.opencontainers.image.created="${CREATED}" \
      org.opencontainers.image.source="https://github.com/st-mich43l/apexvoid-occult"

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1
