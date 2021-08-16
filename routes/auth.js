const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
const { check, body } = require("express-validator");
const User = require("../models/user");

router.get("/login", authController.getLogin);
router.get("/signup", authController.getSignup);
router.get("/reset", authController.getReset);
router.get("/reset/:token", authController.getNewPassword);

router.post(
  "/signup",
  [
    check("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((user) => {
          if (user) {
            return Promise.reject("Email-Id already exists.");
          }
        });
      })
      .normalizeEmail(),

    body(
      "password",
      "Please enter a password with only numbers and alphabets having at least 8 characters."
    )
      .isLength({ min: 8 })
      .isAlphanumeric()
      .trim(),

    body("confirmPassword")
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Passwords do not match");
        }

        return true;
      }),
  ],
  authController.postSignup
);
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email address.")
      .normalizeEmail(),

    body("password", "Password is incorrect! Please try again.")
      .isLength({ min: 8 })
      .isAlphanumeric()
      .trim(),
  ],
  authController.postLogin
);
router.post("/logout", authController.postLogout);
router.post("/reset", authController.postReset);
router.post("/new-password", authController.postNewPassword);

module.exports = router;
