'use strict';

/**
 * @ngdoc function
 * @name fypApp.controller:SettingspanelCtrl
 * @description
 * # SettingspanelCtrl
 * Controller of the fypApp
 */
angular.module('codelaborateApp')
	.controller('SettingsPanelCtrl', ['$scope', function ($scope) {
		$scope.editUserId 		= false;

		$scope.useridKeyPressed = function($event) {
			if($event.charCode === 13) {
				$scope.editUserId = false;
				$scope.updateUserId($scope.newUserId);
			}
		};
	}])
	.directive('settingsPanel', function() {
  		return {
  			templateUrl: 'views/settingspanel.html'
  		};
	});
