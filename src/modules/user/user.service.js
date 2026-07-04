import {
  allowedMimeTypes,
  uploadFiles,
} from "../../utils/multer/uploadFiles.js";
import { successResponse } from "../../utils/responses/success.response.js";
import { decrypt } from "../../utils/security/encryption/encrypt.js"

export const profileService = async (req, res) => {
  const userObj = req.user.toObject()
  delete userObj.password
  delete userObj._id
  delete userObj.__v

  if (userObj.phone) {
    const phoneNum = decrypt(userObj.phone)
    const lastFourDigits = phoneNum.slice(-4)
    userObj.phone = lastFourDigits.padStart(phoneNum.length, "*")
  }
  
  successResponse({
    res,
    message: "Done",
    data: userObj,
  });
};

export const handelPicsResponse = async (req, res) => {
  let type = "file";
  if (req.file != undefined) {
    req.user.profilePic = req.file.path;
  } else {
    type = "files";
    req.user.coverPics = req.files.map((ele) => ele.path);
  }
  await req.user.save();
  res.json(req[type]);
};


export const profilePicService = await uploadFiles({
  destination: "users/profilePics",
  fileValidation: allowedMimeTypes.imageMimeTypes,
  fileType: "file",
}).single("profileImage");

export const coverPicsService = uploadFiles({
  destination: "users/coverPics",
  fileValidation: allowedMimeTypes.imageMimeTypes,
  fileType: "files",
}).array("coverImages", 3);

