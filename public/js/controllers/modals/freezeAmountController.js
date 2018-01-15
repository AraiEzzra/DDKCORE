require('angular');

angular.module('ETPApp').controller('freezeAmountController', ['$scope', 'userService', 'sendTransactionModal', 'freezeAmountModal', '$http','feeService', function ($scope, userService, sendTransactionModal,freezeAmountModal,$http,feeService) {

    $scope.rememberedPassphrase =  userService.rememberedPassphrase;


    /* For Total Count*/

    $scope.freezeOrder = function(FreezeAmount){
        $http.post("/api/frogings/freeze",{freezedAmount:parseInt(FreezeAmount),secret: $scope.rememberedPassphrase})
        .then(function (resp) {
            if (resp.data.success) {
                Materialize.toast('Freeze Success', 3000, 'green white-text'); 
                freezeAmountModal.deactivate(); 
                
            } else {
                //console.log(resp.data.error);
                Materialize.toast('Freeze Error', 3000, 'red white-text');
                $scope.errorMessage.fromServer = resp.data.error;
               
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
        $scope.fee = fees.froze;
    });





    $scope.close = function () {
        console.log('close freeze amount');
        if ($scope.destroy) {
            $scope.destroy();
        }
        //sendTransactionModal.deactivate();
        freezeAmountModal.deactivate();
        console.log('close1 call 2');
    }





    

  

}]);
