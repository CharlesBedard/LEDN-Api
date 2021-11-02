FROM node:16

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .
RUN npm run compile
# RUN npm run populate-db

EXPOSE 3000
CMD [ "npm", "run", "api" ]