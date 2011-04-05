/*
 * Application Framework
*/
(function(window, $, undefined) {

var _ns   = {},
	util = {

		/*
		 * Cookie Get/Set Mutator
		 *
		 * @access : private
		 * @param  : string
		 * @param  : string
		 * @param  : object
		 * @return : string
		*/
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

		/*
		 * Convert JSON object into a string
		 * 
		 * @access : private
		 * @param  : object (JSON object)
		 * @return : string
		 */
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
		},

		/*
		 * Application Session
		 * Ability to store data locally and pass it between pages.
		 * 
		 * @access  : public
		 * @pattern : singleton
		 * @return  : object
		*/
		session: (function() {

			// take JSON object, stringify it and save it to cookie
			function save(session) {
				var json = util.stringJSON(session);
				return json;
			}

			/*
			 * Session constructor
			 *
			 * @access: public
			 * @param : string (name of cookie)
			 * @param : number (expiration of cookie)
			*/
			var instance = function(name, duration) {
				name     = name || "mctroller_session";
				duration = duration || 90;

				// Determine if cookie is set, take JSON string
				// make it an object and assign to var for use within other methods
				this.session = $.parseJSON(util.cookie(name)) || {};

				/*
				 * Save the current state of the session data.
				 * Alternatively, this is done automatically whenever the session data is altered using methods set() or clear().
				 *
				 * @access : privileged
				 * @return : self
				*/
				this.save = function() {
					util.cookie(name, save(this.session), {
						path    : "/",
						expires : duration
					});
				};

				return this;
			};

			/*
			 * Session public methods
			 * Assigned to $.mctroller.session[methodName]
			 *
			 * @access: public
			*/
			instance.prototype = {

				/* 
				 * Access information saved between page loads in application.
				 *
				 * @access : public
				 * @param  : string (name of attribute in JSON object) ( e.g. $.mctroller.session.get('hasAcceptedTermsAndConditions'); ).
				 * @return : mixed (string || false)
				*/
				get: function(name) {
					var val = this.session[name];
					if (val) {
						try {return eval(val)}
						catch(e) {return val}
					}
					return false;
				},

				/*
				 * Set and save information to be used between page loads in application.
				 *
				 * @access : public
				 * @param  : string ( e.g. "userEmailAddress" )
				 * @param  : string ( e.g. "johndoe@gmail.com" )
				 * @return : self
				*/
				set: function(name, val) {
					var session  = this.session[name];
					this.session[name] = ($.isPlainObject(val)) ?
						$.extend(session || {}, val)      :
						($.isArray(val))                  ?
						$.merge(session || [], val)       : val;

					this.save();
					return this;
				},

				/*
				 * Clear information specifc to existing attribute
				 *
				 * @access : public
				 * @param  : string ( e.g. "userEmailAddress" )
				 * @return : self
				*/
				clear: function(name) {
					if (this.get(name))
						delete this.session[name];

					this.save();
					return this;
				},

				/*
				 * View a dump of the session data for the application
				 *
				 * @access : public
				 * @return : stringified JSON
				*/
				dump: function() {
					return util.stringJSON(this.session);
				}
			};

			return instance;
		})()
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
		session    : app.session,
		controller : namespace
	}
});

})(this, jQuery);