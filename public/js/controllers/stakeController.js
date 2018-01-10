require('angular');

angular.module('ETPApp').controller('stakeController', ['$scope', 'ngTableParams', '$filter', '$http',"userService", 'gettextCatalog', 'blockService', function ($scope, ngTableParams, $filter, $http, userService, gettextCatalog,blockService) {

    $scope.view.page = {title: gettextCatalog.getString('Staking'), previous: null};
    $scope.rememberedPassphrase =  userService.rememberedPassphrase;
    $scope.freezeOrders = [];
    $scope.view.bar = {showBlockSearchBar: true};
    $scope.countFreezeOrders = 0;
    



   

    
     $scope.usersTable = new ngTableParams({
        page: 1,
        count: 5,
        sorting: {
            height: 'desc'
        },
        dataset : $scope.freezeOrders
    }, {
    total: $scope.freezeOrders.length,

    getData: function ($defer, params) {
        $scope.data = params.sorting() ? $filter('orderBy')($scope.freezeOrders, params.orderBy()) : $scope.freezeOrders;
        $scope.data = $scope.data.slice((params.page() - 1) * params.count(), params.page() * params.count());
        $defer.resolve($scope.data);
    }
    });

    $scope.usersTable.cols = {
        freezeAmount : gettextCatalog.getString('FreezeAmount'),
        status : gettextCatalog.getString('Status'),
        insertTime : gettextCatalog.getString('InsertTime'),
        matureTime : gettextCatalog.getString('MatureTime'),
        monthRemain : gettextCatalog.getString('MonthRemain'),
        recipient : gettextCatalog.getString('Recipient'),
        action : gettextCatalog.getString('Action')
    };




    $http.post("/api/frogings/getAllOrders", { secret: $scope.rememberedPassphrase })
    .then(function (resp) {
        //alert("stake");
        if (resp.data.success) {
            //console.log(JSON.stringify(resp.data)+"demo");
            var freezeOrders = resp.data.freezeOrders;
            $scope.freezeOrders = JSON.parse(freezeOrders);
            $scope.countFreezeOrders = freezeOrders.length;
        } else {
            console.log(resp.data.error);
        }
    });








}]);
