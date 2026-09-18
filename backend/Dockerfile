# Small, official Node.js image
FROM node:20-alpine

WORKDIR /app

# Copy dependency manifests first so Docker can cache the
# `npm install` layer -- it only re-runs if package.json changes.
COPY package.json ./
RUN npm install --omit=dev

# Now copy the rest of the source code
COPY . .

EXPOSE 5000

CMD ["node", "src/app.js"]
