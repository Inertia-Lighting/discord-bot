FROM node:lts-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]

RUN echo Installing Dependencies
RUN npm install

RUN echo Listing Outdated Dependencies
RUN npm outdated

RUN echo Building Project
RUN npm build

RUN echo Creating Directories
RUN if not exist ".\temporary" mkdir ".\temporary" 

COPY . .

CMD ["npm start"]