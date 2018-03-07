// controller configuration for elasticsearch to inject into services 

require('angular');

angular.module('ETPApp').controller('authController', ['$scope', '$http', function ($scope, $http) {
    $scope.error = null;
    
}]);