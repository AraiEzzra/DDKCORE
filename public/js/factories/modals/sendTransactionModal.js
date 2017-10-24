require('angular');

angular.module('ETPApp').factory('sendTransactionModal', function (btfModal) {
    return btfModal({
        controller: 'sendTransactionController',
        templateUrl: '/partials/modals/sendTransaction.html'
    });
});
