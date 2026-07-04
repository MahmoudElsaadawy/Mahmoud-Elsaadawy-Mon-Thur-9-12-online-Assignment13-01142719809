import { verifyToken } from "../utils/security/token/token.js";
import User from "../DB/models/user.model.js"
import { unauthorizedException, notFoundException } from "../utils/responses/error.response.js";
import { redisGet, revokeTokenKey } from "../utils/redis/redis.service.js";
import { badRequestException } from "../utils/responses/error.response.js";

const decodeToken = async(authorization)=> {
  if (!authorization.startsWith("Bearer")) {
    badRequestException("Invalid authentication method");
  }
  let token = authorization
  token = token.split(" ")[1]
  const decodedToken = verifyToken(token, process.env.ACCESS_TOKEN);
  const redisTokenKey = revokeTokenKey(decodedToken._id, decodedToken.jti)
  if (!await redisGet(redisTokenKey)){
    badRequestException("login again")
  }
  const user = await User.findById(decodedToken._id)
  if (!user) {
    notFoundException("user not found");
  }

  return { user, decodedToken}
}

export const auth = async(req, res, next)=> {
  const { user, decodedToken} = await decodeToken(req.headers.authorization)
  req.user = user
  req.decodedToken = decodedToken
  next()
}

export const authorization = (roles=0)=>{ 
  return async(req, res, next)=> {
    if (typeof(roles) == "object"){
      if(!roles.includes(req.user.role)){
      unauthorizedException("You are not authorized")
      }
    }
    if(req.user.role < roles){
      unauthorizedException("You are not authorized")
    }
    next()
  }
}