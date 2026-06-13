module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Shares', 'type', {
      type: Sequelize.ENUM('contribution', 'savings'),
      allowNull: false,
      defaultValue: 'contribution',

    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Shares', 'type');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Shares_type";');
  },
};