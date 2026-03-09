FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:stable-alpine
# מחיקת קבצי ברירת המחדל של Nginx כדי למנוע את דף ה-Welcome
RUN rm -rf /usr/share/nginx/html/*

# העתקת קבצי ה-Build (וודא ש-Vite מוציא ל-dist ולא ל-build)
COPY --from=builder /app/dist /usr/share/nginx/html

# העתקת קובץ הקונפיגורציה החדש שיצרנו
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]