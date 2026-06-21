# Backend image is built from the monorepo root.
# Use: docker compose -f ../../docker-compose.yml up --build

FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/

RUN npm ci --workspace=@mimar/backend --include-workspace-root

COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

WORKDIR /app/apps/backend

RUN npm run prisma:generate
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app/apps/backend

ENV NODE_ENV=production

RUN apk add --no-cache tini

COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package.json ./package.json
COPY --from=builder /app/apps/backend/prisma ./prisma
COPY --from=builder /app/apps/backend/scripts ./scripts
COPY apps/backend/docker-entrypoint.sh ./docker-entrypoint.sh

RUN sed -i 's/\r$//' docker-entrypoint.sh \
  && chmod +x docker-entrypoint.sh \
  && mkdir -p uploads/companies

EXPOSE 3000

ENTRYPOINT ["tini", "--"]
CMD ["sh", "./docker-entrypoint.sh"]
