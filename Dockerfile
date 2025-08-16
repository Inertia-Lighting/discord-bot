FROM node:lts-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy source code
COPY . /usr/src/app/

# Corepack
RUN corepack enable yarn ;\
# Install dependencies
yarn install ;\
# Clean Cache
yarn cache clean ;\
# Build the bot
yarn build ;\
# Create tmp directory
mkdir -p /usr/src/app/temporary

# Start the bot
CMD ["yarn", "start"]
