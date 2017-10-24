require('angular');

angular.module('ETPApp').factory('multiMembersModal', function (btfModal) {
    return btfModal({
        controller: 'multiMembersModalController',
        templateUrl: '/partials/modals/multiMembersModal.html'
    });
});
