require("dotenv").config();
const Product = require("../models/product");
const Order = require("../models/order");
const fs = require("fs");
const path = require("path");
const pdfDocument = require("pdfkit");

const stripe = require("stripe")(process.env.STRIPE_KEY);

const ITEMS_PER_PAGE = 4;

exports.getallProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/product-list", {
        prods: products,
        docTitle: "All Products",
        path: "/products",
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    })
    .catch((error) => {
      console.log(error);
    });
};

exports.getProductDetails = (req, res, next) => {
  const prodId = req.params.productId;

  Product.findById(prodId)
    .then((product) => {
      res.render("shop/product-detail", {
        docTitle: "Details of the Product",
        product: product,
        path: null,
      });
    })
    .catch((error) => {
      console.log(error);
    });
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/index", {
        prods: products,
        docTitle: "My Shop",
        path: "/",
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    })
    .catch((error) => {
      console.log(error);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then((user) => {
      res.render("shop/cart", {
        docTitle: "Your Cart",
        cartproducts: user.cart.items,
        totalPrice: null,
        path: "/cart",
      });
    })
    .catch((error) => {
      console.log(error);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productID;

  Product.findById(prodId)
    .then((product) => {
      return req.user.addToCart(product);
    })
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postDeleteItem = (req, res, next) => {
  const prodId = req.body.productId;

  req.user.removeFromCart(prodId).then(() => {
    const items = req.session.user.cart.items.filter(
      (prod) => prod.productId.toString() !== prodId.toString()
    );
    req.session.user.cart.items = items;
    res.redirect("/cart");
  });
};

exports.getCheckout = (req, res, next) => {
  let products;
  let total = 0;

  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then((user) => {
      products = user.cart.items;
      products.forEach((prod) => {
        total += prod.quantity * prod.productId.price;
      });

      return stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: products.map((p) => {
          return {
            name: p.productId.title,
            description: p.productId.description,
            amount: p.productId.price * 100,
            currency: "inr",
            quantity: p.quantity,
          };
        }),

        success_url:
          req.protocol + "://" + req.get("host") + "/checkout/success",
        cancel_url: req.protocol + "://" + req.get("host") + "/checkout",
      });
    })
    .then((session) => {
      res.render("shop/checkout", {
        docTitle: "Checkout",
        cartproducts: products,
        path: "/checkout",
        totalPrice: total,
        sessionId: session.id,
      });
    })
    .catch((error) => {
      console.log(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({
    "user.userId": req.user._id,
  })
    .then((orders) => {
      if (!orders) {
        return next(new Error("No Orders found"));
      }

      return orders;
    })
    .then((orders) => {
      res.render("shop/orders", {
        docTitle: "Orders Page",
        orders: orders,
        path: "/orders",
      });
    });
};

exports.getCheckoutSuccess = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then((user) => {
      const products = user.cart.items.map((p) => {
        return {
          productData: {
            ...p.productId,
          },
          quantity: p.quantity,
        };
      });
      const order = new Order({
        products: products,

        user: {
          email: req.user.email,
          userId: req.user,
        },
      });
      order.save();
      req.session.user.cart.items = [];
      user.save();
    })
    .then(() => {
      req.user.cart.items = [];
      req.user.save();
      res.redirect("/orders");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;

  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        return next(new Error("No Order Found"));
      }

      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error("Unauthorized"));
      }

      const invoiceName = "invoice-" + orderId + ".pdf";
      const invoicePath = path.join("data", "invoices", invoiceName);
      const pdfDoc = new pdfDocument();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${invoiceName}.pdf"`
      );

      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);

      pdfDoc.fontSize(26).text("Invoice", {
        underline: true,
      });

      pdfDoc.text("------------------------------------------------------");

      let totalPrice = 0;

      order.products.forEach((prod) => {
        totalPrice += prod.quantity * prod.productData.price;
        pdfDoc
          .fontSize(12)
          .text(
            prod.productData.title +
              "                                        " +
              prod.quantity +
              "                                        " +
              "Rs. " +
              prod.productData.price +
              "\n"
          );
      });

      pdfDoc.text(
        "---------------------------------------------------------------------------------------------------------------------\n"
      );
      pdfDoc.fontSize(13).text("Total Price : Rs " + totalPrice);

      pdfDoc.end();
    })
    .catch((err) => {
      next(new Error(err));
    });
};
