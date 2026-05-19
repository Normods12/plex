# Multi-stage build for Strapi 5 production environment
# Base image
FROM node:20-alpine AS build
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev nasm bash vips-dev git

WORKDIR /opt/
COPY package.json package-lock.json ./
RUN npm ci

WORKDIR /opt/app
COPY . .
ENV NODE_ENV=production
RUN npm run build

# Runtime stage
FROM node:20-alpine
RUN apk add --no-cache vips-dev
WORKDIR /opt/
COPY package.json package-lock.json ./
RUN npm ci --only=production

WORKDIR /opt/app
COPY --from=build /opt/app ./
ENV PATH /opt/node_modules/.bin:$PATH
ENV NODE_ENV=production

EXPOSE 1337
CMD ["npm", "run", "start"]
