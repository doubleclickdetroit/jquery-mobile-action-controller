/*
 * Application Framework
*/
(function(window, $, undefined) {

var _ns   = {},
	util = {
		cookie: function(key, value, options) {
			if (arguments.length > 1 && (value || value === null)) {
				options = $.extend({}, options);
				
				if (value === null) options.expires = -1;
				else if (typeof value === 'object') {
					value = util.stringJSON(value);
				}
				
				if (typeof options.expires === 'number') {
					var days = options.expires, t = options.expires = new Date();
					t.setDate(t.getDate() + days);
				}

				return (document.cookie = [
					encodeURIComponent(key), '=',
					options.raw ? String(value) : encodeURIComponent(String(value)),
					
					// using "expires" attribute as "max-age" is not supported by IE
					options.expires ? '; expires=' + options.expires.toUTCString() : '',
					
					options.path ? '; path=' + options.path : '',
					options.domain ? '; domain=' + options.domain : '',
					options.secure ? '; secure' : ''
				].join(''));
			}
			
			// key and possibly options given, get cookie...
			options = value || {};
			var result, decode = options.raw ? function (s) { return s; } : decodeURIComponent;
			return (result = new RegExp('(?:^|; )' + encodeURIComponent(key) + '=([^;]*)').exec(document.cookie)) ? decode(result[1]) : null;
		},
		stringJSON: function(obj) {
			var arr = [],
				isArray = obj instanceof Array;
			
			if (typeof obj == 'string') return obj;
			for (key in obj) {
				var val = obj[key];
				
				if (typeof val == 'object') {
					var str = (!isArray) ? '"' + key + '":' : "";
					str += util.stringJSON(val);
					arr.push(str);
				}
				else {
					var str = (!isArray) ? '"' + key + '":' : ""
					if (typeof val == 'number') str += val;
					else if (typeof val == 'boolean') str += (val) ? '"true"' : '"false"';
					else str += '"' + val + '"';
					arr.push(str);
				}
			}
			
			return (isArray) ? "[" + arr.join(',') + "]" : "{" + arr.join(',') + "}";
		},
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
		extend: function(ns) {
			if (!ns || !$.isPlainObject(ns))
				return false;

			_ns = $.extend({}, _ns, ns);
			return true;
		},
		remove: function(prop) {
			if (!prop || !_ns[prop])
				return false;

			delete _ns[prop];
			return true;
		}
	},
	app = {
		init: function(ns) {
			if (ns) namespace.extend(ns);

			// initially invoke app-wide code
			app.route({ controller: "common" });

			// reset method to return true since it's already initialized.
			this.init = function() { return true; };
		},
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


// add mctroller to $.mobile on "mobileinit" event
$(window.document).bind('mobileinit', function() {
	$.mobile.mctroller = {
		init       : app.init,
		util       : util,
		controller : namespace
	};
});

})(this, jQuery);