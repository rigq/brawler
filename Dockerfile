# Game server image (Colyseus). Node 24 runs the .ts files directly: no build step.
# Build from the repo root: docker build -t brawler-server .
FROM node:24-slim
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/
# Only what the server needs at runtime (no Phaser, Vite or TypeScript).
RUN npm ci --omit=dev --workspace @brawler/server --include-workspace-root=false
COPY packages/shared/src packages/shared/src
COPY packages/server/src packages/server/src
ENV NODE_ENV=production
ENV PORT=2567
EXPOSE 2567
USER node
CMD ["node", "packages/server/src/index.ts"]
