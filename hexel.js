/* 
	hexelgrid

	The MIT License (MIT)

	Copyright (c) 2013 Nicholas Ortenzio 

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.

*/

$(function () {

	/*** DOM ELEMENTS ***/

	var DOM = {};

	/*** SETTINGS ***/

	var hexel = {
		color: "#aaaaaa",
		stroke: "#333333",
		sin : [],
		cos : [],
		shouldDraw : false
	};



	/*** HELPERS ***/

	var calculateColumn = function (pos) {
		
		return Math.floor(pos.x/hexel.period);
	};

	var calculateRow = function (pos, col) {
		var isOddCol = !!(col%2);
		var row = (isOddCol) ? Math.floor((pos.y + hexel.apothem)/hexel.height) : Math.floor(pos.y/hexel.height);

		return row
	};

	var calculateInside = function (pos) {
		var mod = pos.x % hexel.period;
		return !!(mod>hexel.edge);
	};

	var calculateHexCenter = function (row, col) {
		var pos = { x: 0, y: 0};
		var isOddCol = !!(col%2);

		pos.x = (col * hexel.period) + hexel.radius;
		pos.y = (isOddCol) ? (row * hexel.height) : (row * hexel.height) + hexel.apothem;

		return pos;
	};

	var calculateSweep = function (m) {
		var x = m.center.x - m.pos.x;
		var y = m.center.y - m.pos.y;
		m.sweep = Math.sqrt((x*x) + (y*y));
	};

	var adjustOutsideCenter = function (m) {
		var isNegative = (m.center.y < m.pos.y);

		if (isNegative) {
			m.row = (m.isOdd) ? m.row : m.row+1;
		} else {
			m.row = (m.isOdd) ? m.row-1 : m.row;
		}

		m.col -= 1;

		// recalculate center
		m.center = calculateHexCenter(m.row, m.col);
	};

	var convertMouseCoordinates = function(e) {
		var m = {};

		m.e = e;
		m.pos = { x: e.offsetX, y: e.offsetY };
		m.col = calculateColumn(m.pos);
		m.isOdd = !!(m.col%2);
		m.row = calculateRow(m.pos, m.col);
		m.isInside = calculateInside(m.pos);
		m.center = calculateHexCenter(m.row, m.col);

		// todo: if !isInside, use different detection
		// algorithm to more accurately determine
		// row and columns of "unsafe" areas
		if (!m.isInside) {

			// find distance between hex center and click coordinates
			calculateSweep(m);
			
			// if distance is less than the hex apothem
			// center can remain the same
			// else if distance great than the hex radius
			// adjust column col-=1 always
			// adjust row depending on slope being negative or positive and row even or odd
			if (m.sweep < hexel.apothem) {
				m.isInside = true;
			} else if (m.sweep > hexel.radius) {
				m.isInside = true;
				adjustOutsideCenter(m);
			} else {
				// do nothing
			}

		};


		return m;
	};



	/*** DRAWING ***/

	var drawHexagon = function (pos) {
		var ctx = DOM.ctxCanvas;

		ctx.beginPath();
		ctx.moveTo(pos.x + hexel.cos[0], pos.y + hexel.sin[0]);

		for (var i=1; i<=6; i+=1) {
		    ctx.lineTo(pos.x + hexel.cos[i], pos.y + hexel.sin[i]);
		}

		// just draw outlines for testing
		ctx.fillStyle = hexel.color;
		ctx.lineHeight = 0;
		ctx.fill();
	};

	var drawCirclegon = function (pos) { 
		var ctx = DOM.ctxCanvas;

		ctx.beginPath();
		ctx.moveTo(pos.x + hexel.cos[0], pos.y + hexel.sin[0]);

		for (var i=1; i<=6; i+=1) {
		    ctx.lineTo(pos.x + hexel.cos[i], pos.y + hexel.sin[i]);
		}

		// just draw outlines for testing
		ctx.fillStyle = "#000000";
		ctx.lineHeight = 0;
		ctx.fill();

		ctx.beginPath();
		ctx.arc(pos.x, pos.y, hexel.radius/2, 0,Math.PI*2,true);
		ctx.fillStyle = hexel.color;
		ctx.lineHeight = 0;
		ctx.fill();
	};

	var drawHexagonOutline = function (pos) {
		var ctx = DOM.ctxGrid;

        ctx.clearRect(0, 0, grid.width, grid.height);
		ctx.beginPath();
		ctx.moveTo(pos.x + hexel.cos[0], pos.y + hexel.sin[0]);
		for (var i=1; i<=6; i+=1) {
		    ctx.lineTo(pos.x + hexel.cos[i], pos.y + hexel.sin[i]);
		}
		ctx.lineWidth = 1;
		ctx.strokeStyle = hexel.stroke;
		ctx.stroke();
	};

	var drawCircleOutline = function (pos, radius) {
		var ctx = DOM.ctxGrid;

		ctx.beginPath();
		ctx.arc(pos.x, pos.y, radius, 0,Math.PI*2,true);
		ctx.lineWidth = 1;
		ctx.strokeStyle = "#FF0000";
		ctx.stroke();
	};



	/*** UI EVENTS ***/

	var onCanvasMouseDown = function (e) {
		e.stopPropagation();
		e.preventDefault();

		hexel.shouldDraw = true;

		var mouse = convertMouseCoordinates(e);

		// eventually we shouldnt need this
		if (!mouse.isInside) {
			return;
		}

		drawCirclegon(mouse.center);		
	};

	var onCanvasMouseMove = function (e) {
		var mouse = convertMouseCoordinates(e);

		// eventually we shouldnt need this
		if (!mouse.isInside) {		
			return;
		}

		drawHexagonOutline(mouse.center);
		// drawCircleOutline(mouse.center, hexel.radius);
		// drawCircleOutline(mouse.center, hexel.apothem);


		if (hexel.shouldDraw) {
			drawCirclegon(mouse.center);
		}
	};

	var onCanvasMouseUp = function (e) {
		e.stopPropagation();
		e.preventDefault();

		hexel.shouldDraw = false;		
	};

	var onSwatchClick = function (e) {
		e.preventDefault();

		DOM.$swatches.removeClass('selected');
		hexel.color = $(this).addClass('selected').attr("value");
	};



	/*** INIT ***/

	var initHexelProperties = function (side) {

		var sqrt3 = Math.sqrt(3);
		var rad = Math.PI/180;
		var thirdpi = Math.PI / 3;

		hexel.side = side;
		hexel.radius = side;
		hexel.apothem = Math.cos(30 * rad) * hexel.side;		
		hexel.height = 2 * hexel.apothem;
		hexel.width = 2 * hexel.radius;
		hexel.edge = Math.sin(30 * rad) * hexel.side;
		hexel.period = hexel.width - hexel.edge;

		for (var i=0; i<7; ++i) {
			var ipi = i * thirdpi;
			hexel.cos[i] = hexel.side * Math.cos(ipi);
			hexel.sin[i] = hexel.side * Math.sin(ipi);
		}
	};
 
	var initCanvasLayout = function () {
		var x = 0;
		var y = 0;
		var i = 0;
		var height = DOM.$canvas.height();
		var width = DOM.$canvas.width();
		var c;
		var colors = [
			["#eeeeee", "#dddddd"],
			["#eecccc", "#ddaaaa"]
		];
		var ctx = DOM.ctxCanvas;
		
		while (x < width) {
			x = hexel.period * i;

			c = !!(i%2) ? colors[0] : colors[1];

			ctx.fillStyle = c[0];
			ctx.fillRect(x, 0, hexel.edge, height);
			ctx.fillStyle = c[1];
			ctx.fillRect(x+hexel.edge, 0, hexel.width-hexel.edge, height);

			i+=1;			
		}
	};

	var initSwatches = function () {
		DOM.$swatches.click(onSwatchClick).eq(0).click();
		$.each(DOM.$swatches, function(i,n) { 
			var $this = $(this);
			var val = $this.attr("value");
			$this.css("background", val);
		});
	};

	var initDOM = function () {
		DOM.$main = $("#main")
		DOM.$canvas = $("#canvas");	
		DOM.$grid = $("#grid");
		DOM.$swatches = $("#swatch li a");
		
		DOM.ctxCanvas = DOM.$canvas.get(0).getContext("2d");
		DOM.ctxGrid = DOM.$grid.get(0).getContext("2d");
	};

	var init = (function (size) {

		// init DOM cache
		initDOM();

		// init hexel properties
		initHexelProperties(size);

		// init canvas layout
	 	// initCanvasLayout();

		// init swatch ui
		initSwatches();

		// init canvas ui events
		DOM.$main.mousedown(onCanvasMouseDown).mousemove(onCanvasMouseMove).mouseup(onCanvasMouseUp); 
		

	}(16));


})