
require('angular');


    angular.module('ETPApp').service("stakeService", function ($http, $filter) {
        
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
              service.searchForStake = searchForStake.trim();
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