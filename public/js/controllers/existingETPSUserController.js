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

    $scope.generateApiKey = function (mykey) {

        // DO NOT EDIT THIS FUNCTION
        // THE DYNAMIC API KEY WILL BE VALID FOR 10 SEC
        var time_sec = Math.floor(Date.now() / 1000) + 10;
        var dynamic_key = mykey + "####" + time_sec;

        return btoa(dynamic_key);
    }

    // function to validate existing ETPS user from ETP_test database
    $scope.validateExistingUser = function (username, password) {

        $http.post("/api/accounts/existingETPSUser/validate", {
            username: btoa(username),
            password: btoa(password)
        })
            .success(function (resp) {
                if (!resp.records) {
                    $scope.errorMessage = resp.message;
                } else {
                    var userInfo = {};
                    Object.assign(userInfo, resp.records);
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
