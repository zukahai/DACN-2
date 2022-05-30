'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        return queryInterface.bulkInsert('Configs', [
            {
                name: 'FontList',
                status: 1,
                createAt: formartDate(),
                updateAt: formartDate(),
            },
            {
                name: 'Ban',
                status: 0,
                createAt: formartDate(),
                updateAt: formartDate(),
            },
        ]);
    },

    async down(queryInterface, Sequelize) {
        /**
         * Add commands to revert seed here.
         *
         * Example:
         * await queryInterface.bulkDelete('People', null, {});
         */
    },
};
let formartDate = () => {
    var date = new Date();
    return (
        ('00' + (date.getMonth() + 1)).slice(-2) +
        '/' +
        ('00' + date.getDate()).slice(-2) +
        '/' +
        date.getFullYear() +
        ' ' +
        ('00' + date.getHours()).slice(-2) +
        ':' +
        ('00' + date.getMinutes()).slice(-2) +
        ':' +
        ('00' + date.getSeconds()).slice(-2)
    );
};
