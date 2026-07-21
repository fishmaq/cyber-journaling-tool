FROM node:22-alpine

WORKDIR /app

COPY ./shared ./shared
COPY ./cyber-journaling-backend ./cyber-journaling-backend

WORKDIR /app/shared
RUN npm install -g typescript
RUN npm install && tsc

WORKDIR /app/cyber-journaling-backend
RUN npm install && npm run build:ts
RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npx prisma generate && node dist/index.js"]