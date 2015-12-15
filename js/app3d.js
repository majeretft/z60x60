var App = function () {
	this._fovMin = 25;
	this._fovMax = 50;
	this.orbits = [];
	this.modelName = App.getQueryStringParam('obj');
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

	return results == null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

App.prototype = {
	constructor: App,

	buildScene: function () {
		if (!this.modelName)
			return;

		var me = this;

		var canvas = $('#scene')[0];

		this.renderer = new THREE.WebGLRenderer({ alpha: true, canvas: canvas, antialias: true });
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
			var delta = e.deltaY || e.wheelDelta;
			e.preventDefault ? e.preventDefault() : (e.returnValue = false);

			var result = delta * 0.05;
			me.changeFov(result);
		};

		if ('onwheel' in document)
			document.addEventListener('wheel', onMouseWeel, false); // IE9+, FF17+, Ch31+
		else if ('onmousewheel' in document)
			document.addEventListener('mousewheel', onMouseWeel, false); // old

		var loader = new THREE.OBJMTLLoader();
		var path = 'obj3d/';
		loader.load(path + this.modelName + '.obj', path + this.modelName + '.mtl', function (mdl) {
			mdl.scale.set(0.6, 0.6, 0.6);
			mdl.position.y = -10;

			me.scene.add(mdl);
		});
	},

	changeFov: function (fovDelta) {
		var fov = this.camera.fov + fovDelta;
		if (fov < this._fovMin || fov > this._fovMax)
			return;

		this.camera.fov = fov;
		this.camera.updateProjectionMatrix();
	}
};

$(function () {
	var app = new App();

	app.buildScene();

	$(window).resize(function () {
		app.renderer.setSize(window.innerWidth, window.innerHeight);
		app.camera.aspect = window.innerWidth / window.innerHeight;
		app.camera.updateProjectionMatrix();
	});

	var render = function () {
		if (viewCfg.autorotate) {
			for (var i = 0; i < app.orbits.length; i++) {
				app.orbits[i].update();
			}
		}

		app.renderer.render(app.scene, app.camera);
	}

	var animate = function () {
		requestAnimationFrame(animate);
		render();
	}

	animate();
});
