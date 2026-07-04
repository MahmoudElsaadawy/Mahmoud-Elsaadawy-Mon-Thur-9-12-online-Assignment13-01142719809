import { Router } from "express";
import { auth, authorization } from "../../middleware/auth.middleware.js";
import { coverPicsService, handelPicsResponse, profilePicService, profileService, updatePasswordService } from "./user.service.js";
import { validation } from "../../middleware/valdation.middleware.js";
import { updatePassSchema } from "./user.validation.js";

const router = Router()

router.get("/profile", auth, authorization(0), profileService)
router.patch("/profile-pic", auth, profilePicService, handelPicsResponse)
router.patch("/cover-pics", auth, coverPicsService, handelPicsResponse)
router.patch("/update-password", validation(updatePassSchema), auth, updatePasswordService)

export default router