import {
  allowedMimeTypes,
  uploadFiles,
} from "../../utils/multer/uploadFiles.js";
import { badRequestException } from "../../utils/responses/error.response.js";
import { successResponse } from "../../utils/responses/success.response.js";
import { decrypt } from "../../utils/security/encryption/encrypt.js";
import { compare } from "../../utils/security/hashing/compare.js";
import { hash } from "../../utils/security/hashing/hash.js";
import User from "../../DB/models/user.model.js"
import { redisDel, redisGet, redisKeys, redisSet, redisTTL, revokeTokenKey } from "../../utils/redis/redis.service.js";
import { createOtp } from "../../utils/email/otp.js";
import { sendEmail } from "../../utils/email/sendEmail.js";
import { generateOtpHtml } from "../../utils/email/html.otp.template.js";


export const profilePicService = await uploadFiles({
  destination: "users/profilePics",
  fileValidation: allowedMimeTypes.imageMimeTypes,
  fileType: "file",
}).single("profileImage");

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

export const updateEmailService = async(req, res)=> {
  const user = req.user
  const { newEmail } = req.body

  if ( newEmail == user.email) {
    badRequestException("this email is the same as the current one")
  }
  
  if(await User.findOne({email: newEmail})) {
    badRequestException("email already exists")
  }
  
  if(await redisGet(`Users:${user._id}:otp:emailConfirmation`)){
    const ttl = await redisTTL(`Users:${user._id}:otp:emailConfirmation`)
    badRequestException(`please wait ${ttl} before sending another otp`)
  }

  const newKey = `Users:${user._id}:otp:emailConfirmation`
  const newEmailotp = createOtp()

  const oldKey = `Users:${user._id}:otp:oldEmailConfirmation`
  const oldEmailotp = createOtp()

  await redisSet(newKey, newEmailotp, 5)
  await redisSet(oldKey, oldEmailotp, 5)

  sendEmail({
    to: newEmail,
    subject: "New email confirmation",
    html: generateOtpHtml(user.firstName, newEmailotp),
  });

  sendEmail({
    to: user.email,
    subject: "Confirm your email",
    html: generateOtpHtml(user.firstName, oldEmailotp),
  });

  await redisSet(`Users:${user._id}:email:newEmail`, newEmail, 5)

  successResponse({
    res,
    message: "Otps sent successfully",
  })
}

export const confirmUpdateEmailService = async(req, res)=> {
  const user = req.user
  const { oldOtp, newOtp } = req.body

  const newKey = `Users:${user._id}:otp:emailConfirmation`
  const oldKey = `Users:${user._id}:otp:oldEmailConfirmation`
  
  const newSavedOtp = await redisGet(`Users:${user._id}:otp:emailConfirmation`)
  const oldSavedOtp = await redisGet(`Users:${user._id}:otp:oldEmailConfirmation`)

  if (!(newSavedOtp && oldSavedOtp) || (oldOtp != oldSavedOtp || newOtp != newSavedOtp)) {
    badRequestException("invalid otps")
  }

  const newEmail = await redisGet(`Users:${user._id}:email:newEmail`)
  user.email = newEmail
  await user.save()

  await redisDel(`Users:${user._id}:email:newEmail`)
  await redisDel(`Users:${user._id}:otp:emailConfirmation`)
  await redisDel(`Users:${user._id}:otp:oldEmailConfirmation`)

  successResponse({
    res,
    message: "Email changed successfully",
  })
}