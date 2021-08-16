exports.errorHandler404 = (req, res, next) => {
  res.status(404).render("404", { docTitle: "404 Error" });
};

exports.errorHandler500 = (req, res, next) => {
  res.status(500).render("500", { docTitle: "500 Error" });
};
