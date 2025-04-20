FROM node:lts-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy source code
COPY . /usr/src/app/

# Corepack
RUN corepack enable yarn

# Corepack update
RUN corepack up

# Make sure yarn is on stable
RUN yarn set version stable

# Install dependencies
RUN yarn

# Build the bot
RUN yarn build

# Create tmp directory
RUN mkdir -p /usr/src/app/temporary

# Start the bot
CMD ["yarn", "start"]