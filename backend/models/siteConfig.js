const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SiteConfig = sequelize.define('SiteConfig', {
  siteName: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'CTHMC',
  },
  logo: {
    type: DataTypes.TEXT('long'), // base64 or url
    allowNull: true,
  },
}, {
  tableName: 'site_config',
  timestamps: false,
});

module.exports = SiteConfig;
