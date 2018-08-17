FROM node:alpine
# Run the image as a non-root user
RUN adduser -S droneserver
# Create app directory
RUN mkdir -p /home/droneserver
WORKDIR /home/droneserver
# Install app dependencies
COPY --chown=droneserver:nogroup package.json /home/droneserver
RUN npm install

# Bundle app source
COPY --chown=droneserver:nogroup . /home/droneserver

# Start the app
CMD [ "node", "server.js" ]