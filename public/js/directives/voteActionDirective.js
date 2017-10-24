require('angular');

angular.module('ETPApp').directive('voteAction', function (gettextCatalog) {
    return {
        restrict: 'A',
        scope: {
            adding: '=adding'
        },
        link: function (scope, element, attrs) {
            if (scope.adding) {
                element[0].value = gettextCatalog.getString('CONFIRM VOTE');
            } else {
                element[0].value = gettextCatalog.getString('REMOVE VOTE');
            }
        }
    };
});
