var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-34643252-1']);
_gaq.push(['_trackPageview']);

(function() {
	window.addEventListener ?
		window.addEventListener('scroll', testScroll, false) :
		window.attachEvent('onscroll', testScroll);

	var scrollCount = 0;
	function testScroll() {
		scrollCount ++;
		if (scrollCount == 2) {
			_gaq.push(['_trackEvent', 'window', 'scrolled']);
		}
	};

	var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
	ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
	var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();
