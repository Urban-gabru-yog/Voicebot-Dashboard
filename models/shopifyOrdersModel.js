module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "shopify_orders",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      email: DataTypes.STRING,
      phone_number: DataTypes.STRING,
      order_number: DataTypes.STRING,
      created_at: DataTypes.DATE,
      total_price: DataTypes.DECIMAL(10, 2),
      discount_codes: DataTypes.STRING,
      customer_first_name: DataTypes.STRING,
      title: DataTypes.STRING,
      brand: DataTypes.STRING,
      shopify_order_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: "shopify_orders",
      timestamps: false,
    }
  );
};
