FROM node:14-alpine

WORKDIR /app
COPY . .
RUN yarn install --production --frozen-lockfile

EXPOSE 3333
CMD ["node", "main.js"]
