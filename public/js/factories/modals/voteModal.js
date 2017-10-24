require('angular');

angular.module('ETPApp').factory('voteModal', function (btfModal) {
    return btfModal({
        controller: 'voteController',
        templateUrl: '/partials/modals/vote.html'
    });
});
