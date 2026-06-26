FROM node:24-slim AS builder

WORKDIR /app
ENV npm_config_update_notifier=false

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json nest-cli.json ./
COPY src ./src
COPY public ./public
RUN npm run build

FROM node:24-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV npm_config_update_notifier=false

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

EXPOSE ${PORT:-4860}

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 4860) + '/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/main"]
