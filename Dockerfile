# One container: Express API + Expo web app on the same address.
# The web app calls the API at /api (same origin, no CORS needed).

# 1) Build the Expo web app
FROM node:22-alpine AS web
WORKDIR /mobile
COPY mobile/package*.json ./
RUN npm ci
COPY mobile/ ./
ENV EXPO_PUBLIC_API_URL=/api
RUN npx expo export --platform web --output-dir dist

# 2) Build the API server
FROM node:22-alpine AS api
WORKDIR /app
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# 3) Run
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY --from=api /app/dist ./dist
COPY server/migrations ./migrations
COPY --from=web /mobile/dist ./public
EXPOSE 3000
CMD ["sh", "-c", "node dist/scripts/migrate.js && node dist/index.js"]
