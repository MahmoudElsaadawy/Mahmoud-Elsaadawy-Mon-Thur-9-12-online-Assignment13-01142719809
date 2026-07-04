import { redisClient } from "../../bootstrap.js"

export const redisSet = async(path, otp, time)=> {
  return await redisClient.set(path, otp, {
    expiration: {
      type: "ex",
      value: time * 60,
    }
  })
}

export const redisGet = async(path)=> {
  return redisClient.get(path)
}

export const redisDel = async(path)=> {
  return redisClient.del(path)
}

export const redisTTL = async(path)=> {
  return redisClient.TTL(path)
}
