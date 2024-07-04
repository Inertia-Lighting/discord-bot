FROM node:lts-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy dependency definitions
COPY package.json package-lock.json /usr/src/app/

# Install dependencies
RUN npm install

# Copy source code
COPY src /usr/src/app/src

# Build the bot
RUN npm run build

# Create tmp directory
RUN mkdir -p /usr/src/app/temporary

# Start the bot
CMD ["npm", "start"]