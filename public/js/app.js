require('angular');
require('angular-ui-router');
require('angular-resource');
require('angular-filter');
require('angular-cookies');
require('browserify-angular-animate');
require('../node_modules/angular-animate/angular-animate.js')
require('../node_modules/angular-gettext/dist/angular-gettext.min.js');
require('../node_modules/angular-chart.js/dist/angular-chart.js');
require('../node_modules/angular-socket-io/socket.js');
require('../node_modules/ng-table/dist/ng-table.js');
require('../node_modules/elasticsearch-browser/elasticsearch.angular.min.js');


Mnemonic = require('bitcore-mnemonic');

ETPApp = angular.module('ETPApp', ['ui.router', 'btford.modal', 'ngCookies', 'ngTable', 'ngAnimate', 'chart.js', 'btford.socket-io', 'ui.bootstrap', 'angular.filter', 'gettext', 'elasticsearch']);

ETPApp.config([
    "$locationProvider",
    "$stateProvider",
    "$urlRouterProvider",
    function ($locationProvider, $stateProvider, $urlRouterProvider) {
        $locationProvider.html5Mode(true);
        $urlRouterProvider.otherwise("/");

        // Now set up the states
        $stateProvider
            .state('main', {
                abstract: true,
                templateUrl: "/partials/template.html",
                controller: "templateController"
            })
            .state('main.dashboard', {
                url: "/dashboard",
                templateUrl: "/partials/account.html",
                controller: "accountController"
            })
            .state('main.explorer', {
                url: "/explorer",
                templateUrl: "/partials/explorer.html",
                controller: "explorerController"
            })
            .state('main.stake', {
                url: "/stake",
                templateUrl: "/partials/stake.html",
            	controller: "stakeController"
            })
            .state('main.settings', {
                url: "/settings",
                templateUrl: "/partials/settings.html",
                controller: "settingsController"
            })
            .state('main.transactions', {
                url: "/transactions",
                templateUrl: "/partials/transactions.html",
                controller: "transactionsController"
            })
            .state('main.delegates', {
                url: "/delegates",
                templateUrl: "/partials/delegates.html",
                controller: "delegatesController"
            })
            .state('main.votes', {
                url: "/delegates/votes",
                templateUrl: "/partials/votes.html",
                controller: "votedDelegatesController"
            })
            .state('main.forging', {
                url: "/forging",
                templateUrl: "/partials/forging.html",
                controller: "forgingController"
            })
            .state('main.blockchain', {
                url: "/blockchain",
                templateUrl: "/partials/blockchain.html",
                controller: "blockchainController"
            })
            .state('existingETPSUser', {
                url: "/existingETPSUser",
                templateUrl: "/partials/existing-etps-user.html",
                controller: "existingETPSUserController"
            })
            .state('passphrase', {
                url: "/login",
                templateUrl: "/partials/passphrase.html",
                controller: "passphraseController"
            })
            .state('loading', {
                url: "/",
                templateUrl: "/partials/loading.html"
            });
    }
]).run(function (languageService, clipboardService, $rootScope, $state, AuthService, $timeout) {
    languageService();
    clipboardService();
    $rootScope.$state = $state;

    $rootScope.defaultLoaderScreen = false;
    // render current logged-in user upon page refresh if currently logged-in
    AuthService.getUserStatus()
    .then(function () {
        if (AuthService.isLoggedIn()) {
             $timeout(function(){
                    $state.go('main.dashboard');
            },1000);
        } else {
            $timeout(function(){
                $state.go('passphrase');
        },1000);          
        }
    });
    
    // user authentication upon page forward/back for currently logged-in user
    $rootScope.$on('$stateChangeStart', function (e, toState, toParams, fromState, fromParams) {
        AuthService.getUserStatus()
        .then(function () {
            if(toState.url == '/existingETPSUser'){
                $state.go('existingETPSUser');
            }else{
                if (AuthService.isLoggedIn()) {
                    $state.go(toState.name);
                } else {
                    $state.go('passphrase');
                }
            } 
        });
    }); 
});
