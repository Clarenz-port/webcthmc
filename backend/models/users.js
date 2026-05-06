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
    
    address: {
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

    resetCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resetCodeExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });


// Helper function to capitalize first letter of each word
function capitalizeWords(str) {
  if (!str) return str;
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

User.beforeSave((user) => {
  if (user.firstName) user.firstName = capitalizeWords(user.firstName.trim());
  if (user.middleName) user.middleName = capitalizeWords(user.middleName.trim());
  if (user.lastName) user.lastName = capitalizeWords(user.lastName.trim());
});

module.exports = User;
