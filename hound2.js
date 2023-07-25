rh_houndScriptURL = "http://www.hound.jp/hound.js";
rh_houndScriptOldURL = "http://www.refererhound.jp/hound.js";
rh_houndURL = "http://www.hound.jp/server/hound";
rh_houndManagementURL = "http://www.hound.jp/management/login.jsp";
rh_houndIndexURL = "http://www.hound.jp/";
rh_houndCSSURL = "http://www.hound.jp/server/base.css";
rh_id = "refererhoundhere";
rh_div_class = "refererhound";
rh_version = 3;

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

function rh_getQueryStr(isViewAll) {
	var q = new rh_QueryStr();
	q.add("version", rh_version);

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

	if (ref) {
		q.add("start", ref);
	}
	if (location.href.indexOf("http://") == 0 
			&& location.href != rh_site + rh_path) {
		q.add("location", location.href);
	}
	q.add("path", rh_path);
	q.add("site", rh_site);
	q.add("spannew", window.rh_span_new);
	if (isViewAll) {
		q.add("num", -1);
		q.add("numnew", -1);
	} else {
		q.add("num", window.rh_num_fragment);
		q.add("numnew", window.rh_num_new_fragment);
		q.add("leftlen", window.rh_len_left);
		q.add("overlen", window.rh_len_over);
		q.add("rightlen", window.rh_len_right);
		q.add("snippetlen", window.rh_len_snippet);
		q.add("titlelen", window.rh_len_title);
		q.add("subtitlelen", window.rh_len_subtitle);
	}
	if (window.rh_iframe) {
		q.add("mode", "iframe");
		q.add("cssurl", window.rh_css_url);
	} else if (isViewAll) {
		q.add("mode", "subwindow");
		q.add("lang", navigator.browserLanguage);
		if (document.title) {
			q.add("title", document.title);
		}
	} else {
		q.add("mode", "json");
	}

	return q;
}

function rh_Element(en) {
	this.name = en;
	this.attr = new Object();
	this.content = new Array();
	
	this.getChildren = function(n) {
		var r = new Array();
		for (var i = 0; i < this.content.length; i++) {
			var c = this.content[i];
			if (c.name == n) {
				r.push(c);
			}
		}
		return r;
	};

	this.getChild = function(n) {
		for (var i = 0; i < this.content.length; i++) {
			var c = this.content[i];
			if (c.name == n) {
				return c;
			}
		}
		return null;
	};

	this.getChildContent = function(n) {
		var c = this.getChild(n);
		if (c == null) {
			return null;
		}
		if (c.content.length == 0) {
			return null;
		}
		return c.content[0];
	};

	this.string = function() {
		str = "<" + this.name;
		for (var i in this.attr) {
			var t = typeof(this.attr[i]);
			if(t == "string" || t == "number") {
				str += " " + i + '="' + this.attr[i] + '"';
			}
		}
		str += '>';
		for (var i = 0; i < this.content.length; i++) {
			var t = typeof(this.content[i].string);
			if (t == "function") {
				str += this.content[i].string();
			} else {
				str += this.content[i];
			}
		}
		str += "</" + this.name + ">";

		return str;
	};
}

function rh_parseElement(parent, jsonVal) {
	var e = new rh_Element(jsonVal[0]["@"]);
	for (var i in jsonVal[0]) {
		if (typeof(i) == "string" && i.length >= 2 && i.charAt(0) == "@") {
			e.attr[i.substring(1)] = jsonVal[0][i];
		}
	}
	for (var i = 1; i < jsonVal.length; i ++) {
		var v = jsonVal[i];
		if (typeof(v) == "object") {
			rh_parseElement(e, v);
		} else {
			e.content.push(jsonVal[i]);
		}
	}

	if (parent == null) {
		return e;
	} else {
		parent.content.push(e);
		return parent;
	}
}

function rh_insertScript(src) {
	var e = new rh_Element("scr" + "ipt");
	e.attr["src"] = src;
	e.attr["charset"] = "utf-8";
	e.attr["type"] = "text/javascript";
	e.attr["language"] = "javascript";
	document.write(e.string(""));
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
		}
	}
	
	if (typeof(rh_len_url) != "number") {
		rh_len_url = 80;
	}
	
	iframeFallDown("Opera/7");
	iframeFallDown("Opera 7");
	iframeFallDown("MSIE 5");
}


