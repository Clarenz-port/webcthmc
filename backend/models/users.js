  const { DataTypes } = require("sequelize");
  const sequelize = require("../config/database");

  const User = sequelize.define("User", {
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    middleName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // ⭐ ADDED
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },

    birthdate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    street: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    block: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lot: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("member", "admin", "superadmin"),
      defaultValue: "member",
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "approved", // for existing users
    },
    avatarUrl: {
  type: DataTypes.STRING,
  allowNull: true,
},
  });

  module.exports = User;
