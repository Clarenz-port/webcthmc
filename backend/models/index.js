const ApproveLoan = require("../models/approveloan");
const Purchase = require("../models/purchase");
const Shares = require("../models/shares");
const Loan = require("../models/loans");
const User = require("../models/users");
const Bill = require("../models/billPayment");
const ActivityLog = require("../models/activityLog");
const Dividend = require("../models/dividend");
const loanpay = require("../models/loanpay");

Shares.belongsTo(User, {
  foreignKey: "userId",
  targetKey: "id",
});
User.hasMany(Shares, {
  foreignKey: "userId",
  sourceKey: "id",
});

// Loans → Users.id
Loan.belongsTo(User, {
  foreignKey: "userId",
  targetKey: "id",
});
User.hasMany(Loan, {
  foreignKey: "userId",
  sourceKey: "id",
});

// Purchases → Users.id
Purchase.belongsTo(User, {
  foreignKey: "user_id",
  targetKey: "id",
});
User.hasMany(Purchase, {
  foreignKey: "user_id",
  sourceKey: "id",
});

// Bills → Users.id
Bill.belongsTo(User, {
  foreignKey: "memberId",
  targetKey: "id",
});
User.hasMany(Bill, {
  foreignKey: "memberId",
  sourceKey: "id",
});

ActivityLog.belongsTo(User, { foreignKey: "userId", targetKey: "id" });
User.hasMany(ActivityLog, { foreignKey: "userId", sourceKey: "id" });


module.exports = {
  User,
  Shares,
  Loan,
  Purchase,
  Bill,
  ActivityLog,
  Dividend,
  loanpay,
  ApproveLoan,
};