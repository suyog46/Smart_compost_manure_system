import Router from "express";
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,getCurrentUser,getAllEnvironmentData
} from "../controllers/auth.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/getCurrentUser").get(verifyJWT, getCurrentUser);
router.route("/getAllData").get(getAllEnvironmentData);


export default router;
