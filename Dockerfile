FROM oven/bun:canary-debian AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install
COPY . .
RUN bun run build

FROM debian:bookworm-slim AS final
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      cups \
      cups-client \
      cups-bsd \
      poppler-utils \
      libcups2 \
      ca-certificates \
      && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/local/bin/bun /usr/local/bin/bun
ENV PATH="/usr/local/bin:$PATH"
WORKDIR /app
COPY --from=builder /app .
EXPOSE 3000
ENV NODE_ENV=production
CMD ["bun", "run", "start"]
