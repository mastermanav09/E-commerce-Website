const express = require("express");
const router = express.Router();
const shopProductsController = require("../controllers/shop");
const isAuth = require("../middleware/is-auth");

router.get("/", shopProductsController.getIndex);
router.get("/products", shopProductsController.getallProducts);
router.get("/products/:productId", shopProductsController.getProductDetails);
router.get("/cart", isAuth, shopProductsController.getCart);

router.post("/cart", isAuth, shopProductsController.postCart);
router.post("/cart-delete-item", isAuth, shopProductsController.postDeleteItem);

router.get("/checkout", isAuth, shopProductsController.getCheckout);

router.get("/checkout/success", shopProductsController.getCheckoutSuccess);
router.get("/checkout/cancel", isAuth, shopProductsController.getCheckout);

router.get("/orders", isAuth, shopProductsController.getOrders);

router.get("/orders/:orderId", isAuth, shopProductsController.getInvoice);

module.exports = router;
