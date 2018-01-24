require('angular');

angular.module('ETPApp').factory('sendTransactionModal', function (btfModal) {
    return btfModal({
        controller: 'sendTransactionController',
        templateUrl: '/partials/modals/sendTransaction.html'
    });
});


angular.module('ETPApp').factory('freezeAmountModal', function (btfModal) {
    return btfModal({
        controller: 'freezeAmountController',
        templateUrl: '/partials/modals/freezeAmount.html'
    });
}); 

