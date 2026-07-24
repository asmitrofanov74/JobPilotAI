# ---- Development Stage ----
FROM node:22-alpine AS development

WORKDIR /app

COPY package.json tsconfig.json next.config.js ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

# ---- Production Build Stage ----
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json tsconfig.json next.config.js ./
RUN npm install --production=false

COPY . .
RUN npm run build

# ---- Production Stage ----
FROM node:22-alpine AS production

WORKDIR /app

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
