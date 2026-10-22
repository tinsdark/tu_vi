# Web + API trong một container. Build từ thư mục gốc repo:  docker build -f web/Dockerfile -t tu-vi .
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
# ANTHROPIC_API_KEY cần truyền lúc chạy (docker run -e ANTHROPIC_API_KEY=...); không có thì chỉ trả văn mẫu.
# Sau reverse proxy: thêm -e TUVI_TIN_CAY_PROXY=1 để giới hạn lượt theo IP khách thật.
EXPOSE 8787
USER node
CMD ["npx", "tsx", "server/index.ts"]
