rh_houndScriptURL = "http://www.hound.jp/hound.js";
rh_houndScriptOldURL = "http://www.refererhound.jp/hound.js";
rh_houndURL = "http://www.hound.jp/server/hound";
rh_houndCSSURL = "http://www.hound.jp/server/base.css";
rh_houndSarissaURL = "http://www.hound.jp/sarissa.js";
rh_id = "refererhoundhere";

function rh_showElement(dre) {
	dre.setAttribute("id", rh_id);
	if (document.getElementById(rh_id) == null) {
		if (window.ActiveXObject) {
			document.write('<div id="' + rh_id + '"></div>');
		} else {
			var scl = document.getElementsByTagName('script');
			for (var i = 0; i < scl.length; i ++) {
				var sc = scl[i];
				var scsrc = sc.getAttribute("src");
				if (scsrc == rh_houndScriptURL || scsrc == rh_houndScriptOldURL) {
					var ce = document.createElement('div');
					ce.setAttribute("id", rh_id);
					sc.parentNode.insertBefore(ce, sc);
				}
			}
		}
	}

	var ce = document.getElementById(rh_id);
	if (window.ActiveXObject) {
		ce.outerHTML = Sarissa.serialize(dre);
	} else {
		ce.parentNode.replaceChild(dre, ce);
	}
}

function rh_sendRPCDone(re) {	// re : root element
	if (window.rh_ext_transform) {
		var dre = rh_ext_transform(re);
		rh_showElement(dre);
		return;
	}

	var domDocument;
	if (window.ActiveXObject) {
		domDocument = Sarissa.getDomDocument();
	} else {
		domDocument = document;
	}
	
	function getTN(text) {
		return domDocument.createTextNode(text);
	}

	function getE(en) {
		return domDocument.createElement(en);
	}
	
	function getSpan(className, childE) {
		var e = getE("span");
		e.setAttribute("class", className);
		if (childE != undefined) {
			e.appendChild(childE);
		}
		return e;
	}
	
	var dre = getE("div");	// dre : document root element
	dre.setAttribute("class", "refererhound");

	function getTextLambda(nodeList) {
		return function (elementName) {
			return (nodeList.getElementsByTagName(elementName)[0]).firstChild.nodeValue;
		};
	}

	function appendIfExistLambda(nodeList) {
		return function (testEN, toAppend, runFunc, elseRunFunc) {	// testEN : test element name
			var testEL = nodeList.getElementsByTagName(testEN);	// testEL : test element list
			if (testEL.length > 0) {
				var testE = testEL[0];
				if (testE.childNodes.length > 0) {
					var t = testE.firstChild.nodeValue;
					if (t.length > 0) {
						toAppend.appendChild(runFunc(t));
						return;
					}
				}
			}
			if (elseRunFunc != undefined) {
				toAppend.appendChild(elseRunFunc());
			}
		};
	}

	function getALambda(url) {
		return function () {
			var a = getE("a");
			a.setAttribute("href", url);
			a.setAttribute("target", "_top");
			return a;
		};
	}

	var e;	// e : element
	var ce;	// ce : current element

	if (re.tagName == "button") {
		ce = getE("input");
		ce.setAttribute("type", "button");
		ce.setAttribute("onClick", "rh_showButtonClick()");
		ce.setAttribute("value", re.firstChild.nodeValue);
		e = getE("form");
		e.setAttribute("class", "viewbutton");
		e.appendChild(ce);
		ce = e;
		dre.appendChild(ce);
		rh_showElement(dre);
		return;
	}

	ce = getE("a");
	ce.appendChild(getTN("Hound"));
	ce.setAttribute("href", "http://www.hound.jp/");
	ce.setAttribute("target", "_top");

	e = getE("h2");
	e.appendChild(ce);
	ce = e;

	dre.appendChild(ce);

	if (re.tagName == "error") {
		var getText = getTextLambda(re);
		ce = getE("h3");
		ce.appendChild(getTN(getText("headline")));
		dre.appendChild(ce);
		ce = getE("a");
		ce.setAttribute("href", getText("URL"));
		ce.appendChild(getTN(getText("message")));
		e = getE("p");
		e.appendChild(ce);
		ce = e;
		dre.appendChild(ce);
		rh_showElement(dre);
		return;
	}

	var fl = re.getElementsByTagName("fragment");	// fl : fragment list
	for (var i = 0; i < fl.length; i ++) {
		var fe = fl[i];	// fe : fragment element
		var getText = getTextLambda(fe);
		var appendIfExist = appendIfExistLambda(fe);

		var dfe = getE("div");	// dfe : document fragment element
		dfe.setAttribute("class", "fragment");

		var url = getText("URL");
		var getA = getALambda(url);
		ce = getA();
		ce.appendChild(getTN(getText("title")));
		appendIfExist("subtitle", ce, function (str) {
			return getSpan("subtitle", getTN(" : " + str));
		});
		e = getE("h3");
		if (fe.getAttribute("new")) {
			e.appendChild(getSpan("new", getTN("New ")));
		}
		e.appendChild(ce);
		ce = e;
		dfe.appendChild(ce);
		
		ce = getE("p");
		ce.setAttribute("class", "doc");
		appendIfExist("left", ce, getTN);
		e = getSpan("over");
		appendIfExist("over", e, getTN, function () {
			return getTN("(link)");
		});
		ce.appendChild(e);
		appendIfExist("right", ce, getTN);
		dfe.appendChild(ce);

		ce = getE("p");
		ce.setAttribute("class", "date");
		var d = new Date();
		d.setTime(getText("registered"));
		ce.appendChild(getTN(d.toLocaleString()));
		dfe.appendChild(ce);

		ce = getE("p");
		ce.setAttribute("class", "url");
		ce.appendChild(getTN(url.substring(7, 80)));
		dfe.appendChild(ce);

		dre.appendChild(dfe);
	}

	var al = re.getElementsByTagName("ad");
	for (var i = 0; i < al.length; i ++) {
		var ae = al[i];
		var getText = getTextLambda(ae);
		var appendIfExist = appendIfExistLambda(ae);

		var dae = getE("div");	// dae : document ad element
		dae.setAttribute("class", "fragment");

		var url = getText("URL");
		var getA = getALambda(url);

		ce = getE("img");
		ce.setAttribute("src", getText("imagepath"));
		ce.setAttribute("alt", getText("alt"));

		e = getA();
		e.appendChild(ce);
		ce = e;

		e = getE("h3");
		e.appendChild(ce);
		ce = e;
		ce.appendChild(getE("br"));
		ce.appendChild(getSpan("new", getTN(getText("thisisad") + " ")));
		e = getA();
		e.appendChild(getTN(getText("catchphrase")));
		ce.appendChild(e);
		dae.appendChild(ce);
		
		ce = getE("p");
		ce.setAttribute("class", "doc");
		ce.appendChild(getTN(getText("bodycopy")));
		dae.appendChild(ce);

		ce = getE("p");
		ce.setAttribute("class", "url");
		ce.appendChild(getTN(url.substring(7, 80)));
		dae.appendChild(ce);

		dre.appendChild(dae);
	}
	
	if (re.getAttribute("all")) {
	} else if (window.rh_eventload_around) {
		ce = getE("a");
		rh_num_fragment = -1;
		rh_num_new_fragment = -1;
		rh_iframe = "true";
		ce.setAttribute("href", rh_houndURL + "?" + rh_getQueryStr());
		ce.appendChild(getTN(re.getAttribute("viewall")));
		e = getE("p");
		e.setAttribute("class", "viewall");
		e.appendChild(ce);
		ce = e;
		dre.appendChild(ce);
	} else {
		ce = getE("input");
		ce.setAttribute("type", "button");
		ce.setAttribute("onClick", "rh_showAll()");
		ce.setAttribute("value", re.getAttribute("viewall"));
		e = getE("form");
		e.setAttribute("class", "viewall");
		e.appendChild(ce);
		ce = e;
		dre.appendChild(ce);
	}

	rh_showElement(dre);
}

