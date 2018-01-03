require('angular');

angular.module('ETPApp').factory('passphraseCheck', function (btfModal) {
    return btfModal({
        controller: 'passphraseCheckController',
        templateUrl: '/partials/modals/passphraseCheck.html'
    });
});
