# Stage 1: Build web
FROM node:22-alpine AS web-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Build tts-service
FROM node:22-alpine AS tts-build
WORKDIR /app/tts-service
COPY tts-service/package.json tts-service/package-lock.json ./
RUN npm ci
COPY tts-service ./
RUN npm run build

# Stage 3: Bundle nginx + tts-api into one runtime image
FROM node:22-alpine
RUN apk add --no-cache nginx \
  && mkdir -p /run/nginx /app/tts-service/data

WORKDIR /app

COPY tts-service/package.json tts-service/package-lock.json ./tts-service/
RUN cd /app/tts-service && npm ci --omit=dev

COPY --from=tts-build /app/tts-service/dist ./tts-service/dist
COPY --from=web-build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/http.d/default.conf
COPY entrypoint.sh /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh

EXPOSE 80
CMD ["/app/entrypoint.sh"]
