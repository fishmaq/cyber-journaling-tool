FROM node:22-alpine

WORKDIR /app

COPY ./shared ./shared
COPY ./cyber-journaling-backend ./cyber-journaling-backend

WORKDIR /app/shared
RUN npm install -g typescript
RUN npm install && npm run build

WORKDIR /app/cyber-journaling-backend
RUN npm install && npm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]