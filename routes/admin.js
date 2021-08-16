const express = require("express");
const router = express.Router();
const adminProductsController = require("../controllers/admin");
const isAuth = require("../middleware/is-auth");
const { check, body } = require("express-validator");

router.get("/add-product", isAuth, adminProductsController.getAddProduct);
router.post(
  "/product",
  [
    check("title")
      .trim()
      .isLength({ min: 5 })
      .withMessage("Title should be at least 5 characters long!")
      .isString()
      .withMessage("Title should not contain any special characters!"),

    check("price").custom((value, { req }) => {
      if (value < 5) {
        throw new Error("Amount is too low.");
      }

      return true;
    }),

    body("description", "Description length must be at least 10 characters.").trim().isLength({ min: 10 }),
  ],
  isAuth,
  adminProductsController.postAddProduct
);
router.get("/adminProducts-list", isAuth, adminProductsController.getallProducts);

router.get("/edit-product/:productId", isAuth, adminProductsController.getEditProduct);

router.post(
  "/edit-product",
  [
    check("title").trim().isLength({ min: 5 }).withMessage("Title should be at least 5 characters long"),

    check("price").custom((value, { req }) => {
      if (value < 5) {
        throw new Error("Amount is too low.");
      }

      return true;
    }),

    body("description", "Description length must be at least 10 characters.").trim().isLength({ min: 10 }),
  ],
  isAuth,
  adminProductsController.postEditProduct
);

router.delete("/adminProducts-list/:productId", isAuth, adminProductsController.deleteProduct);

module.exports = router;
