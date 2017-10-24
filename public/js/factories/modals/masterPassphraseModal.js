require('angular');

angular.module('ETPApp').factory('masterPassphraseModal', function (btfModal) {
    return btfModal({
        controller: 'masterPassphraseModalController',
        templateUrl: '/partials/modals/masterPassphraseModal.html'
    });
});
