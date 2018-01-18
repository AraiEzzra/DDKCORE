//import { address } from 'ip';

require('angular');

angular.module('ETPApp').controller('sendFreezeOrderController', ['$scope', 'userService', 'sendTransactionModal', 'sendFreezeOrderModal', '$http','feeService', function ($scope, userService, sendTransactionModal,sendFreezeOrderModal,$http,feeService) {

    $scope.rememberedPassphrase = userService.rememberPassphrase ? userService.rememberedPassphrase : false;
    $scope.sending = false;
    $scope.passmode = false;
    $scope.presendError = false;
    $scope.errorMessage = {};
    $scope.recipientAddress = '';
    

    function validateForm2(onValid) {
        console.log($scope.recipientAddress);
        var isAddress = /^[0-9]+[E|e]$/g;
        var correctAddress = isAddress.test($scope.recipientAddress);
        $scope.errorMessage = {};

        if ($scope.recipientAddress.trim() == '') {
            $scope.errorMessage.recipient = 'Empty recipient';
            $scope.presendError = true;
        } else {
            if (!correctAddress) {
                $scope.errorMessage.recipient = 'Invalid recipient';
                $scope.presendError = true;
            }else{
                return onValid();
            }
        }
    }


    $scope.passcheck = function (fromSecondPass) {
        console.log($scope.recipientAddress);
        if ($scope.rememberedPassphrase) {
            validateForm2(function () {
                $scope.presendError = false;
                $scope.errorMessage = {};
                $scope.sendFreezeOrder($scope.rememberedPassphrase);
            });
        } else {
            validateForm2(function () {
                $scope.presendError = false;
                $scope.errorMessage = {};
                $scope.passmode = !$scope.passmode;
                $scope.secretPhrase = '';
            });
        }
    }


    /* For Total Count*/
    $scope.sendFreezeOrder = function (secretPhrase) {
        console.log(secretPhrase+", freezeId:"+$scope.freezeId+", recipientAddress"+$scope.recipientAddress);
        var data = {
            secret: secretPhrase,
            frozeId: $scope.freezeId,
            recipientId: $scope.recipientAddress
        };

        if (!$scope.sending) {
            $scope.sending = true;

            $http.post("/api/shiftOrder/sendFreezeOrder", data)
                .then(function (resp) {
                    if (resp.data.success) {
                        Materialize.toast('Send freeze order successfully', 3000, 'green white-text');
                        sendFreezeOrderModal.deactivate();

                    } else {
                        console.log(resp.data.error);
                        Materialize.toast('Send freeze order failed', 3000, 'red white-text');
                    }
                });
        }
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
    
    $scope.recipAddress = function () {
        console.log('blank click');
        $scope.recipientAddress = '';
    }


}]);
