import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema({
  body: {
    type: String,
    min: 5,
    required: function() {
      return !this.attachments?.length
    },
  },
  attachments: {
    type: [String]
  },
  receiver: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
  },
  },
  {
    timestamps: true,
    query: false,
    strictQuery: true,
  },
)

const Message = mongoose.models.Message || mongoose.model("Message", messageSchema)

export default Message