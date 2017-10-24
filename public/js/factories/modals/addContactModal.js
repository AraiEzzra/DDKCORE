require('angular');

angular.module('ETPApp').factory('addContactModal', function (btfModal) {
    return btfModal({
        controller: 'addContactModalController',
        templateUrl: '/partials/modals/addContactModal.html'
    });
});
