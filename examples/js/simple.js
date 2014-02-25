$(document).ready(function() {
   
   $('#test').quail({ guideline : [ 'imgHasAlt' ],
                    jsonPath : 'http://webprojects.csumb.edu/quail/mirror.php?p=kevee/quail/master/src/resources',
                    testFailed : function(event) {
                      event.element.addClass('quail-result')
                           .addClass(event.severity)
                           .before('<span class="quail-message">This is a message about why you should add alt text.</span>');
                      
                    }});
 });