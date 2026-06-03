FROM node:20-alpine AS build
WORKDIR /app

# install deps (including dev deps for build)
COPY package*.json ./
RUN npm install

# copy source and build
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# install only production deps
COPY package*.json ./
RUN npm install --omit=dev

# copy built output
COPY --from=build /app/dist ./dist

EXPOSE 3001
CMD ["node", "dist/index.js"]
