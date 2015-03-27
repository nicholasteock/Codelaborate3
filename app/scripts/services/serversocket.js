'use strict';

/**
 * @ngdoc service
 * @name fypApp.serverSocket
 * @description
 * # serverSocket
 * Factory in the fypApp.
 */
angular.module('codelaborateApp')
	.factory('ServerSocket', function (socketFactory) {
		var ioSocketPath = 'http://localhost:8080/run';

		var serverSocket = {};
		serverSocket.socketFactory = {};

		serverSocket.connect = function() {
			serverSocket.socketFactory = socketFactory({
				ioSocket: io(ioSocketPath, {'forceNew': true})
			});
			serverSocket.socketFactory.forward('output');
			serverSocket.socketFactory.forward('complete');
		};

		serverSocket.disconnect = function() {
			console.log('serverSocket disconnect');
			serverSocket.socketFactory.emit('disconnect', null, function() {
				serverSocket.socketFactory.disconnect(true);
			});
		};

		return serverSocket;
	});
