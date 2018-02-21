//import { address } from 'ip';

require('angular');

angular.module('ETPApp').controller('sendFreezeOrderController', ['$scope', 'userService', 'sendTransactionModal', 'sendFreezeOrderModal', '$http','feeService', function ($scope, userService, sendTransactionModal,sendFreezeOrderModal,$http,feeService) {

    $scope.rememberedPassphrase = userService.rememberPassphrase ? userService.rememberedPassphrase : false;
    $scope.sending = false;
    $scope.passmode = false;
    $scope.presendError = false;
    $scope.errorMessage = {};
    $scope.recipientAddress = '';
    $scope.checkSecondPass = false;
    $scope.secondPassphrase = userService.secondPassphrase;
    

    function validateForm(onValid) {
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
        if (fromSecondPass) {
            $scope.checkSecondPass = false;
            $scope.passmode = $scope.rememberedPassphrase ? false : true;
            $scope.secondPhrase = '';
            $scope.secretPhrase = '';
            return;
        }
        if ($scope.rememberedPassphrase) {
            validateForm(function () {
                $scope.presendError = false;
                $scope.errorMessage = {};
                $scope.sendFreezeOrder($scope.rememberedPassphrase);
            });
        } else {
            validateForm(function () {
                $scope.presendError = false;
                $scope.errorMessage = {};
                $scope.passmode = !$scope.passmode;
                $scope.secretPhrase = '';
            });
        }
    }


    /* For Total Count*/
    $scope.sendFreezeOrder = function (secretPhrase, withSecond) {
        if ($scope.secondPassphrase && !withSecond) {
            $scope.checkSecondPass = true;
            $scope.focus = 'secondPhrase';
            return;
        }

        $scope.errorMessage = {};

        var data = {
            secret: secretPhrase,
            frozeId: $scope.freezeId,
            recipientId: $scope.recipientAddress,
            freezedAmount: $scope.freezedAmount
        };

        if ($scope.secondPassphrase) {
            data.secondSecret = $scope.secondPhrase;
            if ($scope.rememberedPassphrase) {
                data.secret = $scope.rememberedPassphrase;
            }
        }

        if (!$scope.sending) {
            $scope.sending = true;

            $http.post("/api/shiftOrder/sendFreezeOrder", data)
                .then(function (resp) {
                    if (resp.data.success) {
                        Materialize.toast('Send freeze order successfully', 3000, 'green white-text');
                        sendFreezeOrderModal.deactivate();

                    } else {
                        Materialize.toast('Send freeze order failed', 3000, 'red white-text');
                        $scope.errorMessage.fromServer = resp.data.error;
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
        if ($scope.destroy) {
            $scope.destroy();
        }
        //sendTransactionModal.deactivate();
        sendFreezeOrderModal.deactivate();
    }
    
    $scope.recipAddress = function () {
        $scope.recipientAddress = '';
    }


}]);
