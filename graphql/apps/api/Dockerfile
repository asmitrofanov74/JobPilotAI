# ---- Development Stage ----
FROM node:22-alpine AS development

WORKDIR /app

COPY package.json tsconfig.json nest-cli.json ./

RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

EXPOSE 4000

CMD ["npm", "run", "start:dev"]

# ---- Production Build Stage ----
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json tsconfig.json nest-cli.json ./
RUN npm install --production=false

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# ---- Production Stage ----
FROM node:22-alpine AS production

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

EXPOSE 4000

CMD ["node", "dist/main"]
