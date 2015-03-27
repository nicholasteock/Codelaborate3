'use strict';

/**
 * @ngdoc function
 * @name codelaborateApp.controller:DashboardCtrl
 * @description
 * # DashboardCtrl
 * Controller of the codelaborateApp
 */
angular.module('codelaborateApp')
	.controller('DashboardCtrl', [
		'$rootScope',
		'$scope',
		'$http',
		'$q',
		'$firebase',
		'md5',
		'$routeParams',
		'Fireroom',
		'ServerSocket',
		'$modal',
		function ($rootScope, $scope, $http, $q, $firebase, md5, $routeParams, Fireroom, ServerSocket, $modal) {
			$scope.shareable 		= true;
			$scope.loading 			= true;
			$scope.loadingStatus 	= 'Working...';
			$scope.listeningForInput= false;
			$scope.settingsShown 	= false;
			$scope.chatShown 		= false;
			$scope.showUsers 		= false;
			$scope.fileHash 		= $routeParams.codeId;
			$scope.codeVersion 		= $routeParams.version;
			$scope.editorTheme 		= 'Monokai';
			$scope.editorThemes 	= {
				'Monokai' 	: 'ace/theme/monokai',
				'Twilight' 	: 'ace/theme/twilight',
				'Cobalt' 	: 'ace/theme/cobalt',
				'Chrome' 	: 'ace/theme/chrome',
				'Ambiance' 	: 'ace/theme/ambiance',
				'Chaos' 	: 'ace/theme/chaos',
				'Dawn' 		: 'ace/theme/dawn',
				'Terminal' 	: 'ace/theme/terminal'
			};
			$scope.editorLanguage 	= 'C++';
			$scope.editorLanguages 	= {
				'C' 		: 'ace/mode/c_cpp',
				'C++' 		: 'ace/mode/c_cpp',
				'Java' 		: 'ace/mode/java'
			};
			$scope.userId 		= 'Guest' + Math.floor(Math.random()*9000) + 1000;
			$scope.newUserId 	= $scope.userId;

			var room 				= $routeParams.codeId+'/'+$routeParams.version;
			var firepadRef 			= new Firebase('https://codelaborate-ace.firebaseio.com/'+room);
			var lastCursorPosition 	= {};

			var generateCompileAlias = function() {
				var d 			= new Date(),
					mdInput 	= $scope.fileHash + d.getTime().toString(),
					mdString 	= md5.createHash(mdInput);
				$scope.compileAlias = mdString.substr(0,9);
			};

			var compileCode = function(params) {
				return $q(function(resolve, reject) {
					$http.post('http://localhost:8080/compile', params).
					success(function(data, status, headers, config) {
						console.log('Success response : ', data);
						if(data.compileResult === 'success') {
							resolve(true);
						}
						else {
							reject(data.error);
						}
					}).
					error(function(data, status, headers, config) {
						console.log('Error response', data);
						reject(data);
					});
				});
			};

			$scope.editor 	= ace.edit('firepad');
			$scope.firepad 	= Firepad.fromACE(firepadRef, $scope.editor, {userId: $scope.userId});
			$scope.firepad.on('ready', function(e) {
			    $scope.changeEditorLanguage($scope.editorLanguage); // Set editor language
			    $scope.changeEditorTheme($scope.editorTheme); // Set editor theme
			    $scope.fireroom 		= Fireroom;
			    $scope.fireroom.users 	= Fireroom.users;
			    $scope.fireroom.chat 	= Fireroom.chat;
			    $scope.fireroom.initFire(room);
			    $scope.loading 			= false;
			});

			$scope.changeEditorLanguage = function(newLanguage) {
				$scope.editorLanguage = newLanguage;
				$scope.editor.getSession().setMode($scope.editorLanguages[newLanguage]);
			};

			$scope.changeEditorTheme = function(newTheme) {
				$scope.editorTheme = newTheme;
				$scope.editor.setTheme($scope.editorThemes[newTheme]);
			};

			$scope.updateUserId = function() {
				$scope.editUserId = false;
				if($scope.newUserId === '') {
					$scope.newUserId = $scope.userId;
					return;
				}
				if($scope.userId === $scope.newUserId) { return; }
				$scope.firepad.setUserId($scope.newUserId);
				$scope.userId = $scope.newUserId;
			};

			$scope.forkCode = function() {
				$scope.loadingStatus = 'Creating a new copy...';
				$scope.loading 			= true;
				var lines = $scope.editor.getValue();

				var newVersion 	= Number($scope.codeVersion) + 1;
				var fileHash 	= $scope.fileHash + '/' + newVersion;
				
				var ref      = new Firebase('https://codelaborate-ace.firebaseio.com/'+fileHash);
				var headless = new Firepad.Headless(ref);
				headless.setText(lines, function() {
					console.log('Done : ', fileHash);
					// window.location.hash = '#/'+fileHash;

					$window.open('http://localhost:9000/#/'+fileHash,'_blank');
					$scope.loading = false;
				});
			};

			$scope.downloadCode = function() {
				var lines = $scope.editor.getValue();
				if(lines.length === 0) {
					alert('Document is blank.');
					return;
				}
				var blob = new Blob([lines], {type: 'text/plain;charset=utf-8'});
				saveAs(blob, 'savedfile.txt');
			};

			// First make call to compile code. To catch compilation errors.
			// Upon successful compilation do we then connect socket and run code.
			$scope.runCode = function() {
				var code = $scope.editor.getValue();
				if(code === '') {
					alert('Cannot run an empty program.');
					return;
				}

				generateCompileAlias();

				var params = {
					code 		: code,
					language 	: $scope.editorLanguage,
					fileName 	: $scope.compileAlias
				};

				$scope.loadingStatus = 'Compiling Code...';
				$scope.loading = true; // Show loading overlay
				var compilePromise = compileCode(params);
				compilePromise.then(function(response) {
					console.log('compilePromise success : ', response);

					//Instantiate socket
					$scope.serverSocket = ServerSocket;
					$scope.serverSocket.socketFactory = ServerSocket.socketFactory;
					$scope.serverSocket.connect();

					$scope.loadingStatus = 'Running code...';
					$scope.loading = false;
					$scope.outputEditor.setReadOnly(false);
					$scope.outputEditor.getSession().setValue('==========PROCESS START==========\n');
					$scope.serverSocket.socketFactory.emit('execute', { fileName: $scope.compileAlias, language: $scope.editorLanguage});
				}, function(error) {
					$scope.loading = false;
					console.log('compilePromise error : ', error);
					$scope.outputEditor.setValue(error);
					$scope.outputEditor.setReadOnly(true);
					$scope.outputEditor.navigateFileEnd();
				});
			};

			$scope.outputAceLoaded = function(_editor) {
				$scope.outputEditor = _editor;
				$scope.outputEditor.setShowPrintMargin(false);
				$scope.outputEditor.getSession().setValue('This is the output terminal.\n\nClick \'Run\' to see your code in action right here.');
				$scope.outputEditor.setReadOnly(true);
			};

			$scope.outputAceChanged = function(e) {
				if(!$scope.listeningForInput) { return; }
				// $scope.listeningForInput = false; // Stop registering further inputs
				var data = e[0].data;
				if(!$scope.serverSocket) { return; }
				if(data.action==='insertText' && data.text==='\n') {
					var inputRowContent = $scope.outputEditor.getSession().getLine(lastCursorPosition.row);
					var inputContent = inputRowContent.substr(lastCursorPosition.column);
					lastCursorPosition = $scope.outputEditor.getCursorPosition();
					console.log('Input content sent : ', inputContent);
					console.log('Input content length : ', inputContent.length);
					$scope.serverSocket.socketFactory.emit('input', inputContent);
				}
			};

			// Outputs content passed from node server onto output editor.
			$scope.$on('socket:output', function (ev, data) {
				$scope.listeningForInput = false;
				console.log('DATA : ', data);
				$scope.outputEditor.navigateFileEnd();
				var insertAt = $scope.outputEditor.getCursorPosition();
				$scope.outputEditor.getSession().insert(insertAt,data);
				setTimeout(function() {
					lastCursorPosition = $scope.outputEditor.getCursorPosition();
					console.log('lastCursorPosition : ', lastCursorPosition);
					$scope.listeningForInput = true;
				}, 100);
			});

			$scope.$on('socket:complete', function(ev, data) {
				console.log('Disconnecting');
				$scope.outputEditor.navigateFileEnd();
				var insertAt = $scope.outputEditor.getCursorPosition();
				$scope.outputEditor.getSession().insert(insertAt,'\n==========PROCESS ENDED==========\n');
				$scope.outputEditor.setReadOnly(true);
				$scope.serverSocket.disconnect();
			});

			/***************************************************************************/
			// WHITEBOARD
			/***************************************************************************/
			// $scope.showWhiteboard = function() {
			// 	var modalInstance = $modal.open({
			// 		templateUrl   	: 'views/modals/whiteboard.html',
			// 		controller    	: 'WhiteboardCtrl',
			// 		backdrop      	: true,
			// 		backdropClass 	: 'modal-backdrop',
			// 		windowClass 	: 'whiteboard-modal'
			// 	});

			// 	modalInstance.opened.then(function() {
			// 		console.log('OPENDED');
			// 		// $rootScope.$broadcast('init_canvas');
			// 	});
			// };
		}
	]);
