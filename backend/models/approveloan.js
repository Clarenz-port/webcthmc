const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ApproveLoan = sequelize.define('ApproveLoan', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  loanId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  month: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  interest: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  balance: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  amortization: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  penalty: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Unpaid',
  },
   paidDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'approve_loans',
  timestamps: true,
});

// Static method to get amortization schedule by loanId
ApproveLoan.getScheduleByLoanId = async function(loanId) {
  return await this.findAll({
    where: { loanId },
    order: [['month', 'ASC']],
    attributes: ['month', 'interest', 'penalty', 'balance', 'amortization', 'dueDate', 'status', 'paidDate']
  });
};

module.exports = ApproveLoan;
