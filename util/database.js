const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;

let _db;

const mongoConnect = () => {
  MongoClient.connect(
    "mongodb+srv://mastermanav:Manav07520442894@cluster0.gkjeh.mongodb.net/shop?retryWrites=true&w=majority",
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
