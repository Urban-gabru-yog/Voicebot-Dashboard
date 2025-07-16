module.exports = (sequelize, DataTypes) => {
  return sequelize.define("order_items", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    order_number: DataTypes.INTEGER,
    title: DataTypes.STRING,
    product_id: DataTypes.BIGINT,
    quantity: DataTypes.INTEGER,
    price: DataTypes.STRING,
    created_at: DataTypes.DATE,
    brand: DataTypes.STRING,
  }, {
    tableName: "order_items",
    timestamps: false,
  });
};
