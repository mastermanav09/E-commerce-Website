const User = require("../models/user");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const { validationResult } = require("express-validator");
require("dotenv").config();

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key: process.env.SENDGRID_API_KEY,
    },
  })
);

exports.getLogin = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  let successReset = req.flash("successReset");
  if (successReset.length > 0) {
    successReset = successReset[0];
  } else {
    successReset = null;
  }

  res.render("auth/login", {
    docTitle: "Login page",
    path: "/login",
    errorMessage: message,
    emailResetMsg: successReset,
    oldInput: {
      email: "",
      password: "",
    },
    validationErrors: [],
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/signup", {
    path: "/signup",
    docTitle: "Signup Page",
    errorMessage: message,
    oldInput: {
      email: "",
      password: "",
    },
    validationErrors: [],
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("auth/login", {
      path: "/login",
      docTitle: "Login",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
      },
      validationErrors: errors.array(),
    });
  }

  User.findOne({ email: email }).then((user) => {
    if (!user) {
      return res.status(422).render("auth/login", {
        path: "/login",
        docTitle: "Login",
        errorMessage:
          "Account not found or email-id/password might be incorrect.",
        oldInput: {
          email: email,
        },

        validationErrors: [],
      });
    }

    bcrypt
      .compare(password, user.password)
      .then((doMatch) => {
        if (doMatch) {
          req.session.isLoggedIn = true;
          req.session.user = user;
          return req.session.save(() => {
            res.redirect("/");
          });
        }

        return res.status(422).render("auth/login", {
          path: "/login",
          docTitle: "Login",
          errorMessage:
            "Account not found or email-id/password might be incorrect.",
          oldInput: {
            email: email,
          },

          validationErrors: [],
        });
      })
      .catch((error) => {
        console.log(error);
        res.redirect("/login");
      });
  });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("auth/signup", {
      path: "/signup",
      docTitle: "Signup Page",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
      },
      validationErrors: errors.array(),
    });
  }

  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const user = new User({
        email: email,
        password: hashedPassword,
        cart: {
          items: [],
        },
      });

      return user.save();
    })
    .then((result) => {
      res.redirect("/login");
      return transporter.sendMail({
        to: email,
        from: "node.shopmail@gmail.com",
        subject: "Sign-up succeeded",
        html: "<h1>You successfully signed up!</h1>",
      });
    })
    .catch((error) => {
      console.log(error);
    });
};

exports.getReset = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  res.render("auth/reset", {
    path: "/reset",
    docTitle: "Reset Password",
    errorMessage: message,
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (error, buffer) => {
    if (error) {
      console.log(error);
      return res.redirect("/");
    }

    const token = buffer.toString("hex");
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash("error", "No Account with that email found");
          throw new Error("No Account with that email found");
        }

        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then((result) => {
        req.flash("successReset", "A link has been sent to your email-id");
        res.redirect("/login");
        transporter.sendMail({
          to: req.body.email,
          from: "node.shopmail@gmail.com",
          subject: "Password Reset",
          html: `<h3>You requested a password reset.</h3><p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>`,
        });
      })
      .catch((error) => {
        return res.redirect("/reset");
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then((user) => {
      let message = req.flash("error");
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render("auth/new-password", {
        path: "/new-password",
        docTitle: "Password reset",
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token,
      });
    })
    .catch((error) => {
      console.log(error);
    });
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.resetpassword;
  const passwordToken = req.body.passwordToken;
  const userId = req.body.userId;
  let resetUser;

  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then(() => {
      res.redirect("/login");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
