FROM node:22-alpine

WORKDIR /app
COPY backend/package.json ./package.json
COPY backend/src ./src

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4000

EXPOSE 4000

CMD ["node", "src/server.js"]
