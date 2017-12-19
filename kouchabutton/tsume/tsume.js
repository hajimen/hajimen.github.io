// tsume.js 2011/09/30
/*
    Copyright 2011 中里一

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
// ref:
// W3C Working Group Note日本語組版処理の要件（日本語版） http://www.w3.org/TR/2009/NOTE-jlreq-20090604/ja/

(function() {
    // refの定める文字クラス
	var 終わり括弧類 = "’”）〕］｝〉》」』】⦆〙〗»〟";
	var ハイフン類 = "‐〜゠–";
	var 区切り約物 = "？！‼⁇⁈⁉";
	var 中点類	 = "・：；";
	var 句点類	 = "。．";
	var 読点類	 = "、，";
	var 繰返し記号 = "ヽヾゝゞ々〻";
	var 長音記号 = "ー";
	var 小書きの仮名 = "ぁぃぅぇぉァィゥェォっゃゅょゎゕゖッャュョヮヵヶㇰㇱㇲㇳㇴㇵㇶㇷㇸㇹㇺㇻㇼㇽㇾㇿㇷ゚";
	var 割注終わり括弧類 = "）〕］";
	var 始め括弧類 = "‘“（〔［｛〈《「『【⦅〘〖«〝";
	var 割注始め括弧類 = "（〔［";

    // tsume独自の文字クラス
	var ダッシュ類 = "～―—…";
	var 前アキ括弧類 = "‘“（〔［｛〈《「『【〘〖〝（〔［";
	var 後アキ括弧類 = "’”）〕］｝〉》」』】〙〗〟）〕］";
	var 全角空白 = "　";

    var 行頭禁則 = 終わり括弧類 + ハイフン類 + 区切り約物 + 中点類 + 句点類 + 読点類 + 繰返し記号
        + 長音記号 + 小書きの仮名 + 割注終わり括弧類 + 全角空白;
    var 行末禁則 = 始め括弧類 + 割注始め括弧類;
    
    // 吸着性: この文字クラスに属する文字を前後両方に持つ文字間は、前後の文字のアキ量のうち小さいほうだけを残す
    // それ以外の場合、前後の文字のアキ量のうち大きいほうだけを残す
    var 吸着性 = 終わり括弧類 + ハイフン類 + 区切り約物 + 中点類 + 句点類 + 読点類 + 割注終わり括弧類
        + 始め括弧類 + 割注始め括弧類 + 全角空白 + ダッシュ類;

    var ぶら下げ = 句点類 + 読点類;

    var 前二分アキ = 前アキ括弧類;
    var 後二分アキ = 後アキ括弧類 + 句点類 + 読点類;
    var 前四分アキ = 中点類 + "！";
    var 後四分アキ = 中点類 + "！";

    // 半角スペースの幅
    var space_em = 0.25;

    // hf: html fragment string
    function is吸着性(c) {
        return 吸着性.indexOf(c) !== -1;
    }
    function 前アキ量(c) {
        if (前二分アキ.indexOf(c) !== -1) {
            return 0.5;
        }
        if (前四分アキ.indexOf(c) !== -1) {
            return 0.25;
        }
        return 0.0;
    }
    function 後アキ量(c) {
        if (後二分アキ.indexOf(c) !== -1) {
            return 0.5;
        }
        if (後四分アキ.indexOf(c) !== -1) {
            return 0.25;
        }
        return 0.0;
    }
    function is行頭禁則(c) {
        return 行頭禁則.indexOf(c) !== -1;
    }
    function is行末禁則(c) {
        return 行末禁則.indexOf(c) !== -1;
    }
    function isぶら下げ(c) {
        return ぶら下げ.indexOf(c) !== -1;
    }
    function getCssMarginClassName(ml, mr) {
        var cn = "";
        if (ml === 0.25) {
            cn += "tsume-ml4 ";
        } else if (ml === 0.5) {
            cn += "tsume-ml2 ";
        } else if (ml === 0.75) {
            cn += "tsume-ml34 ";
        } else if (ml === 1.0) {
            cn += "tsume-ml1 ";
        }
        if (mr === 0.25) {
            cn += "tsume-mr4";
        } else if (mr === 0.5) {
            cn += "tsume-mr2";
        } else if (mr === 0.75) {
            cn += "tsume-mr34";
        } else if (mr === 1.0) {
            cn += "tsume-mr1";
        }
        return cn;
    }
    function getCssAkiClassName(a) {
        var as = a - space_em;
        var cn = "";
        if (as === 0.0) {
            cn += "tsume-a0";
        } else if (as === 0.25) {
            cn += "tsume-a4";
        } else if (as === 0.5) {
            cn += "tsume-a2";
        } else if (as === 0.75) {
            cn += "tsume-a34";
        } else if (as === 1.0) {
            cn += "tsume-a1";
        }
        return cn;
    }
    function main(hf) {
        var n = hf.length;
        var mla = new Array(n); // 左マージン量（符号逆）
        var mra = new Array(n); // 右マージン量（符号逆）
        var aa = new Array(n); // 字間のアキ量、indexは左文字のpos
        var nba = new Array(n); // 改行禁止の字間ならtrue、indexは左文字のpos

        var firstR = hf.substr(0, 1);
        if (前アキ量(firstR) > 0.0) {
            mla[0] = 前アキ量(firstR);
        } else {
            mla[0] = 0.0;
        }
        for(var i = 0; i < n - 1; i ++) {   // iは左文字のpos
            var l = hf.substr(i, 1);
            var r = hf.substr(i + 1, 1);
            var akiL = 後アキ量(l);
            var akiR = 前アキ量(r);
            var akiMin = Math.min(akiL, akiR);
            var akiMax = Math.max(akiL, akiR);

            var a = 0.0;
            var tr = 0.0;
            var tl = 0.0;
            var nb = is行末禁則(l) || is行頭禁則(r);

            if (akiMax > 0.0) {
                if (is吸着性(l) && is吸着性(r)) {
                    // 小さいほうのアキ量だけを残す
                    if (nb) {
                        // 大きいほうのアキ量をマージンとして削るだけで、アキを入れない
                        if (akiMax == akiL) {
                            tl = akiL;
                        } else {
                            tr = akiR;
                        }
                    } else {
                        // 小さいほうのアキ量をアキとして入れ、アキ量をマージンとして削る
                        a = akiMin;
                        tr = akiR;
                        tl = akiL;
                    }
                } else {
                    // 大きいほうのアキ量だけを残す
                    if (nb) {
                        // 小さいほうのアキ量をマージンとして削るだけで、アキを入れない
                        if (akiMin == akiL) {
                            tl = akiL;
                        } else {
                            tr = akiR;
                        }
                    } else {
                        // 大きいほうのアキ量をアキとして入れ、アキ量をマージンとして削る
                        a = akiMax;
                        tr = akiR;
                        tl = akiL;
                    }
                }
            }
            aa[i] = a;
            nba[i] = nb;
            mla[i + 1] = tr;
            mra[i] = tl;
        }

        var lastL = hf.substr(n - 1, 1);
        if (後アキ量(lastL) > 0.0) {
            mra[n - 1] = 後アキ量(lastL);
        }
        
        var newHf = "";
        for (i = 0; i < n - 1; i ++) {
            var c = hf.substr(i, 1);
            var mr = mra[i];
            var ml = mla[i];
            var a = aa[i];
            var nb = nba[i];

            if (c === 全角空白 && i > 0) {
                a = 1.0;
                nb = false;
            } else if (mr === 0.0 && ml === 0.0) {
                newHf += c;
            } else {
                if (isぶら下げ(c) && !nb) {
                    a += 1.0 - (ml + mr);
                    newHf += '<span class="tsume-po"><span class="tsume-pi">' + c + '</span></span>';
                } else {
                    newHf += '<span class="' + getCssMarginClassName(ml, mr) + '">' + c + '</span>';
                }
            }

            if (nb) {
                newHf += '&#65279;';    // 幅なし改行なしスペース
            }

            if (a > 0.0) {
                if (a === space_em) {
                    newHf += ' ';
                } else {
                    newHf += '<span class="' + getCssAkiClassName(a) + '"> </span>';
                }
            }
        }
        newHf += hf.substr(i, 1);
        return newHf;
    }

    // elements: jQuery object
    window.tsume = function(elements) {
        elements.each(
            function(index, el) {
                var hf = $(el).html();
                $(el).html(main(hf));
            }
        )
    };
})();
