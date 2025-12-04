FROM oven/bun:canary-debian AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --production
COPY . .
RUN bun run build

FROM debian:bookworm-slim
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      cups \
      cups-client \
      cups-bsd \
      ghostscript \
      libcups2 \
      ca-certificates \
      && rm -rf /var/lib/apt/lists/*
COPY --from=builder /bun /bun
ENV PATH="/bun/bin:$PATH"
WORKDIR /app
COPY --from=builder /app .
EXPOSE 3000
ENV NODE_ENV=production
CMD ["bun", "run", "start"]
