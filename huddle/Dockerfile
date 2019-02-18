# base image
FROM node:9.6.1

# set working directory
WORKDIR /app
COPY . ./

# install and cache app dependencies
RUN npm install
RUN npm build

# start app
CMD ["npm", "start"]