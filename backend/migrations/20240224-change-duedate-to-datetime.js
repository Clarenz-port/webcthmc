"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Change dueDate column from DATEONLY to DATE (DATETIME)
    await queryInterface.changeColumn("approve_loans", "dueDate", {
      type: Sequelize.DATE,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert dueDate column back to DATEONLY
    await queryInterface.changeColumn("approve_loans", "dueDate", {
      type: Sequelize.DATEONLY,
      allowNull: false,
    });
  },
};
