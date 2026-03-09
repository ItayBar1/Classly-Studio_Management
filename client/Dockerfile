FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# חשוב ל-React Router
COPY --from=builder /app/public/_redirects /usr/share/nginx/html/ || true 
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]