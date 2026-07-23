FROM node:20-slim
WORKDIR /app

COPY package*.json ./
COPY client/package*.json client/
COPY server/package*.json server/
RUN npm install

COPY . .
RUN cd client && npm run build
RUN cd server && npx prisma generate && mkdir -p uploads && npm run build

RUN rm -rf node_modules/.cache client/src server/src

EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "server/dist/index.js"]
