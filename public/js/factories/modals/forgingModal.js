



require('angular');

angular.module('ETPApp').factory('forgingModal', function (btfModal) {
    return btfModal({
        controller: 'forgingModalController',
        templateUrl: '/partials/modals/forgingModal.html'
    });
});
