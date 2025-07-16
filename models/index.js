const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false,
  }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.ShopifyOrder = require("./shopifyOrdersModel")(sequelize, Sequelize);
db.CallLog = require("./callLogsModel")(sequelize, Sequelize);
db.OrderItem = require("./orderItemsModel")(sequelize, Sequelize);
db.ProductCogs = require("./productCogsModel")(sequelize, Sequelize);
db.PhoneNumber = require("./phoneNumberModel")(sequelize, Sequelize);

module.exports = db;
