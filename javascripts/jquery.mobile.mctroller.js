(function(window, $, undefined) {

var _ns   = {},
	util = {
		/*
		 * Build object literal from query string
		 *
		 * @access : private
		 * @param  : string ("?fname=john&lname=doe")
		 * @return : object ({ fname: "john", lname: "doe" })
		*/
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
	namespace = {
		/*
		 * Extend namespace object
		 *
		 * @access : public
		 * @param  : object ({ home: { init:function(){} } })
		 * @return : boolean
		*/
		extend: function(ns) {
			if (!ns || !$.isPlainObject(ns))
				return false;

			_ns = $.extend({}, _ns, ns);
			return true;
		},

		/*
		 * Remove namespace controller
		 *
		 * @access : public
		 * @param  : string ('home')
		 * @return : boolean
		*/
		remove: function(prop) {
			if (!prop || !_ns[prop])
				return false;

			delete _ns[prop];
			return true;
		}
	},
	app = {
		/*
		 * Application initialization
		 *
		 * @access : public
		 * @param  : object ({ home:{ init:function(){} }, about:{ init:function(){} } })
		 * @return : void
		*/
		init: function(ns) {
			if (ns) namespace.extend(ns);

			// initially invoke app-wide code
			app.route({ controller: "common" });

			// reset method to return true since it's already initialized.
			this.init = function() { return true; };
		},

		/*
		 * Action Controller routing
		 * Currently invoked on pagecreate/pageshow/pagehide event bindings
		 *
		 * @access : private
		 * @param  : object ({ element:$(e), params:"fname=john&lname=doe", controller:"users", action:"add" })
		 * @return : void
		*/
		route: function(req) {
			// ensure req exists and is an object
			if (!req || !$.isPlainObject(req)) return false;

			// ensure the controller exists, otherwise default to a plain object.
			var controller = _ns[req.controller] || {},

				// find the action in the controller.
				// default to the init method.
				fn = controller[req.action || "init"];

			// set the context as the controller/namespace, not the window.
			// pass an object containing all name/value pairs from the data-params attr.
			// pass a reference of the page element.
			if ($.isFunction(fn))
				fn.call(controller || _ns, util.params(req.params), req.element);
		}
	};


// map controller and action on page init & page beforecreate/show/hide
$('body').live('pagecreate pagebeforecreate pageshow pagehide', function(evt) {
	var e = $(evt.target),

		// if page[show/hide] event, forget the element's data-action.
		hijack = evt.type == "pageshow" || evt.type == "pagehide" ||
		         evt.type == "pagebeforecreate",

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


// add mctroller namespace to jQuery
$.extend($, {
	mctroller: {
		init       : app.init,
		controller : namespace
	}
});
})(this, jQuery);