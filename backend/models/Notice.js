const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Notice = sequelize.define("Notice", {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true, // null = broadcast to all members (admin notices)
  },
}, {
  timestamps: true,
});

module.exports = Notice;
