FROM node:22-bookworm-slim AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime

RUN apt-get update \
    && apt-get install -y --no-install-recommends swi-prolog-nox \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=10000
ENV SWIPL_PATH=/usr/bin/swipl

COPY package.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server

EXPOSE 10000
CMD ["npm", "start"]
