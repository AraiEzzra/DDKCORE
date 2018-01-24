require('angular');

angular.module('ETPApp').factory('transactionInfo', function (btfModal) {
    return btfModal({
        controller: 'transactionInfoController',
        templateUrl: '/partials/modals/transactionInfo.html'
    });
});
