// config/database.js
require("dotenv").config();
const { Sequelize } = require("sequelize");

const dialectOptions = {
  // keep date/time types as strings to avoid implicit timezone conversion on read
  dateStrings: true,
  typeCast: function (field, next) {
    // Return string for DATETIME / TIMESTAMP fields
    if (field.type === "DATETIME" || field.type === "TIMESTAMP") return field.string();
    return next();
  },
};

// Add SSL for remote databases (like freedb.tech or Railway)
if (process.env.DB_HOST && process.env.DB_HOST !== "localhost" && process.env.DB_HOST !== "127.0.0.1") {
  dialectOptions.ssl = {
    rejectUnauthorized: false
  };
  dialectOptions.maxConnections = 5;
  dialectOptions.waitForConnections = true;
}

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST || "localhost",
  dialect: "mysql",
  port: process.env.DB_PORT || 3306,
  timezone: "+08:00", // <-- IMPORTANT: write dates in PH time
  dialectOptions,
  define: {
    timestamps: true,
  },
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  retry: {
    max: 5,
  },
  acquisitionTimeout: 30000,
});

module.exports = sequelize;
