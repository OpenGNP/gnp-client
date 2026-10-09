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
# Microsoft sign-in — baked in at build time; empty CLIENT_ID hides the button.
ARG VITE_MSAL_CLIENT_ID=
ARG VITE_MSAL_TENANT_ID=common
ENV VITE_MSAL_CLIENT_ID=$VITE_MSAL_CLIENT_ID
ENV VITE_MSAL_TENANT_ID=$VITE_MSAL_TENANT_ID
RUN bun run build

# ---- serve ----
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
