(function($) {
	var quailBuilder = {
   
		config: { 
			tests: { },
			components: { },
			strings: { },
			libraries: { },
			custom: { }
		},

		jsHead: [
			'/*! QUAIL quailjs.org | quailjs.org/license */',
			'/*! Built with the Quail builder at quailjs.org/build */',
			';(function($) {'
		],

		tests: {},

		templateTests: [],

		js: [],

		quailParts: ['components', 'strings', 'custom'],

		severityLabels : {
			0			: { name: 'Suggestion', class: 'success' },
			0.5		: { name: 'Moderate', class: 'primary' },
			1			: { name: 'Severe', class: 'danger' }
	  },

		run: function() {
			var that = this;
			$.getJSON('/dist/tests.min.json', function(tests) {
				that.tests = tests;
				that.displayTests(tests);
				$('#builder :checkbox').on('change', function(event) { 
					event.preventDefault();
					that.updateConfig()
				});
				$('#download-link').on('click keyup', function(event) { 
					event.preventDefault();
					that.createPermalink()
				});
				$('#builder').on('submit', function(event) {
					event.preventDefault();
					that.download();
				});
				$('#download-config').on('click keyup', function(event) {
					event.preventDefault();
					that.downloadConfig();
				});
				$('.edit-text').on('click keyup', function(event) {
					event.preventDefault();
					that.testConfiguration($(this));
				});
				$('.guideline:checkbox').on('change', function(event) {
					event.preventDefault();
					that.filterGuidelines();
				});
			});
		},

		displayTests: function(tests) {
			var that = this;
			var template = Handlebars.compile($('#builder-template').html());
			
			$.each(tests, function(testName, test) {
				test.template = { name : testName}
				that.addTestGuidelines(test);
				test.template.severity = that.severityLabels[test.testability];
				that.templateTests.push(test);
			});

			var gistId = window.location.hash.replace('#', '').trim();
			if(gistId.length) {
				this.updateConfig();
				$.ajax({
		      url: 'https://api.github.com/gists/' + gistId,
		      type: 'GET',
		      dataType: 'json',
		      success : function(data) {
		      	that.config = JSON.parse(data.files['quail-config.json'].content);
				  	that.updateForm();
		      }
		    });
			}
			$('#builder-tests').append(template({ tests: that.templateTests }));
		},

		addTestGuidelines : function(test) {
			test.template.guidelines = [];
			if(typeof test.guidelines === 'undefined' || $.isEmptyObject(test.guidelines)) {
				return;
			}
			$.each(test.guidelines, function(guidelineName, guideline) {
				if(guidelineName === '508') {
					test.template.guidelines.push({
						"508" : 1,
						name : 'Section 508',
						sections : guideline
					});
				}
				if(guidelineName === 'wcag') {
					var g = { wcag : 1, name : 'WCAG 2.0', sc : [ ] };
					$.each(guideline, function(sc, techniques) {
						g.sc.push({
							sc : sc,
							technique: techniques
						})
					});
					test.template.guidelines.push(g);
				}
			});
		},

		updateConfig: function() {
			var that = this;
			this.config = { tests: { },
								 components: { },
								 strings: { },
								 libraries: { },
								 custom: { }
								 };
			$.each(that.tests, function(testName, test) {
				if(!$('#' + testName).is(':checked')) {
					return;
				}
				delete test.template;
				that.config.tests[testName] = test;
				if(typeof test.components !== 'undefined') {
					$.each(test.components, function(index, component) {
						that.config.components[component] = component;
					});
				}
				if(test.type == 'custom') {
					that.config.custom[testName] = testName;
				}
				if(typeof test.strings !== 'undefined') {
					$.each(test.strings, function(index, strings) {
						var string = (strings.search(/\./) !== -1) ? strings.substr(0, strings.search(/\./)) : strings;
						that.config.strings[string] = string;
					});
				}
			});
		},

		updateForm: function() {
			this.hideMessage();
			var that = this;
			$(':checkbox').each(function() {
				$(this).removeAttr('checked');
			});
			$.each(this.config.tests, function(testName, test) {
				$('#' + testName + ':checkbox').attr('checked', 'checked');
				that.updateRowStrings(testName, test);
			});
		},

		filterGuidelines: function() {
			var guidelines = [];
			$('.guideline:checkbox').each(function() {
				if($(this).is(':checked')) {
					guidelines.push($(this).val());
				}
			});
		},

		download: function() {
			this.hideMessage();
			var that = this;
			this.updateConfig();
			this.js = this.jsHead;
			this.js.push('var quailBuilderTests = ' + JSON.stringify(this.config.tests, null, 2) + ';');
			var core = $.ajax({ async: false, url: '/src/js/core.js' });
			this.js.push(core.responseText);
			$.each(this.quailParts, function(index, part) {
				$.each(that.config[part], function(quailPart) {
					var code = $.ajax({ async: false, url: '/src/js/' + part + '/' + quailPart + '.js'});
					that.js.push(code.responseText);
				});				
			});
			this.js.push('})(jQuery);');
			var blob = new Blob([this.js.join("\n")], {type: "text/javascript;charset=utf-8"});
			saveAs(blob, "quail-custom.js");
		},

		createPermalink: function() {
			this.hideMessage();
			var data = {
	      "description": "Quail builder configuration",
	      "public": true,
	      "files": {
	        "quail-config.json": {
	          "content": JSON.stringify(this.config, null, 2)
	        }
	      }
	    }
	    $.ajax({
	      url: 'https://api.github.com/gists',
	      type: 'POST',
	      dataType: 'json',
	      data: JSON.stringify(data)
	    })
	    .success(function(result) {
	      window.location.hash = result.id;
	    })
	    .error(function(err) {
	      this.showError('danger', '<strong>Uh oh!</strong> Could not save gist file, configuration not saved.', err)
	    })
		},

		testConfiguration : function($link) {
			$('#builder-modal-display').remove();
			var test = this.tests[$link.data('test')];
			var that = this;
			var template = Handlebars.compile($('#builder-modal').html());
			$('#builder').after(template({ test: test, testName : $link.data('test') }));
			$('#builder-modal-display').modal();
			$('#builder-modal-display form').on('submit', function(event) {
				event.preventDefault();
				var testName = $('#modal-test').val();
				that.tests[testName].title.en = $('#modal-title').val();
				that.tests[testName].description.en = $('#modal-content').val();
				that.updateRowStrings(testName, that.tests[testName]);
				if(typeof that.config.tests[testName] !== 'undefined') {
					that.config.tests[testName] = that.tests[testName];
				}
				$('#builder-modal-display').modal('hide');
			});
		},

		updateRowStrings : function(testName, test) {
				$('#' + testName + '-row label').html(test.title.en);
				$('#' + testName + '-row .description').html(test.description.en);
				$('#' + testName + '-row .edit-text').prepend('<span class="glyphicon glyphicon-comment"></span><span class="sr-only">Edited</span> ');
		},

		downloadConfig : function() {
			this.updateConfig();
			var blob = new Blob([JSON.stringify(this.config, null, 2)], {type: "text/json;charset=utf-8"});
			saveAs(blob, "quail-config.json");
		},

		showMessage : function(type, message) {
			var template = Handlebars.compile($('#builder-message').html());
			$('#builder').before(template({ type: type, message: message }));
		},

		hideMessage : function() {
			$('#current-message').remove();
		}
	};
	$(document).ready(function() {
		quailBuilder.run();
	});
})(jQuery);