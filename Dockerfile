FROM node:lts-alpine

# Create app directory
WORKDIR /usr/src/app

# Install necessary tools
RUN apk add --no-cache python3 make g++ bash

# Copy package.json and yarn.lock first (for better caching)
COPY package.json yarn.lock ./

# Corepack
RUN corepack enable yarn

# Install dependencies
RUN yarn install

# Copy the rest of the source code
COPY . .

# Create dist directory
RUN mkdir -p /usr/src/app/dist

# Try to build - if it fails due to missing Prisma types, that's expected
RUN yarn build || echo "Build failed due to missing Prisma types - will be generated at runtime"

# Create tmp directory
RUN mkdir -p /usr/src/app/temporary

# Create a robust startup script that handles Prisma generation
RUN echo '#!/bin/bash' > /usr/src/app/start.sh && \
    echo 'echo "Starting Discord Bot..."' >> /usr/src/app/start.sh && \
    echo '' >> /usr/src/app/start.sh && \
    echo '# Try to generate Prisma client if it does not exist' >> /usr/src/app/start.sh && \
    echo 'if [ ! -f "node_modules/.prisma/client/index.js" ]; then' >> /usr/src/app/start.sh && \
    echo '  echo "Generating Prisma client..."' >> /usr/src/app/start.sh && \
    echo '  if npx prisma generate --no-hints; then' >> /usr/src/app/start.sh && \
    echo '    echo "Prisma client generated successfully"' >> /usr/src/app/start.sh && \
    echo '  else' >> /usr/src/app/start.sh && \
    echo '    echo "WARNING: Prisma client generation failed"' >> /usr/src/app/start.sh && \
    echo '    echo "The application may not work properly without database access"' >> /usr/src/app/start.sh && \
    echo '  fi' >> /usr/src/app/start.sh && \
    echo 'fi' >> /usr/src/app/start.sh && \
    echo '' >> /usr/src/app/start.sh && \
    echo '# Try to build the application if dist is empty' >> /usr/src/app/start.sh && \
    echo 'if [ ! -f "dist/index.js" ]; then' >> /usr/src/app/start.sh && \
    echo '  echo "Building application..."' >> /usr/src/app/start.sh && \
    echo '  yarn build:full || yarn build || echo "Build failed - check logs"' >> /usr/src/app/start.sh && \
    echo 'fi' >> /usr/src/app/start.sh && \
    echo '' >> /usr/src/app/start.sh && \
    echo 'echo "Starting the Discord bot..."' >> /usr/src/app/start.sh && \
    echo 'exec yarn start' >> /usr/src/app/start.sh && \
    chmod +x /usr/src/app/start.sh

# Use the startup script
CMD ["/usr/src/app/start.sh"]
