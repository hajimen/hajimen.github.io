rhstat_site = "http://kaoriha.org";
rhstat_houndURL = "http://www.hound.jp/server/hound";
rhstat_defaultCSSURL = "http://kaoriha.org/nikki/stat.css";	// TODO
rhstat_pathList = new Object();

function rhstat_QueryStr() {
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

function rhstat_call() {
	var q = new rhstat_QueryStr();

	var length = 0;
	for (var path in rhstat_pathList) {
		q.add(length, path);
		length ++;
	}
	q.add("length", length);
	q.add("site", rhstat_site);

	rhstat_insertScript("http://www.hound.jp/server/stat?" + q.str);
}

function rhstat_insertScript(src) {
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

function showSubwindow(url) {
	window.open(url, 'newwin', 'scrollbars=yes,width=500');
}

function rhstat_isValidRhstat(e) {
	var ne = rhstat_getFirstChildByClassName(e, "link");
	if (ne != null) {
		if (rhstat_getFirstChildByClassName(ne, "url") != null
				|| rhstat_getFirstChildByClassName(ne, "path") != null) {
			return true;
		}
	}
	return false;
}

function rhstat_mapToRhstat(func) {
	var spanl = document.getElementsByTagName('span');
	for (var i = 0; i < spanl.length; i ++) {
		var spane = spanl[i];
		if (spane.className == "rhstat" && rhstat_isValidRhstat(spane)) {
			func(spane);
		}
	}
}

function rhstat_getFirstChildByClassName(e, name) {
	var spanl = e.getElementsByTagName('span');
	for (var i = 0; i < spanl.length; i ++) {
		var spane = spanl[i];
		if (spane.className == name) {
			return spane;
		}
	}
	return null;
}

function rhstat_extractPath(e) {
	var ue = rhstat_getFirstChildByClassName(e, "url");
	if (ue != null) {
		var url = ue.firstChild.nodeValue;
		if (url.indexOf(rhstat_site) == 0) {
			return url.substring(rhstat_site.length);
		}
	} else {
		var pe = rhstat_getFirstChildByClassName(e, "path");
		if (pe != null) {
			return pe.firstChild.nodeValue;
		}
	}
	return null;
}

function rhstat_show() {
	function addLinkInfoFromPath(path) {
		rhstat_pathList[path] = path;
	}

	function beforeCallStat(spane) {
		addLinkInfoFromPath(rhstat_extractPath(spane));
	}

	rhstat_mapToRhstat(beforeCallStat);
	rhstat_call();
}

function rhstat_sendRPCDone(a) {
	var length = 0;
	for (var path in rhstat_pathList) {
		rhstat_pathList[path] = a[length];
		length ++;
	}

	function createLinkInfo(num, path) {
		var o = new Object();
		o.num = num;
		o.path = path;
		return o;
	}

	function getErrorLinkInfo() {
		return createLinkInfo("N/A", null);
	}

	function getLinkInfoFromPath(path) {
		if (path == null || rhstat_pathList[path] == null) {
			return getErrorLinkInfo();
		} else {
			return createLinkInfo(rhstat_pathList[path], path);
		}
	}

	function getQueryStr(path, title) {
		var q = new rhstat_QueryStr();

		q.add("goal", rhstat_site + path);
		q.add("path", path);
		q.add("site", rhstat_site);
		q.add("mode", "subwindow");
		q.add("title", title);
		
		return q.str;
	}

	function getSubwindowURL(path, title) {
		if (path == null) {
			return "http://www.hound.jp/server?error=rhstat_bad_path&mode=subwindow";
		}
		return rhstat_houndURL + "?" + getQueryStr(path, title);
	}

	function afterCallStat(spane) {
		var ae = document.createElement("a");
		ae.setAttribute("onclick", "showSubwindow(this.href); return false");
		var li = getLinkInfoFromPath(rhstat_extractPath(spane));
		var pe = rhstat_getFirstChildByClassName(spane, "link");
		// TODO url or pathの前にspanを作ってそこに件数を入れるようにする
		// url, path, titleは消す
		var urle = rhstat_getFirstChildByClassName(spane, "url");
		if (urle != null) {
			urle.firstChild.nodeValue = li.num;
		} else {
			var pathe = rhstat_getFirstChildByClassName(spane, "path");
			if (pathe != null) {
				pathe.firstChild.nodeValue = li.num;
			}
		}
		var titlee = rhstat_getFirstChildByClassName(spane, "title");
		var title = "failed";
		if (titlee != null) {
			title = titlee.firstChild.nodeValue;
			titlee.firstChild.nodeValue = "";
		}

		ae.setAttribute("href", getSubwindowURL(li.path, title));
		pe.parentNode.replaceChild(ae, pe);
		ae.appendChild(pe);
		if (window.ActiveXObject) {
			ae.outerHTML = ae.outerHTML;
		}
	}

	rhstat_mapToRhstat(afterCallStat);

	function setCSS(src) {
		var le = document.createElement("link");
		le.setAttribute("href", src);
		le.setAttribute("rel", "stylesheet");
		le.setAttribute("type", "text/css");
		document.getElementsByTagName('head')[0].appendChild(le);
	}

	if (window.rhstat_css_url) {
		setCSS(rhstat_css_url);
	} else {
		setCSS(rhstat_defaultCSSURL);
	}
	
	rhstat_removeVars();
}

if (window.ActiveXObject
		|| navigator.userAgent.indexOf("Safari") != -1) {
	window.rh_dom_around = true;
}

function rhstat_removeVars() {
	for(var i in window) {
		if (typeof(i) == "string" && i.search(/^rhstat_/i) != -1) {
			window[i] = null;
		}
	}
}

rhstat_show();
