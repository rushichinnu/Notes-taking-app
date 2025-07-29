FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Install TypeScript globally to avoid permission issues
RUN npm install -g typescript

# Copy source code
COPY . .

# Build the TypeScript application
RUN npm run build

# Expose the port your app runs on
EXPOSE 5000

# Start the application using the compiled JavaScript
CMD ["node", "dist/server.js"]
