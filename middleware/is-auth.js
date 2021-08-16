module.exports = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    return res.status(401).render("auth/login", { docTitle: "Login page", path: "/login" });
  }

  next();
};
 