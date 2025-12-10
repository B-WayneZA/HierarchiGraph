FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json and lock file
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend code
COPY . .

# Build TypeScript → dist/
RUN npm run build



# --- Production image ---
FROM node:18-alpine

WORKDIR /app

# Copy only built code & node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Expose backend port
EXPOSE 5000

# Run backend
CMD ["node", "dist/server.js"]
