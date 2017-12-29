require('angular');

angular.module('ETPApp').factory('secondPassphraseModal', function (btfModal) {
    return btfModal({
        controller: 'secondPassphraseModalController',
        templateUrl: '/partials/modals/secondPassphraseModal.html'
    });
});
