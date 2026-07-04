import { createClient } from "redis"

export const connectRedis = async()=> {
  const client = await createClient({
    url: process.env.REDIS_URI || "redis://127.0.0.1:6379",
  })

  client.on("connect", () => console.log("redis connected successfully"));
  client.on("error", (e) => console.log("can not connect to redis", e));

  return client
}