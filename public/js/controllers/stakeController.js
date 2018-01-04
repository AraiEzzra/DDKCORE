require('angular');

angular.module('ETPApp').controller('stakeController', ['$scope', 'ngTableParams', '$filter', function ($scope, ngTableParams, $filter) {

    $scope.users = [

        { freezeAmount: 60, status: "Active", insertTime: '2017-12-27 12:37:25',matureTime: '26d, 23h', monthRemain: 6,addderess: "4995063339468361088E"},
        { freezeAmount: 70, status: "Inactive", insertTime: '2017-12-27 12:37:25',matureTime: '26d, 23h', monthRemain: 6,addderess: "4995063339468361088E"},
        { freezeAmount: 80, status: "Active", insertTime: '2017-12-27 12:37:25',matureTime: '26d, 23h', monthRemain: 6,addderess: "4995063339468361088E"},
        { freezeAmount: 20, status: "Inactive", insertTime: '2017-12-27 12:37:25',matureTime: '26d, 23h', monthRemain: 6,addderess: "4995063339468361088E"},
        { freezeAmount: 40, status: "Active", insertTime: '2017-12-27 12:37:25',matureTime: '26d, 23h', monthRemain: 6,addderess: "4995063339468361088E"},
        { freezeAmount: 547, status: "Inactive", insertTime: '2017-12-27 12:37:25',matureTime: '26d, 23h', monthRemain: 6,addderess: "4995063339468361088E"},
        { freezeAmount: 550, status: "Inactive", insertTime: '2017-12-27 12:37:25',matureTime: '26d, 23h', monthRemain: 6,addderess: "4995063339468361088E"},
        { freezeAmount: 650, status: "Active", insertTime: '2017-12-27 12:37:25',matureTime: '26d, 23h', monthRemain: 6,addderess: "4995063339468361088E"},
        { freezeAmount: 540, status: "Active", insertTime: '2017-12-27 12:37:25',matureTime: '26d, 23h', monthRemain: 6,addderess: "4995063339468361088E"},
        { freezeAmount: 879, status: "Inactive", insertTime: '2017-12-27 12:37:25',matureTime: '26d, 23h', monthRemain: 6,addderess: "4995063339468361088E"},
        { freezeAmount: 750, status: "Active", insertTime: '2017-12-27 12:37:25',matureTime: '26d, 23h', monthRemain: 6,addderess: "4995063339468361088E"},
    ];
    $scope.usersTable = new ngTableParams({
        page: 1,
        count: 10
    }, {
    total: $scope.users.length,

    getData: function ($defer, params) {
        $scope.data = params.sorting() ? $filter('orderBy')($scope.users, params.orderBy()) : $scope.users;
        $scope.data = $scope.data.slice((params.page() - 1) * params.count(), params.page() * params.count());
        $defer.resolve($scope.data);
    }
    });

}]);
