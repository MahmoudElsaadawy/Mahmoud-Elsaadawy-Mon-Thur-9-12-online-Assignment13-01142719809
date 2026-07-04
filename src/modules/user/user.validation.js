import joi from "joi"

export const updatePassSchema = {
  body: joi.object({
    oldPassword: joi.string().min(8).required(),
    newPassword: joi.string().min(8).required(),
    confirmNewPassword: joi.string().valid(joi.ref("newPassword")).required().messages({"any.only": "passwords do not match"}),
  }),
}