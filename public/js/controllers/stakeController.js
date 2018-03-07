require('angular');

angular.module('ETPApp').controller('stakeController', ['$scope', '$rootScope', 'ngTableParams', 'stakeService', '$http', "userService", 'gettextCatalog', 'sendFreezeOrderModal','$timeout', 'esClient', function ($scope, $rootScope, ngTableParams, stakeService, $http, userService, gettextCatalog, sendFreezeOrderModal,$timeout, esClient) {

  $scope.view.inLoading = true;
  $scope.rememberedPassphrase = userService.rememberedPassphrase;
  var resultData = [];
  var data = stakeService.data;
  $scope.view.loadingText = gettextCatalog.getString('Staking blockchain');
  $scope.view.page = { title: gettextCatalog.getString('Staking'), previous: null };
  $scope.countFreezeOrders = 0;
  $scope.loading = true;
  $scope.searchStake = stakeService;
  $scope.view.bar = { showStakeSearchBar: true };
  



  $scope.tableStakes = new ngTableParams(
    {
      page: 1,            // show first page
      count: 5,           // count per page
      sorting: { status: 'desc' }
    },
    {
      total: 0, // length of data
      counts: [],
      getData: function ($defer, params) {
        $scope.loading = true;
        if($scope.rememberedPassphrase == ''){
          $scope.rememberedPassphrase = $rootScope.secretPhrase;
        }
        stakeService.getData($scope.searchStake.searchForStake, $defer, params, $scope.filter, $scope.rememberedPassphrase, function () {
          $scope.searchStake.inSearch = false;
          $scope.countFreezeOrders = params.total();
          $scope.loading = false;
          $scope.view.inLoading = false;
        });
      }
    });

  $scope.tableStakes.cols = {
    freezedAmount: gettextCatalog.getString('FreezeAmount'),
    status: gettextCatalog.getString('Status'),
    insertTime: gettextCatalog.getString('InsertTime'),
    matureTime: gettextCatalog.getString('MatureTime'),
    monthRemain: gettextCatalog.getString('MonthRemain'),
    recipient: gettextCatalog.getString('Recipient'),
    action: gettextCatalog.getString('Action')
  };

  $scope.tableStakes.settings().$scope = $scope;

  $scope.$watch("filter.$", function () {
    $scope.tableStakes.reload();
  });


  $scope.sendFreezeOrder = function (id,freezedAmount) {

    $scope.sendFreezeOrderModal = sendFreezeOrderModal.activate({
      freezeId: id,
      freezedAmount:freezedAmount,
      destroy: function () {
      }
    });
  }

  $scope.updateStakes = function () {
    $scope.tableStakes.reload();
};

  $scope.$on('updateControllerData', function (event, data) {
    if (data.indexOf('main.stake') != -1) {
      $scope.updateStakes();
    }
  });

  $scope.clearSearch = function () {
    $scope.searchStake.searchForStake = '';
}



  $scope.updateStakes();




// Search blocks watcher
var tempSearchBlockID = '',
searchBlockIDTimeout;

$scope.$watch('searchStake.searchForStake', function (val) {
    if (searchBlockIDTimeout) $timeout.cancel(searchBlockIDTimeout);
    
    if (val.trim() != '') {
        $scope.searchStake.inSearch = true;
    } else {
        $scope.searchStake.inSearch = false;
        if (tempSearchBlockID != val) {
            tempSearchBlockID = val;
            $scope.updateStakes();
            return;
        }
    }
    tempSearchBlockID = val;
    searchBlockIDTimeout = $timeout(function () {
        $scope.searchStake.searchForStake = tempSearchBlockID;
        $scope.updateStakes();
    }, 2000); // Delay 2000 ms
});


























}]);










