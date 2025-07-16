module.exports = (sequelize, DataTypes) => {
  return sequelize.define("phone_number", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    phone_number: DataTypes.STRING,
    agent_id: DataTypes.STRING,
    brand: DataTypes.STRING,
  }, {
    tableName: "phone_number",
    timestamps: false,
  });
};


