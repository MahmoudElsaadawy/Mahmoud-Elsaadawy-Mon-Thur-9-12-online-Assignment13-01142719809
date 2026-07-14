import redisClient from "./redis.connection.js"

export const redisSet = async(path, value, time)=> {
  return await redisClient.set(path, value, {
    expiration: {
      type: "ex",
      value: time * 60,
    }
  })
}

export const redisGet = (path)=> {
  return redisClient.get(path)
}

export const redisDel = (path)=> {
  return redisClient.del(path)
}

export const redisTTL = (path)=> {
  return redisClient.TTL(path)
}

export const redisKeys = (path)=> {
  return redisClient.keys(path)
}

export const revokeTokenKey = (userId, jti)=> {
  return `Users:login:${userId}:${jti}`
}