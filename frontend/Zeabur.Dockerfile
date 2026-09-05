FROM node:22-alpine

WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json
RUN npm ci

COPY frontend ./frontend

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

WORKDIR /app/frontend
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
