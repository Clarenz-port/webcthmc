// config/database.js
require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  dialect: "mysql",
  timezone: "+08:00", // <-- IMPORTANT: write dates in PH time
  dialectOptions: {
    // keep date/time types as strings to avoid implicit timezone conversion on read
    dateStrings: true,
    typeCast: function (field, next) {
      // Return string for DATETIME / TIMESTAMP fields
      if (field.type === "DATETIME" || field.type === "TIMESTAMP") return field.string();
      return next();
    },
    ssl: process.env.DB_SSL === "true" ? "Amazon RDS" : false,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
  },
  logging: false,
  retry: {
    max: 3,
  },
});

module.exports = sequelize;