function rh_showAll() {
	if (window.ActiveXObject) {
		rh_dom_around = false;
	}
	rh_num_fragment = -1;
	rh_num_new_fragment = -1;
	rh_show();
}

function rh_showButtonClick() {
	if (window.ActiveXObject) {
		rh_dom_around = false;
	}
	rh_show();
}

function rh_show() {
	if (window.Sarissa) {
		rh_showImpl();
	} else {
		rh_insertScript(rh_houndSarissaURL);
	}
}

function rh_QueryStr() {
	var encode;
	{
		var encodeRaw;
		if (typeof(encodeURIComponent) == "function") {
			encodeRaw = encodeURIComponent;
		} else {
			encodeRaw = escape;
		}

		if (encodeRaw("%25") == "%25") {
			encode = function (s) {
				return encodeRaw(s.replace(/%/g, "%25"));
			};
		} else {
			encode = encodeRaw;
		}
	}

	this.str = "";
	this.add = function (param, value) {
		if (value) {
			if(this.str.length > 0)
				this.str += "&";
			this.str += param + "=" + encode(value);
		}
	}
}

function rh_getQueryStr() {
	var q = new rh_QueryStr();
	q.add("version", 2);
	
	if(window.rh_url && window.rh_site) {
		if(rh_url.indexOf(rh_site) != 0) {
			q.add("error", "rh_url");
			rh_path = "/";
		} else {
			rh_path = rh_url.substring(rh_site.length);
		}
	}
	
	if (rh_site.substring(7).indexOf("/") == -1) {
		if (rh_path.indexOf("/") != 0) {
			q.add("error", "rh_path");
			rh_path = "/";
		}
	}
	
	var ref = document.referrer;
	if(location.href.indexOf(rh_path) != -1) {
		var i = location.href.lastIndexOf(rh_path);
		var site = location.href.substring(0, i);
		if(ref.indexOf(site) == 0) {
			ref = null;
		}
	}
	
	if(ref) {
		if (window.rh_button && rh_button == "subwindow_impl") {
			// noop
		} else {
			q.add("start", ref);
		}
	}
	if (location.href.indexOf("http://") == 0 
			&& location.href != rh_site + rh_path) {
		q.add("location", location.href);
	}
	q.add("path", rh_path);
	q.add("site", rh_site);
	q.add("spannew", window.rh_span_new);
	q.add("num", window.rh_num_fragment);
	q.add("numnew", window.rh_num_new_fragment);
	q.add("leftlen", window.rh_len_left);
	q.add("overlen", window.rh_len_over);
	q.add("rightlen", window.rh_len_right);
	q.add("snippetlen", window.rh_len_snippet);
	q.add("titlelen", window.rh_len_title);
	q.add("subtitlelen", window.rh_len_subtitle);
	if (window.rh_iframe) {
		q.add("mode", "iframe");
		q.add("cssurl", window.rh_css_url);
	} else if (window.rh_button) {
		if (rh_button == "subwindow_impl") {
			q.add("mode", "subwindow");
			if (document.title) {
				q.add("title", document.title);
			}
		} else {
			q.add("mode", "button");
		}
	}
	
	return q.str;
}

