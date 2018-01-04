require('angular');

angular.module('ETPApp').controller('stakeController', ['$scope', 'ngTableParams', '$filter', '$http',"userService", function ($scope, ngTableParams, $filter, $http, userService) {


    $scope.rememberedPassphrase =  userService.rememberedPassphrase;
    $scope.freezeOrders = [];
    $scope.view.bar = {showBlockSearchBar: true};
    



    //console.log($scope.rememberedPassphrase);

    
    $scope.usersTable = new ngTableParams({
        page: 1,
        count: 5
    }, {
    total: $scope.freezeOrders.length,

    getData: function ($defer, params) {
        $scope.data = params.sorting() ? $filter('orderBy')($scope.freezeOrders, params.orderBy()) : $scope.freezeOrders;
        $scope.data = $scope.data.slice((params.page() - 1) * params.count(), params.page() * params.count());
        $defer.resolve($scope.data);
    }
    });



    $http.post("/api/frogings/getAllOrders", {secret: $scope.rememberedPassphrase})
    .then(function (resp) {
        //alert("stake");
        if (resp.data.success) {
         //console.log(JSON.stringify(resp.data)+"demo");
            var freezeOrders = resp.data.freezeOrders;

            $scope.freezeOrders = JSON.parse(freezeOrders);

            console.log($scope.freezeOrders);
            

        } else {
            console.log(resp.data.error);
        }
      });




/* 
      $scope.freezeOrders = JSON.parse(freezeOrders); */





}]);
