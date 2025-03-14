FROM node:lts-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy source code
COPY . /usr/src/app/

# Install dependencies
RUN yarn

# Build the bot
RUN yarn build

# Create tmp directory
RUN mkdir -p /usr/src/app/temporary

# Start the bot
CMD ["yarn", "start"]
