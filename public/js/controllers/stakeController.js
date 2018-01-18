require('angular');

angular.module('ETPApp').controller('stakeController', ['$scope', 'ngTableParams', 'NameService', '$http', "userService", 'gettextCatalog', 'sendFreezeOrderModal', function ($scope, ngTableParams, NameService, $http, userService, gettextCatalog, sendFreezeOrderModal) {

  $scope.rememberedPassphrase = userService.rememberedPassphrase;
  var resultData = [];
  var data = NameService.data;
  $scope.view.loadingText = gettextCatalog.getString('Staking blockchain');
  $scope.view.page = { title: gettextCatalog.getString('Staking'), previous: null };
  $scope.countFreezeOrders = 0;
  $scope.loading = true;



  $scope.tableParams = new ngTableParams(
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
        NameService.getData($defer, params, $scope.filter, $scope.rememberedPassphrase, function () {
          $scope.countFreezeOrders = params.total();
          $scope.loading = false;
        });
      }
    });

  $scope.tableParams.cols = {
    freezedAmount: gettextCatalog.getString('FreezeAmount'),
    status: gettextCatalog.getString('Status'),
    insertTime: gettextCatalog.getString('InsertTime'),
    matureTime: gettextCatalog.getString('MatureTime'),
    monthRemain: gettextCatalog.getString('MonthRemain'),
    recipient: gettextCatalog.getString('Recipient'),
    action: gettextCatalog.getString('Action')
  };

  $scope.$watch("filter.$", function () {
    $scope.tableParams.reload();
  });

  $scope.sendFreezeOrder = function (id) {
    $scope.sendFreezeOrderModal = sendFreezeOrderModal.activate({
      freezeId: id,
      destroy: function () {
      }
    });
  }
}]);


angular.module('ETPApp').service("NameService", function ($http, $filter) {

  function filterData(data, filter) {
    return $filter('filter')(data, filter)
  }

  function orderData(data, params) {
    return params.sorting() ? $filter('orderBy')(data, params.orderBy()) : filteredData;
  }

  function sliceData(data, params) {
    return data.slice((params.page() - 1) * params.count(), params.page() * params.count())
  }

  function transformData(data, filter, params) {
    return sliceData(orderData(filterData(data, filter), params), params);
  }

  var service = {
    cachedData: [],
    getData: function ($defer, params, filter, secret, cb) {
      $http.post('/api/frogings/getAllOrders', { secret: secret }).success(function (resp) {
        var resultData = JSON.parse(resp.freezeOrders);
        params.total(resultData.length)
        var filteredData = $filter('filter')(resultData, filter);
        var transformedData = transformData(resultData, filter, params)
        $defer.resolve(transformedData);
        cb(null);
      });
    }
  };
  return service;
});






