function rh_ext_transform(re) {
	if (re.tagName != "button") {
		var domDocument;
		if (window.ActiveXObject) {
			domDocument = Sarissa.getDomDocument();
		} else {
			domDocument = document;
		}
	
		var ce = domDocument.createElement("p");
		ce.appendChild(domDocument.createTextNode("error: rh_button must be set"));
		var dre = domDocument.createElement("div");
		dre.setAttribute("class", "refererhound");
		dre.appendChild(ce);
		return dre;
	}

	rhbutton_count = re.getAttribute("num");
	rhbutton_alt = re.firstChild.nodeValue;
	if (rhbutton_image.URL.substring(rhbutton_image.URL.length - 1, 1) == "/") {
		rhbutton_image.URL = rhbutton_image.URL.substring(0, rhbutton_image.URL.length - 1);
	}

	return rhbutton_get_dre();
}

function rhbutton_showUp() {
	rhbutton_changeMode("up");
	return;
}

function rhbutton_showDown() {
	rhbutton_changeMode("down");
	return;
}

function rhbutton_showOver() {
	rhbutton_changeMode("over");
	return;
}

function rhbutton_changeMode(mode) {
	document.getElementById("rhbutton_" + mode).style.display = "inline";
	if (mode != "up")
		document.getElementById("rhbutton_up").style.display = "none";
	if (mode != "down")
		document.getElementById("rhbutton_down").style.display = "none";
	if (mode != "over")
		document.getElementById("rhbutton_over").style.display = "none";
}

function rhbutton_get_dre() {
	var domDocument;
	if (window.ActiveXObject) {
		domDocument = Sarissa.getDomDocument();
	} else {
		domDocument = document;
	}

	var ae = domDocument.createElement("span");
	ae.setAttribute("onMouseOver", "rhbutton_showOver()");
	ae.setAttribute("onMouseOut", "rhbutton_showUp()");
	ae.setAttribute("onMouseDown", "rhbutton_showDown()");
	ae.setAttribute("onMouseUp", "rh_showButtonClick();rhbutton_showOver()");
	
	function createElementForMode(mode, style) {
		var base = rhbutton_image.URL + "/" + mode + "/";
		function getIMG(src) {
			var imge = domDocument.createElement("img");
			imge.setAttribute("src", base + src + ".gif");
			imge.setAttribute("alt", rhbutton_alt);
			imge.setAttribute("width", rhbutton_image.width[src]);
			imge.setAttribute("height", rhbutton_image.height);
			return imge;
		}
		
		var ce = domDocument.createElement("span");
		ce.setAttribute("id", "rhbutton_" + mode);
		ce.setAttribute("style", style);
		ce.appendChild(getIMG("left"));
		for (var i = 0; i < rhbutton_count.length; i ++) {
			ce.appendChild(getIMG(rhbutton_count.charAt(i)));
		}
		ce.appendChild(getIMG("right"));
		return ce;
	}
	
	ae.appendChild(createElementForMode("up", ""));
	ae.appendChild(createElementForMode("down", "display:none"));
	ae.appendChild(createElementForMode("over", "display:none"));
	
	var pe = domDocument.createElement("p");
	pe.setAttribute("class", "viewbutton");
	pe.appendChild(ae);
	var dre = domDocument.createElement("div");
	dre.setAttribute("class", "refererhound");
	dre.appendChild(pe);
	return dre;
}
