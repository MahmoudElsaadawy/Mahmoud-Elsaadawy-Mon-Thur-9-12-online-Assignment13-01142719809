import { createClient } from "redis"

const connectRedis = await createClient({
    url: process.env.REDIS_URI || "redis://127.0.0.1:6379",
  })

connectRedis.on("connect", () => console.log("redis connected successfully"));
connectRedis.on("error", (e) => console.log("can not connect to redis", e));

export default connectRedis