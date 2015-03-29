'use strict';

/**
 * @ngdoc overview
 * @name codelaborateApp
 * @description
 * # codelaborateApp
 *
 * Main module of the application.
 */
angular
  .module('codelaborateApp', [
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'angular-md5',
    'ui.ace',
    'ui.bootstrap',
    'firebase',
    'btford.socket-io'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/:codeId/:version', {
        templateUrl: 'views/dashboard.html',
        controller: 'DashboardCtrl'
      })
      .when('/roomnotfound', {
        templateUrl: 'views/roomnotfound.html'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
