$(function () {
	var getLogo = function() {
		var month = (new Date()).getMonth();
		var isWinter = month === 11 || month === 0 || month === 1 ? true : false;

		$('img[data-getlogo]').attr('src', isWinter ? 'img/logo.gif' : 'img/logo2.gif');
	};
	
	var init3D = function() {
		if ($('#obj3d').length !== 1)
			return;

		var getGlState = function() {
			try {
				var canvas = document.createElement('canvas');
				return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
			} catch (e) {
				return false;
			}
		};

		if (!getGlState())
			return;

		$('#obj3d').removeClass('hidden');

		var frame = $('#frame3d')[0];
		frame.src = $(frame).data('src');

		$('#toggle').on('click', function(e) {
			if (!frame.contentWindow.viewCfg)
				return;

			frame.contentWindow.viewCfg.autorotate = !frame.contentWindow.viewCfg.autorotate;

			var remCls = frame.contentWindow.viewCfg.autorotate ? 'fa-play-circle' : 'fa-pause-circle';
			var addCls = frame.contentWindow.viewCfg.autorotate ? 'fa-pause-circle' : 'fa-play-circle';

			$(e.currentTarget).children('span').toggleClass(remCls);
			$(e.currentTarget).children('span').toggleClass(addCls);
		});

		$('#eyedropper').colorpicker({ format: 'hex', color: 'red' }).on('changeColor.colorpicker', function(event) {
			if (!frame.contentWindow.viewCfg)
				return;

			frame.contentWindow.viewCfg.matColor = event.color.toHex();
		});
	};

	getLogo();
	init3D();
});
