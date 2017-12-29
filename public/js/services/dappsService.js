require('angular');

angular.module('ETPApp').service('dappsService', function () {

    var dapp = {
        searchForDapp: '',
        searchForDappGlobal: ''
    }

    return dapp;

});