function rh_sendRPCDone(jsonVal) {
	var source = rh_parseElement(null, jsonVal);
	var dest = new rh_Element("div");
	dest.attr["id"] = rh_id;
	dest.attr["class"] = rh_div_class;
	
	var date = new Date();

	function createF() {
		var f = new rh_Element("div");
		f.attr["class"] = rh_div_class;
		return f;
	}

	function createA(url, content) {
		var a = new rh_Element("a");
		a.attr["href"] = url;
		a.attr["target"] = "_top";
		a.content.push(content);
		return a;
	}

	function createE(en, cn, content) {
		var s = new rh_Element(en);
		s.attr["class"] = cn;
		s.content.push(content);
		return s;
	}

	function compareName(s, t) {
		return s.getChildContent("name") > t.getChildContent("name");
	}

	for (var i in source.content) {
		var e = source.content[i];
		var url = e.getChildContent("URL");
		var f = createF();
		if (e.name == "ad") {
			var h = new rh_Element("h3");
			h.content.push(createE("span", "new", e.getChildContent("thisisad") + " "));
			h.content.push(createA(url, e.getChildContent("catchphrase")));
			f.content.push(h);

			var doc = createE("p", "doc", e.getChildContent("bodycopy"));
			var sellers = e.getChildren("seller");
			sellers.sort(compareName);
			for (var ii = 0; ii < sellers.length; ii++) {
				var s = sellers[ii];
				doc.content.push(" ");
				doc.content.push(createA(s.getChildContent("URL"), s.getChildContent("name")));
			}
			f.content.push(doc);
		} else if (e.name == "fragment") {
			var h = new rh_Element("h3");
			if (e.attr["new"]) {
				h.content.push(createE("span", "new", "New "));
			}
			var a = createA(url, e.getChildContent("title"));
			var subtitle = e.getChildContent("subtitle");
			if (subtitle !== null) {
				a.content.push(createE("span", "subtitle", subtitle));
			}
			h.content.push(a);
			f.content.push(h);

			var d = new rh_Element("p");
			d.attr["class"] = "doc";
			var left = e.getChildContent("left");
			if (left !== null) {
				d.content.push(left + " ");
			}
			var over = e.getChildContent("over");
			if (over !== null) {
				d.content.push(createE("span", "over", over));
			}
			var right = e.getChildContent("right");
			if (right !== null) {
				d.content.push(" " + right);
			}
			f.content.push(d);
			
			date.setTime(e.getChildContent("registered"));
			f.content.push(createE("p", "date", date.toLocaleString()));
		} else if (e.name == "nofragment") {
			dest.content.push(createE("h3", "nofragment", e.content[0]));
			continue;
		}
		f.content.push(createE("p", "url", url.substring(7, rh_len_url)));
		dest.content.push(f);
	}

	if (source.attr["all"] != "true") {
		var a = createA(rh_houndURL + "?" + rh_getQueryStr(true).str, source.attr["viewall"]);
		a.attr["target"] = "_blank";
		dest.content.push(createE("p", "viewall", a));
	}

	var footnote = new rh_Element("p");
	footnote.attr["class"] = "footnote";
	if (source.attr["num"] != "0") {
		footnote.content.push(createA(rh_houndManagementURL, source.attr["management"]));
		footnote.content.push(" - ");
	}
	footnote.content.push("&copy;2006 ");
	footnote.content.push(createA(rh_houndIndexURL, "Hound"));
	dest.content.push(footnote);

	document.getElementById(rh_id).innerHTML = dest.string();
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

	addAttribute("src", rh_houndURL + "?" + rh_getQueryStr(false).str);
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
	alert(attributeStr);
	document.write("<ifr" + "ame " + attributeStr + ">" 
				   + '<p>&nbsp;</p>'
				   + "</ifr" + "ame>");
}

function rh_showByRemote() {
	document.write('<div id="' + rh_id + '"></div>');
	rh_insertScript(rh_houndURL + "?" + rh_getQueryStr(false).str);
}

function rh_show() {
	if (window.rh_iframe == "true") {
		rh_showIframe();
		rh_removeVars();
	} else {
		rh_showByRemote();
	}
}

rh_show();
