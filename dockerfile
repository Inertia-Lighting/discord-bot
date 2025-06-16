FROM node:lts-alpine

# Create app directory
WORKDIR /usr/src/app/

# Copy source code
COPY . /usr/src/app/

#Install Prisma Prerequisites
RUN apk add --no-cache \
    openssl \
    zlib \
    libgcc \
    libc6-compat \
    python3 \
    make \
    g++ \
    git

# Corepack
RUN corepack enable

# Install dependencies
RUN yarn

RUN npx prisma generate

RUN find ./dist -type d -print

# Build the bot
RUN yarn build

# Create tmp directory
RUN mkdir -p /usr/src/app/temporary

#Expose ports to the outside world
EXPOSE 12752

# Start the bot
CMD ["yarn", "start"]