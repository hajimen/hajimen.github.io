(function() {
	if (window.ff) {
	} else {
		window.ff = {};
	}

	window.ff.RequestTokenSequenceGenerator = function() {return [function() {
		return;
	}]; };

    window.ff.ServerConnectionSuccessed = function() {
    	// Do nothing
    };

    window.ff.ReceiveTokenSequenceGenerator = function() { return [function() {
    	this.token = "dummy";
    }]; };

    window.ff.CatalogueUpdated = function(etag, lastSid) {
		// Do nothing
	};

	window.ff.AuthStartSequenceGenerator = function() { return [
		function(){
		}
	]; };

	window.ff.IsConnectionOk = function() {
		return true;
	};

	window.ff.AuthClearStorage = function() {
	};
})();
