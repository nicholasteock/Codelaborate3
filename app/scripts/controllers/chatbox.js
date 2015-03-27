'use strict';

/**
 * @ngdoc function
 * @name fypApp.controller:ChatboxCtrl
 * @description
 * # ChatboxCtrl
 * Controller of the fypApp
 */
angular.module('codelaborateApp')
	.controller('ChatboxCtrl', ['$scope', 'Fireroom', function ($scope, Fireroom) {
		// Link up with factory.
		$scope.fireroom = Fireroom;
		$scope.fireroom.chat = Fireroom.chat;
		$scope.fireroom.users = Fireroom.users;

		$scope.inputMessage = "";

		$scope.chatKeyPressed = function($event) {
			if($event.charCode === 13) {
				$scope.sendMessage();
			}
		};

		$scope.sendMessage = function() {
			if($scope.inputMessage.length === 0) return; // Empty message.
			$scope.fireroom.chat.$add({from: $scope.userId, content: $scope.inputMessage});
      		$scope.inputMessage = "";
		};
	}])
	.directive('chatBox', function() {
		return {
			templateUrl: 'views/chatbox.html',
		};
	});
