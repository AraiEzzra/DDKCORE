
require('angular');


angular.module('ETPApp').service("stakeService", function ($http, $filter, esClient) {

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
    searchForStake: '',
    cachedData: [],
    getData: function (searchForStake, $defer, params, filter, secret, cb) {
      console.log('6666666666666666666666666666');
      service.searchForStake = searchForStake.trim();
      $http.post('/api/frogings/getAllOrders', { secret: secret }).success(function (resp) {
        var resultData = JSON.parse(resp.freezeOrders || null);
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