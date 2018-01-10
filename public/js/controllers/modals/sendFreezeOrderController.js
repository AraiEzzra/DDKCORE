require('angular');

angular.module('ETPApp').controller('sendFreezeOrderController', ['$scope', 'userService', 'sendTransactionModal', 'sendFreezeOrderModal', '$http', function ($scope, userService, sendTransactionModal,sendFreezeOrderModal,$http) {

    $scope.rememberedPassphrase =  userService.rememberedPassphrase;


    /* For Total Count*/

    /* $scope.freezeOrder = function(FreezeAmount){
        $http.post("/api/frogings/freeze",{freezedAmount:parseInt(FreezeAmount),secret: $scope.rememberedPassphrase})
        .then(function (resp) {
            if (resp.data.success) {
                Materialize.toast('Freeze Success', 3000, 'green white-text'); 
                freezeAmountModal.deactivate(); 
                
            } else {
                console.log(resp.data.error);
                Materialize.toast('Freeze Error', 3000, 'red white-text');
               
            }
        });
    } */











    $scope.close = function () {
        console.log('close freeze amount');
        if ($scope.destroy) {
            $scope.destroy();
        }
        //sendTransactionModal.deactivate();
        sendFreezeOrderModal.deactivate();
        console.log('close1 call 2');
    }


    $scope.clearSender = function () {
        console.log('demo00000000000');
        $scope.sender = '';
        console.log($scope.sender);
    }
    $scope.clearRecipient = function () {
        $scope.recipient = '';
    }


    

  

}]);
