FROM node:lts-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy source code
COPY . /usr/src/app/

# Install dependencies
RUN npm ci --immutable

# Build the bot
RUN npm run build

# Create tmp directory
RUN mkdir -p /usr/src/app/temporary

# Start the bot
CMD ["npm", "run", "start"]
