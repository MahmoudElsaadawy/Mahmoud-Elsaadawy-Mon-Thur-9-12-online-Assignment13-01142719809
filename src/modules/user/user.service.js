import {
  allowedMimeTypes,
  uploadFiles,
} from "../../utils/multer/uploadFiles.js";
import { successResponse } from "../../utils/responses/success.response.js";
import { decrypt } from "../../utils/security/encryption/encrypt.js"
import { compare } from "../../utils/security/hashing/compare.js";
import { badRequestException } from "../../utils/responses/error.response.js";
import { hash } from "../../utils/security/hashing/hash.js";

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

export const updatePasswordService = async(req, res)=> {

  const { oldPassword, newPassword } = req.body
  const user = req.user

  const checkPassword = await compare(oldPassword, user.password)
  if(!checkPassword){
    badRequestException("wrong password")
  }
  
  const isPassTheSame = await compare(newPassword, user.password)
  if(isPassTheSame){
    badRequestException("password cannot be the same as the last one")
  }

  user.password = await hash(newPassword)
  await user.save()

  successResponse({
    res,
    message: "Password updated successfully",
  })
}