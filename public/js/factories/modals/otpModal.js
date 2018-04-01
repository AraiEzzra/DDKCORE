require('angular');

angular.module('ETPApp').factory('otpModal', function (btfModal) {
    return btfModal({
        controller: 'otpModalController',
        templateUrl: '/partials/modals/otpModal.html'
    });
});
