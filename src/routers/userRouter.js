import express from "express";
import {
  protectorMiddleware,
  publicOnlyMiddleWare,
  uploadFiles,
} from "../middlewares";

import {
  getEdit,
  postEdit,
  remove,
  logout,
  see,
  startGithubLogin,
  finishGithubLogin,
  getChangePassword,
  postChangePassword,
} from "../controllers/userController";

const userRouter = express.Router();

userRouter.get("/logout", protectorMiddleware, logout);
userRouter
  .route("/edit")
  .all(protectorMiddleware)
  .get(getEdit)
  .post(uploadFiles.single("avatar"), postEdit);
userRouter.get("/remove", remove);
userRouter.get("/github/start", publicOnlyMiddleWare, startGithubLogin);
userRouter.get("/github/finish", publicOnlyMiddleWare, finishGithubLogin);
userRouter.get(":id", see);
userRouter
  .route("/change-password")
  .all(protectorMiddleware)
  .get(getChangePassword)
  .post(postChangePassword);

export default userRouter;
