import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redisClient from "../utils/redis/redis.connection.js";


export const myRateLimiter = (mins, limit, message = "try again later", statusCode = 429) => {
  return rateLimit({
    windowMs: mins * 60 * 1000,
    limit,
    keyGenerator: (req)=> req.body.email,
    store: new RedisStore ({
      sendCommand: (...args)=> redisClient.sendCommand(args),
    }),
    handler: (req, res) => {
      res.status(statusCode).json(message);
    },
  });
};