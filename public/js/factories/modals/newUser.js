require('angular');

angular.module('ETPApp').factory('newUser', function (btfModal) {
    return btfModal({
        controller: 'newUserController',
        templateUrl: '/partials/modals/newUser.html'
    });
});
