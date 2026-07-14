import cors from "cors";
import helmet from "helmet";
import { corsArgs } from "../src/middleware/cors.middleware.js";
import { globalErrorHandler } from ".//utils/responses/error.response.js";
import { connectDB } from "./DB/db.connection.js";
import redisClient from "./utils/redis/redis.connection.js";

export const bootstrap = async (express, app) => {
  app.use(express.json());
  app.use("/uploads", express.static("./uploads"))
  app.use(cors(corsArgs))
  app.use(helmet())

  await connectDB();
  await redisClient.connect()

  const { default: authRouter } = await import("./modules/auth/auth.controller.js")
  const { default: userRouter } = await import("./modules/user/user.controller.js")
  const { default: messageRouter } = await import("./modules/message/message.controller.js")

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
