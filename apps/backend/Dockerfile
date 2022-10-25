FROM node:16-alpine

RUN apk add --no-cache --virtual pnpm-install curl \
 && npm install -g pnpm \
 && apk del pnpm-install

WORKDIR /app
COPY . .
RUN pnpm install --production

EXPOSE 3333
CMD ["node", "main.js"]
