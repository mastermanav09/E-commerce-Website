const Product = require("../models/product");
const mongodb = require("mongodb");
const fileHelper = require("../util/file");
const { validationResult } = require("express-validator");
const ITEMS_PER_PAGE = 4;

exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    docTitle: "Add Product Page",
    editProdActiveMode: false,
    path: "/admin/add-product",
    errorMessage: null,
    oldInput: {
      title: "",
      imageURL: "",
      price: "",
      description: "",
    },
  });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect("/");
  }

  const prodId = req.params.productId;

  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return res.redirect("/");
      }

      res.render("admin/edit-product", {
        docTitle: "Edit Product Page",
        editProdActiveMode: editMode,
        product: product,
        path: null,
        errorMessage: null,
      });
    })
    .catch((error) => {
      console.log(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.file;
  const updatedDescription = req.body.description;
  const errors = validationResult(req);

  Product.findById(prodId)
    .then((product) => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect("/login");
      }

      return product;
    })
    .then((product) => {
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDescription;

      if (image) {
        fileHelper.deleteFile(product.imageURL);
        product.imageURL = image.path;
      }

      if (!errors.isEmpty()) {
        return res.status(422).render("admin/edit-product", {
          docTitle: "Edit Product Page",
          product: product,
          path: null,
          editProdActiveMode: true,
          errorMessage: errors.array()[0].msg,
        });
      }

      return product.save().then((result) => {
        res.redirect("/admin/adminProducts-list");
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;

  if (!image) {
    return res.status(422).render("admin/edit-product", {
      docTitle: "Add Product Page",
      editProdActiveMode: false,
      path: "/admin/add-product",
      errorMessage: "Attached file is not an image",
      oldInput: {
        title: title,
        price: price,
        description: description,
      },
    });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      docTitle: "Add Product Page",
      editProdActiveMode: false,
      path: "/admin/add-product",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        title: title,
        price: price,
        description: description,
      },
    });
  }

  const imageURL = image.path;

  const product = new Product({
    title: title,
    imageURL: imageURL,
    price: price,
    description: description,
    userId: req.user._id,
  });

  product
    .save()
    .then((result) => {
      console.log(result);
      res.redirect("/admin/adminProducts-list");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getallProducts = (req, res, next) => {
  const page = +req.query.page || 1;

  var totalItems;
  Product.find({ userId: req.user._id })
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find({ userId: req.user._id })
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render("admin/adminProducts-list", {
        prods: products,
        docTitle: "Admin Products",
        path: "/admin/adminProducts-list",
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    });
};

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;

  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return next(new Error("Product not found"));
      }

      fileHelper.deleteFile(product.imageURL);

      return Product.deleteOne({ _id: prodId, userId: req.user._id });
    })
    .then(() => {
      console.log("Destroyed Product");

      res.status(200).json({ message: "Success!" });
    })
    .then(() => {
      const cartProducts = req.user.cart.items.filter(
        (p) =>
          p.productId.toString() !== new mongodb.ObjectId(prodId).toString()
      );
      req.user.cart.items = cartProducts;
      req.user.save();
    })
    .catch((err) => {
      res.status(500).json({ message: "Failure!" });
    });
};
