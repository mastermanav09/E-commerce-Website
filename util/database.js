const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;
require("dotenv").config();

let _db;

const mongoConnect = () => {
  MongoClient.connect(
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.gkjeh.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority`,
    {
      useUnifiedTopology: true,
    }
  )
    .then((client) => {
      console.log("Connected");
      _db = client.db();
    })
    .catch((error) => {
      console.log(error);
      throw error;
    });
};

const getDb = () => {
  if (_db) {
    return _db;
  }

  throw new Error("Database not found!");
};

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;
