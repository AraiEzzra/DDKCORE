require('angular');

angular.module('ETPApp').controller('confirmDeletionModalController', ["$scope", "confirmDeletionModal", function ($scope, confirmDeletionModal) {

    $scope.close = function (yesDelete) {
        if ($scope.destroy) {
            $scope.destroy(yesDelete);
        }
        confirmDeletionModal.deactivate();
    }

}]);
