(function() {
	function GetCharacterLocation(code, plane) {
		var c = parseInt(code);
		var p = parseInt(plane);
		return c * 16 + 4096 * p;
	}

	function ToHex(num) {
		var h = "0123456789ABCDEF";
		return h.substring(num, num + 1);
	}

	function CreateCharacterTable(plane) {
		var html = "";

		function CreateHHead() {
			html += "<thead><tr><th></th>";
			for (var i = 0; i < 16; i ++) {
				html += '<th class="table_head">' + ToHex(i) + "</th>";
			}
			html += "</tr></thead>";
		}

		function CreateTr(code, line) {
			html += "<tr>";
			CreateLHead(ToHex(line));
			for (var i = 0; i < 16; i ++) {
				CreateTd(code);
				code += 16;
			}
			html += "</tr>";
		}
		
		function CreateLHead(hex) {
			html += '<td class="table_head">' + hex + "</td>";
		}

		function CreateTd(code) {
			html += "<td>";
			CreateSpan(code);
			html += "</td>";
		}
		
		function CreateSpan(code) {
			html += '<span id="c' + code + 'p' + plane + '" class="character_set_0 character_set" style="background-position:0px -' + GetCharacterLocation(code, plane) + 'px" />';
		}
		
		html += '<table style="display:inline;">';

		CreateHHead();
		var code = 0;
		for (var i = 0; i < 16; i ++) {
			CreateTr(code, i);
			code += 1;
		}
		
		html += "</table>";
		
		return html;
	}

	function CreateScreenTable() {
		var html = "";
		
		function CreateTr(row) {
			html += "<tr>";
			for (var i = 0; i < 40; i ++) {
				CreateTd(row, i);
			}
			html += "</tr>";
		}

		function CreateTd(row, column) {
			html += "<td>";
			CreateSpan(row, column);
			html += "</td>";
		}

		function CreateSpan(row, column) {
			html += '<span class="character_set bg_0" id="r' + row + 'c' + column + '" />';
		}

		html += '<table style="border-spacing:0px">';

		for (var i = 0; i < 25; i ++) {
			CreateTr(i);
		}
		
		html += "</table>";
		
		return html;
	}
	
	var cursorR1 = 0;
	var cursorC1 = 0;
	var cursorR2 = 0;
	var cursorC2 = 0;

	function MapToCursorSelection(func) {
		var l = Math.min(cursorC1, cursorC2);
		var r = Math.max(cursorC1, cursorC2);
		var t = Math.min(cursorR1, cursorR2);
		var b = Math.max(cursorR1, cursorR2);
		for (var i = l; i < r + 1; i ++) {
			for (var ii = t; ii < b + 1; ii ++) {
				func($('#r' + ii + 'c' + i));
			}
		}
	}
	
	var isShowCursor = false;
	var isMouseDown = false;
	
	function ShowCursor() {
		isShowCursor = true;
		MapToCursorSelection(function(je) {
			je.html('<span class="cursor" />');
		});
	}

	function HideCursor() {
		isShowCursor = false;
		MapToCursorSelection(function(je) {
			je.html('');
		});
	}

	function Tick() {
		if (isShowCursor) {
			HideCursor();
		} else {
			ShowCursor();
		}
	}

	function Character(code, plane, bg, fg) {
		var enc1 = code + 192;
		var enc2 = plane + bg * 2 + fg * 16 + 192;
		return {
			"code" : code,
			"plane" : plane,
			"bg" : bg,
			"fg" : fg,
			"enc" : String.fromCharCode(enc1, enc2)
		};
	}

	function DecodeCharacter(str) {
		var dec1 = str.charCodeAt(0);
		var dec2 = str.charCodeAt(1);
		if (dec1 > 447 || dec2 > 319) {
			alert("エンコード文字列が不正です。");
			return null;
		}
		var code = dec1 - 192;
		var d = dec2 - 192;
		var plane = d & 1;
		var bg = (d & (2 + 4 + 8)) >>> 1;
		var fg = (d & (16 + 32 + 64)) >>> 4;
		return {
			"code" : code,
			"plane" : plane,
			"bg" : bg,
			"fg" : fg
		};
	}

	var screenCharacter = [];
	(function() {
		for (var i = 0; i < 25; i ++) {
			screenCharacter[i] = [];
			for (var ii = 0; ii < 40; ii ++) {
				screenCharacter[i][ii] = Character(0, 0, 0, 7);
			}
		}
	})();

	function SetCharacter(je, code, plane, bg, fg) {
		for (var i = 0; i < 8; i ++) {
			je.removeClass("character_set_" + i);
			je.removeClass("bg_" + i);
		}
		je.addClass("bg_" + bg);
		je.addClass("character_set_" + fg);
		je.css("background-position", "0px -" + GetCharacterLocation(code, plane) + "px");
		var pos = GetScreenPos(je.get(0));
		screenCharacter[pos.r][pos.c] = Character(code, plane, bg, fg);
	}

	function GetScreenPos(elem) {
		var posA = elem.id.split("c");
		var r = parseInt(posA[0].substring(1));
		var c = parseInt(posA[1]);
		return {'r' : r, 'c' : c};
	}

	function OnScreenMouseDown(event) {
		if (!this.id) {
			return;
		}
		HideCursor();
		var pos = GetScreenPos(this);
		cursorR1 = cursorR2 = pos.r;
		cursorC1 = cursorC2 = pos.c;
		isMouseDown = true;
		ShowCursor();
	}

	function OnScreenMouseOver(event) {
		if (!this.id) {
			return;
		}
		if (!isMouseDown) {
			return;
		}
		HideCursor();
		var pos = GetScreenPos(this);
		cursorR2 = pos.r;
		cursorC2 = pos.c;
		ShowCursor();
	}

	function OnScreenMouseUp(event) {
		if (!this.id) {
			return;
		}
		HideCursor();
		var pos = GetScreenPos(this);
		cursorR2 = pos.r;
		cursorC2 = pos.c;

		if (isMouseDown) {
			isMouseDown = false;
		} else {
			cursorR1 = pos.r;
			cursorC1 = pos.c;
		}
		ShowCursor();
	}

	$(document).ready(function(){
		$('#character_table_p').append(CreateCharacterTable(0));
		$('#character_table_p').append(CreateCharacterTable(1));
		$('#character_table_p table .character_set').click(function(event) {
			HideCursor();
			var posA = event.target.id.split("p");
			var code = parseInt(posA[0].substring(1));
			var plane = parseInt(posA[1]);
			var fg = $('input[name="foreground"]:checked').val();
			var bg = $('input[name="background"]:checked').val();
			MapToCursorSelection(function(je) {
				SetCharacter(je, code, plane, bg, fg);
			});
			
			if (cursorC1 == cursorC2 && cursorR1 == cursorR2) {
				var c = cursorC1;
				var r = cursorR1;
				c ++;
				if (c > 40) {
					c = 0;
					r ++;
					if (r > 25) {
						r = 0;
					}
				}
				cursorC1 = cursorC2 = c;
				cursorR1 = cursorR2 = r;
			}
		});

		$('#screen_table_p').append(CreateScreenTable());
		var screen = $('#screen_table_p table .character_set');
		screen.mousedown(OnScreenMouseDown);
		screen.mouseover(OnScreenMouseOver);
		screen.mouseup(OnScreenMouseUp);

		$('#encode_button').click(function() {
			var str = "";
			for (var i = 0; i < 25; i ++) {
				var line = "";
				for (var ii = 0; ii < 40; ii ++) {
					line += screenCharacter[i][ii].enc;
				}
				str += (line + "\n");
			}
			$("#encoded_textarea").val(str);
		});

		$('#decode_button').click(function() {
			var str = $("#encoded_textarea").val();
			var lines = str.split("\n");
			for (var i = 0; i < 25; i ++) {
				var l = lines[i];
				for (var ii = 0; ii < 40; ii ++) {
					var s = l.substring(ii * 2, ii * 2 + 2);
					var c = DecodeCharacter(s);
					SetCharacter($('#r' + i + 'c' + ii), c.code, c.plane, c.bg, c.fg);
				}
			}
		});

		var megumi = "ÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİ\n"
					+ "ÀİÀİÀİÀİÀİÀİÀİÀİĎĠăĠăĠăĠčĠÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİ\n"
					+ "ÀİÀİÀİÀİÀİÀİÀİÀİăĠíĠÀİĸĠăĠÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİ\n"
					+ "ÀİÀİÀİÀİÀİÀİÀİÀİăĠĈĠÀİĈĠăĠÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİ\n"
					+ "ÀİÀİÀİÀİÀİÀİÀİÀİăĠÀİĹĠÀİăĠÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİ\n"
					+ "ÀİÀİÀİÀİÀİÀİÀİÀİăĠčĠſġĶĠăĠÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİ\n"
					+ "ÀİÀİÀİÀİÀİÀİÀİÀĠăĠăĠÀİÀİăĠÀĠÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİ\n"
					+ "ÀİÀİÀİÀİÀİÀİĶĠİĠ÷ĠİĠÀİðĠÿĠİĠķĠÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİ\n"
					+ "ÀİÀİÀİÀİÀİýĠÀİċĠ÷ĠČĠÀĠċĠÿĠČĠýĠÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİ\n"
					+ "ÀİÀİÀİÀİÀİýĠÀİĎĠčĠüĠüĠüĠĎĠčĠýĠÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİ\n"
					+ "ÀİÀİÀİÀİÀİýĠÀİĂĠăĠĖĠÀĠĂĠăĠĖĠýĠÀĠÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİ\n"
					+ "ÀİÀİÀİÀİÀİýĠÀİùĠÀĠÀĠÀĠÀĠÀĠĵĠýĠÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİ\n"
					+ "ÀİÀİÀİÀİÀİýĠÀİùĠıĠÀĠîĠÀĠýĠĵĠýĠÀĠÀĠÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİ\n"
					+ "ÀİÀİÀİÀİÀİÀİķĠĶĠÀĠÀĠÀĠÀĠÀĠķĠĶĠÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİ\n"
					+ "ÀİÀİÀİÀİÀİÀİýĠúĠúĠúĠúĠúĠúĠúĠıĠÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİ\n"
					+ "ÀİÀİÀİÀİÀİÀİĽĠÀĠÀĠÀĠĂĠĖĠÀĠýĠÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİ\n"
					+ "ÀİÀİÀİÀİÀİÀİĽĠÀĠÀĠÀĠÀĠķĠÀĠýĠÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİ\n"
					+ "ÀİÀİÀİÀİÀİÀİÀĠķĠÀĠÀĠÀĠÀĠķĠýĠÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİ\n"
					+ "ÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİ\n"
					+ "ÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİ\n"
					+ "ÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİ\n"
					+ "ÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİ\n"
					+ "ÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİ\n"
					+ "ÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİ\n"
					+ "ÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİÀİ\n";
		
		var kb = "ĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒ\n"
				+ "ĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒ\n"
				+ "ĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĭĺƯĺƯĺČĺĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒ\n"
				+ "ĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒƯĺĮĺĚÚĚĒĭĺĚĒĚĒĚĒƯĺƯĺĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒ\n"
				+ "ĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĺĚĒĚĒĚĒĚĒŸĺĚĒħĺĚĒĚĒĭĺĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒ\n"
				+ "ĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒķĺĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĘĺĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒ\n"
				+ "ĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒķĺĚĒĚĒĚĒĚĒĚĒĚĒĭĺĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒ\n"
				+ "ĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒķĺĚĒĚĒĚĒĚĒĶĺĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒ\n"
				+ "ĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒķĺĚĒĚĒħĺĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒ\n"
				+ "ĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒČĺĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒ\n"
				+ "ĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒŸĺĚĒĚĒĚĒøÊľÊþÊĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒ\n"
				+ "ĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĖĔĚÄĚÄĚÄĚÄĚÄúêƲÊăÎčÊüÊĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒ\n"
				+ "ĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒęÊþÊþÊĚÄĚÄĚÄĚÄĚÄĚÄƸÄúÄăÎĖÎăÎčÊĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒ\n"
				+ "ĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒÀÎÀÎƲÎƳÎƽÄľÄľÄľÄľÄƷÎĺÎöÎÀÎƻÎăÎčÊĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒ\n"
				+ "ĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒÀÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎýÎĚĒûÊăÎĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒ\n"
				+ "ĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒıÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎƺÎĚĒÿÊăÎĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒ\n"
				+ "ĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒ÷ÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎƺÎĚĒĎÊĖÊĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒ\n"
				+ "ĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒľĺúĺöĞƹÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎƸÎĬÎƸÊĖÊĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒ\n"
				+ "ĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒƸÊƷÎÀÎÀÎÀÎÀÎĂÎčÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎúÎăÎÀÎĺĞþĺĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒ\n"
				+ "ĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĿÊÀÎÀÎÀÎÀÎÀÎÀÎĂÎčÎüÎÀÎÀÎÀÎľÎăÎĺÎÀÎÀÎÀÎÀÎĂĞĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒ\n"
				+ "ĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒ÷ĐÀÎÀÎÀÎÀÎÀÎÀÎÀÎĺÎþİăÎăÎăÎĺÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒ\n"
				+ "ĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒƲÊƿÎƴÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎƶÎĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒ\n"
				+ "ĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒƲÊƿÎƴÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎÀÎƸÎƶÎĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒ\n"
				+ "ĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒƲÊƿÎĺİľÎüÎüÎüÎüÎÀÎÀÎÀÎÀÎüÎúÎúÎƿÎƱÊĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒ\n"
				+ "ĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒİÊöÊĺÊĺÊĺÊþĐăÎăÎăÎăÎþĐúĐöÊĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒĚĒ\n";

		var lines = kb.split("\n");
		for (var i = 0; i < 25; i ++) {
			var l = lines[i];
			for (var ii = 0; ii < 40; ii ++) {
				var s = l.substring(ii * 2, ii * 2 + 2);
				var c = DecodeCharacter(s);
				SetCharacter($('#r' + i + 'c' + ii), c.code, c.plane, c.bg, c.fg);
			}
		}

		$("#encoded_textarea").val(megumi);

		setInterval(Tick, 500);
	});
	
})();
