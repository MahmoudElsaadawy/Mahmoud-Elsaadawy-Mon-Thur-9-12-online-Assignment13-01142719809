import cors from "cors";
import { globalErrorHandler } from ".//utils/responses/error.response.js";
import { connectDB } from "./DB/db.connection.js";
import userRouter from "./modules/user/user.controller.js";
import authRouter from "./modules/auth/auth.controller.js"
import messageRouter from "./modules/message/message.controller.js"
import redisClient from "./utils/redis/redis.connection.js";
import { badRequestException } from ".//utils/responses/error.response.js";

export const bootstrap = async (express, app) => {
  app.use(express.json());
  app.use("/uploads", express.static("./uploads"))

  // app.use((req, res, next)=> {
  //   const origin = req.headers.origin
  //   const whiteList = [
  //       "http://127.0.0.1:5001",
  //       "http://127.0.0.1:5000",
  //     ]

  //     if(!whiteList.includes(origin)) {
  //       badRequestException("origin not allowed")
  //     }

  //     res.headers("Access-Control-Allow-Origin", origin)
  //     res.headers("Access-Control-Allow-Methods", "DELETE")
  //     res.headers("Access-Control-Allow-Headers", "auth")
  //   next()
  // })

  app.use(cors({
    origin: function(origin, callback) {
      const whiteList = [
        "http://127.0.0.1:5501",
        "http://127.0.0.1:5500",
        "https://www.google.com",
      ]

      if (!whiteList.includes(origin)) {
        callback(new Error("origin not allowed"))
      }

      callback(null, origin)
    },
  }))

  await connectDB();
  await redisClient.connect()

  app.use("/api/v1/auth", authRouter)
  app.use("/users", userRouter);
  app.use("/messages", messageRouter)

  app.all("/*all", (req, res) => {
    return res
      .status(404)
      .json({ success: false, message: "this route does not exist" });
  });

  app.use(globalErrorHandler);
};
