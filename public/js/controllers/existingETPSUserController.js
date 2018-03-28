require('angular');

angular.module('ETPApp').controller('existingETPSUserController', ['$scope', '$rootScope', '$http', "$state", "userService", "newUserMigration", 'gettextCatalog', '$cookies', 'focus', function ($rootScope, $scope, $http, $state, userService, newUserMigration, gettextCatalog, $cookies, focus) {

    userService.setData();
    userService.rememberPassphrase = false;
    userService.rememberedPassphrase = '';
    $scope.password = '';
    $scope.errorMessage = "";
    $scope.URL_GLOBAL = "https://api.etpswallet.gold/";
    $scope.API_KEY_GLOBAL = "etps_2_etp_V1.1";

    focus('focusMe');

    $scope.newUser = function (data) {
        $scope.newUserModal = newUserMigration.activate({
            dataVar: data,
            destroy: function () {
            }
        });
    }

    // function to validate existing ETPS user from ETP_test database
    $scope.validateExistingUser = function (username, password) {
        var post = "username=" + btoa(username) + "&password=" + btoa(password);

        $http.post("/api/accounts/existingETPSUser/validate", {

            data: post
        })
            .success(function (resp) {

                if (!resp.success) {
                    $scope.errorMessage = resp.error;
                } else {
                    var userInfo = {};
                    Object.assign(userInfo, resp.userInfo);
                    $http.post("/api/accounts/existingETPSUser", { userInfo: userInfo }).then(function (response) {
                        if (response.data.success) {
                            if (response.data.isMigrated) {
                                $scope.errorMessage = 'User is already migrated';
                            } else {
                                $scope.newUser(userInfo);
                            }
                        } else {
                            $scope.errorMessage = response.data.error;
                        }
                    });
                }
            })
            .error(function (err) {
                $scope.errorMessage = err;
            });
    }
}]);
