(function() {
	$(document).ready(function() {
		var ev = $.Event('contentupdated', {'updated' : $('.separation p')});
		$(document).trigger(ev);
	});
})();
