import { OAuth2Client } from "google-auth-library";
import { nanoid } from "nanoid";
import User from "../../DB/models/user.model.js";
import { generateForgetPasswordHtml } from "../../utils/email/html.forgetPassword.template.js";
import { generateOtpHtml } from "../../utils/email/html.otp.template.js";
import { createOtp } from "../../utils/email/otp.js";
import { sendEmail } from "../../utils/email/sendEmail.js";
import { providerEnum } from "../../utils/enums/user.enum.js";
import { redisDel, redisGet, redisKeys, redisSet, redisTTL, revokeTokenKey } from "../../utils/redis/redis.service.js";
import {
  badRequestException,
  conflictException,
  notFoundException,
  unauthorizedException,
} from "../../utils/responses/error.response.js";
import { successResponse } from "../../utils/responses/success.response.js";
import { encrypt } from "../../utils/security/encryption/encrypt.js";
import { compare } from "../../utils/security/hashing/compare.js";
import { hash } from "../../utils/security/hashing/hash.js";
import {
  generateToken,
  verifyToken,
} from "../../utils/security/token/token.js";

export const signUpService = async (req, res) => {
  const {
    firstName,
    lastName,
    username,
    email,
    password,
    gender,
    role,
    phone,
  } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    conflictException("User Already Exists");
  }
  const otp = createOtp();
  const userCreated = await User.create({
    firstName,
    lastName,
    username,
    email,
    password: await hash(password),
    gender,
    role,
    phone: await encrypt(phone),
  });

  await redisSet(`Users:${userCreated._id}:otp:emailConfirmation`, otp, 5)
  
  sendEmail({
    to: userCreated.email,
    subject: "Confirm your email",
    html: generateOtpHtml(userCreated.firstName, otp),
  });

  successResponse({
    res,
    message: "User Created Successfully",
    data: userCreated,
  });
};

export const confirmEmail = async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });

  if(!user){
    badRequestException("User doesnt exist please sign up")
  }
  
  if (user.emailConfirmed) {
    badRequestException("Email already confirmed");
  }

  
  const userOtp = await redisGet(`Users:${user._id}:otp:emailConfirmation`)

  if(!userOtp || userOtp != otp){
    badRequestException("Invalid or expired otp")
  }

  user.emailConfirmed = true
  await user.save()
  redisDel(`Users:${user._id}:otp:emailConfirmation`)

  successResponse({
    res,
    message: "Email confirmed Successfully",
  });
};

export const resendOtpService = async (req, res) => {
  const user = req.user

  if (user.emailConfirmed) {
    badRequestException("Email already confirmed");
  }

  const isOtpExist = await redisGet(`Users:${user._id}:otp:emailConfirmation`)
  
  if(isOtpExist){
    const ttl = await redisTTL(`Users:${user._id}:otp:emailConfirmation`)
    badRequestException(`wait ${ttl} seconds to resend the otp`)
  }

  const otp = createOtp();

  await redisSet(`Users:${user._id}:otp:emailConfirmation`, otp, 5)

  sendEmail({
    to: user.email,
    subject: "Confirm your email",
    html: generateOtpHtml(user.firstName, otp),
  });

  successResponse({
    res,
    message: "Confirm email sent successfully",
  });
};

export const loginService = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    unauthorizedException("Invalid email or password");
  }

  if (user.provider > providerEnum.System) {
    badRequestException("use social login");
  }

  const matchedPassword = await compare(password, user.password);

  if (!matchedPassword) {
    unauthorizedException("Invalid email or password");
  }

  const jti = nanoid()
  const accessToken = await generateToken(
    {
      _id: user.id,
      email: user.email,
    },
    process.env.ACCESS_TOKEN,
    {
      expiresIn: "10m",
      jwtid: jti,
    },
  );

  const refreshToken = await generateToken(
    {
      _id: user.id,
      email: user.email,
    },
    process.env.REFRESH_TOKEN,
    {
      expiresIn: "7d",
      jwtid: jti,
    },
  );

  await redisSet(revokeTokenKey(user.id, jti), jti, 7 * 24 * 60)
  successResponse({
    res,
    message: "User logged in Successfully",
    data: {
      accessToken,
      refreshToken,
    },
  });
};

