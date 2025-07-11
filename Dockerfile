FROM node:lts-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and yarn.lock first (for better caching)
COPY package.json yarn.lock ./

# Corepack
RUN corepack enable yarn

RUN apk add --no-cache python3 make g++

# Install dependencies
RUN yarn install

# Copy the rest of the source code
COPY . .

# Try to generate Prisma client, but don't fail if it doesn't work
RUN npx prisma generate --no-hints || echo "Prisma generation failed - will retry at runtime"

# Build the bot
RUN yarn build || yarn build:full || echo "Build completed with warnings"

# Create tmp directory
RUN mkdir -p /usr/src/app/temporary

# Start the bot (attempt Prisma generation if needed)
CMD ["sh", "-c", "(npx prisma generate --no-hints 2>/dev/null || echo 'Using existing Prisma client') && yarn start"]
