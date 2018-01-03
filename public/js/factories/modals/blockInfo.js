require('angular');

angular.module('ETPApp').factory('blockInfo', function (btfModal) {
    return btfModal({
        controller: 'blockInfoController',
        templateUrl: '/partials/modals/blockInfo.html'
    });
});
