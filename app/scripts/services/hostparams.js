'use strict';

/**
 * @ngdoc service
 * @name fypApp.hostparams
 * @description
 * # hostparams
 * Constant in the fypApp.
 */
angular.module('codelaborateApp')
	.constant('HOST_PARAMS', {
		clientHost 	: 'http://localhost:9000/',
		// clientHost 	: 'http://hosting.nicholasteock.github.io/web/codelaborate/#/',
		serverHost 	: 'http://localhost:8080/'
	});