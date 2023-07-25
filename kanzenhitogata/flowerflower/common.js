/*
 * Constant:
 * 		window.ff.Site: サイト
 * 		window.ff.Title: 配信タイトル
 * 
 */
(function() {
	if (window.ff) {
	} else {
		window.ff = {};
	}
	window.ff.EVENT_BEFORE_REBUILD_PAGE = "beforerebuildpage";

	var TIMEOUT = 5000;
	var EVENT_CONTENT_UPDATED = "contentupdated";
	var TO_NEXT_RELEASE_PATH = "tonextrelease.txt";
	var TOTAL_JSON_URL = "../total.json";
	var AUTH_PATH = "Auth/";
	var NEXT_RELEASE_UNKNOWN_SPAN = 24 * 60 * 60 * 1000;
	var NEXT_RELEASE_UPDATING_SPAN = 60 * 1000;
	var MAX_RETRY = 5;
	var retry = 0;
	var nextUpdate = 0; // 次のUpdate時刻。0なら即時
	var lastScroll = "";
	var isFirstRun = false;
	var isUpdating = false;
	var isTickEnabled = true;
	var isEnableRestoreScrollPosition = false;
	var isContentFixed = false;
	var sequenceInstanceSet = {};

	// iPad 3.2 bug workaround
	var localStorage = {
		'setItem' : function(k, v) {
			if (window.localStorage.getItem(k) != null) {
				window.localStorage.removeItem(k);
			}
			window.localStorage.setItem(k, v);
		},
		'getItem' : function(k) {
			return window.localStorage.getItem(k);
		},
		'clear' : function() {
			window.localStorage.clear();
		},
		'removeItem' : function(k) {
			window.localStorage.removeItem(k);
		}
	};

	var DepotStorageKey = {
		"Index" : "INDEX_KEY"
	};

	var PreferenceStorageKey = {
		"LastSeparationId" : "ff_last_separation",
		"CatalogueETag" : "ff_catalogue_etag",
		"LastScroll" : "ff_last_scroll",
		"LastRequestCatalogueTime" : "ff_last_request_catalogue_time",
		"NextReleaseText" : "ff_next_release_text",
		"LastOpenSid" : "ff_last_open_sid",
		"IsContentFixed" : "ff_is_content_fixed"
	};

	var HttpHeader = {
		"AuthScheme" : "X-flowerflower-AuthScheme",
		"AuthToken" : "X-flowerflower-AuthToken",
		"ErrorReason" : "X-flowerflower-ErrorReason",
		"AuthStatus" : "X-flowerflower-AuthStatus"
	};

	var ErrorReason = {
		"Invalid" : "Invalid",
		"LockedOut" : "LockedOut"
	};

	var AuthStatus = {
		"Outdated" : "Outdated"
	};

	Date.prototype.setISO8601 = function(dString) {
		var regexp = /(\d\d\d\d)(-)?(\d\d)(-)?(\d\d)(T)?(\d\d)(:)?(\d\d)(:)?(\d\d)(\.\d+)?(Z|([+-])(\d\d)(:)?(\d\d))/;

		if (dString.toString().match(new RegExp(regexp))) {
			var d = dString.match(new RegExp(regexp));
			var offset = 0;

			this.setUTCDate(1);
			this.setUTCFullYear(parseInt(d[1], 10));
			this.setUTCMonth(parseInt(d[3], 10) - 1);
			this.setUTCDate(parseInt(d[5], 10));
			this.setUTCHours(parseInt(d[7], 10));
			this.setUTCMinutes(parseInt(d[9], 10));
			this.setUTCSeconds(parseInt(d[11], 10));
			if (d[12])
				this.setUTCMilliseconds(parseFloat(d[12]) * 1000);
			else
				this.setUTCMilliseconds(0);
			if (d[13] != 'Z') {
				offset = (d[15] * 60) + parseInt(d[17], 10);
				offset *= ((d[14] == '-') ? -1 : 1);
				this.setTime(this.getTime() - offset * 60 * 1000);
			}
		} else {
			this.setTime(Date.parse(dString));
		}
		return this;
	};

	function Sequence(funcArray, onExit, onError, timeout, onTimeout) {
		this.fa = funcArray;
		this.onExit = onExit;
		this.onError = onError;
		this.timeout = timeout;
		this.onTimeout = onTimeout;
		this.contextSet = {};
		this.contextSetIndexCounter = 0;
	}
	Sequence.prototype._caller = function(f, context, args, loc) {
		if (context.$_isTimeouted || context.$_isExited) {
			return;
		}
		var lf = f;
		var lloc = loc;
		while (true) {
			this._prepareCall(lf, context, this.fa, null, lloc, 0, []);
			context.$self = this._generateFunc(lf, context, lloc);
			context.$_lastPassedTime = new Date().getTime();
			if (lf.apply(context, args)) {
				return;
			} else if (context.$_parent) {
				lf = context.$_parent;
				lloc = context.$_parentLoc;
			} else {
				break;
			}
		}
		if (context.$onExit) {
			context.$onExit();
		}
	};
	Sequence.prototype._generateFunc = function(f, context,  loc) {
		var that = this;
		return function() {
				that._caller(f, context, arguments, loc);
		};
	};
	Sequence.prototype._prepareCall = function(f, context, cfa, pf, loc, depth, ploc) {
		for (var i = loc[depth]; i < cfa.length; i ++) {
			var a = cfa[i];
			if (a === f) {
				delete context.$next;
				var c = 1;
				while (context['$' + c]) {
					delete context['$' + c];
					c++;
				}
				if (pf) {
					context.$_parent = pf;
					context.$_parentLoc = ploc;
					context.$parent =  this._generateFunc(pf, context, ploc);
				} else {
					delete context.$_parent;
					delete context.$parent;
				}
				for (var ii = i + 1; ii < cfa.length; ii ++) {
					var nf = cfa[ii];
					if (typeof(nf) == 'function') {
						var nloc = loc.concat();
						nloc[depth] = ii;
						context.$next =  this._generateFunc(nf, context, nloc);
						break;
					}
				}
				if (i  + 1 < cfa.length) {
					var n = cfa[i + 1];
					if (typeof(n) != 'function') {
						var c = 1;
						for (var ii = 0; ii < n.length; ii ++) {
							if (typeof(n[ii]) != 'function') {
								continue;
							}
							var cf = n[ii];
							var cfloc = loc.concat([ii]);
							cfloc[depth] = i + 1;
							context['$' + c] = this._generateFunc(cf, context, cfloc);
							c ++;
						}
					}
				}
				return true;
			}
			if (typeof(a) != 'function') {
				var lpf = pf;
				var lploc = ploc;
				if (i  + 1 < cfa.length) {
					lpf = cfa[i + 1];
					lploc = loc.slice(0, depth).concat([i + 1]);
				}
				if (this._prepareCall(f, context, a, lpf, loc, depth + 1, lploc)) {
					return true;
				}
			}
		}
	};
	Sequence.prototype.Start = function(context) {
		var that = this;
		if (!context) {
			context = {};
		}
		context.$_isExited = false;
		context.$_lastPassedTime = null;
		context.$_isTimeouted = false;
		context.$IsTimeouted = function(now) {
			if (context.$_isTimeouted || context.$_isExited) {
				return true;
			}
			if (that.timeout) {
				if (that.timeout + context.$_lastPassedTime < now) {
					context.$onTimeout();
					if (context.$onExit) {
						context.$onExit();
					}
					context.$_isTimeouted = true;
					return true;
				}
			}
			return false;
		};
		context.$onExit = function() {
			delete context.$onExit;
			if (that.onExit) {
				that.onExit.apply(context, arguments);
			}
			context.$_isExited = true;
			delete that.contextSet[context.$_index];
		};
		context.$onError = function() {
			if (that.onError) {
				that.onError.apply(context, arguments);
			}
			context.$onExit();
		};
		context.$onTimeout = function() {
			if (that.onTimeout) {
				that.onTimeout.apply(context, arguments);
			}
			context.$onExit();
		};
		var f = this.fa[0];
		context.$_index = this.contextSetIndexCounter;
		this.contextSet[context.$_index] = context;
		this._caller(f, context, [], [0]);
	};

	var ScreenMode = {
			"Loading" : "Loading",
			"Authenticating" : "Authenticating",
			"NotInitialized" : "NotInitialized",
			"Scrolling" : "Scrolling",
			"Content" : "Content",
			"_spinner" : null
	};
	ScreenMode.Set = function(mode) {
		var d = document.getElementById("beforeBuildDomTree");
		var s = document.getElementById("beforeRestoreScrollPosition");

		switch (mode) {
		case ScreenMode.NotInitialized:
			if (s) {
				s.disabled = false;
			}
			if (d) {
				d.disabled = false;
				$('#now_loading').css("display", "block");
				$('#now_authenticating').css("display", "none");
			}
			break;
		case ScreenMode.Loading:
			if (s) {
				s.disabled = false;
			}
			if (d) {
				d.disabled = false;
				$('#now_loading').css("display", "block");
				$('#now_authenticating').css("display", "none");
			}
			break;
		case ScreenMode.Authenticating:
			if (s) {
				s.disabled = false;
			}
			if (d) {
				d.disabled = false;
				$('#now_loading').css("display", "none");
				$('#now_authenticating').css("display", "block");
			}
			break;
		case ScreenMode.Scrolling:
			if (s) {
				s.disabled = false;
			}
			if (d) {
				d.disabled = true;
			}
			break;
		case ScreenMode.Content:
			if (s) {
				s.disabled = true;
			}
			if (d) {
				d.disabled = true;
			}
			break;
		default:
			alert("アプリのエラー:ec854fa5-b0ea-403c-9661-3fa7b7423077 アプリの製造元にご連絡ください。");
			if (s) {
				s.disabled = true;
			}
			if (d) {
				d.disabled = true;
			}
			break;
		}

		var isToSpin = (mode === ScreenMode.Authenticating || mode === ScreenMode.Loading);
		if (isToSpin && !ScreenMode._spinner) {
			var opts = {
					  lines: 12, // The number of lines to draw
					  length: 7, // The length of each line
					  width: 4, // The line thickness
					  radius: 30, // The radius of the inner circle
					  color: '#000', // #rgb or #rrggbb
					  speed: 1, // Rounds per second
					  trail: 60, // Afterglow percentage
					  shadow: false // Whether to render a shadow
					};
			ScreenMode._spinner = new Spinner(opts).spin(document.getElementById('busy_screen'));
		} else if (!isToSpin && ScreenMode._spinner) {
			ScreenMode._spinner.stop();
			ScreenMode._spinner = null;
		}
	};
	window.ff.ScreenMode = ScreenMode;

	var StatusSection = {
			"_inActionStack" : [],
			"_error" : null,
			"_schedule" : null,
			"_errorRecoveryButtonText" : null,
			"_errorRecoveryFunc" : null,
			"Type" : {
				"InAction" : "InAction",
				"Error" : "Error",
				"Schedule" : "Schedule"
			}
	};
	StatusSection._SetInnerHtml = function(innerHtml) {
		document.getElementById("status").innerHTML = innerHtml;
	};
	StatusSection._SetText = function(text) {
		StatusSection._SetInnerHtml('<p>' + text + '</p>');
	};
	StatusSection.PopAction = function() {
		with (StatusSection) {
			if (_inActionStack.length === 0) {
				return;
			}
			_inActionStack.pop();
			_Show();
		}
	};
	StatusSection.PushAction = function(text) {
		StatusSection._inActionStack.push(text);
		StatusSection._Show();
	};
	StatusSection._Show = function() {
		with (StatusSection) {
			var html = "";
			if (_inActionStack.length > 0) {
				_SetText(_inActionStack[0]);
			} else if (_error) {
				html = '<p>' + _error + '</p>';
				if (_errorRecoveryFunc) {
					html += '<p><input type="button" value="' + _errorRecoveryButtonText
						+ '" onclick="window.ff.StatusSection._errorRecoveryFunc();" /></p>';
				}
				_SetInnerHtml(html);
			} else {
				if (_schedule) {
					html = '<p>' + _schedule + '</p>';
				}

				var t = localStorage.getItem(PreferenceStorageKey.NextReleaseText);
				if (t && t.length > 0) {
					html += "<p>次回の配信は" + t + "の予定です。</p>";
				} else if (_schedule) {
				} else {
					html += "<p></p>";
				}
				_SetInnerHtml(html);
			}
		}
	};
	StatusSection.Set = function(statusType, text, recoveryButtonText, recoveryFunc) {
		with (StatusSection) {
			switch (statusType) {
			case Type.InAction:
				if (text) {
					_inActionStack = [text];
				} else {
					_inActionStack = [];
				}
				_error = null;
				break;
			case Type.Error:
				_inActionStack = [];
				_error = text;
				_errorRecoveryButtonText = recoveryButtonText;
				_errorRecoveryFunc = recoveryFunc;
				break;
			case Type.Schedule:
				_schedule = text;
				break;
			default:
				alert("アプリのエラー:ba012a12-715a-4839-9b5d-b30b727ee9c8 アプリの製造元にご連絡ください。");
				return;
			}
			_Show();
		}
	};
	window.ff.StatusSection = StatusSection;

	function GetLastScroll() {
		return localStorage.getItem(PreferenceStorageKey.LastScroll + window.ff.StartSid);
	}

	function GetLastScrollHeight() {
		return parseInt(GetLastScroll().split(',')[1]);
	}

	function GetLastScrollPosition() {
		return parseInt(GetLastScroll().split(',')[0]);
	}

	var isRunningRestoreScrollPosition = false;
	var RestoreScrollPosition = new Sequence([
		function() {
			if (isRunningRestoreScrollPosition) {
				return;
			}
			isRunningRestoreScrollPosition = true;
			isTickEnabled = false;
			if (GetLastScroll() == null || GetLastScrollPosition() === 0) {
				this.$2();
			} else {
				this.lastHeight = $(document).height();
				setTimeout(this.$1, 200);
				return true;
			}
		},
		[
			function() {
				var nh = $(document).height();
				if (nh == this.lastHeight) {
					this.$next();
				} else {
					this.lastHeight = nh;
					setTimeout(this.$self, 200);
					return true;
				}
			},
			function() {
				if (GetLastScroll() != null) {
					var y = GetLastScrollPosition();
					var h = GetLastScrollHeight();
					if ($(document).height() != h) {
						y = (y * $(document).height()) / h;
					}
					window.scrollTo(0, y);
				}
			}
		]
	], function() {	// on exit
		ScreenMode.Set(ScreenMode.Content);
		isTickEnabled = true;
		isRunningRestoreScrollPosition = false;
	}, null, 3000);
	sequenceInstanceSet['RestoreScrollPosition'] = RestoreScrollPosition;
	window.ff.RestoreScrollPosition = RestoreScrollPosition;

	function Tick() {
		if (!isTickEnabled) {
			return;
		}

		var now = new Date().getTime();
		for (var i in sequenceInstanceSet) {
			var si = sequenceInstanceSet[i];
			for (var ii in si.contextSet) {
				si.contextSet[ii].$IsTimeouted(now);
			}
		}

		if (!isContentFixed) {
			if (localStorage.getItem("h" + window.ff.StartSid) == null
					&& !window.ff.IsConnectionOk()) {
				StatusSection.Set(StatusSection.Type.Error, "配信サーバと接続できないため、なにもお見せできません。",
						"再接続", window.ff.FireUpdate);
				return;
			}

			if (nextUpdate < now) {
				if (window.ff.IsConnectionOk()) {
					Update.Start();
				} else {
					nextUpdate = NEXT_RELEASE_UPDATING_SPAN + now;
					StatusSection.Set(StatusSection.Type.Schedule, null);
				}
			}
		}
		var v = "" + window.pageYOffset + "," + $(document).height();
		if (lastScroll != v) {
			lastScroll = v;
			localStorage.setItem(PreferenceStorageKey.LastScroll + window.ff.StartSid, v);
		}
	}

	window.ff.OnLinkClick = function(sid) {
		isTickEnabled = false;
		SetStartSid(sid);
		ScreenMode.Set(ScreenMode.Loading);
		StatusSection.Set(StatusSection.Type.Schedule, null);

		BuildDomTree();
	};

	function FireEventContentUpdated(jo) {
		jo.each(function() {
			var h = $(this).html();
			h = h.replace(/href=(['"])([^:]*)\.html(['"])/g,
					"href=$1javascript:void(0)$3 onclick=\"window.ff.OnLinkClick('$2'); return false;\"");
			$(this).html(h);
		});

		var ev = $.Event(EVENT_CONTENT_UPDATED, {"updated" : jo});
		$(document).trigger(ev);
	}

	window.ff.AuthErrorSequenceFunc = function(xhr, status) {
		var statusText = "配信を受け取れませんでした。";
		if (xhr.status != 400) { // 400 bad request
			if (xhr.status == 0) {
				statusText += "配信サーバとの通信に異常があります。インターネットの接続状態を確認してください。";
			} else {
				statusText += "配信サーバとの通信または配信サーバに異常があります。インターネットの接続状態を確認してください。ステータスコード:" + xhr.status;
			}
			StatusSection.Set(StatusSection.Type.Error, statusText, "再接続", window.ff.FireUpdate);
			if (retry < MAX_RETRY) {
				retry++;
			} else {
				alert("アプリのエラー:51de90c4-b592-4b97-a02f-85bec5d97b13  配信サーバとの通信または配信サーバに異常があります。ステータスコード:" + xhr.status);
				retry = 0;
			}
		} else {
			var errorReason = xhr.getResponseHeader(HttpHeader.ErrorReason);
			switch (errorReason) {
			case ErrorReason.Invalid:
				alert("アプリのエラー:25f65c6b-a769-410b-8630-c67610a951d5  配信サーバがこのアプリの認証を拒否しました。");
				break;
			case ErrorReason.LockedOut:
				alert("アプリのエラー:a5b36c3a-66bd-42cb-a5bf-e82cd32c3a86 不正アクセスなどの理由により配信サーバがこのアプリの認証を拒否しました。");
				break;
			default:
				alert("アプリのエラー:7d6b3e00-345c-4faa-9d37-dad1ab153b1c なんらかの理由により配信サーバがこのアプリの認証を拒否しました。");
				break;
			}
		}
		this.$onError();
		return true;
	};

	var RequestJsonSequence = [
		function() {
			this.isRetry = false;
			this.retryFunc = this.$1;
			this.$1();
			return true;
		},
		window.ff.ReceiveTokenSequenceGenerator(),
		function() {
			var opt = {
				"type" : "GET",
				"url" : window.ff.Site + this.path,
				"cache" : false,
				"beforeSend" : this.$1,
				"success" : this.$2,
				"error" : this.$3,
				"dataType" : "json",
				"timeout" : TIMEOUT
			};
			$.ajax(opt);
			return true;
		},
		[
			function(xhr) {	// beforeSend
				xhr.setRequestHeader(window.ff.HttpHeader.AuthToken, this.token);
				xhr.setRequestHeader(window.ff.HttpHeader.AuthScheme, window.ff.AuthScheme);
				if (this.etag) {
					xhr.setRequestHeader("If-None-Match", this.etag);
				} else {
					xhr.setRequestHeader("If-None-Match", '"never-match-this"');
				}
				return true;
			},
			function(data, status, xhr) {	// success
				var authStatus = xhr.getResponseHeader(window.ff.HttpHeader.AuthStatus);
				this.data = data;
				this.xhr = xhr;
				if (authStatus == window.ff.AuthStatus.Outdated) {
					RequestToken.Start();
				} else if (authStatus) {
					alert("アプリのエラー:c1f98b43-296f-48c5-a497-d087d6bd5d37 アプリのバージョンが古いか、あるいは配信サーバとの通信に異常があります。");
					this.$onError();
					return true;
				}
			},
			function(xhr, status) {
				if (xhr.status == 400 && !this.isRetry && xhr.getResponseHeader(HttpHeader.ErrorReason) != ErrorReason.LockedOut) {	// 403 forbidden
					this.isRetry = true;
					StatusSection.PushAction("アプリを認証しています...");
					this.$1();
					return true;
				} else {
					window.ff.AuthErrorSequenceFunc(xhr, status);
					return true;
				}
			},
			window.ff.RequestTokenSequenceGenerator(),
			function() {
				StatusSection.PopAction();
				this.retryFunc();
				return true;
			}
		]
	];

	var UpdateImpl = new Sequence([
		function() {
			isUpdating = true;
			StatusSection.Set(StatusSection.Type.InAction, "配信サーバと接続しています...");

			var opt = {
				"type" : "GET",
				"dataType" : "text",
				"url" : window.ff.Site + TO_NEXT_RELEASE_PATH,
				"cache" : false,
				"success" : this.$1,
				"error" : this.$2,
				"timeout" : TIMEOUT
			};
			$.ajax(opt);
			return true;
		},
		[
			function(data) {	// success
				this.toNextUpdate = parseInt(data);
			},
			function(xhr, status, errorThrown) {	// error
				StatusSection.Set(StatusSection.Type.Error, "配信サーバと接続できませんでした。", "再接続", window.ff.FireUpdate);

                if (retry < MAX_RETRY) {
					retry++;
				} else {
					alert("アプリのエラー:d9e836bf-bdf2-4ba1-896e-370ee585ca8c 配信サーバとの通信または配信サーバに異常があります。");
					retry = 0;
				}
                this.$onExit();
                return true;
			}
		],
		function() {
			StatusSection.Set(StatusSection.Type.InAction, "配信サーバと通信しています...");
			this.path = AUTH_PATH + "catalogue.json";
			this.etag = localStorage.getItem(PreferenceStorageKey.CatalogueETag);
			this.$1();
			return true;
		},
		RequestJsonSequence,
		function() {
			var catalogue = this.data;
			window.ff.ServerConnectionSuccessed();
			if (this.xhr.status == 304) {
				if (this.toNextUpdate === -1) {
					nextUpdate = NEXT_RELEASE_UNKNOWN_SPAN + new Date().getTime();
				} else if (this.toNextUpdate > NEXT_RELEASE_UPDATING_SPAN) {
					nextUpdate = this.toNextUpdate + new Date().getTime();
				}
				StatusSection.Set(StatusSection.Type.InAction, null);
				StatusSection.Set(StatusSection.Type.Schedule, null);
				return;
			}
			this.catalogueEtag = this.xhr.getResponseHeader("ETag");

			if (catalogue.next_release) {
				var d = new Date();
				d.setISO8601(catalogue.next_release);
				var year = d.getFullYear(); // 年
				var mon = d.getMonth() + 1; // 月
				var date = d.getDate(); // 日
				var hour = d.getHours(); // 時
				var min = d.getMinutes(); // 分

				this.nextUpdateText = year + "年" + mon + "月" + date + "日 "
						+ hour + "時" + min + "分";
			} else {
				this.nextUpdateText = "";
			}

			var lastSid = localStorage.getItem(PreferenceStorageKey.LastSeparationId);
			var local = catalogue.local;
			var from = 0;
			var i;
			for (i = 0; i < local.length; i++) {
				if (local[i] == lastSid) {
					from = i + 1;
					break;
				}
			}
			if (from == local.length) {
				if (this.toNextUpdate === -1) {
					nextUpdate = NEXT_RELEASE_UNKNOWN_SPAN + new Date().getTime();
				} else if (this.toNextUpdate > NEXT_RELEASE_UPDATING_SPAN) {
					nextUpdate = this.toNextUpdate + new Date().getTime();
				}
				StatusSection.Set(StatusSection.Type.InAction, null);
				StatusSection.Set(StatusSection.Type.Schedule, null);
				return;
			}

			var express = catalogue.express;
			var diffFilenameList = [];
			var jumpTo = null;
			for (i = from; i < local.length; i++) {
				if (jumpTo != null) {
					if (jumpTo == local[i]) {
						jumpTo = null;
					}
					continue;
				}
				if (express[local[i]]) {
					diffFilenameList.push(local[i] + express[local[i]]);
					jumpTo = express[local[i]];
				} else {
					diffFilenameList.push(local[i]);
				}
			}
			if (diffFilenameList.length === 0) {
				StatusSection.Set(StatusSection.Type.InAction, null);
				StatusSection.Set(StatusSection.Type.Schedule, null);
				return;
			}

			this.lastSeparationId = diffFilenameList[diffFilenameList.length - 1];
			this.updateEntryMap = {};
			this.diffFilenameList = diffFilenameList;
			this.$next();
			return true;
		},
		function() {
			StatusSection.Set(StatusSection.Type.InAction, "配信を受け取っています...");
			this.path = AUTH_PATH + this.diffFilenameList.shift() + ".json";
			this.etag = null;
			this.again = this.$self;
			this.$1();
			return true;
		},
		RequestJsonSequence,
		function() {
			for (var k in this.data) {
				if (this.data[k] === null) {
					localStorage.removeItem(k);
					this.updateEntryMap[k] = null;
				} else {
					localStorage.setItem(k, this.data[k]);
					this.updateEntryMap[k] = this.data[k];
				}
			}

			if (this.diffFilenameList.length === 0) {
				this.$next();
			} else {
				this.again();
			}
			return true;
		},
		function() {
			localStorage.setItem(PreferenceStorageKey.CatalogueETag, this.catalogueEtag);
			localStorage.setItem(PreferenceStorageKey.LastSeparationId, this.lastSeparationId);
			localStorage.setItem(PreferenceStorageKey.NextReleaseText, this.nextUpdateText);

			if (this.toNextUpdate === -1) {
				nextUpdate = NEXT_RELEASE_UNKNOWN_SPAN + new Date().getTime();
			} else if (this.toNextUpdate > NEXT_RELEASE_UPDATING_SPAN) {
				nextUpdate = this.toNextUpdate + new Date().getTime();
			}

			window.ff.CatalogueUpdated(this.catalogueEtag, this.lastSeparationId, "" + this.toNextUpdate);

			if (this.updateEntryMap[DepotStorageKey.Index] && isFirstRun) {
				isFirstRun = false;
				BuildDomTree();
			} else {
				// DOMツリーを更新
				if (this.updateEntryMap[DepotStorageKey.Index]) {
					BuildNav();
				}
				var updated = $();

				for ( var re in this.updateEntryMap) {
					if (this.updateEntryMap[re] === null && re.indexOf("h") === 0) {
						var ce = document.getElementById(re.substring(1, re.length));
						if (ce !== null) {
							ce.parentNode.removeChild(ce);
							delete ce;
						}
					}
				}
				if (this.updateEntryMap["h" + window.ff.StartSid] != null) {
					var c = $('#' + window.ff.StartSid);
					if (c.length) {
						c.html(this.updateEntryMap[ue]);
					} else {
						$('#content').prepend(
								'<div class="separation" id="' + window.ff.StartSid
										+ '">'
										+ this.updateEntryMap["h" + window.ff.StartSid]
										+ '</div>');
					}
					updated = updated.add('#' + window.ff.StartSid);
				}

				var beforeSid = window.ff.StartSid;
				for ( var sid = localStorage.getItem("n" + window.ff.StartSid); sid !== null; sid = localStorage
						.getItem("n" + sid)) {
					for ( var ue in this.updateEntryMap) {
						if ("h" + sid == ue) {
							var c = $('#' + sid);
							if (c.length) {
								c.html(this.updateEntryMap[ue]);
							} else {
								$('#' + beforeSid).after(
										'<div class="separation" id="' + sid + '">'
												+ this.updateEntryMap[ue] + '</div>');
							}
							updated = updated.add('#' + sid);
						}
					}
					beforeSid = sid;
				}

				FireEventContentUpdated(updated);
			}

			retry = 0;

			StatusSection.Set(StatusSection.Type.InAction, null);
			StatusSection.Set(StatusSection.Type.Schedule, "配信を受け取りました。");
		}
	], function() {	// exit
		isUpdating = false;
	},  function() {	// error
		StatusSection.Set(StatusSection.Type.Error, "配信サーバとの通信にエラーが発生しました。", "再接続", window.ff.FireUpdate);
	}, 50000, function() {	// timeout
		StatusSection.Set(StatusSection.Type.Error, "配信サーバとの通信がタイムアウトしました。", "再接続", window.ff.FireUpdate);
	});
	sequenceInstanceSet['UpdateImpl'] = UpdateImpl;

	var Update = {
			"Start" : function() {
				nextUpdate = NEXT_RELEASE_UPDATING_SPAN + new Date().getTime();
				if (isUpdating) {
					return;
				}
				UpdateImpl.Start();
			}
	};

	var RequestToken = new Sequence(window.ff.RequestTokenSequenceGenerator(),
			null, null, 40000, function() {	// timeout
		StatusSection.Set(StatusSection.Type.Error, "アプリの認証がタイムアウトしました。", "リトライ", function() { RequestToken.Start(); });
	});
	sequenceInstanceSet['RequestToken'] = RequestToken;

	function BuildNav() {
		var indexJson = localStorage.getItem(DepotStorageKey.Index);
		var nav = "";
		var indexList = $.parseJSON(indexJson);
		if (indexList.length > 0 && window.ff.StartSid == "") {
			SetStartSid(indexList[0].start);
		}
		for ( var i = 0; i < indexList.length; i++) {
			var index = indexList[i];
			nav += '<li><a href="javascript:void(0)" onclick="window.ff.OnLinkClick(\'' + index.start + '\'); return false;">'
					+ index.name + '</a></li>';
			if (index.start == window.ff.StartSid) {
				document.title = index.name;
			}
		}
		nav += '<li><a href="javascript:void(0)" onclick="window.ff.OnLinkClick(\'character_note\'); return false;">登場人物紹介</a></li>';
		nav += '<li><a href="javascript:void(0)" onclick="window.ff.OnLinkClick(\'about_this_app\'); return false;">このアプリについて</a></li>';
		nav += '<li><a href="http://kaoriha.org/latest_item.html">近刊案内</a></li>';

		$('#nav ul').html(nav);

		return indexList;
	}

	function BuildDomTree() {
		window.scrollTo(0, 0);
		var e = document.createEvent('Events');
		e.initEvent(window.ff.EVENT_BEFORE_REBUILD_PAGE, false, false);
		document.dispatchEvent(e);

		var indexJson = localStorage.getItem(DepotStorageKey.Index);
		if (indexJson != null) {
			BuildNav();

			var content = "";
			for ( var sid = window.ff.StartSid; sid !== null; sid = localStorage
					.getItem("n" + sid)) {
				if (localStorage.getItem("h" + sid)) {
					content += '<div class="separation" id="' + sid + '">';
					content += localStorage.getItem("h" + sid);
					content += '</div>';
				}
			}
			document.getElementById("content").innerHTML = content;
			FireEventContentUpdated($('.separation'));
		}
	}

	window.ff.RequestService = function(path, type, data, successFunc, errorFunc) {
		var opt = {
				"type" : type,
				"url" : window.ff.Site + path,
				"cache" : false,
				"success" : successFunc,
				"error" : errorFunc,
				"timeout" : TIMEOUT
		};
		if (data) {
			opt.data = data;
		}
		$.ajax(opt);
	};

	window.ff.HttpHeader = HttpHeader;

	window.ff.AuthStatus = AuthStatus;

	window.ff.CharacterNoteElement = '<a href="javascript:void(0)" onclick="window.ff.OnLinkClick(\'character_note\'); return false;">';

	window.ff.FireUpdate = function(after) {
		if (isUpdating || isContentFixed) {
			return;
		}
		if (!window.ff.IsConnectionOk()) {
			StatusSection.Set(StatusSection.Type.Error, "インターネットと接続されていません。", "再接続", window.ff.FireUpdate);
			return;
		}

		StatusSection.Set(StatusSection.Type.InAction, "配信サーバと接続します...");
		if (after) {
			nextUpdate = after + new Date().getTime();
		} else {
			nextUpdate = 0;
		}
	}

	function SetStartSid(sid) {
		localStorage.setItem(PreferenceStorageKey.LastOpenSid, sid);
		window.ff.StartSid = sid;
		isEnableRestoreScrollPosition = true;
	}

	var ClearAllStorageSequence = new Sequence([
		function() {
			navigator.notification.confirm('ストレージを削除します。よろしいですか？',
					this.$next,
					window.ff.Title,
					'いいえ,はい');
			return true;
		},
		function(button) {
			if (button === 2) {
		        window.localStorage.clear();
		        window.ff.AuthClearStorage();
		        Initialize.Start();
			}
		}
	]);
	window.ff.ClearAllStorage = function() { ClearAllStorageSequence.Start(); };

	var Initialize = new Sequence([
		function() {
			StatusSection.Set(StatusSection.Type.InAction, "初期化しています...");
			ScreenMode.Set(ScreenMode.Loading);

			if (localStorage.getItem(DepotStorageKey.Index) === null) {
				isFirstRun = true;
			} else if (localStorage.getItem(DepotStorageKey.IsContentFixed) !== null) {
				isContentFixed = true;
			}

			if (isContentFixed) {
				this.$next();
			} else {
				var opt = {
						"type" : "GET",
						"url" : TOTAL_JSON_URL,
						"success" : this.$1,
						"error" : this.$2,
						"dataType" : "json",
						"timeout" : TIMEOUT
				};
				$.ajax(opt);
			}

			return true;
		},
		[
			function(data, status, xhr) {	// success
				for (var k in data) {
					localStorage.setItem(k, data[k]);
				}
				localStorage.setItem(DepotStorageKey.IsContentFixed, "true");
				isContentFixed = true;
				isFirstRun = false;
			},
			function(xhr, status) {	// error
			}
		],
		function () {
			if (isContentFixed) {
				this.$next();
			} else {
				this.isFirstRun = isFirstRun;
				this.$1();
			}
		   return true;
		},
		window.ff.AuthStartSequenceGenerator(),
		function() {
			if (localStorage.getItem(PreferenceStorageKey.LastOpenSid) !== null) {
				window.ff.StartSid = localStorage.getItem(PreferenceStorageKey.LastOpenSid);
			} else {
				window.ff.StartSid = "";
			}
			isEnableRestoreScrollPosition = true;

			if (isFirstRun) {
				ScreenMode.Set(ScreenMode.NotInitialized);
				if (window.ff.IsConnectionOk()) {
					StatusSection.Set(StatusSection.Type.InAction, "配信サーバと接続します...");
					Update.Start();
				} else {
					StatusSection.Set(StatusSection.Type.Error, "配信サーバと接続できないため、なにもお見せできません。",
							"再接続", window.ff.FireUpdate);
				}
			} else {
				BuildDomTree();
				StatusSection.Set(StatusSection.Type.InAction, null);
			}

			setInterval(Tick, 1000);

			document.addEventListener("resume", function() {
				window.ff.FireUpdate(1000);
			}, false);
		}
	], null, function() {	//onError
		document.addEventListener("resume", function() {
			document.removeEventListener("resume", arguments.callee, false);
			Initialize.Start();
		}, false);
		ScreenMode.Set(ScreenMode.NotInitialized);
		StatusSection.Set(StatusSection.Type.Error, "初期化に失敗しました。",
			"リトライ", function() { Initialize.Start() });
	});
	sequenceInstanceSet['Initialize'] = Initialize;

	window.ff.Start = function() {
		$(document).bind(EVENT_CONTENT_UPDATED, function(e) {
			if (isEnableRestoreScrollPosition) {
				isEnableRestoreScrollPosition = false;
				ScreenMode.Set(ScreenMode.Scrolling);
				RestoreScrollPosition.Start();
			}
		});

		Initialize.Start();
	};

	document.addEventListener('deviceready', function() {
		window.ff.Start();
	}, false);
})();
