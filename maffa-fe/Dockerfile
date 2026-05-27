# Build:  podman build -t maffa-fe --build-arg VITE_API_URL=http://localhost:8000 .
# Run:    podman run -d --name my-app -p 5000:5000 maffa-fe
#         (-p host:container is required; without it, localhost:5000 will not work.)
#
# --- Stage 1: install deps and produce static dist/ ---
FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies first (better layer cache)
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite inlines VITE_* at build time only.
# Override at deploy time with: --build-arg VITE_API_URL=https://your-domain/maffa
ARG VITE_API_URL=http://134.33.132.134/maffa

ENV VITE_API_URL=${VITE_API_URL}

ARG BASE_PATH=/maffa-fe/
ENV BASE_PATH=${BASE_PATH}

RUN npm run build

# --- Stage 2: serve with nginx ---
FROM nginx:1.27-alpine AS runner
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 5000
CMD ["nginx", "-g", "daemon off;"]
