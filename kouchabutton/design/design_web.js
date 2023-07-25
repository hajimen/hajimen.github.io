(function() {
var isTsumeEnabled = true;

$(document).bind("contentupdated", function(e) {
	$('.in_nav p').html('<a href="#top" class="display_nav_top_inline display_nav_top_inline_left">目次</a>'
			+ '＊' + window.ff.CharacterNoteElement.substring(0, window.ff.CharacterNoteElement.length - 1)
			+ ' class="display_nav_top_inline display_nav_top_inline_right">登場人物紹介</a>');

	$('#inner_nav li').each(function() {
		if ($(this).html().indexOf(window.ff.StartSid) != -1) {
			$(this).addClass("self_li");
			$(this).html($(this).text());
		}
	});

	if (isTsumeEnabled) {
		window.tsume(e.updated);
	}

    if (window.ruby_fix) {
        window.ruby_fix(e.updated);
    }
});

$(document).ready(function() {
	$('body').append('<p id="compare_a" style="visibility:hidden; width: 6em;">漢字漢字漢字</p><p id="compare_b" style="visibility:hidden; width: 5.9em;">「」。：（）</p><p id="compare_c" style="visibility:hidden; width: 6em;">漢</p>');
	
	if ($('#compare_a').height() != $('#compare_c').height() || $('#compare_b').height() == $('#compare_c').height()) {
		isTsumeEnabled = false;
	}
	$('#compare_a').remove();
	$('#compare_b').remove();
	$('#compare_c').remove();

	var separator = '<p style="text-align:center;"><span style="color: rgb(44, 160, 44)">■</span>　<span style="color: rgb(170, 170, 90)">■</span>　<span style="color: rgb(128, 51, 0)">■</span></p>';
	$('#nav ul').wrap('<div id="inner_nav"></div>');
	$('#nav').prepend('<a name="top" href="/kouchabutton/"><img class="left_top" src="design/left_top.png" alt="" border="0" /></a>');
	$('#inner_nav').prepend(separator + '<h2>目次</h2>');
	$('#inner_nav').append(separator);
	$('#nav').prepend('<img class="display_nav_top out_square" src="design/blank_square.png" alt="" style="position:absolute; left: 0px;" />');
	$('#nav').prepend('<img class="display_nav_top out_square" src="design/blank_square.png" alt="" style="position:absolute; right: 0px;" />');
	$('#nav').append('<img class="display_nav_top out_square" src="design/blank_square.png" alt="" style="position:absolute; left: 0px; bottom: 0px;" />');
	$('#nav').append('<img class="display_nav_top out_square" src="design/blank_square.png" alt="" style="position:absolute; right: 0px; bottom: 0px;" />');

	$('#text_frame').prepend('<img class="display_nav_left out_square" src="design/blank_square.png" alt="" style="float: left; position:relative; margin-left: -12em;" />');
	$('#text_frame').prepend('<img class="display_nav_left out_square" src="design/blank_square.png" alt="" style="float: left; position:relative; margin-left: -4em;" />');
	$('#text_frame').append('<img class="display_nav_left out_square" src="design/blank_square.png" alt="" style="float: left; position:relative; margin-left: -12em; margin-top: -2em;" />');
	$('#text_frame').append('<img class="display_nav_left out_square" src="design/blank_square.png" alt="" style="float: left; position:relative; margin-left: -4em; margin-top: -2em;" />');

	function fixFixedPosition() {
        var initialTop = parseFloat($('#full_box').css('margin-top').replace('px', ''));
        function Fix() {
            if ($('#nav').css("position") == 'fixed') {
                $('#nav').css("top", $(this).scrollTop() + initialTop);
            }
        }
        function FixOrientation(e) {
        	setTimeout(function() {
                if (window.orientation == 0 || window.orientation == 180) {
                    $('#nav').css("top", initialTop);
                } else if ($('#nav').css("position") == 'fixed') {
                    $('#nav').css("top", $(this).scrollTop() + initialTop);
                }
        	}, 1);
        }
        window.addEventListener('orientationchange', FixOrientation, true);
        window.addEventListener(window.ff.EVENT_BEFORE_REBUILD_PAGE, Fix, true);
		setInterval(function() {
            Fix();
		}, 1000);
	}

	var ua = navigator.userAgent;
	if (ua.indexOf('Android') != -1) {
		if (ua.indexOf('Android 1.') != -1 || ua.indexOf('Android 2.') != -1) {
			fixFixedPosition();
		}
	} else if (ua.indexOf('AppleWebKit') != -1 && (ua.indexOf('OS 3_') != -1 || ua.indexOf('OS 4_') != -1)) {
		fixFixedPosition();
	}
});

})();
