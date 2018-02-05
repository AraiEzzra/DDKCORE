require('angular');

angular.module('ETPApp').controller('existingETPSUserController', ['$scope', '$rootScope', '$http', "$state", "userService", "newUserMigration", 'gettextCatalog', '$cookies', function ($rootScope, $scope, $http, $state, userService, newUserMigration, gettextCatalog, $cookies) {

    userService.setData();
    userService.rememberPassphrase = false;
    userService.rememberedPassphrase = '';
    $scope.rememberPassphrase = true;
    $scope.errorMessage = "";

   

    $scope.newUser = function (data) {

        $scope.newUserModal = newUserMigration.activate({
            dataVar: data,
            destroy: function () {
            }
        });
    }

    $scope.login = function (username, password) {

        console.log("!!!!!!!!!" + username + "....." + password);


        var data = {
            balance: 10,
            username: "navin"
        };

        this.newUser(data);


      //  $scope.errorMessage = "";
        // $http.post("/api/accounts/open/", {
        //     username: username,
        //     password: password
        // }).then(function (resp) {
        //     if (resp.data.success) {

        //         $http.post("/api/accounts/").then(function (response) {

        //             if(!(response.data.isMigrated) && response.data.isMigrated == 0){
        //                     //call function to create new account and do migration
        //                     $scope.newUser();
                           //    $scope.migrateData(resp.data);
        //             }else{
        //                     //throw error message that data already migrated
        //             }

        //         }, function (error) {
        //             $scope.errorMessage = error.data.error ? error.data.error : error.data;
        //         })
                
        //     } else {
        //         $scope.errorMessage = resp.data.error ? resp.data.error : 'Error connecting to ETPS server';
        //     }
        // }, function (error) {
        //     $scope.errorMessage = error.data.error ? error.data.error : error.data;
        // });


    }


}]);
