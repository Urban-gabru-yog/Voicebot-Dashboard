module.exports = (sequelize, DataTypes) => {
  return sequelize.define("product_cogs", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    product_id: DataTypes.STRING,
    product_name: DataTypes.STRING,
    brand: DataTypes.STRING,
    COGS: DataTypes.DECIMAL(10, 2),
  }, {
    tableName: "product_cogs",
    timestamps: false,
  });
};
