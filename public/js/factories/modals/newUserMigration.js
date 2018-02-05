require('angular');

angular.module('ETPApp').factory('newUserMigration', function (btfModal) {
    return btfModal({
        controller: 'newUserMigrationController',
        templateUrl: '/partials/modals/newUserMigration.html'
    });
});
