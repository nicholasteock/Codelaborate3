'use strict';

/**
 * @ngdoc function
 * @name fypApp.controller:CallCtrl
 * @description
 * # CallCtrl
 * Controller of the fypApp
 */
angular.module('codelaborateApp')
	.controller('CallCtrl', ['$scope', '$routeParams', function ($scope, $routeParams) {
		var skylink = new Skylink();
		var audioStream;
		var videoStream;

		skylink.on('peerJoined', function(peerId, peerInfo, isSelf) {
			console.log('peerJoined : ', peerId);
			if(isSelf) {
				return; // We already have a video element for our video and don't need to create a new one.
			}
			var vid = document.createElement('video');
			vid.autoplay = true;
			// vid.muted = true; // Added to avoid feedback when testing locally
			vid.id = peerId;
			document.body.appendChild(vid);
		});

		skylink.on('incomingStream', function(peerId, stream, isSelf) {
			console.log('incomingStream : ', peerId);
			if(isSelf) {
				$('.chatctrl').removeClass('hide');
				$scope.audioEnabled = true;
				$scope.videoEnabled = true;
				videoStream = stream.getVideoTracks();
				audioStream = stream.getAudioTracks();
				return;
			}
			var vid = document.getElementById(peerId);
			attachMediaStream(vid, stream);
		});

		skylink.on('peerLeft', function(peerId) {
			console.log('peerLeft : ', peerId);
			var vid = document.getElementById(peerId);
			document.body.removeChild(vid);
		});

		skylink.on('mediaAccessSuccess', function(stream) {
			console.log('mediaAccessSuccess');
			var vid = document.getElementById('myvideo');
			attachMediaStream(vid, stream);
		});

		skylink.on('mediaAccessStopped', function() {
			console.log('mediaAccessStopped');
			$('.btn-call').removeClass('hide');
			$('.chatctrl').addClass('hide');
		});
		
		skylink.on('mediaAccessError', function() {
			console.log('mediaAccessError');
			$('.btn-call').removeClass('hide');
			$('.chatctrl').addClass('hide');
		});

		skylink.init({
			apiKey: '86689a8d-4a49-48de-90aa-00875ccc64c1',
			defaultRoom: $routeParams.codeId+$routeParams.version
		});

		$scope.startCall = function(event) {
			// event.target.style.display = 'none';
			$('.btn-call').addClass('hide');

			skylink.joinRoom({
				audio: true,
				video: true
			});
		};

		$scope.enableVideo = function() {
			// console.log("enableVideo");
			$scope.videoEnabled = true;
			videoStream[0].enabled = true;
		};

		$scope.enableAudio = function() {
			// console.log("enableVideo");
			$scope.audioEnabled = true;
			audioStream[0].enabled = true;
		};

		$scope.disableVideo = function() {
			// console.log("disableVideo");
			$scope.videoEnabled = false;
			videoStream[0].enabled = false;
		};

		$scope.disableAudio = function() {
			// console.log("disableVideo");
			$scope.audioEnabled = false;
			audioStream[0].enabled = false;
		};
	}]);
