quail.languageDirAttributeIsUsed = function() {
	var currentDirection = (quail.html.attr('dir')) ? quail.html.attr('dir').toLowerCase() : 'ltr';
	var oppositeDirection = (currentDirection === 'ltr') ? 'rtl' : 'ltr';
	quail.html.find('p, blockquote, aside, h1, h2, h3, h4, h5, h6').each(function() {
		if($(this).attr('dir')) {
			currentDirection = $(this).attr('dir').toLowerCase();
		}
		else {
			currentDirection = ($(this).parent('[dir]').first().attr('dir')) ? $(this).parent('[dir]').first().attr('dir').toLowerCase() : currentDirection;
		}
		if(typeof quail.textDirection[currentDirection] === 'undefined') {
			currentDirection = 'ltr';
		}
		oppositeDirection = (currentDirection === 'ltr') ? 'rtl' : 'ltr';
		var matches = $(this).text().match(quail.textDirection[oppositeDirection]);
		if(!matches) {
			return;
		}
		matches = matches.length;
		$(this).find('[dir=' + oppositeDirection + ']').each(function() {
			var childMatches = $(this).text().match(quail.textDirection[oppositeDirection]);
			if(childMatches) {
				matches = matches - childMatches.length;
			}
		});
		if(matches > 0) {
			quail.testFails('languageDirAttributeIsUsed', $(this));
		}
	});
};