'use strict';

/**
 * @ngdoc function
 * @name fypApp.controller:WhiteboardCtrl
 * @description
 * # WhiteboardCtrl
 * Controller of the fypApp
 */
angular.module('codelaborateApp')
	.controller('WhiteboardCtrl', ['$scope', 'Fireroom', 'WhiteboardFactory', function ($scope, Fireroom, WhiteboardFactory) {
var startWatching = false;
		var canvas,
			context,
			backgroundImage,
			offsetY = 90,  // mouse cursor offset
			offsetX = 40,  // mouse cursor offset
			points = [],
			mouseDown = false,
			startPos = { x: 0, y: 0 },
			endPos = { x: 0, y: 0 };

		$scope.colorOptions = [
			'#000000',
			'#ffffff',
			'#0000ff',
			'#00ffff',
			'#ff0000',
			'#00ff00',
			'#ffff00',
			'#ff00ff',
			'#888888'
		];

		canvas = document.getElementById('whiteboard-canvas');
		context = canvas.getContext('2d');
		// console.log('init : ', canvas);
		// console.log('init : ', context);

		$scope.lineWidth = 5;
		$scope.tool = 'pencil';
		$scope.fillShape = false;
		$scope.opaqueMode = false;
		$scope.lineColor = '#000000';
		$scope.fillColor = '#000000';

		$scope.fireroom = Fireroom;
		$scope.fireroom.wb = Fireroom.wb;

		$scope.whiteboardFactory = WhiteboardFactory;
		$scope.whiteboardFactory.setCanvas(canvas);
		$scope.whiteboardFactory.setContext(context);

		$scope.$on('wb_done', function(event) {
			console.log('wb_done. buffer : ', $scope.fireroom.wb);

			// $scope.whiteboardFactory.setBuffer($scope.fireroom.wb);
			$scope.whiteboardFactory.initBuffer();
			setTimeout( function() {
				$scope.whiteboardFactory.renderAll();
			}, 300);

			startWatching = true;
		});

		var renderPath = function (data) {
			if ($scope.tool === 'rectangle' || $scope.tool === 'line' || $scope.tool === 'circle') {
				$scope.whiteboardFactory.renderAll();
			}

			$scope.whiteboardFactory.render(data);
		};

		var createRenderObject = function () {
			var data,
				pointsLength;

			pointsLength = points.length;

			switch ($scope.tool) {
				case 'pencil':
					data = {
						ToolName: 'pencil',
						LineWidth: $scope.lineWidth,
						Points: points,
						Color: $scope.lineColor
					};
					break;

				case 'line':
					data = {
						ToolName: 'line',
						LineColor: $scope.lineColor,
						LineWidth: $scope.lineWidth,
						StartX: startPos.x,
						StartY: startPos.y,
						EndX: endPos.x,
						EndY: endPos.y
					};
					break;

				case 'rectangle':
					data = {
						ToolName: 'rectangle',
						LineColor: $scope.lineColor,
						FillColor: $scope.fillColor,
						LineWidth: $scope.lineWidth,
						StartX: startPos.x,
						StartY: startPos.y,
						Width: endPos.x - startPos.x,
						Height: endPos.y - startPos.y,
						FillShape: $scope.fillShape
					};
					break;

				case 'circle':
					data = {
						ToolName: 'circle',
						LineColor: $scope.lineColor,
						FillColor: $scope.fillColor,
						LineWidth: $scope.lineWidth,
						StartX: startPos.x,
						StartY: startPos.y,
						Radius: (Math.abs(endPos.x - startPos.x) + (Math.abs(endPos.y - startPos.y)) / 2),
						FillShape: $scope.fillShape
					};
					break;

				default:
					console.log('createRenderObject: unkown tool');
					data = {};
					break;
			}

			return data;
		};

		$scope.mousedown = function (e) {
			console.log('mouse down');
			var data;

			points.push({
				x: (e.pageX - canvas.offsetLeft) - offsetX,
				y: (e.pageY - canvas.offsetTop) - offsetY,
				color: $scope.lineColor
			});			

			mouseDown = true;

			startPos.x = points[0].x;
			startPos.y = points[0].y;
			endPos.x = points[0].x;
			endPos.y = points[0].y;

			data = createRenderObject();
			renderPath(data);
		};

		$scope.mousemove = function (e) {
			console.log('mouse move');
			var x, y, lastPoint, data;

			if (mouseDown) {
				x = (e.pageX - canvas.offsetLeft) - offsetX;
				y = (e.pageY - canvas.offsetTop) - offsetY;

				points.push({
					x: x,
					y: y,
					color: $scope.lineColor
				});
				
				lastPoint = points[points.length - 1];
				endPos.x = lastPoint.x;
				endPos.y = lastPoint.y;

				data = createRenderObject();
				renderPath(data);				
			}			
		};

		$scope.mouseup = function (e) {
			console.log('mouse up');
			var data;

			mouseDown = false;
			data = createRenderObject();
			$scope.whiteboardFactory.addToBuffer(data);
			console.log('mouseup : ', $scope.whiteboardFactory.buffer);

			points = [];
			startPos.x = 0;
			startPos.y = 0;
			endPos.x = 0;
			endPos.y = 0;
		};

		$scope.makeOpaque = function(mode) {
			$scope.opaqueMode = mode;
		};

		$scope.changeLineColor = function(color) {
			$scope.lineColor = color;
		};

		$scope.changeFillColor = function(color) {
			$scope.fillColor = color;
		};

		$scope.changeTool = function(tool) {
			$scope.tool = tool;
		};

		$scope.toggleFillShape = function() {
			$scope.fillShape = !$scope.fillShape;
		};

		$scope.isToolNameSelected = function () {
			var i;

			for (i = 0; i < arguments.length; i++) {
				if (arguments[i] === $scope.tool) {
					return true;
				}
			}

			return false;
		};

		$scope.changeLineWidth = function (size) {
			$scope.lineWidth = Number(size);
		};

		$scope.changeColorTarget = function (target) {
			$scope.colorTarget = target;
		};

		$scope.undo = function () {
			$scope.whiteboardFactory.undo();
			$scope.whiteboardFactory.renderAll();

			points = [];
			startPos.x = 0;
			startPos.y = 0;
			endPos.x = 0;
			endPos.y = 0;
		};

		$scope.$on('wb_child_added', function() {
			if(!startWatching) return;
			console.log('wb_child_added');
			setTimeout(function() {
				$scope.whiteboardFactory.renderAll();
			}, 300);
		});

		$scope.$on('wb_child_changed', function() {
			if(!startWatching) return;
			console.log('wb_child_changed');
			setTimeout(function() {
				$scope.whiteboardFactory.renderAll();
			}, 300);
		});

		$scope.$on('wb_child_removed', function() {
			if(!startWatching) return;
			console.log('wb_child_removed');
			setTimeout(function() {
				$scope.whiteboardFactory.renderAll();
			}, 300);
		});


	}]);
