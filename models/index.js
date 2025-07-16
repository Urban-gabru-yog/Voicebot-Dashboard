const { Sequelize } = require("sequelize");
require("dotenv").config();

console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASS ? '***' : '(empty)');
console.log('DB_NAME:', process.env.DB_NAME);

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false,
  }
);

sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connected');
  })
  .catch((err) => {
    console.error('❌ Unable to connect to the database:', err);
  });

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.ShopifyOrder = require("./shopifyOrdersModel")(sequelize, Sequelize);
db.CallLog = require("./callLogsModel")(sequelize, Sequelize);
db.OrderItem = require("./orderItemsModel")(sequelize, Sequelize);
db.ProductCogs = require("./productCogsModel")(sequelize, Sequelize);
db.PhoneNumber = require("./phoneNumberModel")(sequelize, Sequelize);

module.exports = db;
