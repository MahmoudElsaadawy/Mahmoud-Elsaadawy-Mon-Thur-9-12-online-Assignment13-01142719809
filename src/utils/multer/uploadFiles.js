import fs from "fs/promises"
import multer, { diskStorage } from "multer"
import crypto from "crypto"

export const allowedMimeTypes = {
  imageMimeTypes: [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/svg+xml",
  "image/webp",
  "image/avif",
  "image/tiff",
  "image/bmp",
  "image/vnd.microsoft.icon",
  "image/x-icon",
  "image/apng",
  ],
  videoMimeTypes: [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/mpeg",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
  "video/3gpp",
  "video/3gpp2",
  "video/mp2t",
  "video/x-flv",
  "video/x-ms-wm",
  ]
}

export const uploadFiles = ({
  destination = "general",
  fileSize = 3 * 1024 * 1024,
  fileValidation = allowedMimeTypes.imageMimeTypes,
  fileType = "file",
  })=> {
    const storage = diskStorage({
      destination: async(req, file, cb)=> {
        const folderName = `./uploads/${destination}`
        try{
          await fs.access(folderName)
        } catch (e) {
          await fs.mkdir(folderName, {
            recursive: true,
          })
        }
        return cb(null, folderName)
      },
      filename: async(req, file, cb)=> {
      const fileExtention = file.mimetype.split("/")[1]
      if (fileType == "file"){
        return cb(null, `${req.user._id}.${fileExtention}`)
      }
      return cb(null, `${crypto.randomInt(1, 100000000)}.${fileExtention}`)
    },
  })
  const fileFilter = (req, file, cb)=> {
    if (!fileValidation.includes(file.mimetype)){
      return cb(new Error ("file type not allowed"), false)
    }
    return cb(null, true)
  }

  return multer({
  storage,
  limits:{fileSize},
  fileFilter,
})}