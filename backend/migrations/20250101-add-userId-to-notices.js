module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Notices', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'null = broadcast to all members, otherwise specific member'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Notices', 'userId');
  },
};
