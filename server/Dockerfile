# שלב הבנייה (Builder)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
# מעתיקים גם את תיקיית הפריזמה לצורך ה-Generate
COPY prisma ./prisma/ 
RUN npm install
COPY . .
# ייצור הקליינט לפני ה-Build
RUN npx prisma generate 
RUN npm run build

# שלב ההרצה (Runtime)
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
# העתקת הסכימה גם לשלב ההרצה
COPY --from=builder /app/prisma ./prisma/ 

RUN npm install --only=production
# פקודה קריטית: ייצור הקליינט עבור סביבת הפרודקשן
RUN npx prisma@6 generate

EXPOSE 5000
CMD ["npm", "start"]