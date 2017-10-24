require('angular');

angular.module('ETPApp').factory('openDappModal', function (btfModal) {
    return btfModal({
        controller: 'openDappModalController',
        templateUrl: '/partials/modals/openDappModal.html'
    });
});
