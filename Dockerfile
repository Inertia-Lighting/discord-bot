FROM node:lts-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy source code
COPY . /usr/src/app/

ENV CI=true

# Corepack
RUN corepack enable

# Install dependencies
RUN pnpm install

RUN pnpm build

# Create tmp directory
RUN mkdir -p /usr/src/app/temporary

# Start the bot
CMD ["pnpm", "start"]
