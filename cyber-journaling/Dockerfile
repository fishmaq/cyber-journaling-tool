# Build Stage
FROM node:22-alpine AS build

WORKDIR /app/

COPY ./shared ./shared
COPY ./cyber-journaling ./cyber-journaling

WORKDIR /app/shared
RUN npm install -g typescript
RUN npm install && tsc

WORKDIR /app/cyber-journaling

RUN npm install && npm run build


# Production Stage
FROM nginx:alpine

COPY cyber-journaling/nginx.conf.template /etc/nginx/templates/default.conf.template

COPY --from=build /app/cyber-journaling/dist/cyber-journaling/browser /usr/share/nginx/html

EXPOSE 80

COPY cyber-journaling/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

CMD ["nginx", "-g", "daemon off;"]
