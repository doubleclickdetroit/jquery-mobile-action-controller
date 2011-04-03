/*
 * Application Framework
*/
(function(window, $, ns, undefined) {

var NS   = ns || {},
	util = {
		params: function(str) { // http://bit.ly/gWliW5
			if (!str) return {};
			var e,
				p = {},
				a = /\+/g,
				r = /([^&=]+)=?([^&]*)/g,
				d = function (s) {return decodeURIComponent(s.replace(a,' '));};

			while (e = r.exec(str))
				p[d(e[1])] = d(e[2]);

			return p;
		}
	},
	app = {
		route: function(req) {
			// ensure req exists and is an object
			if (!req || !$.isPlainObject(req)) return false;

			// ensure the controller exists, otherwise default to a plain object.
			var controller = NS[req.controller] || {},

				// find the action in the controller.
				// default to the init method.
				fn = controller[req.action || "init"];
			
			// set the context as the controller/namespace, not the window.
			// pass an object containing all name/value pairs from the data-params attr.
			// pass a reference of the page element.
			if ($.isFunction(fn))
				fn.call(controller || NS, util.params(req.params), req.element);
		}
	};


// initially invoke app-wide code
app.route({ controller: "common" });


// map controller and action on page init & page show/hide
$('body').live('pagecreate pageshow pagehide', function(evt) {
	var e = $(evt.target),

		// if page[show/hide] event, forget the element's data-action.
		hijack = evt.type == "pageshow" || evt.type == "pagehide",

		// do we need to hijack the action for page[show/creat]
		// if not, get the action from the data-action attr.
		action = hijack ? evt.type : e.jqmData('action');

	function route(obj) {
		app.route($.extend({
			element    : e,
			params     : e.jqmData('params'),
			controller : e.jqmData('controller')
		}, obj || {}));
	}

	if (!hijack) route();
	if (action) route({ action:action });
});

})(this, jQuery, myController);