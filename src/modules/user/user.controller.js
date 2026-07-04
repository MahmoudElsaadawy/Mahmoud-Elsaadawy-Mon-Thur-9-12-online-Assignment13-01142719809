import { Router } from "express";
import { auth, authorization } from "../../middleware/auth.middleware.js";
import { coverPicsService, handelPicsResponse, profilePicService, profileService } from "./user.service.js";

const router = Router()

router.get("/profile", auth, authorization(0), profileService)
router.patch("/profile-pic", auth, profilePicService, handelPicsResponse)
router.patch("/cover-pics", auth, coverPicsService, handelPicsResponse)

export default router