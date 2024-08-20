import { createClient } from "redis";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

const redisConfig = {
  url: process.env.REDIS_URL,
  socket: {
    tls: process.env.REDIS_URL?.startsWith("rediss"),
  },
};

const redisObj = {
  publisher: createClient(redisConfig),
  subscriber: createClient(redisConfig),
  connections: [],
  publish: function (channel, message) {
    this.publisher.publish(channel, JSON.stringify(message));
  },
  subscribe: function (channel) {
    this.subscriber.subscribe(channel, (message) => {
      const data = JSON.parse(message);
      this.connections.forEach(({ res: existingConnection }) => {
        const { profileId } = existingConnection.req.query;
        if (data.profileId === profileId) {
          existingConnection.write(`retry: 5000\ndata: ${JSON.stringify(data)}\n\n`);
        }
      });
    });
  },
  addConn: function (connection) {
    const { profileId, interactiveNonce } = connection.res.req.query;

    if (
      this.connections.some(
        ({ res: existingConnection }) =>
          existingConnection.req.query.interactiveNonce === interactiveNonce &&
          existingConnection.req.query.profileId === profileId,
      )
    ) {
      // Replace old connection with new one
      this.connections.splice(
        this.connections.findIndex(
          ({ res: existingConnection }) =>
            existingConnection.req.query.interactiveNonce === interactiveNonce &&
            existingConnection.req.query.profileId === profileId,
        ),
        1,
        connection,
      );
    } else {
      this.connections.push(connection);
    }
  },
  deleteConn: function () {
    // Remove inactive connections older than 30 minutes
    this.connections = this.connections.filter(({ res, lastHeartbeatTime }) => {
      const isActive = lastHeartbeatTime > Date.now() - 30 * 60 * 1000;
      if (!isActive) {
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
