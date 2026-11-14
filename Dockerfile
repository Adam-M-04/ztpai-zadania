FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

ENV NODE_ENV=production
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
USER node
EXPOSE 3000

CMD ["sh", "-c", "npx knex migrate:latest --verbose && exec node src/server.js"]
