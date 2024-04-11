import { createClient } from "redis";

const shouldSendEvent = (data, profileId) => {
  return data.profileId === profileId;
};

// Code for Redis in AWS
const redisObj = {
  publisher: createClient({
    url: process.env.REDIS_URL,
    socket: {
      tls: process.env.REDIS_URL.startsWith("rediss"),
    },
  }),
  subscriber: createClient({
    url: process.env.REDIS_URL,
    socket: {
      tls: process.env.REDIS_URL.startsWith("rediss"),
    },
  }),

  // For local development

  // code for Redis on my local
  // const redisObj = {
  //   publisher: createClient({
  //     password: process.env.REDIS_PASSWORD,
  //     socket: {
  //       host: "redis-10627.c15.us-east-1-2.ec2.cloud.redislabs.com",
  //       port: 10627,
  //     },
  //   }),
  //   subscriber: createClient({
  //     password: process.env.REDIS_PASSWORD,
  //     socket: {
  //       host: "redis-10627.c15.us-east-1-2.ec2.cloud.redislabs.com",
  //       port: 10627,
  //     },
  //   }),

  publish: function (channel, message) {
    console.log(`Publishing ${message.event} to ${channel}`);
    this.publisher.publish(channel, JSON.stringify(message));
  },
  subscribe: function (channel) {
    this.subscriber.subscribe(channel, (message) => {
      const data = JSON.parse(message);
      const { profileId, waypointNumber } = data;
      console.log(`Event '${data.event}' received on ${channel}`);
      let dataToSend = null;
      if (data.event === "waypoint-entered") {
        dataToSend = { profileId, waypointNumber };
      }
      this.connections.forEach(({ res: existingConnection }) => {
        const { profileId } = existingConnection.req.query;
        if (shouldSendEvent(data, profileId)) {
          existingConnection.write(`retry: 5000\ndata: ${JSON.stringify(dataToSend)}\n\n`);
        }
      });
    });
  },
  connections: [],
  addConn: function (connection) {
    const { visitorId, interactiveNonce } = connection.res.req.query;

    if (
      this.connections.some(
        ({ res: existingConnection }) =>
          existingConnection.req.query.interactiveNonce === interactiveNonce &&
          existingConnection.req.query.visitorId === visitorId,
      )
    ) {
      // Replace old connection with new one
      this.connections.splice(
        this.connections.findIndex(
          ({ res: existingConnection }) =>
            existingConnection.req.query.interactiveNonce === interactiveNonce &&
            existingConnection.req.query.visitorId === visitorId,
        ),
        1,
        connection,
      );
    } else {
      this.connections.push(connection);
    }
    console.log(`Connection ${interactiveNonce} added. Length is ${this.connections.length}`);
  },
  deleteConn: function () {
    // Remove inactive connections older than 30 minutes
    this.connections = this.connections.filter(({ res, lastHeartbeatTime }) => {
      const isActive = lastHeartbeatTime > Date.now() - 30 * 60 * 1000;
      if (!isActive) {
        console.log(`Connection to ${res.req.query.interactiveNonce} deleted`);
      }
      return isActive;
    });
  },
};

redisObj.publisher.connect();
redisObj.subscriber.connect();

redisObj.subscribe(`${process.env.INTERACTIVE_KEY}_RACE`);

redisObj.publisher.on("error", (err) => console.error("Publisher Error", err));
redisObj.subscriber.on("error", (err) => console.error("Subscriber Error", err));

setInterval(() => {
  if (redisObj.connections.length > 0) {
    redisObj.deleteConn();
  }
}, 1000 * 60);

export default redisObj;
