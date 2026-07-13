import { Router } from "express";
import { auth, authorization } from "../../middleware/auth.middleware.js";
import { sendMessagesService, getMessagesService, deleteMessagesService } from "./message.service.js";
import {
  allowedMimeTypes,
  uploadFiles,
} from "../../utils/multer/uploadFiles.js";

const router = Router();

router.post(
  "",
  auth,
  uploadFiles({
    destination: "messages",
    fileValidation: allowedMimeTypes.imageMimeTypes,
    fileType: "files",
  }).array("images", 5),
  sendMessagesService,
);

router.get("", auth, getMessagesService)
router.delete("/:id", auth, deleteMessagesService)

export default router;
