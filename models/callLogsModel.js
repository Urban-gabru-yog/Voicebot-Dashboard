module.exports = (sequelize, DataTypes) => {
  return sequelize.define("call_logs", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    call_id: DataTypes.STRING,
    name: DataTypes.STRING,
    title: DataTypes.STRING,
    price: DataTypes.DECIMAL(10, 2),
    email: DataTypes.STRING,
    start_timestamp: DataTypes.DATE,
    end_timestamp: DataTypes.DATE,
    combined_cost: DataTypes.DECIMAL(10, 2),
    from_number: DataTypes.STRING,
    to_number: DataTypes.STRING,
    brand: DataTypes.STRING,
  }, {
    tableName: "call_logs",
    timestamps: false,
  });
};
