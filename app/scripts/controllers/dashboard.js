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
		'HOST_PARAMS',
		'$http',
		'$q',
		'$firebase',
		'md5',
		'$routeParams',
		'Fireroom',
		'ServerSocket',
		'$modal',
		function ($rootScope, $scope, HOST_PARAMS, $http, $q, $firebase, md5, $routeParams, Fireroom, ServerSocket, $modal) {
			$scope.fireroom 		= Fireroom;
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
			
			$scope.editFilename = false;
			$scope.fileName 	= 'untitled';
			$scope.userId 		= 'Guest' + Math.floor(Math.random()*9000) + 1000;
			$scope.newUserId 	= $scope.userId;

			var room 				= $routeParams.codeId+'/'+$routeParams.version;
			var firepadRef 			= new Firebase('https://codelaborate-ace.firebaseio.com/'+room);
			var lastCursorPosition 	= {};

			var getFileExtension = function(language) {
				var extension = '';
				switch(language) {
					case 'C':
						extension = '.c';
						break;
					case 'C++':
						extension = '.cpp';
						break;
					case 'Java':
						extension = '.java';
						break;
				}
				return extension;
			};

			var generateCompileAlias = function() {
				var d 			= new Date(),
					mdInput 	= $scope.fileHash + d.getTime().toString(),
					mdString 	= md5.createHash(mdInput);
				$scope.compileAlias = mdString.substr(0,9);
			};

			var compileCode = function(params) {
				return $q(function(resolve, reject) {
					$http.post(HOST_PARAMS.serverHost+'compile', params).
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

			// Initialization. Checks if session exists first, before proceeding with editor, chat, wb inits.
			$scope.fireroom.verifyRoom(room, function(roomExists) {
				if(!roomExists) {
					window.location.hash = '#/roomnotfound';
					return;
				}
				else {
					$scope.editor 	= ace.edit('firepad');
					$scope.firepad 	= Firepad.fromACE(firepadRef, $scope.editor, {userId: $scope.userId});
					$scope.firepad.on('ready', function(e) {
					    $scope.changeEditorLanguage($scope.editorLanguage); // Set editor language
					    $scope.changeEditorTheme($scope.editorTheme); // Set editor theme
					    $scope.fireroom.users 	= Fireroom.users;
					    $scope.fireroom.chat 	= Fireroom.chat;
					    $scope.fireroom.initFire(room);
					    $scope.loading 			= false;
					});
				}
			});

			$scope.fireroom.getChildCount($scope.fileHash, function(childCount) {
				var temp = [];
				for(var i=0;i<childCount; i++) {
					temp.push(i);
				}
				$scope.childCount = temp;
			});

			$scope.changeFilename = function() {
				$scope.editFilename = !$scope.editFilename;
				firepadRef.update({'name': $scope.fileName});
			};

			$scope.changeEditorLanguage = function(newLanguage) {
				$scope.editorLanguage = newLanguage;
				$scope.editor.getSession().setMode($scope.editorLanguages[newLanguage]);
				firepadRef.update({'language': newLanguage});
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
				$scope.loadingStatus 	= 'Creating a new copy...';
				$scope.loading 			= true;

				$scope.fireroom.getChildCount($scope.fileHash, function(childCount) {
					var lines = $scope.editor.getValue();
					var fileHash 	= $scope.fileHash + '/' + childCount;

					var ref      = new Firebase('https://codelaborate-ace.firebaseio.com/'+fileHash);
					var headless = new Firepad.Headless(ref);

					ref.set({'name': $scope.fileName, 'language': $scope.editorLanguage});

					headless.setText(lines, function() {
						$scope.$apply(function() {
							$scope.loading=false;
						});
						window.open(HOST_PARAMS.clientHost+fileHash,'_blank');
					});
				});
			};

			$scope.downloadCode = function() {
				var lines = $scope.editor.getValue(),
					extension = getFileExtension($scope.editorLanguage);
				if(lines.length === 0) {
					alert('Document is blank.');
					return;
				}
				var blob = new Blob([lines], {type: 'text/plain;charset=utf-8'});
				saveAs(blob, $scope.fileName+extension);
			};

			$scope.changeVersion = function(version) {
				window.location.hash = '#/'+$routeParams.codeId+'/'+version;
			};

			// First make call to compile code. To catch compilation errors.
			// Upon successful compilation do we then connect socket and run code.
			$scope.runCode = function() {
				var code = $scope.editor.getValue();
				if(code === '') {
					alert('Cannot run an empty program.');
					return;
				}

				var modalInstance = $modal.open({
					templateUrl 	: 'views/modals/runsettings.html',
					controller 		: 'RunsettingsCtrl',
					backdrop 		: true,
					backdropClass 	: 'modal-backdrop',
					size 			: 'sm',
					resolve 		: {
						modalInfo: function() {
							return {
								fileExtension: getFileExtension($scope.editorLanguage),
								fileName: $scope.fileName
							};
						}
					}
				});

				modalInstance.result.then(function(runSettings) {
					console.log(runSettings);

					generateCompileAlias(); // Generate 'folder' for code

					var params = {
						code 		: code,
						language 	: $scope.editorLanguage,
						dirName 	: $scope.compileAlias,
						fileName 	: runSettings.fileName,
						arguments 	: runSettings.arguments,
						showWarnings: runSettings.showWarnings
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
						$scope.serverSocket.socketFactory.emit('execute', { 
							dirName 	: $scope.compileAlias,
							fileName 	: runSettings.fileName,
							language 	: $scope.editorLanguage,
							arguments 	: runSettings.arguments
						});
					}, function(error) {
						$scope.loading = false;
						console.log('compilePromise error : ', error);
						$scope.outputEditor.setValue(error);
						$scope.outputEditor.setReadOnly(true);
						$scope.outputEditor.navigateFileEnd();
					});
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

			$scope.launchChatroom = function() {
				
			}

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

			firepadRef.child('name').on('value', function(snapshot) {
				$scope.fileName = snapshot.val();
			});
			firepadRef.child('language').on('value', function(snapshot) {
				var language = snapshot.val();
				$scope.editorLanguage = language;
				$scope.editor.getSession().setMode($scope.editorLanguages[language]);
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
