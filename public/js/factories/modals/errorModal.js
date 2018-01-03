require('angular');

angular.module('ETPApp').factory('errorModal', function (btfModal) {
    return btfModal({
        controller: 'errorModalController',
        templateUrl: '/partials/modals/errorModal.html'
    });
});
