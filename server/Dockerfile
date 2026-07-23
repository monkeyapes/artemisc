FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
COPY client/package*.json client/
COPY server/package*.json server/
RUN npm install

COPY . .
RUN cd client && npm run build
RUN cd server && npx prisma generate && npm run build

EXPOSE 3001
CMD ["node", "server/dist/index.js"]
