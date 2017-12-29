require('angular');

angular.module('ETPApp').factory('userInfo', function (btfModal) {
    return btfModal({
        controller: 'userInfoController',
        templateUrl: '/partials/modals/userInfo.html'
    });
});