function rh_showImpl() {
	if (window.rh_iframe == "true") {
		rh_showIframe();
		rh_removeVars();
	} else if (window.rh_button && rh_button == "subwindow_impl") {
		rh_showSubwindow();
	} else {
		rh_showByRemote();
	}
}

function rh_showIframe() {
	function getQuoted(str) {
		return '"' + str + '"';
	}

	var attributeStr = "";
	function addAttribute(param, value) {
		if(value || typeof(value) == "number") {
			attributeStr += " " + param + "=" + getQuoted(value);
		}
	}

	addAttribute("src", rh_houndURL + "?" + rh_getQueryStr());
	if (window.rh_width) {
		addAttribute("width", rh_width);
	} else {
		addAttribute("width", 400);
	}
	if (window.rh_height) {
		addAttribute("height", rh_height);
	} else {
		addAttribute("height", 300);
	}
	addAttribute("frameborder", 0);
	addAttribute("marginwidth", 0);
	addAttribute("marginheight", 0);
	addAttribute("vspace", 0);
	addAttribute("hspace", 0);
	addAttribute("allowtransparency", "true");
	addAttribute("scrolling", "auto");
	addAttribute("class", "refererhoundframe");
	
	document.write("<ifr" + "ame " + attributeStr + ">" 
				   + '<p>&nbsp;</p>'
				   + "</ifr" + "ame>");
}

function rh_showByRemote() {
	rh_insertScript(rh_houndURL + "?" + rh_getQueryStr());

	if (window.rh_button) {
		if (rh_button == "subwindow") {
			rh_button = "subwindow_impl";
		} else if (rh_button == "inplace") {
			window.rh_button = null;
		}
	}
}

function rh_showSubwindow() {
	window.open(rh_houndURL + "?" + rh_getQueryStr(), 'newwin', 'scrollbars=yes,width=500');
}

function rh_insertScript(src) {
	var attrs = new Object();
	attrs["src"] = src;
	attrs["charset"] = "utf-8";
	attrs["type"] = "text/javascript";
	attrs["language"] = "javascript";
	if (window.rh_dom_around) {
		function getQuoted(str) {
			return '"' + str + '"';
		}
	
		var attributeStr = "";
		function addAttribute(param, value) {
			if(value || typeof(value) == "number") {
				attributeStr += " " + param + "=" + getQuoted(value);
			}
		}
		for (var i in attrs) {
			addAttribute(i, attrs[i]);
		}
	
		document.write("<scr" + "ipt " + attributeStr + ">" 
					   + '<p>&nbsp;</p>'
					   + "</scr" + "ipt>");
	} else {
		var s = document.createElement("script");
		for (var i in attrs) {
			s.setAttribute(i, attrs[i]);
		}
		document.body.appendChild(s);
	}
}

function rh_removeVars() {
	for(var i in window) {
		if(typeof(i) == "string" && i.search(/^rh_/i) != -1) {
			window[i] = null;
		}
	}
}

{
	function setCSS(src) {
		var le = document.createElement("link");
		le.setAttribute("href", src);
		le.setAttribute("rel", "stylesheet");
		le.setAttribute("type", "text/css");
		document.getElementsByTagName('head')[0].appendChild(le);
	}

	if (window.rh_css_url) {
		setCSS(rh_css_url);
	} else {
		setCSS(rh_houndCSSURL);
	}

	function iframeFallDown(UAContains) {
		if (navigator.userAgent.indexOf(UAContains) != -1) {
			rh_iframe = "true";
			if (window.rh_button && rh_button == "subwindow") {
				rh_width = "1px";
				rh_height = "1px";
			}
		}
	}
	
	iframeFallDown("Opera/7");
	iframeFallDown("Opera 7");
	iframeFallDown("MSIE 5");
}

if (window.ActiveXObject) {
	window.rh_dom_around = true;
}

if (navigator.userAgent.indexOf("Safari") != -1) {
	window.rh_dom_around = true;
	window.rh_eventload_around = true;
}

rh_show();
