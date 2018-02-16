
require('angular');

angular.module('ETPApp').controller('accountController', ['$state', '$scope', '$rootScope', '$http', "userService", "$interval", "$timeout", "sendTransactionModal", "secondPassphraseModal", "delegateService", 'viewFactory', 'transactionInfo', 'userInfo', '$filter', 'gettextCatalog', function ($state, $rootScope, $scope, $http, userService, $interval, $timeout, sendTransactionModal, secondPassphraseModal, delegateService, viewFactory, transactionInfo, userInfo, $filter, gettextCatalog) {

    $scope.view = viewFactory;
    $scope.view.inLoading = true;
    $scope.view.loadingText = gettextCatalog.getString('Loading dashboard');
    $scope.view.page = { title: gettextCatalog.getString('Dashboard'), previous: null };
    $scope.view.bar = {};
    $scope.delegate = undefined;
    $scope.address = userService.address;
    $scope.publicKey = userService.publicKey;
    $scope.balance = userService.balance;
    $scope.unconfirmedBalance = userService.unconfirmedBalance;
    $scope.secondPassphrase = userService.secondPassphrase;
    $scope.unconfirmedPassphrase = userService.unconfirmedPassphrase;
    $scope.transactionsLoading = true;
    $scope.allVotes = 100 * 1000 * 1000 * 1000 * 1000 * 100;
    $scope.rememberedPassphrase = userService.rememberPassphrase ? userService.rememberedPassphrase : false;
 
    $scope.graphs = {
        ETPPrice: {
            labels: ['1', '2'],
            series: ['Series B'],
            data: [
                [60, 20]
            ],
            colours: ['#29b6f6'],
            options: {
                scaleShowGridLines: false,
                pointDot: false,
                showTooltips: false,
                scaleShowLabels: false,
                scaleBeginAtZero: true
            }
        }
    };

    $scope.transactionInfo = function (block) {
        $scope.modal = transactionInfo.activate({ block: block });
    }

    $scope.resetAppData = function () {
        $scope.balance = userService.balance = 0;
        $scope.unconfirmedBalance = userService.unconfirmedBalance = 0;

        $scope.balanceToShow = [0]

        $scope.secondPassphrase = userService.secondPassphrase = 0;
        $scope.unconfirmedPassphrase = userService.unconfirmedPassphrase = 0;

        userService.multisignatures = userService.u_multisignatures = null;
        $scope.multisignature = false;

        $scope.delegateInRegistration = userService.delegateInRegistration = null;
        $scope.delegate = userService.delegate = null;
        $scope.username = userService.username = null;
    }

    $scope.userInfo = function (userId) {
        $scope.modal = userInfo.activate({ userId: userId });
    }

    $scope.getTransactions = function () {
        $http.get("/api/transactions", {
            params: {
                senderPublicKey: userService.publicKey,
                recipientId: $scope.address,
                limit: 8,
                orderBy: 'timestamp:desc'
            }
        }).then(function (resp) {
            var transactions = resp.data.transactions;

            $http.get('/api/transactions/unconfirmed', {
                params: {
                    senderPublicKey: userService.publicKey,
                    address: userService.address
                }
            }).then(function (resp) {
                var unconfirmedTransactions = resp.data.transactions;

                $timeout(function () {
                    $scope.transactions = _.compact(
                        unconfirmedTransactions.concat(transactions).slice(0, 8)
                    );
                });
            });
        });
    }

    $scope.getAccount = function () {
        $http.get("/api/accounts", { params: { address: userService.address } }).then(function (resp) {
            $scope.view.inLoading = false;
            if (resp.data.account) {
                var account = resp.data.account;
                userService.balance = account.balance;
                userService.multisignatures = account.multisignatures;
                userService.u_multisignatures = account.u_multisignatures;
                userService.unconfirmedBalance = account.unconfirmedBalance;
                userService.secondPassphrase = account.secondSignature || account.unconfirmedSignature;
                userService.unconfirmedPassphrase = account.unconfirmedSignature;
                $scope.balance = userService.balance;
                $scope.unconfirmedBalance = userService.unconfirmedBalance;
                $scope.balanceToShow = $filter('decimalFilter')(userService.unconfirmedBalance);
                if ($scope.balanceToShow[1]) {
                    $scope.balanceToShow[1] = '.' + $scope.balanceToShow[1];
                }
                $scope.secondPassphrase = userService.secondPassphrase;
                $scope.unconfirmedPassphrase = userService.unconfirmedPassphrase;
                $scope.balanceDec = $scope.balance / 100000000;
                $scope.balanceDecParseInt = parseInt($scope.balanceDec);
            } else {
                $scope.resetAppData();
            }
        });
    }

    /* For total stakeholders */
    $scope.getStakeholdersCount = function () {
        $http.get("/api/frogings/countStakeholders")
        .then(function (resp) {
            if (resp.data.success) {
                var countStakeholders = resp.data.countStakeholders.count;
                $scope.countStakeholders = JSON.parse(countStakeholders);
            } else {
                console.log(resp.data.error);
            }
        });
    }

    /* For Circulating Supply */
    $scope.getCirculatingSupply = function () {
        $http.get("/api/accounts/getCirculatingSupply")
        .then(function (resp) {
            if (resp.data.success) {
                var circulatingSupply = resp.data.circulatingSupply / 100000000;
                $scope.circulatingSupply = parseInt(circulatingSupply);
            } else {
                console.log(resp.data.error);
            }
        });
    }

    /* For Total Count*/
    $scope.getAccountHolders = function () {
        $http.get("/api/accounts/count")
        .then(function (resp) {
            if (resp.data.success) {
                var totalCount = resp.data.count;
                $scope.totalCount = JSON.parse(totalCount);
            } else {
                console.log(resp.data.error);
            }
        });
    }
 
    /* For Your ETP Frozen */
    $scope.getMyETPFrozen = function () {

        if (($scope.rememberedPassphrase == undefined || $scope.rememberedPassphrase == false)) {
            $scope.rememberedPassphrase = $rootScope.secretPhrase;
        }
       
        $http.post("/api/frogings/getMyETPFrozen", { secret: $scope.rememberedPassphrase })
        .then(function (resp) {
            if (resp.data.success) {
                var myETPFrozen = resp.data.totalETPStaked.sum / 100000000;
                $scope.myETPFrozen = parseInt(myETPFrozen);
            } else {
                console.log(resp.data.error);
                $scope.myETPFrozen = 0;
            }
        });
    }


    /* For Your total supply */
    $scope.getTotalSupply = function () {
        $http.get("/api/accounts/totalSupply")
        .then(function (resp) {
            if (resp.data.success) {
                var totalSupply = resp.data.totalSupply / 100000000;
                $scope.totalSupply = JSON.parse(totalSupply);
            } else {
                console.log(resp.data.error);
            }
        });
    }

    /* For total ETP staked by stakeholders */
    $scope.getTotalETPStaked = function () {
        $http.get("/api/frogings/getTotalETPStaked")
        .then(function (resp) {
            if (resp.data.success) {
                var totalETPStaked = resp.data.totalETPStaked.sum / 100000000;
                $scope.totalETPStaked = parseInt(totalETPStaked);
            } else {
                console.log(resp.data.error);
            }
        });
    }

    $scope.getCandles = function () {
        $http.get("https://explorer.ETP.io/api/candles/getCandles")
        .then(function (response) {
            $scope.graphs.ETPPrice.data = (response.data && response.data.candles) ? [
                response.data.candles.map(
                    function (candle) {
                        return candle.close;
                    }
                )
            ] : [];
        });
    }

    $scope.$on('$destroy', function () {
        $interval.cancel($scope.balanceInterval);
        $scope.balanceInterval = null;
        $interval.cancel($scope.transactionsInterval);
        $scope.transactionsInterval = null;
    });

    $scope.addSecondPassphrase = function () {
        $scope.secondPassphraseModal = secondPassphraseModal.activate({
            totalBalance: $scope.unconfirmedBalance,
            destroy: function (r) {
                $scope.updateAppView();
                if (r) {
                    $scope.unconfirmedPassphrase = true;
                }
            }
        });
    }

    $scope.updateAppView = function () {
        $scope.getAccount();
        $scope.getTransactions();
        $scope.getStakeholdersCount();
        $scope.getCirculatingSupply();
        $scope.getAccountHolders();
        $scope.getMyETPFrozen();
        $scope.getTotalSupply();
        $scope.getTotalETPStaked();
        delegateService.getDelegate($scope.publicKey, function (response) {
            $timeout(function () {
                $scope.delegate = response;
            });
        });
    }

    $scope.$on('updateControllerData', function (event, data) {
        $scope.$$listeners.updateControllerData.splice(1);
        if ((data.indexOf('main.dashboard') != -1 && $state.current.name == 'main.dashboard') || data.indexOf('main.transactions') != -1) {
            $scope.updateAppView();
        }
    });

    $scope.updateAppView();
    $scope.getCandles();


}]);
