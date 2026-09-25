# ---- build ----
FROM oven/bun:1 AS build
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# Same-origin: nginx below serves this build and proxies /api to gnp-server over
# the Docker network, so a relative path works with no domain needed.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN bun run build

# ---- serve ----
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
