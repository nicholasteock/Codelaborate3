'use strict';

/**
 * @ngdoc function
 * @name codelaborateApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the codelaborateApp
 */
angular.module('codelaborateApp')
	.controller('MainCtrl', ['$scope', 'HOST_PARAMS', '$http', '$q', '$firebase', 'md5', '$modal', 'ServerSocket', function ($scope, HOST_PARAMS, $http, $q, $firebase, md5, $modal, ServerSocket) {
		$scope.shareable 		= false;
		$scope.loading 			= false;
		$scope.loadingStatus 	= "Working...";
		$scope.listeningForInput= false;
		$scope.settingsShown 	= false;
		$scope.editorLanguage 	= 'Java';
		$scope.editorTheme 		= 'Monokai';
		$scope.editorThemes 	= {
			'Monokai' 	: "ace/theme/monokai",
			'Twilight' 	: "ace/theme/twilight",
			'Cobalt' 	: "ace/theme/cobalt",
			'Chrome' 	: "ace/theme/chrome",
			'Ambiance' 	: "ace/theme/ambiance",
			'Chaos' 	: "ace/theme/chaos",
			'Dawn' 		: "ace/theme/dawn",
			'Terminal' 	: "ace/theme/terminal"
		};
		$scope.editorLanguage 	= 'C++';
		$scope.editorLanguages 	= {
			'C' 		: 'ace/mode/c_cpp',
			'C++' 		: 'ace/mode/c_cpp',
			'Java' 		: 'ace/mode/java'
		};

		$scope.editFilename = false;
		$scope.fileName 	= 'untitled';

		var lastCursorPosition = {};

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

		var generateFileHash = function() {
			var d = new Date();
			var mdString 	= md5.createHash(d.getTime().toString());
			$scope.fileHash = mdString.substr(0,9);
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

		$scope.changeEditorLanguage = function(newLanguage) {
			$scope.editorLanguage = newLanguage;
			$scope.editor.getSession().setMode($scope.editorLanguages[newLanguage]);
		};

		$scope.changeEditorTheme = function(newTheme) {
			$scope.editorTheme = newTheme;
			$scope.editor.setTheme($scope.editorThemes[newTheme]);
		};

		$scope.showSavePrompt = function() {
			var modalInstance = $modal.open({
				templateUrl   : 'views/modals/saveprompt.html',
				controller    : 'SavepromptCtrl',
				backdrop      : true,
				backdropClass : 'modal-backdrop',
				size          : 'sm'
			});
		};

		$scope.aceLoaded = function(_editor) {
			$scope.editor 	= _editor;
			$scope.changeEditorLanguage($scope.editorLanguage); // Set editor language
		    $scope.changeEditorTheme($scope.editorTheme); // Set editor theme
			$scope.editor.getSession().setValue("Welcome to Codelaborate!\n\nCode your program right here, and click 'Run' to execute it right here!\n\nThe current language setting is: C++.\nChange that with the settings panel on the right.\n\nCodelaborate with your friends by clicking 'Save' and sharing the unique link given to you!\n\nHave fun!");
			generateFileHash();
		};

		$scope.aceChanged = function(e) {
		};

		$scope.saveCode = function() {
			var lines 		= $scope.editor.getValue(),
				firepadRef  = new Firebase('https://codelaborate-ace.firebaseio.com/'+$scope.fileHash+'/0'),
				headless 	= new Firepad.Headless(firepadRef);

			firepadRef.set({'name': $scope.fileName});

			headless.setText(lines, function() {
				window.location.hash = '#/'+$scope.fileHash+'/0';
			});
		};

		$scope.downloadCode = function() {
			var lines = $scope.editor.getValue();

			if(lines.length === 0) {
				alert('Document is blank.');
				return;
			}

			var blob = new Blob([lines], {type: "text/plain;charset=utf-8"});
			saveAs(blob, $scope.fileHash+".txt");
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

				$scope.loadingStatus = "Compiling Code...";
				$scope.loading = true; // Show loading overlay
				var compilePromise = compileCode(params);
				compilePromise.then(function(response) {
					console.log('compilePromise success : ', response);

					//Instantiate socket
					$scope.serverSocket = ServerSocket;
					$scope.serverSocket.socketFactory = ServerSocket.socketFactory;
					$scope.serverSocket.connect();

					$scope.loadingStatus = "Running code...";
					$scope.loading = false;
					$scope.outputEditor.setReadOnly(false);
					$scope.outputEditor.getSession().setValue('==========PROCESS START==========\n');
					$scope.serverSocket.socketFactory.emit('execute', { 
						dirName 	: $scope.compileAlias,
						fileName 	: runSettings.fileName,
						language 	: $scope.editorLanguage,
						arguments 	: runSettings.arguments,
						showWarnings: runSettings.showWarnings
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
			$scope.outputEditor.getSession().setValue("This is the output terminal.\n\nClick 'Run' to see your code in action right here.");
			$scope.outputEditor.setReadOnly(true);
		};

		$scope.outputAceChanged = function(e) {
			if(!$scope.listeningForInput) return;
			// $scope.listeningForInput = false; // Stop registering further inputs
			var data = e[0].data;
			if(!$scope.serverSocket) return;
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
}]);
