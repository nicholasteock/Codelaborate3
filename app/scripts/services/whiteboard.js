'use strict';

/**
 * @ngdoc service
 * @name fypApp.whiteboard
 * @description
 * # whiteboard
 * Factory in the fypApp.
 */
angular.module('codelaborateApp')
	.factory('WhiteboardFactory', ['Fireroom', function (Fireroom) {

		var whiteboardFactory = {};
		whiteboardFactory.buffer = [];

		whiteboardFactory.initBuffer = function() {
			whiteboardFactory.buffer = Fireroom.wb;
			// console.log('initBuffer : ', whiteboardFactory.buffer);
			return;
		};

		whiteboardFactory.setContext = function (ctx) {
			// console.log('set context : ', ctx);
			whiteboardFactory.context = ctx;
		};

		whiteboardFactory.renderPencil = function (data) {
			var i;

			whiteboardFactory.context.beginPath();
			whiteboardFactory.context.lineCap = 'round';
			whiteboardFactory.context.strokeStyle = data.Color;
			whiteboardFactory.context.lineWidth = data.LineWidth;
			whiteboardFactory.context.moveTo(data.Points[0].x, data.Points[0].y);
			for (i = 0; i < data.Points.length; i++) {
				whiteboardFactory.context.lineTo(data.Points[i].x, data.Points[i].y);
			}
			whiteboardFactory.context.stroke();
		};

		whiteboardFactory.renderLine = function (data) {
			whiteboardFactory.context.beginPath();
			whiteboardFactory.context.strokeStyle = data.LineColor;
			whiteboardFactory.context.lineWidth = data.LineWidth;
			whiteboardFactory.context.lineCap = 'round';
			whiteboardFactory.context.moveTo(data.StartX, data.StartY);
			whiteboardFactory.context.lineTo(data.EndX, data.EndY);
			whiteboardFactory.context.stroke();
		};

		whiteboardFactory.renderRectangle = function (data) {
			whiteboardFactory.context.beginPath();
			whiteboardFactory.context.strokeStyle = data.LineColor;
			whiteboardFactory.context.fillStyle = data.FillColor;
			whiteboardFactory.context.lineWidth = data.LineWidth;
			whiteboardFactory.context.rect(data.StartX, data.StartY, data.Width, data.Height);

			if (data.FillShape) {
				whiteboardFactory.context.fill();
			}
			
			whiteboardFactory.context.stroke();
		};

		whiteboardFactory.renderCircle = function (data) {
			whiteboardFactory.context.beginPath();
			whiteboardFactory.context.strokeStyle = data.LineColor;
			whiteboardFactory.context.fillStyle = data.FillColor;
			whiteboardFactory.context.lineWidth = data.LineWidth;
			whiteboardFactory.context.arc(data.StartX, data.StartY, data.Radius, 0, Math.PI * 2, false);

			if (data.FillShape) {
				whiteboardFactory.context.fill();
			}

			whiteboardFactory.context.stroke();
		};

		whiteboardFactory.renderAll = function () {
			// console.log('in renderAll', whiteboardFactory.buffer);

			var buffer = whiteboardFactory.buffer;

			whiteboardFactory.context.clearRect(0, 0, whiteboardFactory.canvas.width, whiteboardFactory.canvas.height);
			// console.log('BUFFER : ', buffer);
			angular.forEach(buffer, function(record) {
				// console.log('RECORD : ', record);
				switch (record.ToolName) {
					case 'pencil':
						whiteboardFactory.renderPencil(record);
						break;
					case 'rectangle':
						whiteboardFactory.renderRectangle(record);
						break;
					case 'circle':
						whiteboardFactory.renderCircle(record);
						break;
					case 'line':
						whiteboardFactory.renderLine(record);
						break;
					// case 'image':
					// 	renderImage(record);
					// 	break;
				}
			});
		};

		whiteboardFactory.setBuffer = function(input) {
			// console.log('In set buffer : ', input);
			whiteboardFactory.buffer = input;
		};

		whiteboardFactory.addToBuffer = function (data) {
			// console.log(data);
			whiteboardFactory.buffer.$add(data);
			// whiteboardFactory.buffer.push(data);
			// buffer.$add(data);
		};

		whiteboardFactory.render = function (data) {
			switch (data.ToolName) {
				case 'pencil':
					whiteboardFactory.renderPencil(data);
					break;
				case 'rectangle':
					whiteboardFactory.renderRectangle(data);
					break;
				case 'circle':
					whiteboardFactory.renderCircle(data);
					break;
				case 'line':
					whiteboardFactory.renderLine(data);
					break;
				// case 'image':
				// 	renderImage(data);
				// 	break;
			}
		};

		whiteboardFactory.setCanvas = function(cv) {
			whiteboardFactory.canvas = cv;
		};

		whiteboardFactory.undo = function () {
			whiteboardFactory.buffer.pop();   
		};

		whiteboardFactory.clearAll = function() {
			Fireroom.clearWb();
		};

		return whiteboardFactory;
	}]);