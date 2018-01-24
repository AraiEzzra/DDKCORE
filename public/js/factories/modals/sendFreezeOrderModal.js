require('angular');

angular.module('ETPApp').factory('sendFreezeOrderModal', function (btfModal) {
    return btfModal({
        controller: 'sendFreezeOrderController',
        templateUrl: '/partials/modals/sendFreezeOrder.html'
    });
}); 
