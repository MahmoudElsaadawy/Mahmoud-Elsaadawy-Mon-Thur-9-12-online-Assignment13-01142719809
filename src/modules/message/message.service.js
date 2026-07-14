import Message from "../../DB/models/message.model.js";
import User from "../../DB/models/user.model.js";
import {
  notFoundException,
  unauthorizedException
} from "../../utils/responses/error.response.js";
import { successResponse } from "../../utils/responses/success.response.js";

export const sendMessagesService = async (req, res)=> {
  const { content, to } = req.body;
  const { files } = req

  const receiver = await User.findById(to);

  if (!receiver) {
    notFoundException("invalid receiver id");
  }

  let attachments = []

  if (req.files?.length) {
    attachments = req.files.map((ele)=> ele.path)
  }

  const message = await Message.create({
    body: content,
    attachments,
    receiver: receiver._id,
  });

  successResponse({
    res,
    message: "message sent successfully",
    data: {content, ...attachments},
  })
};

export const getMessagesService = async(req, res)=> {
  const user = req.user
  const messages = await Message.find({
    receiver: user._id
  }).select("-_id -updatedAt -__v")

  successResponse({
    res,
    data: {
      user: {
        user: `${user.firstName} ${user.lastName}`,
        id: user._id,
        messages,
      },
    }
  })
}

export const deleteMessagesService = async(req, res)=> {
  const user = req.user
  const { id } = req.params
  const message = await Message.findById(id)

  if(!message) {
    notFoundException("message not found")
  }

  if(message.receiver.toString() != user._id.toString()) {
    unauthorizedException("you are not authorized to delete this message")
  }

  await message.deleteOne()

  return successResponse({
    res,
    message: "message deleted successfully"
  })
}