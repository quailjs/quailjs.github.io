/*global Ember*/
var App = Ember.Application.create();
var accessibilityTests;
var accessibilityGuidelines = {};
var severity = {
  0     : '<span class="label label-success">Suggestion</span>',
  0.5   : '<span class="label label-primary">Moderate</span>',
  1     : '<span class="label label-danger">Severe</span>'
};

$(document).ready(function() {
	var messages = { imgHasAlt : 'Your images are missing alt text here. Better fix that.',
	        documentAbbrIsUsed : 'This abbreviation needs to be wrapped in an abbr or acronym tag.'
  };
  $('.demonstration').quail({jsonPath : '/dist', 
                             guideline : [ 'imgHasAlt', 'documentAbbrIsUsed' ],
                             testFailed : function(event) {
        	                    if(event.testName == 'documentAbbrIsUsed') {
          	                    event.element.html(event.element.html().replace(event.options.acronym, '<span class="quail-result moderate" title="' + messages[event.testName] +'">' + event.options.acronym + '</span>'));
        	                    }
        	                    else {
          	                    event.element.addClass('quail-result')
        	                           .addClass(event.severity)
        	                           .attr('title', messages[event.testName]);
        	                    }
        	                    $('.quail-result').tooltip();
      	                    }});
});

var getTests = function() {
	if(typeof accessibilityTests !== 'undefined') {
		return accessibilityTests;
	}
	accessibilityTests = [];
	var tests = $.ajax({ url: 'dist/tests.min.json', async: false, dataType: 'json'});
	$.each(tests.responseJSON, function(testName, test) {
  	test.raw = JSON.stringify(test, null, 2);
  	test.id = testName;
  	test.severity = severity[test.testability];
  	test.guidelineLabels = [];
    $.each(test.guidelines, function(name, guideline) {
      test.guidelineLabels.push(name.toUpperCase());
    });
    test.guidelineLabels = test.guidelineLabels.join(', ');
    test.tags = (typeof test.tags === 'undefined') ? '' : test.tags.join(', ');
	  var guidelines = test.guidelines;
		test.guidelines = { wcag : [], 508: guidelines[508]};
		if(typeof guidelines.wcag !== 'undefined') {
			$.each(guidelines.wcag, function(sc, data) {
				$.each(data.techniques, function(index, technique) {
					test.guidelines.wcag.push({id : sc, technique : technique });
				});
			})
		}
  	accessibilityTests.push(test);
  });

  tests = null;
  return accessibilityTests;
}

var getGuideline = function(name) {
	if(typeof accessibilityGuidelines[name] !== 'undefined') {
		return accessibilityGuidelines[name];
	}
	getTests();
	var guideline = $.ajax({ url: 'dist/guidelines/' + name + '.json', async: false, dataType: 'json'});
	accessibilityGuidelines[name] = [];
	if(name == 'wcag') {
		$.each(guideline.responseJSON.guidelines, function(index, sc) {
			sc.id = index;
			sc.t = [];
			$.each(sc.techniques, function(techniqueId, technique) {
				var techniqueTests = [];
				$.each(accessibilityTests, function(index, test) {
					if(typeof this.guidelines !== 'undefined' &&
						typeof this.guidelines[name] !== 'undefined') {
						$.each(this.guidelines[name], function() {
							if(this.technique == technique) {
								techniqueTests.push(test);
							}
						});
					}
				});
				sc.t.push({ id : this, tests: techniqueTests, description: guideline.responseJSON.techniques[this].description});	
			});
			sc.techniques = sc.t;
			delete sc.t;

			accessibilityGuidelines[name].push(sc);
		});
	}
	if(name == '508') {
		$.each(guideline.responseJSON.guidelines, function(letter, guideline) {
			guideline.id = letter;
			guideline.tests = [];
			$.each(accessibilityTests, function(index, test) {
					if(typeof this.guidelines !== 'undefined' &&
						typeof this.guidelines[name] !== 'undefined') {
						if(this.guidelines[name].indexOf(letter) !== -1) {
							guideline.tests.push(test);
						}
					}
			});
			accessibilityGuidelines[name].push(guideline);
		});
	}
	guideline = null;
	return accessibilityGuidelines[name];
}

App.Router.map(function() {
	this.resource('accessibilityTests', { path: 'accessibility-tests'});
	this.resource('accessibilityTest', { path: 'accessibility-test/:id'});
	this.resource('examples');
	this.resource('guidelines');
	this.resource('guidelinesWcag', { path: 'guidelines/wcag'});
	this.resource('guidelines508', { path: 'guidelines/508'});
	this.resource('build');
});

App.AccessibilityTestsRoute = Ember.Route.extend({
	model: function() {
		return getTests();
	}
});

App.AccessibilityTestRoute = Ember.Route.extend({
	model: function(params) {
		getTests();
		var test = {};
		$.each(accessibilityTests, function() {
			if(this.id == params.id) {
				test = this;
			}
		});
		return test;
	}
});

App.GuidelinesWcagRoute = Ember.Route.extend({
	model: function() {
		getGuideline('wcag');
		return accessibilityGuidelines['wcag'];
	}
});

App.Guidelines508Route = Ember.Route.extend({
	model: function() {
		getGuideline('508');
		return accessibilityGuidelines['508'];
	}
});

App.BuildRoute = Ember.Route.extend({
	model: function() {
		return getTests();
	},
	actions: {
		editTest: function(test) {
			$('#builder-modal-display').modal('show');
			$('#builder-modal-display .modal-title').html(test.title.en);
			$('#modal-title').val(test.title.en);
			$('#modal-content').val(test.description.en);
			$('#builder-modal-display form').on('submit', function(event) {
				event.preventDefault();
				console.log(test);
				//test.setEach('title', { en : $('#modal-title').val() };
				//test.description.en = $('#modal-content').val();
				$('#builder-modal-display').modal('hide');
			});
		}
	}
});

