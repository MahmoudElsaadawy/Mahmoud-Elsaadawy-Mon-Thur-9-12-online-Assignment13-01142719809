import mongoose from "mongoose"

export const connectDB = async()=> {
  try {
    await mongoose.connect(process.env.DB_URI, {
      dbName: `Assignment${process.env.DB_VERSION}`
    })
    console.log("connected to DB successfully", mongoose.connection.host)
  } catch (e){
    console.log("can not connect to db: " + e)
  }
}

