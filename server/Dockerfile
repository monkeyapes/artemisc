FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
COPY client/package*.json client/
COPY server/package*.json server/
RUN npm install

COPY . .
RUN cd client && npm run build
RUN cd server && mkdir -p uploads && npx prisma generate && npm run build && ls -la dist/

RUN rm -rf node_modules/.cache client/src server/src

FROM node:20-slim
WORKDIR /app
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/client/dist ./client/dist
COPY --from=build /app/server/uploads ./server/uploads
COPY --from=build /app/server/prisma ./server/prisma
COPY --from=build /app/server/package.json ./server/

EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "server/dist/index.js"]
