# Use an official Node.js runtime as a parent image
FROM node:20 AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json for npm install
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app code
COPY . .

# Expose the port the app will run on
EXPOSE 3002

# Install production dependencies
RUN npm install --only=production

# Start the server
CMD ["node", "server.js"]