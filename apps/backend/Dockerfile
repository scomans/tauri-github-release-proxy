FROM node:26-slim

RUN npm install -g pnpm

WORKDIR /app
COPY . .
RUN pnpm install --production

EXPOSE 3333
CMD ["node", "main.js"]
