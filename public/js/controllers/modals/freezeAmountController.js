require('angular');

angular.module('ETPApp').controller('freezeAmountController', ['$scope', 'userService', 'sendTransactionModal', 'freezeAmountModal', '$http','feeService', function ($scope, userService, sendTransactionModal,freezeAmountModal,$http,feeService) {

    $scope.rememberedPassphrase =  userService.rememberedPassphrase;

    $scope.isCorrectValue = function (currency, throwError) {
        var parts = String(currency).trim().split('.');
        var amount = parts[0];
        var fraction;

        if (!throwError) throwError = false;

        function error (message) {
            $scope.errorMessage.amount = message;

            if (throwError) {
              throw $scope.errorMessage.amount;
            } else {
              console.error(message);
              return false;
            }
        }

        if (amount == '') {
            return error('ETP amount can not be blank');
        }

        if (parts.length == 1) {
            // No fractional part
            fraction = '00000000';
        } else if (parts.length == 2) {
            if (parts[1].length > 8) {
                return error('ETP amount must not have more than 8 decimal places');
            } else if (parts[1].length <= 8) {
                // Less than eight decimal places
                fraction = parts[1];
            } else {
                // Trim extraneous decimal places
                fraction = parts[1].substring(0, 8);
            }
        } else {
            return error('ETP amount must have only one decimal point');
        }

        // Pad to eight decimal places
        for (var i = fraction.length; i < 8; i++) {
            fraction += '0';
        }

        // Check for zero amount
        if (amount == '0' && fraction == '00000000') {
            return error('ETP amount can not be zero');
        }

        // Combine whole with fractional part
        var result = amount + fraction;

        // In case there's a comma or something else in there.
        // At this point there should only be numbers.
        if (!/^\d+$/.test(result)) {
            return error('ETP amount contains non-numeric characters');
        }

        // Remove leading zeroes
        result = result.replace(/^0+/, '');

        return parseInt(result);
    }

    $scope.convertETP = function (currency) {
        return $scope.isCorrectValue(currency, true);
    }

    /* For Total Count*/

    $scope.freezeOrder = function(FreezeAmount){
        $http.post("/api/frogings/freeze",{freezedAmount:$scope.convertETP(FreezeAmount),secret: $scope.rememberedPassphrase})
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
