(function() {
	if (window.ff) {
	} else {
		window.ff = {};
	}

	function GetLastScrollHeight() {
		return $.cookie('last_scroll_height' + location.href);
	}

	function SetLastScrollHeight(height) {
		$.cookie('last_scroll_height' + location.href, "" + height, {expires: 3650, path: '/'});
	}

	function GetLastScrollPosition() {
		return $.cookie('last_scroll_position' + location.href);
	}

	function SetLastScrollPosition(pos) {
		$.cookie('last_scroll_position' + location.href, "" + pos, {expires: 3650, path: '/'});
	}

	function GetLastViewedSeparationId() {
		return $.cookie('last_viewed_separation' + location.href);
	}

	function SetLastViewedSeparationId(separationId) {
		$.cookie('last_viewed_separation' + location.href, "" + separationId, {expires: 3650, path: '/'});
	}

	function Tick() {
		SetLastScrollPosition(window.pageYOffset);
		SetLastScrollHeight($(document).height());
		var y = GetLastScrollPosition();
	}
	
	function RemoveStyleElement() {
		var s = document.getElementById("beforeRestoreScrollPosition");
		if (s) {
			s.disabled = true;
		}
	}
	
	function RestoreScrollPositionImpl() {
		if (GetLastScrollPosition() != null) {
			var y = GetLastScrollPosition();
			var h = GetLastScrollHeight();
			if ($(document).height() != h) {
				y = (y * $(document).height()) / h;
			}
			window.scrollTo(0, y);
		}

		var s = document.getElementById("beforeRestoreScrollPosition");
		if (s) {
			s.disabled = true;
		}

		Tick();

		if (GetLastViewedSeparationId() != null) {
			$('#' + GetLastViewedSeparationId()).nextAll().each(function(index, el) {
				el.style.display = "block";
			});
		}
		var s = $(".separation");
		if (s.length > 0) {
			SetLastViewedSeparationId(s[s.length - 1].id);
		}
		setInterval(Tick, 1000);
	}

	function WaitForLayoutFixed(f, h) {
		setTimeout(function() {
			var nh = $(document).height();
			if (nh == h) {
				f();
			} else {
				WaitForLayoutFixed(f, nh);
			}
		}, 100);
	}

	function RestoreScrollPosition() {
		if (GetLastScrollPosition() == null || GetLastScrollPosition() == 0) {
			RestoreScrollPositionImpl();
		} else {
			WaitForLayoutFixed(RestoreScrollPositionImpl, $(document).height());
		}
	}
	
	function ContentUpdated() {
		if  (!navigator.cookieEnabled) {
			RemoveStyleElement();
			return;
		}

		if (GetLastViewedSeparationId() != null) {
			$('#' + GetLastViewedSeparationId()).nextAll().each(function(index, el) {
				el.style.display = "none";
			});
		}

		setTimeout(function() {
			RestoreScrollPosition();
		}, 100);
	}

	window.ff.CharacterNoteElement = '<a href="character_note.html">';

	$(document).bind("contentupdated", function(e) {
		ContentUpdated();
	});
})();
