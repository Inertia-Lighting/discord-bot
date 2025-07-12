FROM node:lts-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy source code
COPY . /usr/src/app/

# Corepack
RUN corepack enable yarn

RUN apk add --no-cache python3 make g++

# Install dependencies
RUN yarn install

# Build the bot
RUN yarn build

# Create tmp directory
RUN mkdir -p /usr/src/app/temporary

# Start the bot
CMD ["yarn", "start"]
