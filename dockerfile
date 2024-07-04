FROM node:lts-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy dependency definitions
COPY package.json /usr/src/app
COPY package-lock.json /usr/src/app

# Install dependecies
RUN npm ci

# Warn outdated dependecies
RUN npm outdated

# Build the bot
RUN npm build

# Get all the code needed to run the app
COPY . /usr/src/app/

# Create tmp directory
RUN if not exist ".\usr\src\app\temporary" mkdir ".\usr\src\app\temporary"

# Start the bot
CMD ["npm", "start"]