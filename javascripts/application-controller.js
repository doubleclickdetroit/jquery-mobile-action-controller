(function(window, undefined) {
	
/*
 * Application Model
*/
var Model = (function() {
	
})(),

/*
 * Application Action Controller(s)
*/
Controller = {
	common: {
		init: function() {
			console.log('common.init was invoked!');
		}
	},

	home: {
		init: function(params, element) {
			var self = this;
			console.log('home.init was invoked!', params, element);
			element.find('a.ui-btn').live('click', function(evt) {
				self.actionPerformed();
			});
		},
		foo: function(params) {
			console.log('home.foo was invoked!', params);
			this.bar();
		},
		bar: function() {
			console.log('home.bar was invoked!', this);
		},
		actionPerformed: function() {
			alert('The button was clicked!');
			console.log('actionPerformed context:', this);
		}
	},

	about: {
		init: function() {
			console.log('about.init was invoked!');
		},
		pageshow: function(params, element) {
			console.log('about.pageshow was invoked!', element);
		},
		pagehide: function(p) {
			console.log('about.pagehide was invoked!', p);
		}
	}
};


// Assign controller to framework
$(window.document).bind('mobileinit', function() {
	$.mobile.mctroller.init(Controller);
});

})(this);