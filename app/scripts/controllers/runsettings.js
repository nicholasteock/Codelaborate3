'use strict';

/**
 * @ngdoc function
 * @name fypApp.controller:FilenamepromptCtrl
 * @description
 * # FilenamepromptCtrl
 * Controller of the fypApp
 */
angular.module('codelaborateApp')
	.controller('RunsettingsCtrl', ['$scope', '$modalInstance', 'modalInfo', function ($scope, $modalInstance, modalInfo) {
		$scope.fileExtension = modalInfo.fileExtension;
		$scope.fileName = modalInfo.fileName;
		$scope.argumentsArray = ['test'];
		$scope.newArgument = '';

		$scope.addArg = function() {
			if($scope.newArgument === '') return;
			$scope.argumentsArray.push($scope.newArgument);
			$scope.newArgument = '';
		};

		$scope.removeArg = function(index) {
			$scope.argumentsArray.splice(index, 1);
		};

		$scope.ok = function() {
			var runSettings = {
				fileName: $scope.fileName,
				arguments: $scope.argumentsArray
			};
			$modalInstance.close(runSettings);
		};

		$scope.cancel = function() {
			$modalInstance.dismiss('cancel');
		};
	}]);
