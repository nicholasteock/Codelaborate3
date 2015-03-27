'use strict';

/**
 * @ngdoc function
 * @name fypApp.controller:SavepromptCtrl
 * @description
 * # SavepromptCtrl
 * Controller of the fypApp
 */
angular.module('codelaborateApp')
	.controller('SavepromptCtrl', ['$scope', '$modalInstance', function ($scope, $modalInstance) {
		$scope.ok = function () {
			$modalInstance.close($scope.selected.item);
		};

		$scope.cancel = function () {
			$modalInstance.dismiss('cancel');
		};
	}]);