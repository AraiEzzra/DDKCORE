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

  $scope.tableStakes.settings().$scope = $scope;

  $scope.$watch("filter.$", function () {
    $scope.tableStakes.reload();
  });


  $scope.sendFreezeOrder = function (id) {

    $scope.sendFreezeOrderModal = sendFreezeOrderModal.activate({
      freezeId: id,
      destroy: function () {
      }
    });
  }

  $scope.updateStakes = function () {
    console.log("updateStakes......."+(new Date()));
    $scope.tableStakes.reload();
};

  $scope.$on('updateControllerData', function (event, data) {
    console.log("inside stake controler");
    if (data.indexOf('main.stake') != -1) {
      $scope.updateStakes();
    }
  });


  $scope.updateStakes();


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
      // Remove below code because when we do multiple order and in between check stake,
      //    html page then it cached it ,in future always displayed it using cache

      // if(service.cachedData.length>0){
      //   console.log("using cached data")
      //   var filteredData = filterData(service.cachedData,filter);
      //   var transformedData = sliceData(orderData(filteredData,params),params);
      //   params.total(filteredData.length)
      //   $defer.resolve(transformedData);
      // }
      // else{
      //   console.log("fetching data")
      $http.post('/api/frogings/getAllOrders', { secret: secret }).success(function (resp) {
        var resultData = JSON.parse(resp.freezeOrders || null);
        //angular.copy(resultData,service.cachedData)
        if (resultData != null) {
          params.total(resultData.length)
          var filteredData = $filter('filter')(resultData, filter);
          var transformedData = transformData(resultData, filter, params)

          $defer.resolve(transformedData);
        }

        cb(null);
      });


    }
  };
  return service;
});






