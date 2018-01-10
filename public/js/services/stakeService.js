require('angular');

angular.module('ETPApp').service('stakeService', function () {
    /* /api/frogings/getAllOrders */
    
    $http({
        method : "POST",
        url : "/api/frogings/getAllOrders"
    }).then(function mySuccess(response) {
        $scope.myStatke = response.data;
    }, function myError(response) {
        $scope.myStatke = response.statusText;
    });

});