export const refreshToken = async (req, res) => {
  const refreshToken = req.headers.authorization;
  let token = req.headers.authorization;
  if (!token.startsWith("Bearer")) {
    badRequestException("Invalid authentication method");
  }
  token = token.split(" ")[1];
  const payload = verifyToken(token, process.env.REFRESH_TOKEN);
  const user = await User.findById(payload._id);
  if (!user) {
    notFoundException("user not found");
  }

  const jti = await redisGet(await revokeTokenKey(user.id, payload.jti))
  const accessToken = await generateToken(
    {
      _id: user.id,
      email: user.email,
    },
    process.env.ACCESS_TOKEN,
    {
      expiresIn: "10m",
      jwtid: jti,
    },
  );

  successResponse({
    res,
    data: accessToken,
  });
};

export const socialLogin = async (req, res) => {
  const { idToken } = req.body;
  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.CLIENT_ID,
  });
  const payload = ticket.getPayload();
  const { email, given_name: firstName, family_name: lastName } = payload;
  let user = await User.findOne({ email });
  if (user) {
    if (user.provider == providerEnum.System) {
      badRequestException("Email already signed up please use system login");
    }
  } else {
    user = await User.create({
      firstName,
      lastName,
      email,
      username: `${firstName} ${lastName}`,
      emailConfirmed: true,
      provider: providerEnum.Google,
    });
  }

  const accessToken = await generateToken(
    {
      _id: user.id,
      email: user.email,
    },
    process.env.ACCESS_TOKEN,
    {
      expiresIn: "10m",
    },
  );

  const refreshToken = await generateToken(
    {
      _id: user.id,
      email: user.email,
    },
    process.env.REFRESH_TOKEN,
    {
      expiresIn: "7d",
    },
  );

  successResponse({
    res,
    message: "User logged in Successfully",
    data: {
      accessToken,
      refreshToken,
    },
  });
};

export const forgetPasswordService = async(req, res)=> {
  const { email } = req.body
  const user = await User.findOne({email})
  if(!user){
    badRequestException("User doesnt exist please sign up")
  }

  const userResetToken = await redisGet(`Users:${user._id}:otp:passwordReset`)
  
  if(userResetToken){
    const ttl = await redisTTL(`Users:${user._id}:otp:passwordReset`)
    badRequestException(`wait ${ttl} seconds before requesting the email again`)
  }

  const jti = nanoid()
  const resetToken = await generateToken(
    {
      _id: user.id,
      email: user.email,
    },
    process.env.FORGET_PASSWORD_TOKEN,
    {
      expiresIn: "10m",
      jwtid: jti,
    },
  );
  
  await redisSet(`Users:${user._id}:otp:passwordReset`, jti, 10)
  
  const link = `${process.env.BASE_URL}${process.env.PORT}/api/v1/auth/reset-password/${resetToken}`

  sendEmail({
    to: user.email,
    subject: "Password reset",
    html: generateForgetPasswordHtml(user.firstName, link),
  });

  successResponse({
    res,
    message: "Password reset email sent successfully",
    data:{
      message: "Dont forget to check the html page that i made too",
      forgetPasswordToken: resetToken,
    }
  })
}

export const resetPasswordService = async(req, res)=> {
  const { token } = req.params
  const { password } = req.body
  const payload = verifyToken(token, process.env.FORGET_PASSWORD_TOKEN);
  const user = await User.findById(payload._id);
  if (!user) {
    notFoundException("user not found");
  }

  const userJti = await redisGet(`Users:${user._id}:otp:passwordReset`)
  if (userJti != payload.jti){
    badRequestException("invalid or expired link please request another one")
  }
  
  const isPassTheSame = await compare(password, user.password)
  if(isPassTheSame){
    badRequestException("password cannot be the same as the last one")
  }

  await redisDel(`Users:${user._id}:otp:passwordReset`)
  user.password = await hash(password)
  await user.save()

  successResponse({
    res,
    message: "Password changed successfully",
  })
}

export const logout = async(req, res)=> {
  const user = req.user
  const payload = req.decodedToken
  const key = revokeTokenKey(user._id, payload.jti)
  await redisDel(key)
  successResponse({
    res,
    message: "logged out successfully",
  })
}

export const logoutAll = async(req, res)=> {
  const user = req.user
  
  const keys = await redisKeys(`Users:login:${req.user.id}:*`)
  await redisDel(keys)
  
  successResponse({
    res,
    message: "logged out from all devices successfully",
  })
}