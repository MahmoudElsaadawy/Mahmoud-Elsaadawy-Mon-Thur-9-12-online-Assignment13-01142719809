import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { validation } from "../../middleware/valdation.middleware.js";
import { confirmEmail, logout, logoutAll, forgetPasswordService, loginService, refreshToken, resendOtpService, resetPasswordService, signUpService, socialLogin } from "./auth.service.js";
import { loginSchema, resetPasswordSchema, signUpSchema } from "./auth.validation.js";
import { auth } from "../../middleware/auth.middleware.js";

const router = Router()
const dirname = path.dirname(fileURLToPath(import.meta.url));

router.post("/signup", validation(signUpSchema),signUpService)
router.patch("/confirm-email", confirmEmail)
router.patch("/resend-confirm-mail-otp", auth, resendOtpService)
router.post("/login", validation(loginSchema), loginService)
router.post("/refresh-token", refreshToken)

router.post("/social-login", socialLogin)
router.get("/social-login",(req, res)=>{
  res.sendFile(path.resolve(dirname, "../../../FE/googleOAuth.html"))
})

router.patch("/reset-password/:token", validation(resetPasswordSchema), resetPasswordService)
router.get("/reset-password/:token",(req, res)=>{
  res.sendFile(path.resolve(dirname, "../../../FE/resetPassword.html"))
})

router.patch("/forget-password", forgetPasswordService)
router.post("/logout", auth, logout)
router.post("/logout-all", auth, logoutAll)

export default router