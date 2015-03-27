'use strict';

/**
 * @ngdoc service
 * @name fypApp.fireroom
 * @description
 * # fireroom
 * Factory in the fypApp.
 */
angular.module('codelaborateApp')
	.factory('Fireroom', ['$rootScope', '$firebase', function ($rootScope, $firebase) {
		
		var fireroom = {};

		fireroom.users 	= [];
		fireroom.chat 	= [];
		fireroom.wb 	= [];

		fireroom.initFire = function(room) {
			var usersRef 	= new Firebase('https://codelaborate-ace.firebaseio.com/'+room+'/users');
			fireroom.users 	= $firebase(usersRef).$asArray();

			var chatRef 	= new Firebase('https://codelaborate-chat.firebaseio.com/'+room);
			fireroom.chat 	= $firebase(chatRef).$asArray();

			var wbRef 		= new Firebase('https://codelaborate-wb.firebaseio.com/'+room);
			fireroom.wb 	= $firebase(wbRef).$asArray();

			wbRef.once('value', function() {
				$rootScope.$broadcast('wb_done', wbRef);
			});

			wbRef.on('child_added', function() {
				$rootScope.$broadcast('wb_child_added');
			});
			wbRef.on('child_changed', function() {
				$rootScope.$broadcast('wb_child_changed');
			});
			wbRef.on('child_removed', function() {
				$rootScope.$broadcast('wb_child_removed');
			});
			// $rootScope.$broadcast('initfire-done');
			// console.log('Checking factory...');
			// console.log('Users : ', fireroom.users);
			// console.log('Chat : ', fireroom.chat);
		};

		return fireroom;
	}]);
