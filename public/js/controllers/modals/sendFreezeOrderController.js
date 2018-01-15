//import { address } from 'ip';

require('angular');

angular.module('ETPApp').controller('sendFreezeOrderController', ['$scope', 'userService', 'sendTransactionModal', 'sendFreezeOrderModal', '$http','feeService', function ($scope, userService, sendTransactionModal,sendFreezeOrderModal,$http,feeService) {

    $scope.rememberedPassphrase =  userService.rememberedPassphrase;


    /* For Total Count*/
    $scope.freezeOrder = function(freezeId,recipientId){
        console.log("Navin");
        $http.post("/api/shiftOrder/sendFreezeOrder",{frozeId:freezeId,recipientId:recipientId,secret: $scope.rememberedPassphrase})
        .then(function (resp) {
            if (resp.data.success) {
                //console.log(JSON.stringify(resp.data));
                Materialize.toast('Send freeze order successfully', 3000, 'green white-text'); 
                freezeAmountModal.deactivate(); 
                
            } else {
                //console.log(resp.data.error);
                Materialize.toast('Send freeze order failed', 3000, 'red white-text');
            }
        });
    }

    $scope.getCurrentFee = function () {
        $http.get('/api/blocks/getFee').then(function (resp) {
                $scope.currentFee = resp.data.fee;
                $scope.fee = resp.data.fee;
            });
    }



    feeService(function (fees) {
        $scope.fee = fees.sendfreeze;
    });









    $scope.close = function () {
        console.log('close freeze amount');
        if ($scope.destroy) {
            $scope.destroy();
        }
        //sendTransactionModal.deactivate();
        sendFreezeOrderModal.deactivate();
        console.log('close1 call 2');
    }


    
    $scope.clearRecipient = function () {
        $scope.recipient = '';
    }


    

  

}]);
