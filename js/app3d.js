var App = function () {
	this._fovMin = 25;
	this._fovMax = 50;
	this.orbits = [];

	var models = {
		'60x60_outer_pyramid': { obj: 'obj3d/60x60_outer_pyramid.obj', mtl: 'obj3d/60x60_cap.mtl' },
		'60x60_outer_cap': { obj: 'obj3d/60x60_outer_cap2.obj', mtl: 'obj3d/60x60_outer_cap2.mtl' },
		'60x60_inner_pyramid': { obj: 'obj3d/60x60_inner_pyramid2.obj', mtl: 'obj3d/60x60_cap.mtl' },
		'60x60_inner_new': { obj: 'obj3d/60x60_inner_new.obj', mtl: 'obj3d/60x60_cap.mtl' }
	};

	this.modelName = models[App.getQueryStringParam('obj')];
};

App.getGLState = function () {
	try {
		var canvas = document.createElement('canvas');
		return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
	} catch (e) {
		return false;
	}
};

App.getQueryStringParam = function (name) {
	if (!name)
		return null;

	var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
	var results = regex.exec(location.search);

	return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

App.prototype = {
	constructor: App,

	buildScene: function () {
		if (!this.modelName)
			return;

		var me = this;

		var canvas = $('#scene')[0];
		this.renderer = new THREE.WebGLRenderer({ alpha: true, canvas: canvas, antialias: true });

		if (+window.devicePixelRatio > 1)
			this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(window.innerWidth, window.innerHeight);

		this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 4000);

		var ambientLight = new THREE.AmbientLight(0x555555);
		var pointLight = new THREE.PointLight(0xffffff);
		pointLight.intensity = 0.9;

		this.scene = new THREE.Scene();
		this.scene.add(pointLight);
		this.scene.add(ambientLight);

		this.camera.lookAt(this.scene.position);
		this.camera.position.set(50, 30, 50);
		pointLight.position.set(50, 50, 50);

		this.orbits.push(new THREE.OrbitControls(this.camera, canvas));
		this.orbits.push(new THREE.OrbitControls(pointLight, canvas));

		var onMouseWeel = function (e) {
			var delta = e.deltaY || e.wheelDelta || e.detail;
			e.preventDefault ? e.preventDefault() : e.returnValue = false;
			if (e.stopPropagation)
				e.stopPropagation();

			var result = delta * 0.05;
			me.changeFov(result);
		};

		if ('onwheel' in document)
			document.addEventListener('wheel', onMouseWeel, false); // IE9+, FF17+, Ch31+
		else if ('onmousewheel' in document)
			document.addEventListener('mousewheel', onMouseWeel, false); // old
		else
			document.addEventListener('MozMousePixelScroll', onMouseWeel, false); // firefox

		var dollyStart = new THREE.Vector2();
		var dollyEnd = new THREE.Vector2();
		var dollyDelta = new THREE.Vector2();

		function touchstart(e) {
			if (!e.touches || e.touches.length !== 2)
				return;

			var dx = e.touches[0].pageX - e.touches[1].pageX;
			var dy = e.touches[0].pageY - e.touches[1].pageY;
			var distance = Math.sqrt(dx * dx + dy * dy);
			dollyStart.set(0, distance);
		}

		function touchmove(e) {
			if (!e.touches || e.touches.length !== 2)
				return;

			e.preventDefault ? e.preventDefault() : e.returnValue = false;
			if (e.stopPropagation)
				e.stopPropagation();

			var dx = e.touches[0].pageX - e.touches[1].pageX;
			var dy = e.touches[0].pageY - e.touches[1].pageY;
			var distance = Math.sqrt(dx * dx + dy * dy);

			dollyEnd.set(0, distance);
			dollyDelta.subVectors(dollyEnd, dollyStart);

			if (dollyDelta.y > 0)
				me.changeFov(-1);
			else if (dollyDelta.y < 0)
				me.changeFov(1);

			dollyStart.copy(dollyEnd);
		}

		this.renderer.domElement.addEventListener('touchstart', touchstart, false);
		this.renderer.domElement.addEventListener('touchmove', touchmove, false);

		var loader = new THREE.OBJMTLLoader();
		loader.load(this.modelName.obj, this.modelName.mtl, function (mdl) {
			mdl.scale.set(0.6, 0.6, 0.6);
			mdl.position.y = -10;

			me.scene.add(mdl);
			me.obj3d = mdl;
		});
	},

	changeFov: function (fovDelta) {
		var fov = this.camera.fov + fovDelta;
		if (fov < this._fovMin || fov > this._fovMax)
			return;

		this.camera.fov = fov;
		this.camera.updateProjectionMatrix();
	},

	changeColor: function (newColor) {
		if (!this.obj3d || this.oldColor === newColor)
			return;

		var obj = this.obj3d.children[2];

		if (!obj || !obj.material)
			return;

		var colorStr = newColor.substring(1);
		obj.material.color = new THREE.Color(parseInt(colorStr, 16));
		this.oldColor = newColor;
	}
};

$(function () {
	var app = new App();

	app.buildScene();

	var resize = function () {
		if (+window.devicePixelRatio > 1)
			app.renderer.setPixelRatio(window.devicePixelRatio);

		app.renderer.setSize(window.innerWidth, window.innerHeight);
		app.camera.aspect = window.innerWidth / window.innerHeight;
		app.camera.updateProjectionMatrix();
	};

	$(window).on('orientationchange', function () {
		resize();
	});

	$(window).resize(function () {
		resize();
	});

	var diffbuffer = {
		matColor: viewCfg.matColor,
		camPos: app.camera.position.clone(),
		camFov: app.camera.fov
	};

	var firstFrame = true;

	var render = function() {
		if (viewCfg.autorotate) {
			for (var i = 0; i < app.orbits.length; i++) {
				app.orbits[i].update();
			}
		}

		if (diffbuffer.matColor === viewCfg.matColor
			&& diffbuffer.camPos.equals(app.camera.position)
			&& diffbuffer.camFov === app.camera.fov
			&& !firstFrame)
			return;

		diffbuffer.matColor = viewCfg.matColor;
		diffbuffer.camPos = app.camera.position.clone();
		diffbuffer.camFov = app.camera.fov;

		firstFrame = false;

		if (viewCfg.matColor) {
			app.changeColor(viewCfg.matColor);
		}

		app.renderer.render(app.scene, app.camera);
	};

	var animate = function() {
		requestAnimationFrame(animate);
		render();
	};

	animate();
});
