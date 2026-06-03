FROM node:18-alpine AS build
WORKDIR /app

# install deps (including dev deps for build)
COPY package*.json ./
RUN npm ci

# copy source and build
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production

# install only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# copy built output
COPY --from=build /app/dist ./dist

EXPOSE 3001
CMD ["node", "dist/index.js"]
