# Web tĩnh trong một container. Build từ thư mục gốc repo:  docker build -f web/Dockerfile -t tu-vi .
FROM node:22-alpine AS build
WORKDIR /app
COPY web/package.json web/package-lock.json web/
RUN cd web && npm ci
COPY data data
COPY web web
RUN cd web && npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8787
COPY --from=build /app/data data
COPY --from=build /app/web web
WORKDIR /app/web

EXPOSE 8787
USER node
CMD ["npx", "tsx", "server/index.ts"]
