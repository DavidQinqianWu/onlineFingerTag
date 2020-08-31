// abc2svg - ABC to SVG translator
// @source: https://chiselapp.com/user/moinejf/repository/abc2svg
// Copyright (C) 2014-2020 Jean-Francois Moine - LGPL3+
// abc2svg - abc2svg.js
//
// Copyright (C) 2014-2020 Jean-Francois Moine
//
// This file is part of abc2svg-core.
//
// abc2svg-core is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// abc2svg-core is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with abc2svg-core.  If not, see <http://www.gnu.org/licenses/>.

// define the abc2svg object is not yet done
if (typeof abc2svg == "undefined") var abc2svg = {};

// constants
abc2svg.C = {
  BLEN: 1536,

  // symbol types
  BAR: 0,
  CLEF: 1,
  CUSTOS: 2,
  GRACE: 4,
  KEY: 5,
  METER: 6,
  MREST: 7,
  NOTE: 8,
  PART: 9,
  REST: 10,
  SPACE: 11,
  STAVES: 12,
  STBRK: 13,
  TEMPO: 14,
  BLOCK: 16,
  REMARK: 17,

  // note heads
  FULL: 0,
  EMPTY: 1,
  OVAL: 2,
  OVALBARS: 3,
  SQUARE: 4,

  // slur/tie types (3 + 1 bits)
  SL_ABOVE: 0x01,
  SL_BELOW: 0x02,
  SL_AUTO: 0x03,
  SL_HIDDEN: 0x04,
  SL_DOTTED: 0x08, // (modifier bit)
};

// !! tied to the symbol types in abc2svg.js !!
abc2svg.sym_name = [
  "bar",
  "clef",
  "custos",
  "",
  "grace",
  "key",
  "meter",
  "Zrest",
  "note",
  "part",
  "rest",
  "yspace",
  "staves",
  "Break",
  "tempo",
  "",
  "block",
  "remark",
];

// key table - index = number of accidentals + 7
abc2svg.keys = [
  new Int8Array([-1, -1, -1, -1, -1, -1, -1]), // 7 flat signs
  new Int8Array([-1, -1, -1, 0, -1, -1, -1]), // 6 flat signs
  new Int8Array([0, -1, -1, 0, -1, -1, -1]), // 5 flat signs
  new Int8Array([0, -1, -1, 0, 0, -1, -1]), // 4 flat signs
  new Int8Array([0, 0, -1, 0, 0, -1, -1]), // 3 flat signs
  new Int8Array([0, 0, -1, 0, 0, 0, -1]), // 2 flat signs
  new Int8Array([0, 0, 0, 0, 0, 0, -1]), // 1 flat signs
  new Int8Array([0, 0, 0, 0, 0, 0, 0]), // no accidental
  new Int8Array([0, 0, 0, 1, 0, 0, 0]), // 1 sharp signs
  new Int8Array([1, 0, 0, 1, 0, 0, 0]), // 2 sharp signs
  new Int8Array([1, 0, 0, 1, 1, 0, 0]), // 3 sharp signs
  new Int8Array([1, 1, 0, 1, 1, 0, 0]), // 4 sharp signs
  new Int8Array([1, 1, 0, 1, 1, 1, 0]), // 5 sharp signs
  new Int8Array([1, 1, 1, 1, 1, 1, 0]), // 6 sharp signs
  new Int8Array([1, 1, 1, 1, 1, 1, 1]), // 7 sharp signs
];

// base-40 representation of musical pitch
// (http://www.ccarh.org/publications/reprints/base40/)
abc2svg.p_b40 = new Int8Array( // staff pitch to base-40
  //		  C  D   E   F   G   A   B
  [2, 8, 14, 19, 25, 31, 37]
);
abc2svg.b40_p = new Int8Array( // base-40 to staff pitch
  //		       C		 D
  [
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    1,
    1,
    //	      E		     F		       G
    2,
    2,
    2,
    2,
    2,
    3,
    3,
    3,
    3,
    3,
    3,
    4,
    4,
    4,
    4,
    4,
    4,
    //	      A			B
    5,
    5,
    5,
    5,
    5,
    5,
    6,
    6,
    6,
    6,
    6,
  ]
);
abc2svg.b40_a = new Int8Array( // base-40 to accidental
  //		         C		     D
  [
    -2,
    -1,
    0,
    1,
    2,
    0,
    -2,
    -1,
    0,
    1,
    2,
    0,
    //		E		 F		     G
    -2,
    -1,
    0,
    1,
    2,
    -2,
    -1,
    0,
    1,
    2,
    0,
    -2,
    -1,
    0,
    1,
    2,
    0,
    //		A		    B
    -2,
    -1,
    0,
    1,
    2,
    0,
    -2,
    -1,
    0,
    1,
    2,
  ]
);
abc2svg.b40_m = new Int8Array( // base-40 to midi
  //			 C		   D
  [
    -2,
    -1,
    0,
    1,
    2,
    0,
    0,
    1,
    2,
    3,
    4,
    0,
    //	      E		     F		       G
    2,
    3,
    4,
    5,
    6,
    3,
    4,
    5,
    6,
    7,
    0,
    5,
    6,
    7,
    8,
    9,
    0,
    //	      A			    B
    7,
    8,
    9,
    10,
    11,
    0,
    9,
    10,
    11,
    12,
    13,
  ]
);
abc2svg.b40k = new Int8Array( // base-40 interval to possible transposition
  //		        C		  D
  [
    36,
    1,
    2,
    3,
    8,
    2,
    2,
    7,
    8,
    13,
    14,
    2,
    //		    37
    //	       E	      F		        G
    8,
    13,
    14,
    19,
    20,
    13,
    14,
    19,
    20,
    25,
    2,
    19,
    24,
    25,
    30,
    31,
    2,
    //					    20
    //	       A		 B
    25,
    30,
    31,
    36,
    37,
    2,
    31,
    36,
    37,
    38,
    3,
  ]
);
//				    2
abc2svg.b40sf = new Int8Array( // base-40 interval to key signature
  //		        C		   D
  [
    -2,
    -7,
    0,
    7,
    2,
    88,
    0,
    -5,
    2,
    -3,
    4,
    88,
    //	       E	      F		        G
    2,
    -3,
    4,
    -1,
    6,
    -3,
    4,
    -1,
    6,
    1,
    88,
    -1,
    -6,
    1,
    -4,
    3,
    88,
    //	       A		 B
    1,
    -4,
    3,
    -2,
    5,
    88,
    3,
    -2,
    5,
    0,
    7,
  ]
);
abc2svg.isb40 = new Int8Array([0, 1, 6, 11, 12, 17, 18, 23, 28, 29, 34, 35]); // interval with sharp to base-40 interval
abc2svg.ifb40 = new Int8Array([0, 5, 6, 11, 12, 17, 22, 23, 28, 29, 34, 39]); // interval with flat to base-40 interval

abc2svg.pab40 = function (p, a) {
  p += 19; // staff pitch from C-1
  var b40 = ((p / 7) | 0) * 40 + abc2svg.p_b40[p % 7];
  if (a && a != 3)
    // if some accidental, but not natural
    b40 += a;
  return b40;
}; // pit2b40()
abc2svg.b40p = function (b) {
  return ((b / 40) | 0) * 7 + abc2svg.b40_p[b % 40] - 19;
}; // b40p()
abc2svg.b40a = function (b) {
  return abc2svg.b40_a[b % 40];
}; // b40a()
abc2svg.b40m = function (b) {
  return ((b / 40) | 0) * 12 + abc2svg.b40_m[b % 40];
}; // b40m()

// simplify a rational number n/d
abc2svg.rat = function (n, d) {
  var a,
    t,
    n0 = 0,
    d1 = 0,
    n1 = 1,
    d0 = 1;
  while (1) {
    if (d == 0) break;
    t = d;
    a = (n / d) | 0;
    d = n % d;
    n = t;
    t = n0 + a * n1;
    n0 = n1;
    n1 = t;
    t = d0 + a * d1;
    d0 = d1;
    d1 = t;
  }
  return [n1, d1];
}; // rat()

// compare pitches
// This function is used to sort the note pitches
abc2svg.pitcmp = function (n1, n2) {
  return n1.pit - n2.pit;
};
// YYMComment: 程序入口
// start of the Abc object
abc2svg.Abc = function (user) {
  "use strict";

  // constants
  var C = abc2svg.C;

  // mask some unsafe functions
  var require = empty_function,
    system = empty_function,
    write = empty_function,
    XMLHttpRequest = empty_function;

  // -- constants --

  // staff system
  var OPEN_BRACE = 0x01,
    CLOSE_BRACE = 0x02,
    OPEN_BRACKET = 0x04,
    CLOSE_BRACKET = 0x08,
    OPEN_PARENTH = 0x10,
    CLOSE_PARENTH = 0x20,
    STOP_BAR = 0x40,
    FL_VOICE = 0x80,
    OPEN_BRACE2 = 0x0100,
    CLOSE_BRACE2 = 0x0200,
    OPEN_BRACKET2 = 0x0400,
    CLOSE_BRACKET2 = 0x0800,
    MASTER_VOICE = 0x1000,
    IN = 96, // resolution 96 PPI
    // YYMCode: 修改 CM 值, 根据屏幕自适应
    CM = user.page_width_yym / 21 || 37.8,
    /* number of steps for y offsets */
    YSTEP = 256;

  // error texts
  var errs = {
    bad_char: "Bad character '$1'",
    bad_grace: "Bad character in grace note sequence",
    bad_transp: "Bad transpose value",
    bad_val: "Bad value in $1",
    bar_grace: "Cannot have a bar in grace notes",
    ignored: "$1: inside tune - ignored",
    misplaced: "Misplaced '$1' in %%score",
    must_note: "!$1! must be on a note",
    must_note_rest: "!$1! must be on a note or a rest",
    nonote_vo: "No note in voice overlay",
    not_ascii: "Not an ASCII character",
    not_enough_n: "Not enough notes/rests for %%repeat",
    not_enough_m: "Not enough measures for %%repeat",
    not_enough_p: "Not enough parameters in %%map",
    not_in_tune: "Cannot have '$1' inside a tune",
    notransp: "Cannot transpose with a temperament",
  };
  // needed for modules
  var self = this,
    glovar = {
      meter: {
        type: C.METER, // meter in tune header
        wmeasure: 1, // no M:
        a_meter: [], // default: none
      },
    },
    info = {}, // information fields
    parse = {
      ctx: {},
      prefix: "%",
      state: 0,
      ottava: [],
      line: new scanBuf(),
    },
    tunes = [], // first time symbol and voice array per tune for playing
    psvg; // PostScript

  // utilities
  function clone(obj, lvl) {
    if (!obj) return obj;
    var tmp = new obj.constructor();
    for (var k in obj)
      if (obj.hasOwnProperty(k)) {
        if (lvl && typeof obj[k] != "number") tmp[k] = clone(obj[k], lvl - 1);
        else tmp[k] = obj[k];
      }
    return tmp;
  }

  function errbld(sev, txt, fn, idx) {
    var i, j, l, c, h;

    if (user.errbld) {
      switch (sev) {
        case 0:
          sev = "warn";
          break;
        case 1:
          sev = "error";
          break;
        default:
          sev = "fatal";
          break;
      }
      user.errbld(sev, txt, fn, idx);
      return;
    }
    if (idx != undefined && idx >= 0) {
      i = l = 0;
      while (1) {
        j = parse.file.indexOf("\n", i);
        if (j < 0 || j > idx) break;
        l++;
        i = j + 1;
      }
      c = idx - i;
    }
    h = "";
    if (fn) {
      h = fn;
      if (l) h += ":" + (l + 1) + ":" + (c + 1);
      h += " ";
    }
    switch (sev) {
      case 0:
        h += "Warning: ";
        break;
      case 1:
        h += "Error: ";
        break;
      default:
        h += "Internal bug: ";
        break;
    }
    user.errmsg(h + txt, l, c);
  }

  function error(sev, s, msg, a1, a2, a3, a4) {
    var i, j, regex, tmp;

    if (!sev && cfmt.quiet) return;
    if (s) {
      if (s.err)
        // only one error message per symbol
        return;
      s.err = true;
    }
    if (user.textrans) {
      tmp = user.textrans[msg];
      if (tmp) msg = tmp;
    }
    if (arguments.length > 3)
      msg = msg.replace(/\$./g, function (a) {
        switch (a) {
          case "$1":
            return a1;
          case "$2":
            return a2;
          case "$3":
            return a3;
          default:
            return a4;
        }
      });
    if (s && s.fname) errbld(sev, msg, s.fname, s.istart);
    // YYMCode: 修改代码反馈错误信息, bug版本
    else {
      if (s && s.istart) {
        let tempEnd;
        // 没有isend 就给10 长度
        if (!s.iend) {
          tempEnd = s.istart;
        } else {
          tempEnd = s.iend;
        }

        let count = 0;
        let measureRecorder = 0;
        let finalMeasure = "";
        while (true) {
          let start = tempEnd + count;
          let temp = Abc.prototype.myfileString.substr(start, 2);
          if (temp === " |") {
            //说明已经到了小节号标签了
            measureRecorder++;
          } else if (temp === " %") {
            //说明到了小节标注地方
            let measureNumber = 0;
            while (true) {
              // start的位置找到“ %” 然后在往后两个, 是开始小节号
              let numberTemp = parseInt(
                Abc.prototype.myfileString.substr(start + 2 + measureNumber, 1)
              ).toString();
              if (numberTemp !== "NaN") {
                finalMeasure += numberTemp;
                measureNumber++;
              } else {
                break;
              }
            }
            finalMeasure = parseInt(finalMeasure) - measureRecorder + 1;
            break;
          }
          count++;
        }
        let exportString = `ab字段是: ${Abc.prototype.myfileString.slice(
          s.istart,
          tempEnd
        )}`;
        errbld(sev, msg, exportString, `第${finalMeasure}小节`);
      } else {
        errbld(sev, msg);
      }
    }
    // ******************/
  }
  // scanning functions
  function scanBuf() {
    //	this.buffer = buffer
    this.index = 0;

    scanBuf.prototype.char = function () {
      return this.buffer[this.index];
    };
    scanBuf.prototype.next_char = function () {
      return this.buffer[++this.index];
    };
    scanBuf.prototype.get_int = function () {
      var val = 0,
        c = this.buffer[this.index];
      while (c >= "0" && c <= "9") {
        val = val * 10 + Number(c);
        c = this.next_char();
      }
      return val;
    };
  }

  function syntax(sev, msg, a1, a2, a3, a4) {
    var s = {
      fname: parse.fname,
      istart: parse.istart + parse.line.index,
    };

    error(sev, s, msg, a1, a2, a3, a4);
  }

  // inject javascript code
  function js_inject(js) {
    if (!/eval *\(|Function|setTimeout|setInterval/.test(js))
      eval('"use strict";\n' + js);
    else syntax(1, "Unsecure code");
  }

  var dd_tb = {}, // definition of the decorations
    a_de; // array of the decoration elements

  // decorations - populate with standard decorations
  var decos = {
      dot: "0 stc 5 1 1",
      tenuto: "0 emb 5 3 3",
      slide: "1 sld 3 7 0",
      arpeggio: "2 arp 12 10 0",
      roll: "3 roll 7 6 6",
      fermata: "3 hld 10 7 7",
      emphasis: "3 accent 7 4 4",
      lowermordent: "3 lmrd 10 5 5",
      coda: "3 coda 24 10 10",
      uppermordent: "3 umrd 10 5 5",
      segno: "3 sgno 22 8 8",
      trill: "3 trl 14 5 5",
      upbow: "3 upb 10 5 5",
      downbow: "3 dnb 9 5 5",
      gmark: "3 grm 6 5 5",
      wedge: "0 wedge 7 3 3", // (staccatissimo or spiccato)
      turnx: "3 turnx 10 0 5",
      breath: "3 brth 0 1 20",
      longphrase: "3 lphr 0 1 1",
      mediumphrase: "3 mphr 0 1 1",
      shortphrase: "3 sphr 0 1 1",
      invertedfermata: "3 hld 10 7 7",
      invertedturn: "3 turn 10 0 5",
      invertedturnx: "3 turnx 10 0 5",
      "0": "3 fng 8 3 3 0",
      "1": "3 fng 8 3 3 1",
      "2": "3 fng 8 3 3 2",
      "3": "3 fng 8 3 3 3",
      "4": "3 fng 8 3 3 4",
      "5": "3 fng 8 3 3 5",
      plus: "3 dplus 7 3 3",
      "+": "3 dplus 7 3 3",
      accent: "3 accent 7 4 4",
      ">": "3 accent 7 4 4",
      marcato: "3 marcato 9 3 3",
      "^": "3 marcato 9 3 3",
      mordent: "3 lmrd 10 5 5",
      open: "3 opend 10 3 3",
      snap: "3 snap 14 3 3",
      thumb: "3 thumb 14 3 3",
      dacapo: "3 dacs 16 20 20 Da Capo",
      dacoda: "3 dacs 16 20 20 Da Coda",
      "D.C.": "3 dcap 16 10 10",
      "D.S.": "3 dsgn 16 10 10",
      "D.C.alcoda": "3 dacs 16 38 38 D.C. al Coda",
      "D.S.alcoda": "3 dacs 16 38 38 D.S. al Coda",
      "D.C.alfine": "3 dacs 16 38 38 D.C. al Fine",
      "D.S.alfine": "3 dacs 16 38 38 D.S. al Fine",
      fine: "3 dacs 16 10 10 Fine",
      turn: "3 turn 10 0 5",
      "trill(": "3 ltr 8 0 0",
      "trill)": "3 ltr 8 0 0",
      f: "6 f 18 1 7",
      ff: "6 ff 18 2 10",
      fff: "6 fff 18 4 13",
      ffff: "6 ffff 18 6 16",
      mf: "6 mf 18 6 13",
      mp: "6 mp 18 6 16",
      p: "6 p 18 2 8",
      pp: "6 pp 18 5 14",
      ppp: "6 ppp 18 8 20",
      pppp: "6 pppp 18 10 25",
      pralltriller: "3 umrd 10 5 5",
      sfz: "6 sfz 18 4 10",
      ped: "4 ped 18 6 10",
      "ped-up": "4 pedoff 12 4 4",
      "ped(": "4 lped 20 1 1",
      "ped)": "4 lped 20 1 1",
      "crescendo(": "6 cresc 18 0 0",
      "crescendo)": "6 cresc 18 0 0",
      "<(": "6 cresc 18 0 0",
      "<)": "6 cresc 18 0 0",
      "diminuendo(": "6 dim 18 0 0",
      "diminuendo)": "6 dim 18 0 0",
      ">(": "6 dim 18 0 0",
      ">)": "6 dim 18 0 0",
      "-(": "8 gliss 0 0 0",
      "-)": "8 gliss 0 0 0",
      "~(": "8 glisq 0 0 0",
      "~)": "8 glisq 0 0 0",
      "8va(": "3 8va 10 0 0",
      "8va)": "3 8va 10 0 0",
      "8vb(": "4 8vb 10 0 0",
      "8vb)": "4 8vb 10 0 0",
      "15ma(": "3 15ma 10 0 0",
      "15ma)": "3 15ma 10 0 0",
      "15mb(": "4 15mb 10 0 0",
      "15mb)": "4 15mb 10 0 0",
      // internal
      //	color: "10 0 0 0 0",
      invisible: "32 0 0 0 0",
      beamon: "33 0 0 0 0",
      trem1: "34 0 0 0 0",
      trem2: "34 0 0 0 0",
      trem3: "34 0 0 0 0",
      trem4: "34 0 0 0 0",
      xstem: "35 0 0 0 0",
      beambr1: "36 0 0 0 0",
      beambr2: "36 0 0 0 0",
      rbstop: "37 0 0 0 0",
      "/": "38 0 0 6 6",
      "//": "38 0 0 6 6",
      "///": "38 0 0 6 6",
      "beam-accel": "39 0 0 0 0",
      "beam-rall": "39 0 0 0 0",
      stemless: "40 0 0 0 0",
      rbend: "41 0 0 0 0",
      editorial: "42 0 0 0 0",
      "sacc-1": "3 sacc-1 6,4 4 4",
      sacc3: "3 sacc3 6,5 4 4",
      sacc1: "3 sacc1 6,4 4 4",
      courtesy: "43 0 0 0 0",
      "cacc-1": "3 cacc-1 0 0 0",
      cacc3: "3 cacc3 0 0 0",
      cacc1: "3 cacc1 0 0 0",
    },
    // types of decoration per function
    f_near = [true, true, true],
    f_note = [false, false, false, true, true, true, false, false, true],
    f_staff = [false, false, false, false, false, false, true, true];

  /* -- get the max/min vertical offset -- */
  function y_get(st, up, x, w) {
    var y,
      p_staff = staff_tb[st],
      i = ((x / realwidth) * YSTEP) | 0,
      j = (((x + w) / realwidth) * YSTEP) | 0;

    if (i < 0) i = 0;
    if (j >= YSTEP) {
      j = YSTEP - 1;
      if (i > j) i = j;
    }
    if (up) {
      y = p_staff.top[i++];
      while (i <= j) {
        if (y < p_staff.top[i]) y = p_staff.top[i];
        i++;
      }
    } else {
      y = p_staff.bot[i++];
      while (i <= j) {
        if (y > p_staff.bot[i]) y = p_staff.bot[i];
        i++;
      }
    }
    return y;
  }

  /* -- adjust the vertical offsets -- */
  function y_set(st, up, x, w, y) {
    var p_staff = staff_tb[st],
      i = ((x / realwidth) * YSTEP) | 0,
      j = (((x + w) / realwidth) * YSTEP) | 0;

    /* (may occur when annotation on 'y' at start of an empty staff) */
    if (i < 0) i = 0;
    if (j >= YSTEP) {
      j = YSTEP - 1;
      if (i > j) i = j;
    }
    if (up) {
      while (i <= j) {
        if (p_staff.top[i] < y) p_staff.top[i] = y;
        i++;
      }
    } else {
      while (i <= j) {
        if (p_staff.bot[i] > y) p_staff.bot[i] = y;
        i++;
      }
    }
  }

  /* -- get the staff position of the dynamic and volume marks -- */
  function up_p(s, pos) {
    switch (pos) {
      case C.SL_ABOVE:
        return true;
      case C.SL_BELOW:
        return false;
    }
    if (s.multi && s.multi != 0) return s.multi > 0;
    if (!s.p_v.have_ly) return false;

    /* above if the lyrics are below the staff */
    return s.pos.voc != C.SL_ABOVE;
  }

  /* -- drawing functions -- */
  /* 2: special case for arpeggio */
  function d_arp(de) {
    var m,
      h,
      dx,
      s = de.s,
      dd = de.dd,
      xc = 5;

    if (s.type == C.NOTE) {
      for (m = 0; m <= s.nhd; m++) {
        if (s.notes[m].acc) {
          dx = 5 + s.notes[m].shac;
        } else {
          dx = 6 - s.notes[m].shhd;
          switch (s.head) {
            case C.SQUARE:
              dx += 3.5;
              break;
            case C.OVALBARS:
            case C.OVAL:
              dx += 2;
              break;
          }
        }
        if (dx > xc) xc = dx;
      }
    }
    h = 3 * (s.notes[s.nhd].pit - s.notes[0].pit) + 4;
    m = dd.h; /* minimum height */
    if (h < m) h = m;

    de.has_val = true;
    de.val = h;
    //	de.x = s.x - xc;
    de.x -= xc;
    de.y = 3 * (s.notes[0].pit - 18) - 3;
  }

  // special case for long dynamic decorations
  function d_cresc(de) {
    if (de.ldst)
      // skip start of deco
      return;
    var s,
      dd,
      dd2,
      up,
      x,
      dx,
      x2,
      i,
      s2 = de.s,
      de2 = de.start /* start of the deco */,
      de2_prev,
      de_next;

    s = de2.s;
    x = s.x + 3;
    i = de2.ix;
    if (i > 0) de2_prev = a_de[i - 1];

    de.st = s2.st;
    de.lden = false; /* old behaviour */
    de.has_val = true;
    up = up_p(s2, s2.pos.dyn);
    if (up) de.up = true;

    // shift the starting point if any dynamic mark on the left
    if (
      de2_prev &&
      de2_prev.s == s &&
      ((de.up && !de2_prev.up) || (!de.up && de2_prev.up))
    ) {
      dd2 = de2_prev.dd;
      if (f_staff[dd2.func]) {
        // if dynamic mark
        x2 = de2_prev.x + de2_prev.val + 4;
        if (x2 > x) x = x2;
      }
    }

    if (de.defl.noen) {
      /* if no decoration end */
      dx = de.x - x;
      if (dx < 20) {
        x = de.x - 20 - 3;
        dx = 20;
      }
    } else {
      // shift the ending point if any dynamic mark on the right
      x2 = s2.x;
      de_next = a_de[de.ix + 1];
      if (
        de_next &&
        de_next.s == s &&
        ((de.up && !de_next.up) || (!de.up && de_next.up))
      ) {
        dd2 = de_next.dd;
        if (f_staff[dd2.func])
          // if dynamic mark
          x2 -= 5;
      }
      dx = x2 - x - 4;
      if (dx < 20) {
        x -= (20 - dx) * 0.5;
        dx = 20;
      }
    }

    de.val = dx;
    de.x = x;
    de.y = y_get(de.st, up, x, dx);
    if (!up) {
      dd = de.dd;
      de.y -= dd.h;
    }
    /* (y_set is done later in draw_deco_staff) */
  }

  /* 0: near the note (dot, tenuto) */
  function d_near(de) {
    var y,
      up,
      s = de.s,
      dd = de.dd;

    if (dd.str) {
      // annotation like decoration
      //		de.x = s.x;
      //		de.y = s.y;
      return;
    }
    if (s.multi) up = s.multi > 0;
    else up = s.stem < 0;
    if (up) {
      y = s.ymx | 0;
    } else if (dd.name[0] == "w") {
      de.inv = true;
      y = s.ymn;
    } else {
      y = s.ymn - dd.h;
    }
    if (y > -6 && y < 24) {
      if (up) y += 3;
      y = (((y + 6) / 6) | 0) * 6 - 6; /* between lines */
    }
    if (up) s.ymx = y + dd.h;
    else if (dd.name[0] == "w")
      // wedge
      s.ymn = y - dd.h;
    else s.ymn = y;
    de.y = y;
    if (s.type == C.NOTE) de.x += s.notes[s.stem >= 0 ? 0 : s.nhd].shhd;
    if (dd.name[0] == "d" /* if dot decoration */ && s.nflags >= -1) {
      /* on stem */
      if (up) {
        if (s.stem > 0) de.x += 3.5; // stem_xoff
      } else {
        if (s.stem < 0) de.x -= 3.5;
      }
    }
  }

  /* 6: dynamic marks */
  function d_pf(de) {
    var dd2,
      x2,
      x,
      up,
      s = de.s,
      dd = de.dd,
      de_prev;

    // don't treat here the long decorations
    if (de.ldst)
      // if long deco start
      return;
    if (de.start) {
      // if long decoration
      d_cresc(de);
      return;
    }

    de.val = dd.wl + dd.wr;
    up = up_p(s, s.pos.vol);
    if (up) de.up = true;
    x = s.x - dd.wl;
    if (de.ix > 0) {
      de_prev = a_de[de.ix - 1];
      if (
        de_prev.s == s &&
        ((de.up && !de_prev.up) || (!de.up && de_prev.up))
      ) {
        dd2 = de_prev.dd;
        if (f_staff[dd2.func]) {
          /* if dynamic mark */
          x2 = de_prev.x + de_prev.val + 4;
          if (x2 > x) x = x2;
        }
      }
    }

    de.x = x;
    de.y = y_get(s.st, up, x, de.val);
    if (!up) de.y -= dd.h;
    /* (y_set is done later in draw_deco_staff) */
  }

  /* 1: special case for slide */
  function d_slide(de) {
    var m,
      dx,
      s = de.s,
      yc = s.notes[0].pit,
      xc = 5;

    for (m = 0; m <= s.nhd; m++) {
      if (s.notes[m].acc) {
        dx = 4 + s.notes[m].shac;
      } else {
        dx = 5 - s.notes[m].shhd;
        switch (s.head) {
          case C.SQUARE:
            dx += 3.5;
            break;
          case C.OVALBARS:
          case C.OVAL:
            dx += 2;
            break;
        }
      }
      if (s.notes[m].pit <= yc + 3 && dx > xc) xc = dx;
    }
    //	de.x = s.x - xc;
    de.x -= xc;
    de.y = 3 * (yc - 18);
  }

  // special case for long decoration
  function d_trill(de) {
    if (de.ldst) return;
    var up,
      y,
      w,
      tmp,
      dd = de.dd,
      s2 = de.s,
      st = s2.st,
      s = de.start.s,
      x = s.x;

    if (de.prev) {
      // hack 'tr~~~~~'
      x = de.prev.x + 10;
      y = de.prev.y;
    }
    de.st = st;

    if (dd.func != 4) {
      // if not below
      switch (dd.glyph) {
        case "8va":
        case "15ma":
          up = 1;
          break;
        default:
          up = s2.multi >= 0;
          break;
      }
    }
    if (de.defl.noen) {
      /* if no decoration end */
      w = de.x - x;
      if (w < 20) {
        x = de.x - 20 - 3;
        w = 20;
      }
    } else {
      w = s2.x - x - 6;
      if (s2.type == C.NOTE) w -= 6;
      if (w < 20) {
        x -= (20 - w) * 0.5;
        w = 20;
      }
    }
    dd = de.dd;
    if (!y) y = y_get(st, up, x, w);
    if (up) {
      tmp = staff_tb[s.st].topbar + 2;
      if (y < tmp) y = tmp;
    } else {
      y -= dd.h;
      tmp = staff_tb[s.st].botbar - 2;
      if (y > tmp) y = tmp;
    }
    de.lden = false;
    de.has_val = true;
    de.val = w;
    de.x = x;
    de.y = y;
    if (up) y += dd.h;
    y_set(st, up, x, w, y);
    if (up) s.ymx = s2.ymx = y;
    else s.ymn = s2.ymn = y;
  }

  /* 3, 4: above (or below) the staff */
  function d_upstaff(de) {
    // don't treat here the long decorations
    if (de.ldst)
      // if long deco start
      return;
    if (de.start) {
      // if long decoration
      d_trill(de);
      return;
    }
    var yc,
      up,
      inv,
      s = de.s,
      dd = de.dd,
      x = s.x,
      w = dd.wl + dd.wr,
      stafft = staff_tb[s.st].topbar + 2,
      staffb = staff_tb[s.st].botbar - 2;

    if (s.nhd) x += s.notes[s.stem >= 0 ? 0 : s.nhd].shhd;
    up = -1;
    if (dd.func == 4) {
      // below
      up = 0;
    } else if (s.pos) {
      switch (s.pos.orn) {
        case C.SL_ABOVE:
          up = 1;
          break;
        case C.SL_BELOW:
          up = 0;
          break;
      }
    }

    switch (dd.glyph) {
      case "accent":
      case "roll":
        if (!up || (up < 0 && (s.multi < 0 || (!s.multi && s.stem > 0)))) {
          yc = y_get(s.st, false, s.x - dd.wl, w) - 2;
          if (yc > staffb) yc = staffb;
          yc -= dd.h;
          y_set(s.st, false, s.x, 0, yc);
          inv = true;
          s.ymn = yc;
        } else {
          yc = y_get(s.st, true, s.x - dd.wl, w) + 2;
          if (yc < stafft) yc = stafft;
          y_set(s.st, true, s.x - dd.wl, w, yc + dd.h);
          s.ymx = yc + dd.h;
        }
        break;
      case "brth":
      case "lphr":
      case "mphr":
      case "sphr":
        yc = stafft + 1;
        if (dd.glyph == "brth" && yc < s.ymx) yc = s.ymx;
        for (s = s.ts_next; s; s = s.ts_next) if (s.seqst) break;
        x += ((s ? s.x : realwidth) - x) * 0.45;
        break;
      default:
        if (dd.name.indexOf("invert") == 0) inv = true;
        if (
          dd.name != "invertedfermata" &&
          (up > 0 || (up < 0 && s.multi >= 0))
        ) {
          yc = y_get(s.st, true, s.x - dd.wl, w) + 2 + dd.hd;
          if (yc < stafft) yc = stafft;
          y_set(s.st, true, s.x - dd.wl, w, yc + dd.h);
          s.ymx = yc + dd.h;
        } else {
          yc = y_get(s.st, false, s.x - dd.wl, w) - 3 + dd.hd;
          if (yc > staffb) yc = staffb;
          yc -= dd.h;
          y_set(s.st, false, s.x - dd.wl, w, yc - dd.hd);
          if (dd.name == "fermata") inv = true;
          s.ymn = yc;
        }
        break;
    }
    if (inv) {
      yc += dd.h;
      de.inv = true;
    }
    de.x = x;
    de.y = yc;
  }

  /* deco function table */
  var func_tb = [
    d_near /* 0 - near the note */,
    d_slide /* 1 */,
    d_arp /* 2 */,
    d_upstaff /* 3 - tied to note */,
    d_upstaff /* 4 (below the staff) */,
    d_trill /* 5 */,
    d_pf /* 6 - tied to staff (dynamic marks) */,
    d_cresc /* 7 */,
  ];

  // add a decoration
  /* syntax:
   *	%%deco <name> <c_func> <glyph> <h> <wl> <wr> [<str>]
   * "<h>" may be followed by ",<hd>" (descent)
   */
  function deco_add(param) {
    var dv = param.match(/(\S*)\s+(.*)/);
    decos[dv[1]] = dv[2];
  }

  // define a decoration
  function deco_def(nm) {
    var a,
      dd,
      dd2,
      name2,
      c,
      i,
      elts,
      str,
      hd,
      text = decos[nm];

    if (!text) {
      if (cfmt.decoerr) error(1, null, "Unknown decoration '$1'", nm);
      return; //undefined
    }

    // extract the values
    a = text.match(/(\d+)\s+(.+?)\s+([0-9.,]+)\s+([0-9.]+)\s+([0-9.]+)/);
    if (!a) {
      error(1, null, "Invalid decoration '$1'", nm);
      return; //undefined
    }
    var c_func = Number(a[1]),
      //		glyph = a[2],
      h = a[3],
      wl = parseFloat(a[4]),
      wr = parseFloat(a[5]);

    if (isNaN(c_func)) {
      error(1, null, "%%deco: bad C function value '$1'", a[1]);
      return; //undefined
    }
    if (c_func > 10 && (c_func < 32 || c_func > 43)) {
      error(1, null, "%%deco: bad C function index '$1'", c_func);
      return; //undefined
    }
    if (c_func == 5)
      // old !trill(!
      c_func = 3;
    if (c_func == 7)
      // old !cresc(!
      c_func = 6;

    if (h.indexOf(",") > 0) {
      h = h.split(",");
      hd = h[1];
      h = h[0];
    } else {
      hd = 0;
    }
    if (h > 50 || wl > 80 || wr > 80) {
      error(1, null, "%%deco: abnormal h/wl/wr value '$1'", text);
      return; //undefined
    }

    // create/redefine the decoration
    dd = dd_tb[nm];
    if (!dd) {
      dd = {
        name: nm,
      };
      dd_tb[nm] = dd;
    }

    /* set the values */
    dd.func = dd.name.indexOf("head-") == 0 ? 9 : c_func;
    dd.glyph = a[2];
    dd.h = Number(h);
    dd.hd = Number(hd);
    dd.wl = wl;
    dd.wr = wr;
    str = text.replace(a[0], "").trim();
    if (str) {
      // optional string
      if (str[0] == '"') str = str.slice(1, -1);
      dd.str = str;
    }

    /* compatibility */
    if (dd.func == 6 && dd.str == undefined) dd.str = dd.name;

    // link the start and end of long decorations
    c = dd.name.slice(-1);
    if (c == "(" || (c == ")" && dd.name.indexOf("(") < 0)) {
      dd.str = null; // (no string)
      name2 = dd.name.slice(0, -1) + (c == "(" ? ")" : "(");
      dd2 = dd_tb[name2];
      if (dd2) {
        if (c == "(") {
          dd.dd_en = dd2;
          dd2.dd_st = dd;
        } else {
          dd.dd_st = dd2;
          dd2.dd_en = dd;
        }
      } else {
        dd2 = deco_def(name2);
        if (!dd2) return; //undefined
      }
    }
    return dd;
  }

  /* -- convert the decorations -- */
  function deco_cnv(a_dcn, s, prev) {
    var i,
      j,
      dd,
      dcn,
      note,
      nd = a_dcn.length;

    for (i = 0; i < nd; i++) {
      dcn = a_dcn[i];
      dd = dd_tb[dcn];
      if (!dd) {
        dd = deco_def(dcn);
        if (!dd) continue;
      }

      /* special decorations */
      switch (dd.func) {
        case 0: // near
          if (s.type == C.BAR && dd.name == "dot") {
            s.bar_dotted = true;
            break;
          }
        // fall thru
        case 1: // slide
        case 2: // arp
          //			if (s.type != C.NOTE && s.type != C.REST) {
          if (!s.notes) {
            error(1, s, errs.must_note_rest, dd.name);
            continue;
          }
          break;
        case 8: // gliss
          if (s.type != C.NOTE) {
            error(1, s, errs.must_note, dd.name);
            continue;
          }
          note = s.notes[s.nhd]; // move to the upper note of the chord
          if (!note.a_dcn) note.a_dcn = [];
          note.a_dcn.push(dd.name);
          continue;
        case 9: // alternate head
          if (!s.notes) {
            error(1, s, errs.must_note_rest, dd.name);
            continue;
          }

          // move the alternate head of the chord to the notes
          for (j = 0; j <= s.nhd; j++) {
            note = s.notes[j];
            if (!note.a_dcn) note.a_dcn = [];
            note.a_dcn.push(dd.name);
          }
          continue;
        default:
          break;
        case 10 /* color */:
          if (s.notes) {
            for (j = 0; j <= s.nhd; j++) s.notes[j].color = dd.name;
          } else {
            s.color = dd.name;
          }
          continue;
        case 32 /* invisible */:
          s.invis = true;
          continue;
        case 33 /* beamon */:
          if (s.type != C.BAR) {
            error(1, s, "!beamon! must be on a bar");
            continue;
          }
          s.beam_on = true;
          continue;
        case 34 /* trem1..trem4 */:
          if (
            s.type != C.NOTE ||
            !prev ||
            prev.type != C.NOTE ||
            s.dur != prev.dur
          ) {
            error(
              1,
              s,
              "!$1! must be on the last of a couple of notes",
              dd.name
            );
            continue;
          }
          s.trem2 = true;
          s.beam_end = true;
          s.beam_st = false;
          prev.beam_st = true;
          prev.beam_end = false;
          s.ntrem = prev.ntrem = Number(dd.name[4]);
          for (j = 0; j <= s.nhd; j++) s.notes[j].dur *= 2;
          for (j = 0; j <= prev.nhd; j++) prev.notes[j].dur *= 2;
          continue;
        case 35 /* xstem */:
          if (s.type != C.NOTE) {
            error(1, s, errs.must_note, dd.name);
            continue;
          }
          s.xstem = true;
          continue;
        case 36 /* beambr1 / beambr2 */:
          if (s.type != C.NOTE) {
            error(1, s, errs.must_note, dd.name);
            continue;
          }
          if (dd.name[6] == "1") s.beam_br1 = true;
          else s.beam_br2 = true;
          continue;
        case 37 /* rbstop */:
          s.rbstop = 1; // open
          continue;
        case 38 /* /, // and /// = tremolo */:
          if (s.type != C.NOTE) {
            error(1, s, errs.must_note, dd.name);
            continue;
          }
          s.trem1 = true;
          s.ntrem = dd.name.length; /* 1, 2 or 3 */
          continue;
        case 39 /* beam-accel/beam-rall */:
          if (s.type != C.NOTE) {
            error(1, s, errs.must_note, dd.name);
            continue;
          }
          s.feathered_beam = dd.name[5] == "a" ? 1 : -1;
          continue;
        case 40 /* stemless */:
          s.stemless = true;
          continue;
        case 41 /* rbend */:
          s.rbstop = 2; // with end
          continue;
        case 42: // editorial
          if (!s.notes[0].acc) continue;
          dcn = "sacc" + s.notes[0].acc.toString(); // small accidental
          dd = dd_tb[dcn];
          if (!dd) {
            dd = deco_def(dcn);
            if (!dd) {
              error(1, s, errs.bad_val, "!editorial!");
              continue;
            }
          }
          delete s.notes[0].acc;
          curvoice.acc[s.notes[0].pit + 19] = 0; // ignore the accidental
          break;
        case 43: // courtesy
          j = curvoice.acc[s.notes[0].pit + 19];
          if (s.notes[0].acc || !j) continue;
          if (!s.notes[0].a_dcn) s.notes[0].a_dcn = [];
          s.notes[0].a_dcn.push("cacc" + j);
          continue;
      }

      // add the decoration in the symbol
      if (!s.a_dd) s.a_dd = [];
      s.a_dd.push(dd);
    }
  }

  /* -- update the x position of a decoration -- */
  // used to center the rests
  function deco_update(s, dx) {
    var i,
      de,
      nd = a_de.length;

    for (i = 0; i < nd; i++) {
      de = a_de[i];
      if (de.s == s) de.x += dx;
    }
  }

  /* -- adjust the symbol width -- */
  function deco_width(s) {
    var dd,
      i,
      wl = 0,
      a_dd = s.a_dd,
      nd = a_dd.length;

    for (i = 0; i < nd; i++) {
      dd = a_dd[i];
      switch (dd.func) {
        case 1 /* slide */:
          if (wl < 7) wl = 7;
          break;
        case 2 /* arpeggio */:
          if (wl < 14) wl = 14;
          break;
        case 3:
          switch (dd.glyph) {
            case "brth":
            case "lphr":
            case "mphr":
            case "sphr":
              if (s.wr < 20) s.wr = 20;
              break;
          }
          break;
      }
    }
    if (wl != 0 && s.prev && s.prev.type == C.BAR) wl -= 3;
    return wl;
  }

  /* -- draw the decorations -- */
  /* (the staves are defined) */
  function draw_all_deco() {
    if (a_de.length == 0) return;
    var de,
      de2,
      dd,
      s,
      note,
      f,
      st,
      x,
      y,
      y2,
      ym,
      uf,
      i,
      str,
      a,
      new_de = [],
      ymid = [];

    if (!cfmt.dynalign) {
      st = nstaff;
      y = staff_tb[st].y;
      while (--st >= 0) {
        y2 = staff_tb[st].y;
        ymid[st] = (y + 24 + y2) * 0.5;
        y = y2;
      }
    }

    while (1) {
      de = a_de.shift();
      if (!de) break;
      dd = de.dd;
      if (!dd) continue; // deleted

      if (dd.dd_en)
        // start of long decoration
        continue;

      // handle the stem direction
      s = de.s;
      f = dd.glyph;
      i = f.indexOf("/");
      if (i > 0) {
        if (s.stem >= 0) f = f.slice(0, i);
        else f = f.slice(i + 1);
      }

      // no voice scale if staff decoration
      if (f_staff[dd.func]) set_sscale(s.st);
      else set_scale(s);

      st = de.st;
      if (!staff_tb[st].topbar) continue; // invisible staff
      x = de.x;
      //		y = de.y + staff_tb[st].y / staff_tb[st].staffscale
      y = de.y + staff_tb[st].y;

      // update the coordinates if head decoration
      if (de.m != undefined) {
        note = s.notes[de.m];
        if (note.shhd) x += note.shhd * stv_g.scale;

        /* center the dynamic marks between two staves */
        /*fixme: KO when deco on other voice and same direction*/
      } else if (
        f_staff[dd.func] &&
        !cfmt.dynalign &&
        ((de.up && st > 0) || (!de.up && st < nstaff))
      ) {
        if (de.up) ym = ymid[--st];
        else ym = ymid[st++];
        ym -= dd.h * 0.5;
        if ((de.up && y < ym) || (!de.up && y > ym)) {
          //				if (s.st > st) {
          //					while (s.st != st)
          //						s = s.ts_prev
          //				} else if (s.st < st) {
          //					while (s.st != st)
          //						s = s.ts_next
          //				}
          y2 = y_get(st, !de.up, de.x, de.val) + staff_tb[st].y;
          if (de.up) y2 -= dd.h;
          //fixme: y_set is not used later!
          if ((de.up && y2 > ym) || (!de.up && y2 < ym)) {
            y = ym;
            //					y_set(st, de.up, de.x, de.val,
            //						(de.up ? y + dd.h : y)
            //							- staff_tb[st].y)
          }
        }
      }

      // check if user JS decoration
      uf = user[f];
      if (uf && typeof uf == "function") {
        uf(x, y, de);
        continue;
      }

      // check if user PS definition
      if (self.psdeco(f, x, y, de)) continue;

      anno_start(s, "deco");
      //		if (de.flags.grace) {
      //			g_open(x, y, 0, .7, de.inv ? -.7 : 0);
      //			x = y = 0
      //		} else
      if (de.inv) {
        g_open(x, y, 0, 1, -1);
        x = y = 0;
      }
      if (de.has_val) {
        if (
          dd.func != 2 || // if not !arpeggio!
          stv_g.st < 0
        )
          // or not staff scale
          // || voice_tb[s.v].scale != 1)
          out_deco_val(x, y, f, de.val / stv_g.scale, de.defl);
        else out_deco_val(x, y, f, de.val, de.defl);
        if (de.defl.noen) new_de.push(de.start); // to be continued next line
      } else if (dd.str != undefined) {
        str = dd.str;
        if (str[0] == "@") {
          a = str.match(/^@([0-9.-]+),([0-9.-]+);?/);
          x += Number(a[1]);
          y += Number(a[2]);
          str = str.replace(a[0], "");
        }
        //			out_deco_str(x, y + de.dy,	// - dd.h * .2,
        out_deco_str(
          x,
          y, // - dd.h * .2,
          f,
          str
        );
      } else if (de.lden) {
        out_deco_long(x, y, de);
      } else {
        xygl(x, y, f);
      }
      if (stv_g.g) g_close();
      anno_stop(s, "deco");
    }

    // keep the long decorations which continue on the next line
    a_de = new_de;
  }

  /* -- create the decorations and define the ones near the notes -- */
  /* (the staves are not yet defined) */
  /* (delayed output) */
  /* this function must be called first as it builds the deco element table */
  function draw_deco_near() {
    var s, g;

    // update starting old decorations
    function ldeco_update(s) {
      var i,
        de,
        //			x = s.ts_prev.x + s.ts_prev.wr
        x = s.x - s.wl,
        nd = a_de.length;

      for (i = 0; i < nd; i++) {
        de = a_de[i];
        de.ix = i;
        de.s.x = de.x = x;
        de.defl.nost = true;
      }
    }

    /* -- create the deco elements, and treat the near ones -- */
    function create_deco(s) {
      var dd,
        k,
        l,
        pos,
        de,
        x,
        nd = s.a_dd.length;

      /*fixme:pb with decorations above the staff*/
      for (k = 0; k < nd; k++) {
        dd = s.a_dd[k];

        /* check if hidden */
        switch (dd.func) {
          default:
            pos = 0;
            break;
          case 3: /* d_upstaff */
          case 4:
            pos = s.pos.orn;
            break;
          case 6 /* d_pf */:
            pos = s.pos.vol;
            break;
          case 7 /* d_cresc */:
            pos = s.pos.dyn;
            break;
        }
        if (pos == C.SL_HIDDEN) continue;

        de = {
          s: s,
          dd: dd,
          st: s.st,
          ix: a_de.length,
          defl: {},
          x: s.x,
          y: s.y,
          //				dy: 0
        };
        a_de.push(de);
        if (dd.dd_en) {
          de.ldst = true;
        } else if (dd.dd_st) {
          //fixme: pb with "()"
          de.lden = true;
          de.defl.nost = true;
        }

        if (!f_near[dd.func]) /* if not near the note */ continue;
        func_tb[dd.func](de);
      }
    } // create_deco()

    // create the decorations of note heads
    function create_dh(s, m) {
      var f,
        str,
        de,
        uf,
        k,
        dcn,
        dd,
        note = s.notes[m],
        nd = note.a_dcn.length;

      for (k = 0; k < nd; k++) {
        dcn = note.a_dcn[k];
        dd = dd_tb[dcn];
        if (!dd) {
          dd = deco_def(dcn);
          if (!dd) continue;
        }

        switch (dd.func) {
          case 0:
          case 1:
          case 3:
          case 4:
          case 8: // gliss
            break;
          default:
            //			case 2:			// arpeggio
            //			case 5:			// trill
            //			case 7:			// d_cresc
            error(1, null, "Cannot have !$1! on a head", dd.name);
            continue;
          case 9: // head replacement
            note.invis = true;
            break;
          case 10: // color
            note.color = dd.name;
            continue;
          case 32: // invisible
            note.invis = true;
            continue;
          case 40: // stemless chord (abcm2ps behaviour)
            s.stemless = true;
            continue;
        }

        //fixme: check if hidden?
        de = {
          s: s,
          dd: dd,
          st: s.st,
          m: m,
          ix: 0,
          defl: {},
          x: s.x,
          y: 3 * (note.pit - 18),
          //				dy: 0
        };
        a_de.push(de);
        if (dd.dd_en) {
          de.ldst = true;
        } else if (dd.dd_st) {
          de.lden = true;
          de.defl.nost = true;
        }
      }
    } // create_dh()

    // create all decorations of a note (chord and heads)
    function create_all(s) {
      if (s.a_dd) create_deco(s);
      if (s.notes) {
        for (var m = 0; m < s.notes.length; m++) {
          if (s.notes[m].a_dcn) create_dh(s, m);
        }
      }
    } // create_all()

    // link the long decorations
    function ll_deco() {
      var i,
        j,
        de,
        de2,
        dd,
        dd2,
        v,
        s,
        st,
        n_de = a_de.length;

      // add ending decorations
      for (i = 0; i < n_de; i++) {
        de = a_de[i];
        if (!de.ldst)
          // not the start of long decoration
          continue;
        dd = de.dd;
        dd2 = dd.dd_en;
        s = de.s;
        v = s.v; // search later in the voice
        for (j = i + 1; j < n_de; j++) {
          de2 = a_de[j];
          if (!de2.start && de2.dd == dd2 && de2.s.v == v) break;
        }
        if (j == n_de) {
          // no end, search in the staff
          st = s.st;
          for (j = i + 1; j < n_de; j++) {
            de2 = a_de[j];
            if (!de2.start && de2.dd == dd2 && de2.s.st == st) break;
          }
        }
        if (j == n_de) {
          // no end, insert one
          de2 = {
            s: de.s,
            st: de.st,
            dd: dd2,
            ix: a_de.length - 1,
            x: realwidth - 6,
            y: de.s.y,
            lden: true,
            defl: {
              noen: true,
            },
          };
          if (de2.x < s.x + 10) de2.x = s.x + 10;
          if (de.m != undefined) de2.m = de.m;
          a_de.push(de2);
        }
        de2.start = de;
        de2.defl.nost = de.defl.nost;

        // handle 'tr~~~~~'
        if (dd.name == "trill(" && i > 0 && a_de[i - 1].dd.name == "trill")
          de2.prev = a_de[i - 1];
      }

      // add starting decorations
      for (i = 0; i < n_de; i++) {
        de2 = a_de[i];
        if (
          !de2.lden || // not the end of long decoration
          de2.start
        )
          // start already found
          continue;
        s = de2.s;
        de = {
          s: prev_scut(s),
          st: de2.st,
          dd: de2.dd.dd_st,
          ix: a_de.length - 1,
          //				x: s.x - s.wl - 4,
          y: s.y,
          ldst: true,
        };
        de.x = de.s.x;
        if (de2.m != undefined) de.m = de2.m;
        a_de.push(de);
        de2.start = de;
      }
    } // ll_deco

    // update the long decorations started in the previous line
    for (s = tsfirst; s; s = s.ts_next) {
      switch (s.type) {
        case C.CLEF:
        case C.KEY:
        case C.METER:
          continue;
      }
      break;
    }
    if (a_de.length != 0) ldeco_update(s);

    for (; s; s = s.ts_next) {
      switch (s.type) {
        case C.BAR:
        case C.MREST:
        case C.NOTE:
        case C.REST:
        case C.SPACE:
          break;
        case C.GRACE:
          for (g = s.extra; g; g = g.next) create_all(g);
          break;
        default:
          continue;
      }
      create_all(s);
    }
    ll_deco(); // link the long decorations
  }

  /* -- define the decorations tied to a note -- */
  /* (the staves are not yet defined) */
  /* (delayed output) */
  function draw_deco_note() {
    var i,
      de,
      dd,
      f,
      nd = a_de.length;

    for (i = 0; i < nd; i++) {
      de = a_de[i];
      dd = de.dd;
      f = dd.func;
      if (f_note[f] && de.m == undefined) func_tb[f](de);
    }
  }

  // -- define the music elements tied to the staff --
  //	- decoration tied to the staves
  //	- chord symbols
  //	- repeat brackets
  /* (the staves are not yet defined) */
  /* (unscaled delayed output) */
  function draw_deco_staff() {
    var s,
      first_gchord,
      p_voice,
      x,
      y,
      w,
      i,
      v,
      de,
      dd,
      gch,
      gch2,
      ix,
      top,
      bot,
      minmax = new Array(nstaff + 1),
      nd = a_de.length;

    /* draw the repeat brackets */
    function draw_repbra(p_voice) {
      var s, s1, y, y2, i, p, w, wh, first_repeat;

      /* search the max y offset */
      y = staff_tb[p_voice.st].topbar + 25; // 20 (vert bar) + 5 (room)
      for (s = p_voice.sym; s; s = s.next) {
        if (s.type != C.BAR) continue;
        if (!s.rbstart || s.norepbra) continue;
        /*fixme: line cut on repeat!*/
        if (!s.next) break;
        if (!first_repeat) {
          first_repeat = s;
          set_font("repeat");
        }
        s1 = s;
        for (;;) {
          if (!s.next) break;
          s = s.next;
          if (s.rbstop) break;
        }
        y2 = y_get(p_voice.st, true, s1.x, s.x - s1.x);
        if (y < y2) y = y2;

        /* have room for the repeat numbers */
        if (s1.text) {
          wh = strwh(s1.text);
          y2 = y_get(p_voice.st, true, s1.x + 4, wh[0]);
          y2 += wh[1];
          if (y < y2) y = y2;
        }
        if (s.rbstart) s = s.prev;
      }

      /* draw the repeat indications */
      s = first_repeat;
      if (!s) return;
      set_dscale(p_voice.st, true);
      y2 = y * staff_tb[p_voice.st].staffscale;
      for (; s; s = s.next) {
        if (!s.rbstart || s.norepbra) continue;
        s1 = s;
        while (1) {
          if (!s.next) break;
          s = s.next;
          if (s.rbstop) break;
        }
        if (s1 == s) break;
        x = s1.x;
        //			if (s1.bar_type[0] == ":")
        //				x -= 4;
        if (s.type != C.BAR) {
          w = s.rbstop ? 0 : s.x - realwidth + 4;
        } else if (
          (s.bar_type.length > 1 && // if complex bar
            s.bar_type != "[]") ||
          s.bar_type == "]"
        ) {
          //				if (s.bar_type == "]")
          //					s.invis = true
          //fixme:%%staves: cur_sy moved?
          if (s1.st > 0 && !(cur_sy.staves[s1.st - 1].flags & STOP_BAR))
            w = s.wl;
          else if (s.bar_type.slice(-1) == ":") w = 12;
          else if (s.bar_type[0] != ":")
            //				      || s.bar_type == "]")
            w = 0;
          /* explicit repeat end */ else w = 8;
        } else {
          w = s.rbstop ? 0 : 8;
        }
        w = s.x - x - w; // / staff_tb[p_voice.st].staffscale;

        if (
          !s.next && // 2nd ending at end of line
          !s.rbstop &&
          !p_voice.bar_start
        ) {
          // continue on next line
          p_voice.bar_start = clone(s);
          p_voice.bar_start.type = C.BAR;
          p_voice.bar_start.bar_type = "";
          delete p_voice.bar_start.text;
          p_voice.bar_start.rbstart = 1;
          delete p_voice.bar_start.a_gch;
        }
        if (s1.text) xy_str(x + 4, y2 - gene.curfont.size - 3, s1.text);
        xypath(x, y2);
        if (s1.rbstart == 2) output += "m0 20v-20";
        output += "h" + w.toFixed(1);
        if (s.rbstop == 2) output += "v20";
        output += '"/>\n';
        y_set(s1.st, true, x, w, y + 2);

        if (s.rbstart) s = s.prev;
      }
    } // draw_repbra()

    /* create the decorations tied to the staves */
    for (i = 0; i <= nstaff; i++)
      minmax[i] = {
        ymin: 0,
        ymax: 0,
      };
    for (i = 0; i < nd; i++) {
      de = a_de[i];
      dd = de.dd;
      if (!dd)
        // if error
        continue;
      if (!f_staff[dd.func] /* if not tied to the staff */ || de.m != undefined)
        // or head decoration
        continue;
      func_tb[dd.func](de);
      if (dd.dd_en)
        // if start
        continue;
      if (cfmt.dynalign) {
        if (de.up) {
          if (de.y > minmax[de.st].ymax) minmax[de.st].ymax = de.y;
        } else {
          if (de.y < minmax[de.st].ymin) minmax[de.st].ymin = de.y;
        }
      }
    }

    /* and, if wanted, set them at a same vertical offset */
    for (i = 0; i < nd; i++) {
      de = a_de[i];
      dd = de.dd;
      if (!dd)
        // if error
        continue;
      if (
        dd.dd_en || // if start
        !f_staff[dd.func]
      )
        continue;
      if (cfmt.dynalign) {
        if (de.up) y = minmax[de.st].ymax;
        else y = minmax[de.st].ymin;
        de.y = y;
      } else {
        y = de.y;
      }
      if (de.up) y += dd.h;
      y_set(de.st, de.up, de.x, de.val, y);
    }

    // search the vertical offset for the chord symbols
    for (i = 0; i <= nstaff; i++)
      minmax[i] = {
        ymin: 0,
        ymax: 24,
      };
    for (s = tsfirst; s; s = s.ts_next) {
      if (!s.a_gch) continue;
      if (!first_gchord) first_gchord = s;
      gch2 = null;
      for (ix = 0; ix < s.a_gch.length; ix++) {
        gch = s.a_gch[ix];
        if (gch.type != "g") continue;
        gch2 = gch; // chord closest to the staff
        if (gch.y < 0) break;
      }
      if (gch2) {
        w = gch2.wh[0];
        if (gch2.y >= 0) {
          y = y_get(s.st, true, s.x, w);
          if (y > minmax[s.st].ymax) minmax[s.st].ymax = y;
        } else {
          y = y_get(s.st, false, s.x, w);
          if (y < minmax[s.st].ymin) minmax[s.st].ymin = y;
        }
      }
    }

    // draw the chord symbols if any
    if (first_gchord) {
      for (i = 0; i <= nstaff; i++) {
        bot = staff_tb[i].botbar;
        if (minmax[i].ymin > bot - 4) minmax[i].ymin = bot - 4;
        top = staff_tb[i].topbar;
        if (minmax[i].ymax < top + 4) minmax[i].ymax = top + 4;
      }
      set_dscale(-1); /* restore the scale parameters */
      for (s = first_gchord; s; s = s.ts_next) {
        if (!s.a_gch) continue;
        self.draw_gchord(s, minmax[s.st].ymin, minmax[s.st].ymax);
      }
    }

    /* draw the repeat brackets */
    for (v = 0; v < voice_tb.length; v++) {
      p_voice = voice_tb[v];
      if (p_voice.second || !p_voice.sym) continue;
      draw_repbra(p_voice);
    }
  }

  /* -- draw the measure bar numbers -- */
  /* (scaled delayed output) */
  function draw_measnb() {
    var s,
      st,
      bar_num,
      x,
      y,
      w,
      any_nb,
      font_size,
      w0,
      sy = cur_sy;

    /* search the top staff */
    for (st = 0; st <= nstaff; st++) {
      if (sy.st_print[st]) break;
    }
    if (st > nstaff) return; /* no visible staff */
    set_dscale(st);

    /* leave the measure numbers as unscaled */
    if (staff_tb[st].staffscale != 1) {
      font_size = get_font("measure").size;
      param_set_font(
        "measurefont",
        "* " + (font_size / staff_tb[st].staffscale).toString()
      );
    }
    set_font("measure");
    w0 = cwidf("0"); // (greatest) width of a number

    s = tsfirst; /* clef */
    bar_num = gene.nbar;
    if (bar_num > 1) {
      if (cfmt.measurenb == 0) {
        any_nb = true;
        y = y_get(st, true, 0, 20);
        if (y < staff_tb[st].topbar + 14) y = staff_tb[st].topbar + 14;
        xy_str(0, y, bar_num.toString());
        y_set(st, true, 0, 20, y + gene.curfont.size + 2);
      } else if (bar_num % cfmt.measurenb == 0) {
        for (; ; s = s.ts_next) {
          switch (s.type) {
            case C.TIMESIG:
            case C.CLEF:
            case C.KEYSIG:
            case C.FMTCHG:
            case C.STBRK:
              continue;
          }
          break;
        }

        // don't display the number twice
        if (s.type != C.BAR || !s.bar_num) {
          if (s.prev) s = s.prev;
          x = s.x + s.wr;
          any_nb = true;
          w = w0;
          if (bar_num >= 10) w *= bar_num >= 100 ? 3 : 2;
          if (gene.curfont.box) w += 4;
          y = y_get(st, true, x, w);
          if (y < staff_tb[st].topbar + 6) y = staff_tb[st].topbar + 6;
          y += 2;
          xy_str(x, y, bar_num.toString());
          if (gene.curfont.box) {
            y += 2;
            w += 3;
          }
          y += gene.curfont.size;
          y_set(st, true, x, w, y);
          s.ymx = y;
        }
      }
    }

    for (; s; s = s.ts_next) {
      switch (s.type) {
        case C.STAVES:
          sy = s.sy;
          for (st = 0; st < nstaff; st++) {
            if (sy.st_print[st]) break;
          }
          set_dscale(st);
          continue;
        default:
          continue;
        case C.BAR:
          if (!s.bar_num || s.bar_num <= 1) continue;
          break;
      }

      bar_num = s.bar_num;
      if (
        cfmt.measurenb == 0 ||
        bar_num % cfmt.measurenb != 0 ||
        !s.next ||
        s.bar_mrep
      )
        continue;
      if (!any_nb) any_nb = true;
      w = w0;
      if (bar_num >= 10) w *= bar_num >= 100 ? 3 : 2;
      x = s.x - w * 0.4;
      y = y_get(st, true, x, w);
      if (y < staff_tb[st].topbar + 3) y = staff_tb[st].topbar + 3;
      if (s.next.type == C.NOTE) {
        if (s.next.stem > 0) {
          if (y < s.next.ys - gene.curfont.size)
            y = s.next.ys - gene.curfont.size;
        } else {
          if (y < s.next.y) y = s.next.y;
        }
      }
      y += 2;
      if (gene.curfont.box) {
        y += 2;
        w += 3;
      }
      xy_str(x, y, bar_num.toString());
      y += gene.curfont.size;
      if (gene.curfont.box) y += 2;
      y_set(st, true, x, w, y);
      s.ymx = y;
    }
    gene.nbar = bar_num;

    if (font_size) param_set_font("measurefont", "* " + font_size.toString());
  }

  /* -- draw the parts and the tempo information -- */
  /* (the staves are being defined) */
  function draw_partempo(st, top) {
    var s,
      some_part,
      some_tempo,
      h,
      w,
      y,
      dy = 0 /* put the tempo indication at top */,
      ht = 0;

    /* get the minimal y offset */
    var ymin = staff_tb[st].topbar + 8,
      dosh = 0,
      shift = 1,
      x = -100; // (must be negative for %%soloffs)

    for (s = tsfirst; s; s = s.ts_next) {
      if (s.type != C.TEMPO || s.invis) continue;
      if (!some_tempo) some_tempo = s;
      w = s.tempo_wh[0];
      if (s.time == 0 && s.x > 40)
        // at start of tune and no %%soloffs,
        s.x = 40; // shift the tempo over the key signature
      y = y_get(st, true, s.x - 16, w);
      if (y > ymin) ymin = y;
      if (x >= s.x - 16 && !(dosh & (shift >> 1))) dosh |= shift;
      shift <<= 1;
      x = s.x - 16 + w;
    }
    if (some_tempo) {
      set_sscale(-1);
      set_font("tempo");
      ht = gene.curfont.size + 8;
      y = 2 - ht;
      h = y - ht;
      if (dosh != 0) ht *= 2;
      if (top < ymin + ht) dy = ymin + ht - top;

      /* draw the tempo indications */
      for (s = some_tempo; s; s = s.ts_next) {
        if (s.type != C.TEMPO || s.invis)
          // (displayed by %%titleformat)
          continue;
        if (user.anno_start || user.anno_stop) {
          s.wl = 16;
          s.wr = 30;
          s.ymn = dosh & 1 ? h : y;
          s.ymx = s.ymn + 14;
          anno_start(s);
        }
        writempo(s, s.x - 16, dosh & 1 ? h : y);
        anno_stop(s);
        dosh >>= 1;
        while (s.ts_next && s.ts_next.type == C.TEMPO) s = s.ts_next;
      }
    }

    /* then, put the parts */
    /*fixme: should reduce vertical space if parts don't overlap tempo...*/
    ymin = staff_tb[st].topbar + 6;
    for (s = tsfirst; s; s = s.ts_next) {
      if (s.type != C.PART || s.invis) continue;
      if (!some_part) {
        some_part = s;
        set_font("parts");
        h = gene.curfont.size + 2;
        /* + cfmt.partsspace ?? */
      }
      w = strwh(s.text)[0];
      y = y_get(st, true, s.x - 10, w + 3);
      if (ymin < y) ymin = y;
    }
    if (some_part) {
      set_sscale(-1);
      if (gene.curfont.box) h += 2;
      if (top < ymin + h + ht) dy = ymin + h + ht - top;

      for (s = some_part; s; s = s.ts_next) {
        if (s.type != C.PART || s.invis) continue;
        s.x -= 10;
        if (user.anno_start || user.anno_stop) {
          w = strwh(s.text)[0];
          s.wl = 0;
          s.wr = w;
          s.ymn = -ht - h;
          s.ymx = s.ymn + h;
          anno_start(s);
        }
        xy_str(s.x, 2 - ht - h, s.text);
        anno_stop(s);
        while (s.ts_next && s.ts_next.type == C.PART) s = s.ts_next;
      }
    }
    return dy;
  }
  // abc2svg - draw.js - draw functions
  //
  // Copyright (C) 2014-2020 Jean-Francois Moine
  //
  // This file is part of abc2svg-core.
  //
  // abc2svg-core is free software: you can redistribute it and/or modify
  // it under the terms of the GNU Lesser General Public License as published by
  // the Free Software Foundation, either version 3 of the License, or
  // (at your option) any later version.
  //
  // abc2svg-core is distributed in the hope that it will be useful,
  // but WITHOUT ANY WARRANTY; without even the implied warranty of
  // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  // GNU Lesser General Public License for more details.
  //
  // You should have received a copy of the GNU Lesser General Public License
  // along with abc2svg-core.  If not, see <http://www.gnu.org/licenses/>.

  // constants
  var STEM_MIN = 16 /* min stem height under beams */,
    STEM_MIN2 = 14 /* ... for notes with two beams */,
    STEM_MIN3 = 12 /* ... for notes with three beams */,
    STEM_MIN4 = 10 /* ... for notes with four beams */,
    STEM_CH_MIN = 14 /* min stem height for chords under beams */,
    STEM_CH_MIN2 = 10 /* ... for notes with two beams */,
    STEM_CH_MIN3 = 9 /* ... for notes with three beams */,
    STEM_CH_MIN4 = 9 /* ... for notes with four beams */,
    BEAM_DEPTH = 3.2 /* width of a beam stroke */,
    BEAM_OFFSET = 0.25 /* pos of flat beam relative to staff line */,
    BEAM_SHIFT = 5 /* shift of second and third beams */,
    BEAM_STUB = 8 /* length of stub for flag under beam */,
    SLUR_SLOPE = 0.5 /* max slope of a slur */,
    GSTEM = 15 /* grace note stem length */,
    GSTEM_XOFF = 2.3; /* x offset for grace note stem */

  var cache;

  /* -- compute the best vertical offset for the beams -- */
  function b_pos(grace, stem, nflags, b) {
    var top,
      bot,
      d1,
      d2,
      shift = !grace ? BEAM_SHIFT : 3.5,
      depth = !grace ? BEAM_DEPTH : 1.8;

    /* -- up/down shift needed to get k*6 -- */
    function rnd6(y) {
      var iy = Math.round((y + 12) / 6) * 6 - 12;
      return iy - y;
    } // rnd6()

    if (stem > 0) {
      bot = b - (nflags - 1) * shift - depth;
      if (bot > 26) return 0;
      top = b;
    } else {
      top = b + (nflags - 1) * shift + depth;
      if (top < -2) return 0;
      bot = b;
    }

    d1 = rnd6(top - BEAM_OFFSET);
    d2 = rnd6(bot + BEAM_OFFSET);
    return d1 * d1 > d2 * d2 ? d2 : d1;
  }

  /* duplicate a note for beaming continuation */
  function sym_dup(s) {
    var m, note;

    s = clone(s);
    s.invis = true;
    delete s.extra;
    delete s.text;
    delete s.a_gch;
    delete s.a_ly;
    delete s.a_dd;
    s.notes = clone(s.notes);
    for (m = 0; m <= s.nhd; m++) {
      note = s.notes[m] = clone(s.notes[m]);
      delete note.a_dcn;
    }
    return s;
  }

  /* -- calculate a beam -- */
  /* (the staves may be defined or not) */
  var min_tb = [
    [STEM_MIN, STEM_MIN, STEM_MIN2, STEM_MIN3, STEM_MIN4, STEM_MIN4],
    [
      STEM_CH_MIN,
      STEM_CH_MIN,
      STEM_CH_MIN2,
      STEM_CH_MIN3,
      STEM_CH_MIN4,
      STEM_CH_MIN4,
    ],
  ];

  // (possible hook)
  Abc.prototype.calculate_beam = function (bm, s1) {
    var s,
      s2,
      g,
      notes,
      nflags,
      st,
      v,
      two_staves,
      two_dir,
      x,
      y,
      ys,
      a,
      b,
      stem_err,
      max_stem_err,
      p_min,
      p_max,
      s_closest,
      stem_xoff,
      scale,
      visible,
      dy;

    if (!s1.beam_st) {
      /* beam from previous music line */
      s = sym_dup(s1);
      lkvsym(s, s1);
      lktsym(s, s1);
      s.x -= 12;
      if (s.x > s1.prev.x + 12) s.x = s1.prev.x + 12;
      s.beam_st = true;
      delete s.beam_end;
      s.tmp = true;
      delete s.sls;
      s1 = s;
    }

    /* search last note in beam */
    notes = nflags = 0; /* set x positions, count notes and flags */
    two_staves = two_dir = false;
    st = s1.st;
    v = s1.v;
    stem_xoff = s1.grace ? GSTEM_XOFF : 3.5;
    for (s2 = s1; ; s2 = s2.next) {
      if (s2.type == C.NOTE) {
        if (s2.nflags > nflags) nflags = s2.nflags;
        notes++;
        if (s2.st != st) two_staves = true;
        if (s2.stem != s1.stem) two_dir = true;
        if (!visible && !s2.invis && (!s2.stemless || s2.trem2)) visible = true;
        if (s2.beam_end) break;
      }
      if (!s2.next) {
        /* beam towards next music line */
        for (; ; s2 = s2.prev) {
          if (s2.type == C.NOTE) break;
        }
        s = sym_dup(s2);
        s.next = s2.next;
        if (s.next) s.next.prev = s;
        s2.next = s;
        s.prev = s2;
        s.ts_next = s2.ts_next;
        if (s.ts_next) s.ts_next.ts_prev = s;
        s2.ts_next = s;
        s.ts_prev = s2;
        delete s.beam_st;
        s.beam_end = true;
        s.tmp = true;
        delete s.sls;
        s.x += 12;
        if (s.x < realwidth - 12) s.x = realwidth - 12;
        s2 = s;
        notes++;
        break;
      }
    }

    // at least, must have a visible note with a stem
    if (!visible) return false;

    bm.s2 = s2; /* (don't display the flags) */

    if (staff_tb[st].y == 0) {
      /* staves not defined */
      if (two_staves) return false;
    } else {
      /* staves defined */
      //		if (!two_staves && !s1.grace) {
      if (!two_staves) {
        bm.s1 = s1; /* beam already calculated */
        bm.a = (s1.ys - s2.ys) / (s1.xs - s2.xs);
        bm.b = s1.ys - s1.xs * bm.a + staff_tb[st].y;
        bm.nflags = nflags;
        return true;
      }
    }

    s_closest = s1;
    p_min = 100;
    p_max = 0;
    for (s = s1; ; s = s.next) {
      if (s.type != C.NOTE) continue;
      if ((scale = s.p_v.scale) == 1) scale = staff_tb[s.st].staffscale;
      if (s.stem >= 0) {
        x = stem_xoff + s.notes[0].shhd;
        if (s.notes[s.nhd].pit > p_max) {
          p_max = s.notes[s.nhd].pit;
          s_closest = s;
        }
      } else {
        x = -stem_xoff + s.notes[s.nhd].shhd;
        if (s.notes[0].pit < p_min) {
          p_min = s.notes[0].pit;
          s_closest = s;
        }
      }
      s.xs = s.x + x * scale;
      if (s == s2) break;
    }

    // have flat beams on grace notes when asked
    if (s.grace && cfmt.flatbeams) a = 0;
    // if a note inside the beam is the closest to the beam, the beam is flat
    else if (!two_dir && notes >= 3 && s_closest != s1 && s_closest != s2)
      a = 0;

    y = s1.ys + staff_tb[st].y;
    if (a == undefined) a = (s2.ys + staff_tb[s2.st].y - y) / (s2.xs - s1.xs);

    if (a != 0) a = (cfmt.beamslope * a) / (cfmt.beamslope + Math.abs(a)); // max steepness for beam

    // pivot around the middle of the beam
    b = (y + s2.ys + staff_tb[s2.st].y) / 2 - (a * (s2.xs + s1.xs)) / 2;

    /*fixme: have a look again*/
    /* have room for the symbols in the staff */
    max_stem_err = 0; /* check stem lengths */
    s = s1;
    if (two_dir) {
      /* 2 directions */
      /*fixme: more to do*/
      ys = ((s1.grace ? 3.5 : BEAM_SHIFT) * (nflags - 1) + BEAM_DEPTH) * 0.5;
      if (s1.stem != s2.stem && s1.nflags < s2.nflags) b += ys * s2.stem;
      else b += ys * s1.stem;
    } else if (!s1.grace) {
      /* normal notes */
      var beam_h = BEAM_DEPTH + BEAM_SHIFT * (nflags - 1);
      //--fixme: added for abc2svg
      while (
        s.ts_prev &&
        s.ts_prev.type == C.NOTE &&
        s.ts_prev.time == s.time &&
        s.ts_prev.x > s1.xs
      )
        s = s.ts_prev;

      for (; s && s.time <= s2.time; s = s.ts_next) {
        if (s.type != C.NOTE || s.invis || (s.st != st && s.v != v)) {
          continue;
        }
        x = s.v == v ? s.xs : s.x;
        ys = a * x + b - staff_tb[s.st].y;
        if (s.v == v) {
          stem_err = min_tb[s.nhd == 0 ? 0 : 1][s.nflags];
          if (s.stem > 0) {
            if (s.notes[s.nhd].pit > 26) {
              stem_err -= 2;
              if (s.notes[s.nhd].pit > 28) stem_err -= 2;
            }
            stem_err -= ys - 3 * (s.notes[s.nhd].pit - 18);
          } else {
            if (s.notes[0].pit < 18) {
              stem_err -= 2;
              if (s.notes[0].pit < 16) stem_err -= 2;
            }
            stem_err -= 3 * (s.notes[0].pit - 18) - ys;
          }
          stem_err += BEAM_DEPTH + BEAM_SHIFT * (s.nflags - 1);
        } else {
          /*fixme: KO when two_staves*/
          if (s1.stem > 0) {
            if (s.stem > 0) {
              /*fixme: KO when the voice numbers are inverted*/
              if (s.ymn > ys + 4 || s.ymx < ys - beam_h - 2) continue;
              if (s.v > v) stem_err = s.ymx - ys;
              else stem_err = s.ymn + 8 - ys;
            } else {
              stem_err = s.ymx - ys;
            }
          } else {
            if (s.stem < 0) {
              if (s.ymx < ys - 4 || s.ymn > ys - beam_h - 2) continue;
              if (s.v < v) stem_err = ys - s.ymn;
              else stem_err = ys - s.ymx + 8;
            } else {
              stem_err = ys - s.ymn;
            }
          }
          stem_err += 2 + beam_h;
        }
        if (stem_err > max_stem_err) max_stem_err = stem_err;
      }
    } else {
      /* grace notes */
      for (; ; s = s.next) {
        ys = a * s.xs + b - staff_tb[s.st].y;
        stem_err = GSTEM - 2;
        if (s.stem > 0) stem_err -= ys - 3 * (s.notes[s.nhd].pit - 18);
        else stem_err += ys - 3 * (s.notes[0].pit - 18);
        stem_err += 3 * (s.nflags - 1);
        if (stem_err > max_stem_err) max_stem_err = stem_err;
        if (s == s2) break;
      }
    }

    if (max_stem_err > 0)
      /* shift beam if stems too short */
      b += s1.stem * max_stem_err;

    /* have room for the gracenotes, bars and clefs */
    /*fixme: test*/
    if (!two_staves && !two_dir)
      for (s = s1.next; ; s = s.next) {
        switch (s.type) {
          case C.REST /* cannot move rests in multi-voices */:
            g = s.ts_next;
            if (!g || g.st != st || (g.type != C.NOTE && g.type != C.REST))
              break;
          //fixme:too much vertical shift if some space above the note
          //fixme:this does not fix rest under beam in second voice (ts_prev)
          /*fall thru*/
          case C.BAR:
            if (s.invis) break;
          /*fall thru*/
          case C.CLEF:
            y = a * s.x + b;
            if (s1.stem > 0) {
              y = s.ymx - y + BEAM_DEPTH + BEAM_SHIFT * (nflags - 1) + 2;
              if (y > 0) b += y;
            } else {
              y = s.ymn - y - BEAM_DEPTH - BEAM_SHIFT * (nflags - 1) - 2;
              if (y < 0) b += y;
            }
            break;
          case C.GRACE:
            for (g = s.extra; g; g = g.next) {
              y = a * g.x + b;
              if (s1.stem > 0) {
                y = g.ymx - y + BEAM_DEPTH + BEAM_SHIFT * (nflags - 1) + 2;
                if (y > 0) b += y;
              } else {
                y = g.ymn - y - BEAM_DEPTH - BEAM_SHIFT * (nflags - 1) - 2;
                if (y < 0) b += y;
              }
            }
            break;
        }
        if (s == s2) break;
      }

    if (a == 0)
      /* shift flat beams onto staff lines */
      b += b_pos(s1.grace, s1.stem, nflags, b - staff_tb[st].y);

    /* adjust final stems and rests under beam */
    for (s = s1; ; s = s.next) {
      switch (s.type) {
        case C.NOTE:
          s.ys = a * s.xs + b - staff_tb[s.st].y;
          if (s.stem > 0) {
            s.ymx = s.ys + 2.5;
            //fixme: hack
            if (
              s.ts_prev &&
              s.ts_prev.stem > 0 &&
              s.ts_prev.st == s.st &&
              s.ts_prev.ymn < s.ymx &&
              s.ts_prev.x == s.x &&
              s.notes[0].shhd == 0
            ) {
              s.ts_prev.x -= 3; /* fix stem clash */
              s.ts_prev.xs -= 3;
            }
          } else {
            s.ymn = s.ys - 2.5;
          }
          break;
        case C.REST:
          y = a * s.x + b - staff_tb[s.st].y;
          dy =
            BEAM_DEPTH + BEAM_SHIFT * (nflags - 1) + (s.head != C.FULL ? 4 : 9);
          if (s1.stem > 0) {
            y -= dy;
            if (s1.multi == 0 && y > 12) y = 12;
            if (s.y <= y) break;
          } else {
            y += dy;
            if (s1.multi == 0 && y < 12) y = 12;
            if (s.y >= y) break;
          }
          if (s.head != C.FULL) y = (((y + 3 + 12) / 6) | 0) * 6 - 12;
          s.y = y;
          break;
      }
      if (s == s2) break;
    }

    /* save beam parameters */
    if (staff_tb[st].y == 0) /* if staves not defined */ return false;
    bm.s1 = s1;
    bm.a = a;
    bm.b = b;
    bm.nflags = nflags;
    return true;
  };

  /* -- draw the beams for one word -- */
  /* (the staves are defined) */
  function draw_beams(bm) {
    var s,
      i,
      beam_dir,
      shift,
      bshift,
      bstub,
      bh,
      da,
      k,
      k1,
      k2,
      x1,
      s1 = bm.s1,
      s2 = bm.s2;

    /* -- draw a single beam -- */
    function draw_beam(x1, x2, dy, h, bm, n) {
      /* beam number (1..n) */
      var y1,
        dy2,
        s = bm.s1,
        nflags = s.nflags;

      if (s.ntrem) nflags -= s.ntrem;
      if (s.trem2 && n > nflags) {
        if (s.dur >= C.BLEN / 2) {
          x1 = s.x + 6;
          x2 = bm.s2.x - 6;
        } else if (s.dur < C.BLEN / 4) {
          x1 += 5;
          x2 -= 6;
        }
      }

      y1 = bm.a * x1 + bm.b - dy;
      x2 -= x1;
      //--fixme: scale (bm.a already scaled!)
      x2 /= stv_g.scale;
      dy2 = bm.a * x2 * stv_g.scale;
      xypath(x1, y1, true);
      output +=
        "l" +
        x2.toFixed(1) +
        " " +
        (-dy2).toFixed(1) +
        "v" +
        h.toFixed(1) +
        "l" +
        (-x2).toFixed(1) +
        " " +
        dy2.toFixed(1) +
        'z"/>\n';
    } // draw_beam()

    anno_start(s1, "beam");
    /*fixme: KO if many staves with different scales*/
    //	set_scale(s1)
    if (!s1.grace) {
      bshift = BEAM_SHIFT;
      bstub = BEAM_STUB;
      shift = 0.34; /* (half width of the stem) */
      bh = BEAM_DEPTH;
    } else {
      bshift = 3.5;
      bstub = 3.2;
      shift = 0.29;
      bh = 1.8;
    }

    /*fixme: quick hack for stubs at end of beam and different stem directions*/
    beam_dir = s1.stem;
    if (s1.stem != s2.stem && s1.nflags < s2.nflags) beam_dir = s2.stem;
    if (beam_dir < 0) bh = -bh;

    /* make first beam over whole word and adjust the stem lengths */
    draw_beam(s1.xs - shift, s2.xs + shift, 0, bh, bm, 1);
    da = 0;
    for (s = s1; ; s = s.next) {
      if (s.type == C.NOTE && s.stem != beam_dir)
        s.ys =
          bm.a * s.xs +
          bm.b -
          staff_tb[s.st].y +
          bshift * (s.nflags - 1) * s.stem -
          bh;
      if (s == s2) break;
    }

    if (s1.feathered_beam) {
      da = bshift / (s2.xs - s1.xs);
      if (s1.feathered_beam > 0) {
        da = -da;
        bshift = da * s1.xs;
      } else {
        bshift = da * s2.xs;
      }
      da = da * beam_dir;
    }

    /* other beams with two or more flags */
    shift = 0;
    for (i = 2; i <= bm.nflags; i++) {
      shift += bshift;
      if (da != 0) bm.a += da;
      for (s = s1; ; s = s.next) {
        if (s.type != C.NOTE || s.nflags < i) {
          if (s == s2) break;
          continue;
        }
        if (s.trem1 && i > s.nflags - s.ntrem) {
          x1 = s.dur >= C.BLEN / 2 ? s.x : s.xs;
          draw_beam(x1 - 5, x1 + 5, (shift + 2.5) * beam_dir, bh, bm, i);
          if (s == s2) break;
          continue;
        }
        k1 = s;
        while (1) {
          if (s == s2) break;
          k = s.next;
          if (k.type == C.NOTE || k.type == C.REST) {
            if (k.trem1) {
              if (k.nflags - k.ntrem < i) break;
            } else if (k.nflags < i) {
              break;
            }
          }
          if (k.beam_br1 || (k.beam_br2 && i > 2)) break;
          s = k;
        }
        k2 = s;
        while (k2.type != C.NOTE) k2 = k2.prev;
        x1 = k1.xs;
        if (k1 == k2) {
          if (k1 == s1) {
            x1 += bstub;
          } else if (k1 == s2) {
            x1 -= bstub;
          } else if (k1.beam_br1 || (k1.beam_br2 && i > 2)) {
            x1 += bstub;
          } else {
            k = k1.next;
            while (k.type != C.NOTE) k = k.next;
            if (k.beam_br1 || (k.beam_br2 && i > 2)) {
              x1 -= bstub;
            } else {
              k1 = k1.prev;
              while (k1.type != C.NOTE) k1 = k1.prev;
              if (
                k1.nflags < k.nflags ||
                (k1.nflags == k.nflags && k1.dots < k.dots)
              )
                x1 += bstub;
              else x1 -= bstub;
            }
          }
        }
        draw_beam(x1, k2.xs, shift * beam_dir, bh, bm, i);
        if (s == s2) break;
      }
    }
    if (s1.tmp) unlksym(s1);
    else if (s2.tmp) unlksym(s2);
    anno_stop(s1, "beam");
  }

  /* -- draw the left side of the staves -- */
  function draw_lstaff(x) {
    //	if (cfmt.alignbars)
    //		return
    var i,
      j,
      yb,
      h,
      fl,
      nst = cur_sy.nstaff,
      l = 0;

    /* -- draw a system brace or bracket -- */
    function draw_sysbra(x, st, flag) {
      var i, st_end, yt, yb;

      while (!cur_sy.st_print[st]) {
        if (cur_sy.staves[st].flags & flag) return;
        st++;
      }
      i = st_end = st;
      while (1) {
        if (cur_sy.st_print[i]) st_end = i;
        if (cur_sy.staves[i].flags & flag) break;
        i++;
      }
      yt = staff_tb[st].y + staff_tb[st].topbar * staff_tb[st].staffscale;
      yb =
        staff_tb[st_end].y +
        staff_tb[st_end].botbar * staff_tb[st_end].staffscale;
      if (flag & (CLOSE_BRACE | CLOSE_BRACE2)) out_brace(x, yb, yt - yb);
      else out_bracket(x, yt, yt - yb);
    }

    for (i = 0; ; i++) {
      fl = cur_sy.staves[i].flags;
      if (fl & (OPEN_BRACE | OPEN_BRACKET)) l++;
      if (cur_sy.st_print[i]) break;
      if (fl & (CLOSE_BRACE | CLOSE_BRACKET)) l--;
      if (i == nst) break;
    }
    for (j = nst; j > i; j--) {
      if (cur_sy.st_print[j]) break;
    }
    if (i == j && l == 0) return;
    yb = staff_tb[j].y + staff_tb[j].botbar * staff_tb[j].staffscale;
    h = staff_tb[i].y + staff_tb[i].topbar * staff_tb[i].staffscale - yb;
    xypath(x, yb);
    output += "v" + (-h).toFixed(1) + '"/>\n';
    for (i = 0; i <= nst; i++) {
      fl = cur_sy.staves[i].flags;
      if (fl & OPEN_BRACE) draw_sysbra(x, i, CLOSE_BRACE);
      if (fl & OPEN_BRACKET) draw_sysbra(x, i, CLOSE_BRACKET);
      if (fl & OPEN_BRACE2) draw_sysbra(x - 6, i, CLOSE_BRACE2);
      if (fl & OPEN_BRACKET2) draw_sysbra(x - 6, i, CLOSE_BRACKET2);
    }
  }

  /* -- draw the time signature -- */
  function draw_meter(s) {
    if (!s.a_meter) return;
    var dx,
      i,
      j,
      meter,
      x,
      st = s.st,
      p_staff = staff_tb[st],
      y = p_staff.y;

    // adjust the vertical offset according to the staff definition
    if (p_staff.stafflines != "|||||")
      y += (p_staff.topbar + p_staff.botbar) / 2 - 12; // bottom

    for (i = 0; i < s.a_meter.length; i++) {
      meter = s.a_meter[i];
      x = s.x + s.x_meter[i];

      if (meter.bot) {
        out_XYAB(
          '\
<g transform="translate(X,Y)" text-anchor="middle">\n\
	<text y="-12">A</text>\n\
	<text>B</text>\n\
</g>\n',
          x,
          y + 6,
          m_gl(meter.top),
          m_gl(meter.bot)
        );
      } else {
        out_XYAB(
          '\
<text x="X" y="Y" text-anchor="middle">A</text>\n',
          x,
          y + 12,
          m_gl(meter.top)
        );
      }
    }
  }

  var acc_nd = {}; // cache of the microtonal accidentals

  /* -- draw an accidental -- */
  function draw_acc(x, y, a) {
    if (typeof a != "number") {
      // if microtone
      var c,
        n = a[0],
        d = a[1];

      c = n + "_" + d;
      a = acc_nd[c];
      if (!a) {
        a = abc2svg.rat(Math.abs(n), d);
        d = a[1];
        a = (n < 0 ? -a[0] : a[0]).toString();
        if (d != 1) a += "_" + d;
        acc_nd[c] = a;
      }
    }
    xygl(x, y, "acc" + a);
  }

  // memorize the helper/ledger lines
  function set_hl(p_st, n, x, dx1, dx2) {
    var i, hl;

    if (n >= 0) {
      hl = p_st.hlu[n];
      if (!hl) hl = p_st.hlu[n] = [];
    } else {
      hl = p_st.hld[-n];
      if (!hl) hl = p_st.hld[-n] = [];
    }

    for (i = 0; i < hl.length; i++) {
      if (x >= hl[i][0]) break;
    }
    if (i == hl.length) {
      hl.push([x, dx1, dx2]);
    } else if (x > hl[i][0]) {
      hl.splice(++i, 0, [x, dx1, dx2]);
    } else {
      if (dx1 < hl[i][1]) hl[i][1] = dx1;
      if (dx2 > hl[i][2]) hl[i][2] = dx2;
    }
  } // set_hl()

  // draw helper lines
  // (possible hook)
  Abc.prototype.draw_hl = function (s) {
    var i,
      j,
      n,
      note,
      hla = [],
      st = s.st,
      p_staff = staff_tb[st];

    // check if any helper line
    if (!p_staff.hll) return; // no helper line (no line)
    for (i = 0; i <= s.nhd; i++) {
      note = s.notes[i];
      if (!p_staff.hlmap[note.pit - p_staff.hll])
        hla.push([note.pit - 18, note.shhd * stv_g.scale]);
    }
    n = hla.length;
    if (!n) return; // no

    // handle the helper lines out of the staff
    var dx1,
      dx2,
      hl,
      shhd,
      hlp,
      stafflines = p_staff.stafflines,
      top = stafflines.length - 1,
      yu = top,
      bot = p_staff.botline / 6,
      yl = bot,
      dx = s.grace ? 4 : hw_tb[s.head] * 1.3;

    // get the x start and x stop of the intermediate helper lines
    note = s.notes[s.stem < 0 ? s.nhd : 0];
    shhd = note.shhd;

    for (i = 0; i < hla.length; i++) {
      hlp = hla[i][0];
      dx1 = (hla[i][1] < shhd ? hla[i][1] : shhd) - dx;
      dx2 = (hla[i][1] > shhd ? hla[i][1] : shhd) + dx;
      if (hlp < bot * 2) {
        if (hlp < yl * 2) yl = ++hlp >> 1;
        n--;
      } else if (hlp > top * 2) {
        yu = hlp >> 1;
        n--;
      }
      set_hl(p_staff, hlp >> 1, s.x, dx1, dx2);
    }

    dx1 = shhd - dx;
    dx2 = shhd + dx;
    while (++yl < bot) set_hl(p_staff, yl, s.x, dx1, dx2);
    while (--yu > top) set_hl(p_staff, yu, s.x, dx1, dx2);
    if (!n) return; // no more helper lines

    // draw the helper lines inside the staff
    i = yl;
    j = yu;
    while (i > bot && stafflines[i] == "-") i--;
    while (j < top && stafflines[j] == "-") j++;
    for (; i < j; i++) {
      if (stafflines[i] == "-") set_hl(p_staff, i, s.x, dx1, dx2);
    }
  };

  /* -- draw a key signature -- */
  // (possible hook)
  var sharp_cl = new Int8Array([24, 9, 15, 21, 6, 12, 18]),
    flat_cl = new Int8Array([12, 18, 24, 9, 15, 21, 6]),
    sharp1 = new Int8Array([-9, 12, -9, -9, 12, -9]),
    sharp2 = new Int8Array([12, -9, 12, -9, 12, -9]),
    flat1 = new Int8Array([9, -12, 9, -12, 9, -12]),
    flat2 = new Int8Array([-12, 9, -12, 9, -12, 9]);

  Abc.prototype.draw_keysig = function (x, s) {
    if (s.k_none || s.k_play) return;
    var old_sf = s.k_old_sf,
      st = s.st,
      staffb = staff_tb[st].y,
      i,
      shift,
      p_seq,
      clef_ix = s.k_y_clef;

    if (clef_ix & 1) clef_ix += 7;
    clef_ix /= 2;
    while (clef_ix < 0) clef_ix += 7;
    clef_ix %= 7;

    /* normal accidentals */
    if (!s.k_a_acc) {
      /* put neutrals if 'accidental cancel' */
      if (cfmt.cancelkey || s.k_sf == 0) {
        /* when flats to sharps, or sharps to flats, */
        if (s.k_sf == 0 || old_sf * s.k_sf < 0) {
          /* old sharps */
          shift = sharp_cl[clef_ix];
          p_seq = shift > 9 ? sharp1 : sharp2;
          for (i = 0; i < old_sf; i++) {
            xygl(x, staffb + shift, "acc3");
            shift += p_seq[i];
            x += 5.5;
          }

          /* old flats */
          shift = flat_cl[clef_ix];
          p_seq = shift < 18 ? flat1 : flat2;
          for (i = 0; i > old_sf; i--) {
            xygl(x, staffb + shift, "acc3");
            shift += p_seq[-i];
            x += 5.5;
          }
          if (s.k_sf != 0) x += 3; /* extra space */
        }
      }

      /* new sharps */
      if (s.k_sf > 0) {
        shift = sharp_cl[clef_ix];
        p_seq = shift > 9 ? sharp1 : sharp2;
        for (i = 0; i < s.k_sf; i++) {
          xygl(x, staffb + shift, "acc1");
          shift += p_seq[i];
          x += 5.5;
        }
        if (cfmt.cancelkey && i < old_sf) {
          x += 2;
          for (; i < old_sf; i++) {
            xygl(x, staffb + shift, "acc3");
            shift += p_seq[i];
            x += 5.5;
          }
        }
      }

      /* new flats */
      if (s.k_sf < 0) {
        shift = flat_cl[clef_ix];
        p_seq = shift < 18 ? flat1 : flat2;
        for (i = 0; i > s.k_sf; i--) {
          xygl(x, staffb + shift, "acc-1");
          shift += p_seq[-i];
          x += 5.5;
        }
        if (cfmt.cancelkey && i > old_sf) {
          x += 2;
          for (; i > old_sf; i--) {
            xygl(x, staffb + shift, "acc3");
            shift += p_seq[-i];
            x += 5.5;
          }
        }
      }
    } else if (s.k_a_acc.length) {
      /* explicit accidentals */
      var acc,
        last_acc = s.k_a_acc[0].acc,
        last_shift = 100,
        s2 = {
          st: st,
          nhd: 0,
          notes: [{}],
        };

      for (i = 0; i < s.k_a_acc.length; i++) {
        acc = s.k_a_acc[i];
        shift =
          (s.k_y_clef + // clef shift
            acc.pit -
            18) *
          3;
        if (i != 0 && (shift > last_shift + 18 || shift < last_shift - 18))
          x -= 5.5;
        // no clash
        else if (acc.acc != last_acc) x += 3;
        last_acc = acc.acc;
        s2.x = x;
        s2.notes[0].pit = shift / 3 + 18;
        self.draw_hl(s2);
        last_shift = shift;
        draw_acc(x, staffb + shift, acc.acc);
        x += 5.5;
      }
    }
  };

  /* -- convert the standard measure bars -- */
  function bar_cnv(bar_type) {
    switch (bar_type) {
      case "[":
      case "[]":
        return ""; /* invisible */
      case "|:":
      case "|::":
      case "|:::":
        return "[" + bar_type; /* |::: -> [|::: */
      case ":|":
      case "::|":
      case ":::|":
        return bar_type + "]"; /* :..| -> :..|] */
      case "::":
        return cfmt.dblrepbar; /* :: -> double repeat bar */
    }
    return bar_type;
  }

  /* -- draw a rest -- */
  /* (the staves are defined) */
  var rest_tb = [
    "r128",
    "r64",
    "r32",
    "r16",
    "r8",
    "r4",
    "r2",
    "r1",
    "r0",
    "r00",
  ];

  function draw_rest(s) {
    var s2,
      i,
      j,
      x,
      y,
      yb,
      bx,
      p_staff = staff_tb[s.st];

    // if rest alone in the measure or measure repeat,
    // change the head and center
    if (s.dur_orig == s.p_v.meter.wmeasure || (s.rep_nb && s.rep_nb >= 0)) {
      if (s.dur < C.BLEN * 2) s.nflags = -2;
      // semibreve / whole
      else if (s.dur < C.BLEN * 4) s.nflags = -3;
      else s.nflags = -4;
      s.dots = 0;

      /* don't use next/prev: there is no bar in voice overlay */
      s2 = s.ts_next;
      while (s2.time != s.time + s.dur && s2.ts_next) s2 = s2.ts_next;
      x = s2.x - s2.wl;
      s2 = s;
      while (!s2.seqst) s2 = s2.ts_prev;
      s2 = s2.ts_prev;
      x = (x + s2.x + s2.wr) / 2;

      /* center the associated decorations */
      if (s.a_dd) deco_update(s, x - s.x);
      s.x = x;
    } else {
      x = s.x;
      if (s.notes[0].shhd) x += s.notes[0].shhd * stv_g.scale;
    }
    if (s.invis) return;

    yb = p_staff.y; // bottom of staff

    if (s.rep_nb) {
      set_sscale(s.st);
      anno_start(s);
      if (p_staff.stafflines == "|||||") yb += 12;
      else yb += (p_staff.topbar + p_staff.botbar) / 2;
      if (s.rep_nb < 0) {
        xygl(x, yb, "srep");
      } else {
        xygl(x, yb, "mrep");
        if (s.rep_nb > 2 && s.v == cur_sy.top_voice) {
          set_font("annotation");
          if (gene.curfont.box) {
            gene.curfont.box = false;
            bx = true;
          }
          xy_str(x, yb + p_staff.topbar - 9, s.rep_nb.toString(), "c");
          if (bx) gene.curfont.box = true;
        }
      }
      anno_stop(s);
      return;
    }

    set_scale(s);
    anno_start(s);

    if (s.notes[0].color) set_color(s.notes[0].color);

    y = s.y;

    i = 5 - s.nflags; /* rest_tb index (5 = C_XFLAGS) */
    if (i == 7 && y == 12 && p_staff.stafflines.length <= 2)
      y -= 6; /* semibreve a bit lower */

    // draw the rest
    if (!s.notes[0].invis)
      // if not head replacement
      xygl(x, y + yb, rest_tb[i]);

    /* output ledger line(s) when greater than minim */
    if (i >= 6) {
      j = y / 6;
      switch (i) {
        default:
          switch (p_staff.stafflines[j + 1]) {
            case "|":
            case "[":
              break;
            default:
              set_hl(p_staff, j + 1, x, -7, 7);
              break;
          }
          if (i == 9) {
            /* longa */
            y -= 6;
            j--;
          }
          break;
        case 7 /* semibreve */:
          y += 6;
          j++;
        case 6 /* minim */:
          break;
      }
      switch (p_staff.stafflines[j]) {
        case "|":
        case "[":
          break;
        default:
          set_hl(p_staff, j, x, -7, 7);
          break;
      }
    }
    if (s.dots) {
      x += 8;
      y += yb + 3;
      j = s.dots;
      i = (s.dur_orig / 12) >> (5 - s.nflags - j);
      while (j-- > 0) {
        xygl(x, y, i & (1 << j) ? "dot" : "dot+");
        x += 3.5;
      }
    }
    set_color();
    anno_stop(s);
  }

  /* -- draw grace notes -- */
  /* (the staves are defined) */
  function draw_gracenotes(s) {
    var yy,
      x0,
      y0,
      x1,
      y1,
      x2,
      y2,
      x3,
      y3,
      bet1,
      bet2,
      slur,
      dy1,
      dy2,
      g,
      last,
      note,
      bm = {};

    /* draw the notes */
    //	bm.s2 = undefined			/* (draw flags) */
    for (g = s.extra; g; g = g.next) {
      if (g.beam_st && !g.beam_end) {
        if (self.calculate_beam(bm, g)) draw_beams(bm);
      }
      anno_start(g);
      draw_note(g, !bm.s2);
      if (g == bm.s2) bm.s2 = null; /* (draw flags again) */
      anno_stop(g);
      if (g.sls || g.sl2) slur = true;
      if (!g.next) break; /* (keep the last note) */
    }

    // if an acciaccatura, draw a bar
    if (s.sappo) {
      g = s.extra;
      if (!g.next) {
        /* if one note */
        x1 = 9;
        y1 = g.stem > 0 ? 5 : -5;
      } else {
        /* many notes */
        x1 = (g.next.x - g.x) * 0.5 + 4;
        y1 = (g.ys + g.next.ys) * 0.5 - g.y;
        if (g.stem > 0) y1 -= 1;
        else y1 += 1;
      }
      note = g.notes[g.stem < 0 ? 0 : g.nhd];
      out_acciac(x_head(g, note), y_head(g, note), x1, y1, g.stem > 0);
    }

    /* slur */
    //fixme: have a full key symbol in voice
    if (
      s.p_v.ckey.k_bagpipe /* no slur when bagpipe */ ||
      !cfmt.graceslurs ||
      slur || // explicit slur
      s.tie_s || // some tie
      !s.next ||
      s.next.type != C.NOTE
    )
      return;
    last = g;
    if (
      ((g.stem >= 0 || s.multi < 0) && g.notes[0].pit <= 28) ||
      g.notes[0].pit < 16
    ) {
      // slur below
      yy = 127;
      for (g = s.extra; g; g = g.next) {
        if (g.y < yy) {
          yy = g.y;
          last = g;
        }
      }
      x0 = last.x;
      y0 = last.y - 5;
      if (s.extra != last) {
        x0 -= 4;
        y0 += 1;
      }
      s = s.next;
      x3 = s.x - 1;
      if (s.stem < 0 && s.nflags > -2) x3 -= 4;
      y3 = 3 * (s.notes[0].pit - 18) - 5;
      dy1 = (x3 - x0) * 0.4;
      if (dy1 > 3) dy1 = 3;
      dy2 = dy1;
      bet1 = 0.2;
      bet2 = 0.8;
      if (y0 > y3 + 7) {
        x0 = last.x - 1;
        y0 += 0.5;
        y3 += 6.5;
        x3 = s.x - 5.5;
        dy1 = (y0 - y3) * 0.8;
        dy2 = (y0 - y3) * 0.2;
        bet1 = 0;
      } else if (y3 > y0 + 4) {
        y3 = y0 + 4;
        x0 = last.x + 2;
        y0 = last.y - 4;
      }
    } else {
      // slur above
      yy = -127;
      for (g = s.extra; g; g = g.next) {
        if (g.y > yy) {
          yy = g.y;
          last = g;
        }
      }
      x0 = last.x;
      y0 = last.y + 5;
      if (s.extra != last) {
        x0 -= 4;
        y0 -= 1;
      }
      s = s.next;
      x3 = s.x - 1;
      if (s.stem >= 0 && s.nflags > -2) x3 -= 2;
      y3 = 3 * (s.notes[s.nhd].pit - 18) + 5;
      dy1 = (x0 - x3) * 0.4;
      if (dy1 < -3) dy1 = -3;
      dy2 = dy1;
      bet1 = 0.2;
      bet2 = 0.8;
      if (y0 < y3 - 7) {
        x0 = last.x - 1;
        y0 -= 0.5;
        y3 -= 6.5;
        x3 = s.x - 5.5;
        dy1 = (y0 - y3) * 0.8;
        dy2 = (y0 - y3) * 0.2;
        bet1 = 0;
      } else if (y3 < y0 - 4) {
        y3 = y0 - 4;
        x0 = last.x + 2;
        y0 = last.y + 4;
      }
    }

    x1 = bet1 * x3 + (1 - bet1) * x0 - x0;
    y1 = bet1 * y3 + (1 - bet1) * y0 - dy1 - y0;
    x2 = bet2 * x3 + (1 - bet2) * x0 - x0;
    y2 = bet2 * y3 + (1 - bet2) * y0 - dy2 - y0;

    anno_start(s, "slur");
    xypath(x0, y0 + staff_tb[s.st].y);
    output +=
      "c" +
      x1.toFixed(1) +
      " " +
      (-y1).toFixed(1) +
      " " +
      x2.toFixed(1) +
      " " +
      (-y2).toFixed(1) +
      " " +
      (x3 - x0).toFixed(1) +
      " " +
      (-y3 + y0).toFixed(1) +
      '"/>\n';
    anno_stop(s, "slur");
  }

  /* -- set the y offset of the dots -- */
  function setdoty(s, y_tb) {
    var m, m1, y;

    /* set the normal offsets */
    for (m = 0; m <= s.nhd; m++) {
      y = 3 * (s.notes[m].pit - 18); /* note height on staff */
      if (y % 6 == 0) {
        if (s.dot_low) y -= 3;
        else y += 3;
      }
      y_tb[m] = y;
    }
    /* dispatch and recenter the dots in the staff spaces */
    for (m = 0; m < s.nhd; m++) {
      if (y_tb[m + 1] > y_tb[m]) continue;
      m1 = m;
      while (m1 > 0) {
        if (y_tb[m1] > y_tb[m1 - 1] + 6) break;
        m1--;
      }
      if (
        3 * (s.notes[m1].pit - 18) - y_tb[m1] <
        y_tb[m + 1] - 3 * (s.notes[m + 1].pit - 18)
      ) {
        while (m1 <= m) y_tb[m1++] -= 6;
      } else {
        y_tb[m + 1] = y_tb[m] + 6;
      }
    }
  }

  // get the x and y position of a note head
  // (when the staves are defined)
  function x_head(s, note) {
    return s.x + note.shhd * stv_g.scale;
  }
  function y_head(s, note) {
    return staff_tb[s.st].y + 3 * (note.pit - 18);
  }

  /* -- draw m-th head with accidentals and dots -- */
  /* (the staves are defined) */
  // sets {x,y}_note
  function draw_basic_note(x, s, m, y_tb) {
    var i,
      p,
      yy,
      dotx,
      doty,
      inv,
      old_color = false,
      note = s.notes[m],
      staffb = staff_tb[s.st].y /* bottom of staff */,
      y = 3 * (note.pit - 18) /* note height on staff */,
      shhd = note.shhd * stv_g.scale,
      x_note = x + shhd,
      y_note = y + staffb,
      // YYMCode: 写入 note id
      note_id = note.note_id;
    var elts = identify_note(s, note.dur),
      head = elts[0],
      dots = elts[1],
      nflags = elts[2];
    /* draw the head */
    if (note.invis) {
    } else if (s.grace) {
      // don't apply %%map to grace notes
      p = "ghd";
      x_note -= 4.5 * stv_g.scale;
    } else if (note.map && note.map[0]) {
      i = s.head;
      p = note.map[0][i]; // heads
      if (!p) p = note.map[0][note.map[0].length - 1];
      i = p.indexOf("/");
      if (i >= 0) {
        // stem dependant
        if (s.stem >= 0) p = p.slice(0, i);
        else p = p.slice(i + 1);
      }
    } else if (s.type == C.CUSTOS) {
      p = "custos";
    } else {
      switch (head) {
        case C.OVAL:
          p = "HD";
          break;
        case C.OVALBARS:
          if (s.head != C.SQUARE) {
            p = "HDD";
            break;
          }
        // fall thru
        case C.SQUARE:
          if (nflags > -4) {
            p = "breve";
          } else {
            p = "longa";
            inv = s.stem > 0;
          }

          /* don't display dots on last note of the tune */
          if (!tsnext && s.next && s.next.type == C.BAR && !s.next.next)
            dots = 0;
          x_note += 1;
          break;
        case C.EMPTY:
          p = "Hd"; // white note
          break;
        default:
          // black note
          p = "hd";
          break;
      }
    }
    if (note.color != undefined) old_color = set_color(note.color);
    if (p) {
      if (inv) {
        g_open(x_note, y_note, 0, 1, -1);
        x_note = y_note = 0;
      }
      // YYMCode: 添加note id
      if (!self.psxygl(x_note, y_note, p)) xygl(x_note, y_note, p, note_id);
      // ******************/
      if (inv) g_close();
    }

    /* draw the dots */
    /*fixme: to see for grace notes*/
    if (dots) {
      dotx = x + (7.7 + s.xmx) * stv_g.scale;
      if (y_tb[m] == undefined) {
        y_tb[m] = 3 * (s.notes[m].pit - 18);
        if ((s.notes[m].pit & 1) == 0) y_tb[m] += 3;
      }
      doty = y_tb[m] + staffb;
      i = (note.dur / 12) >> (5 - nflags - dots);
      while (dots-- > 0) {
        xygl(dotx, doty, i & (1 << dots) ? "dot" : "dot+");
        dotx += 3.5;
      }
    }

    /* draw the accidental */
    if (note.acc) {
      x -= note.shac * stv_g.scale;
      if (!s.grace) {
        draw_acc(x, y + staffb, note.acc);
      } else {
        g_open(x, y + staffb, 0, 0.75);
        draw_acc(0, 0, note.acc);
        g_close();
      }
    }
    if (old_color != false) set_color(old_color);
  }

  /* -- draw a note or a chord -- */
  /* (the staves are defined) */
  function draw_note(s, fl) {
    // draw flags
    var s2,
      i,
      m,
      y,
      staffb,
      slen,
      c,
      nflags,
      x,
      y,
      note,
      y_tb = new Array(s.nhd + 1);

    if (s.dots) setdoty(s, y_tb);

    note = s.notes[s.stem < 0 ? s.nhd : 0]; // master note head
    x = x_head(s, note);
    staffb = staff_tb[s.st].y;

    self.draw_hl(s);

    /* draw the stem and flags */
    y = y_head(s, note);
    if (!s.stemless) {
      slen = s.ys - s.y;
      nflags = s.nflags;
      if (s.ntrem) nflags -= s.ntrem;
      if (!fl || nflags <= 0) {
        /* stem only */
        if (s.nflags > 0) {
          /* (fix for PS low resolution) */
          if (s.stem >= 0) slen -= 1;
          else slen += 1;
        }
        out_stem(x, y, slen, s.grace);
      } else {
        /* stem and flags */
        out_stem(x, y, slen, s.grace, nflags, cfmt.straightflags);
      }
    } else if (s.xstem) {
      /* cross-staff stem */
      s2 = s.ts_prev;
      slen = (s2.stem > 0 ? s2.y : s2.ys) - s.y;
      slen += staff_tb[s2.st].y - staffb;
      out_stem(x, y, slen);
    }

    /* draw the tremolo bars */
    if (fl && s.trem1) {
      var ntrem = s.ntrem || 0,
        x1 = x;
      slen = 3 * (s.notes[s.stem > 0 ? s.nhd : 0].pit - 18);
      if (s.head == C.FULL || s.head == C.EMPTY) {
        x1 += (s.grace ? GSTEM_XOFF : 3.5) * s.stem;
        if (s.stem > 0) slen += 6 + 5.4 * ntrem;
        else slen -= 6 + 5.4;
      } else {
        if (s.stem > 0) slen += 5 + 5.4 * ntrem;
        else slen -= 5 + 5.4;
      }
      slen /= s.p_v.scale;
      out_trem(x1, staffb + slen, ntrem);
    }

    /* draw the note heads */
    x = s.x;
    for (m = 0; m <= s.nhd; m++) draw_basic_note(x, s, m, y_tb);
  }

  // find where to start a long decoration
  function prev_scut(s) {
    while (s.prev) {
      s = s.prev;
      if (s.rbstart) return s;
    }

    /* return a symbol of any voice starting before the start of the voice */
    s = s.p_v.sym;
    while (s.type != C.CLEF) s = s.ts_prev; /* search a main voice */
    if (s.next && s.next.type == C.KEY) s = s.next;
    if (s.next && s.next.type == C.METER) return s.next;
    return s;
  }

  /* -- decide whether a slur goes up or down (same voice) -- */
  function slur_direction(k1, k2) {
    var s, some_upstem, low, dir;

    // check if slur sequence in a multi-voice staff
    function slur_multi(s1, s2) {
      //		while (1) {
      //			if (s1.multi)		// if multi voice
      //				//fixme: may change
      //				return s1.multi
      //			if (s1 == s2)
      //				break
      //			s1 = s1.next
      //		}
      if (s1.multi) return s1.multi;
      if (s2.multi) return s2.multi;
      return 0;
    } // slur_multi()

    if (k1.grace && k1.stem > 0) return -1;

    dir = slur_multi(k1, k2);
    if (dir) return dir;

    for (s = k1; ; s = s.next) {
      if (s.type == C.NOTE) {
        if (!s.stemless) {
          if (s.stem < 0) return 1;
          some_upstem = true;
        }
        if (s.notes[0].pit < 22) /* if under middle staff */ low = true;
      }
      //		if (s == k2)
      if (s.time == k2.time)
        // (k2 may be a grace note)
        break;
    }
    if (!some_upstem && !low) return 1;
    return -1;
  }

  /* -- output a slur / tie -- */
  function slur_out(x1, y1, x2, y2, dir, height, dotted) {
    var dx,
      dy,
      dz,
      alfa = 0.3,
      beta = 0.45;

    /* for wide flat slurs, make shape more square */
    dy = y2 - y1;
    if (dy < 0) dy = -dy;
    dx = x2 - x1;
    if (dx > 40 && dy / dx < 0.7) {
      alfa = 0.3 + 0.002 * (dx - 40);
      if (alfa > 0.7) alfa = 0.7;
    }

    /* alfa, beta, and height determine Bezier control points pp1,pp2
     *
     *           X====alfa===|===alfa=====X
     *	    /		 |	       \
     *	  pp1		 |	        pp2
     *	  /	       height		 \
     *	beta		 |		 beta
     *      /		 |		   \
     *    p1		 m		     p2
     *
     */

    var mx = 0.5 * (x1 + x2),
      my = 0.5 * (y1 + y2),
      xx1 = mx + alfa * (x1 - mx),
      yy1 = my + alfa * (y1 - my) + height;
    xx1 = x1 + beta * (xx1 - x1);
    yy1 = y1 + beta * (yy1 - y1);

    var xx2 = mx + alfa * (x2 - mx),
      yy2 = my + alfa * (y2 - my) + height;
    xx2 = x2 + beta * (xx2 - x2);
    yy2 = y2 + beta * (yy2 - y2);

    //	dy = 1.6 * dir
    dy = 2 * dir;
    dz = 0.2 + 0.001 * dx;
    if (dz > 0.6) dz = 0.6;
    dz *= dir;
    dx *= 0.03;
    //	if (dx > 10.)
    //		dx = 10.

    //	var scale_y = stv_g.st < 0 ? stv_g.scale : 1
    var scale_y = 1; // (see set_dscale())
    if (!dotted) output += '<path d="M';
    else output += '<path class="stroke" stroke-dasharray="5,5" d="M';
    out_sxsy(x1, " ", y1);
    output +=
      "c" +
      ((xx1 - x1) / stv_g.scale).toFixed(1) +
      " " +
      ((y1 - yy1) / scale_y).toFixed(1) +
      " " +
      ((xx2 - x1) / stv_g.scale).toFixed(1) +
      " " +
      ((y1 - yy2) / scale_y).toFixed(1) +
      " " +
      ((x2 - x1) / stv_g.scale).toFixed(1) +
      " " +
      ((y1 - y2) / scale_y).toFixed(1);

    if (!dotted)
      output +=
        "\n\tv" +
        (-dz).toFixed(1) +
        "c" +
        ((xx2 - dx - x2) / stv_g.scale).toFixed(1) +
        " " +
        ((y2 + dz - yy2 - dy) / scale_y).toFixed(1) +
        " " +
        ((xx1 + dx - x2) / stv_g.scale).toFixed(1) +
        " " +
        ((y2 + dz - yy1 - dy) / scale_y).toFixed(1) +
        " " +
        ((x1 - x2) / stv_g.scale).toFixed(1) +
        " " +
        ((y2 - y1) / scale_y).toFixed(1);
    output += '"/>\n';
  }

  // draw a slur between two chords / notes
  /* (the staves are not yet defined) */
  /* (delayed output) */
  /* (not a pretty routine, this) */
  function draw_slur(
    path, // list of symbols under the slur
    not1, // note if start on a note head
    sl
  ) {
    // ending variables: type, note, end on a note
    var i,
      k,
      g,
      x1,
      y1,
      x2,
      y2,
      height,
      addy,
      a,
      y,
      z,
      h,
      dx,
      dy,
      ty = sl.ty,
      dir = (ty & 0x07) == C.SL_ABOVE ? 1 : -1,
      n = path.length,
      i1 = 0,
      i2 = n - 1,
      k1 = path[0],
      k2 = path[i2];

    /*fixme: if two staves, may have upper or lower slur*/

    var nn = 1,
      upstaff = k1.st,
      two_staves = false;

    set_dscale(k1.st);

    for (i = 1; i < n; i++) {
      k = path[i];
      if (k.type == C.NOTE || k.type == C.REST) {
        nn++;
        if (k.st != upstaff) {
          two_staves = true;
          if (k.st < upstaff) upstaff = k.st;
        }
      }
    }
    /*fixme: KO when two staves*/
    if (two_staves) error(2, k1, "*** multi-staves slurs not treated yet");

    /* fix endpoints */
    x1 = k1.x;
    if (k1.notes && k1.notes[0].shhd) x1 += k1.notes[0].shhd;
    x2 = k2.x;
    if (k2.notes) x2 += k2.notes[0].shhd;

    if (not1) {
      // start on a note
      y1 = 3 * (not1.pit - 18) + 2 * dir;
      x1 += 3;
    } else {
      // start on a chord
      y1 = dir > 0 ? k1.ymx + 2 : k1.ymn - 2;
      if (k1.type == C.NOTE) {
        if (dir > 0) {
          if (k1.stem > 0) {
            x1 += 5;
            if (
              k1.beam_end &&
              k1.nflags >= -1 /* if with a stem */ &&
              //fixme: check if at end of tuplet
              !k1.in_tuplet
            ) {
              //					  || k1.ys > y1 - 3)) {
              if (k1.nflags > 0) {
                x1 += 2;
                y1 = k1.ys - 3;
              } else {
                y1 = k1.ys - 6;
              }
              // don't clash with decorations
              //					} else {
              //						y1 = k1.ys + 3
            }
            //				} else {
            //					y1 = k1.y + 8
          }
        } else {
          if (k1.stem < 0) {
            x1 -= 1;
            if (k2.grace) {
              y1 = k1.y - 8;
            } else if (
              k1.beam_end &&
              k1.nflags >= -1 &&
              (!k1.in_tuplet || k1.ys < y1 + 3)
            ) {
              if (k1.nflags > 0) {
                x1 += 2;
                y1 = k1.ys + 3;
              } else {
                y1 = k1.ys + 6;
              }
              //					} else {
              //						y1 = k1.ys - 3
            }
            //				} else {
            //					y1 = k1.y - 8
          }
        }
      }
    }

    if (sl.is_note) {
      // end on a note
      y2 = 3 * (sl.note.pit - 18) + 2 * dir;
      x2 -= 3;
    } else {
      // end on a chord
      y2 = dir > 0 ? k2.ymx + 2 : k2.ymn - 2;
      if (k2.type == C.NOTE) {
        if (dir > 0) {
          if (k2.stem > 0) {
            x2 += 1;
            if (k2.beam_st && k2.nflags >= -1 && !k2.in_tuplet)
              //						|| k2.ys > y2 - 3))
              y2 = k2.ys - 6;
            //					else
            //						y2 = k2.ys + 3
            //				} else {
            //					y2 = k2.y + 8
          }
        } else {
          if (k2.stem < 0) {
            x2 -= 5;
            if (k2.beam_st && k2.nflags >= -1 && !k2.in_tuplet)
              //						|| k2.ys < y2 + 3))
              y2 = k2.ys + 6;
            //					else
            //						y2 = k2.ys - 3
            //				} else {
            //					y2 = k2.y - 8
          }
        }
      }
    }

    if (k1.type != C.NOTE) {
      y1 = y2 + 1.2 * dir;
      x1 = k1.x + k1.wr * 0.5;
      if (x1 > x2 - 12) x1 = x2 - 12;
    }

    if (k2.type != C.NOTE) {
      if (k1.type == C.NOTE) y2 = y1 + 1.2 * dir;
      else y2 = y1;
      if (k1 != k2) x2 = k2.x - k2.wl * 0.3;
    }

    if (nn >= 3) {
      k = path[1];
      if (k.type != C.BAR && k.x < x1 + 48) {
        if (dir > 0) {
          y = k.ymx - 2;
          if (y1 < y) y1 = y;
        } else {
          y = k.ymn + 2;
          if (y1 > y) y1 = y;
        }
      }
      k = path[i2 - 1];
      if (k.type != C.BAR && k.x > x2 - 48) {
        if (dir > 0) {
          y = k.ymx - 2;
          if (y2 < y) y2 = y;
        } else {
          y = k.ymn + 2;
          if (y2 > y) y2 = y;
        }
      }
    }

    a = (y2 - y1) / (x2 - x1); /* slur steepness */
    if (a > SLUR_SLOPE || a < -SLUR_SLOPE) {
      a = a > SLUR_SLOPE ? SLUR_SLOPE : -SLUR_SLOPE;
      if (a * dir > 0) y1 = y2 - a * (x2 - x1);
      else y2 = y1 + a * (x2 - x1);
    }

    /* for big vertical jump, shift endpoints */
    y = y2 - y1;
    if (y > 8) y = 8;
    else if (y < -8) y = -8;
    z = y;
    if (z < 0) z = -z;
    dx = 0.5 * z;
    dy = 0.3 * y;
    if (y * dir > 0) {
      x2 -= dx;
      y2 -= dy;
    } else {
      x1 += dx;
      y1 += dy;
    }

    /* special case for grace notes */
    if (k1.grace) x1 = k1.x - GSTEM_XOFF * 0.5;
    if (k2.grace) x2 = k2.x + GSTEM_XOFF * 1.5;

    h = 0;
    a = (y2 - y1) / (x2 - x1);
    if (k1 != k2 && k1.v == k2.v) {
      addy = y1 - a * x1;
      for (i = 1; i < i2; i++) {
        k = path[i];
        if (k.st != upstaff) continue;
        switch (k.type) {
          case C.NOTE:
          case C.REST:
            if (dir > 0) {
              y = 3 * (k.notes[k.nhd].pit - 18) + 6;
              if (y < k.ymx) y = k.ymx;
              y -= a * k.x + addy;
              if (y > h) h = y;
            } else {
              y = 3 * (k.notes[0].pit - 18) - 6;
              if (y > k.ymn) y = k.ymn;
              y -= a * k.x + addy;
              if (y < h) h = y;
            }
            break;
          case C.GRACE:
            for (g = k.extra; g; g = g.next) {
              if (dir > 0) {
                y = 3 * (g.notes[g.nhd].pit - 18) + 6;
                if (y < g.ymx) y = g.ymx;
                y -= a * g.x + addy;
                if (y > h) h = y;
              } else {
                y = 3 * (g.notes[0].pit - 18) - 6;
                if (y > g.ymn) y = g.ymn;
                y -= a * g.x + addy;
                if (y < h) h = y;
              }
            }
            break;
        }
      }
      y1 += 0.45 * h;
      y2 += 0.45 * h;
      h *= 0.65;
    }

    if (nn > 3) height = (0.08 * (x2 - x1) + 12) * dir;
    else height = (0.03 * (x2 - x1) + 8) * dir;
    if (dir > 0) {
      if (height < 3 * h) height = 3 * h;
      if (height > 40) height = 40;
    } else {
      if (height > 3 * h) height = 3 * h;
      if (height < -40) height = -40;
    }

    y = y2 - y1;
    if (y < 0) y = -y;
    if (dir > 0) {
      if (height < 0.8 * y) height = 0.8 * y;
    } else {
      if (height > -0.8 * y) height = -0.8 * y;
    }
    height *= cfmt.slurheight;

    //	anno_start(k1_o, 'slur');
    slur_out(x1, y1, x2, y2, dir, height, ty & C.SL_DOTTED);
    //	anno_stop(k1_o, 'slur');

    /* have room for other symbols */
    dx = x2 - x1;
    a = (y2 - y1) / dx;
    /*fixme: it seems to work with .4, but why?*/
    //	addy = y1 - a * x1 + .4 * height
    //fixme: the following code seems better!
    addy = y1 - a * x1;
    if (height > 0) addy += 4 * Math.sqrt(height) - 2;
    else addy -= 4 * Math.sqrt(-height) - 2;
    for (i = 0; i < i2; i++) {
      k = path[i];
      if (k.st != upstaff) continue;
      y = a * k.x + addy;
      if (k.ymx < y) k.ymx = y;
      else if (k.ymn > y) k.ymn = y;
      if (i == i2 - 1) {
        dx = x2;
        if (k2.sl1) dx -= 5;
        y -= height / 3;
      } else {
        dx = path[i + 1].x;
      }
      if (i != 0) x1 = k.x;
      else y -= height / 3;
      dx -= x1;
      y_set(upstaff, dir > 0, x1, dx, y);
    }
  }

  /* -- draw the slurs between 2 symbols --*/
  function draw_slurs(s, last) {
    var gr1, i, m, note, sls, nsls;

    // draw a slur knowing the start and stop elements
    function draw_sls(
      s, // start symbol
      sl, // stop note
      snote
    ) {
      // optional start note
      var k,
        v,
        i,
        dir,
        path = [],
        enote = sl.note,
        s2 = enote.s; // end of slur

      if (last && s2.time > last.time) return; // will be drawn next time

      // if the slur continues on the next music line,
      // stop it on the invisible bar at end of current line
      if (tsnext && s2.time >= tsnext.time) {
        s.p_v.sls.push(sl); // continuation on next line
        s2 = s.p_v.s_next.prev; // one voice
        while (s2.next) s2 = s2.next; // search the ending bar
        sl = Object.create(sl); // new slur
        sl.note = {
          s: s2,
        };
      }

      // set the slur position
      switch (sl.ty & 0x07) {
        case C.SL_ABOVE:
          dir = 1;
          break;
        case C.SL_BELOW:
          dir = -1;
          break;
        default:
          if (s.v != s2.v) dir = -1;
          // always above ?
          else dir = slur_direction(s, s2);
          sl.ty &= ~0x07;
          sl.ty |= dir > 0 ? C.SL_ABOVE : C.SL_BELOW;
          break;
      }

      // build the path of the symbols under the slur
      if (s.v == s2.v) {
        v = s.v;
      }
      if (!cur_sy.voices[s.v] || !cur_sy.voices[s2.v]) {
        v = s.v > s2.v ? s.v : s2.v;
      } else if (
        dir * // if slur on first voice
          (cur_sy.voices[s.v].range <= cur_sy.voices[s2.v].range ? 1 : -1) >
        0
      )
        v = s.v;
      else v = s2.v;

      if (
        gr1 && // if start on a grace note
        !(
          s2.grace && // and not end in the same
          s.v == s2.v && // grace note sequence
          s.time == s2.time
        )
      ) {
        do {
          path.push(s); // add all grace notes
          s = s.next;
        } while (s);
        s = gr1.next;
      } else {
        path.push(s);
        if (s.grace) s = s.next;
        else s = s.ts_next;
      }

      if (!s2.grace) {
        // if end on a normal note
        while (s) {
          if (s.v == v) path.push(s);
          if (s == s2) break;
          s = s.ts_next;
        }
      } else if (s.grace) {
        // if start/end in the same sequence
        while (1) {
          //				if (s.v == v)
          path.push(s);
          if (s == s2) break;
          s = s.next;
        }
      } else {
        // end on a grace note
        k = s2;
        while (k.prev) k = k.prev; // .extra pointer
        while (1) {
          if (s.v == v) path.push(s);
          if (s.extra == k) break;
          s = s.ts_next;
        }
        s = k;
        while (1) {
          path.push(s);
          if (s == s2) break;
          s = s.next;
        }
      }

      // if some nested slurs/tuplets, draw them
      for (i = 1; i < path.length - 1; i++) {
        s = path[i];
        if (s.sls || s.sl1) draw_slurs(s, last);
        if (s.tp) draw_tuplet(s);
      }
      draw_slur(path, snote, sl);
      return 1; // slur drawn, remove it
    } // draw_sls()

    // code of draw_slurs()
    while (1) {
      if (!s || s == last) {
        if (
          !gr1 || // if end of grace notes
          !(s = gr1.next) || // return to normal notes
          s == last
        )
          break;
        gr1 = null;
      }
      if (s.type == C.GRACE) {
        // if start of grace notes
        gr1 = s; // continue in the grace note sequence
        s = s.extra;
        continue;
      }
      if (s.sls) {
        // slurs from the chord
        sls = s.sls;
        s.sls = null;
        nsls = [];
        for (i = 0; i < sls.length; i++) {
          if (!draw_sls(s, sls[i])) nsls.push(sls[i]);
        }
        if (nsls.length) s.sls = nsls;
      }
      if (s.sl1) {
        // slurs from the note heads
        for (m = 0; m <= s.nhd; m++) {
          note = s.notes[m];
          if (note.sls) {
            sls = note.sls;
            note.sls = null;
            nsls = [];
            for (i = 0; i < sls.length; i++) {
              if (!draw_sls(s, sls[i], note)) nsls.push(sls[i]);
            }
            if (nsls.length) note.sls = nsls;
          }
        }
      }
      s = s.next;
    }
  }

  /* -- draw a tuplet -- */
  /* (the staves are not yet defined) */
  /* (delayed output) */
  /* See http://moinejf.free.fr/abcm2ps-doc/tuplets.xhtml
   * for the value of 'tp.f' */
  function draw_tuplet(s1) {
    var s2,
      s3,
      g,
      upstaff,
      nb_only,
      some_slur,
      x1,
      x2,
      y1,
      y2,
      xm,
      ym,
      a,
      s0,
      yy,
      yx,
      dy,
      a,
      dir,
      r,
      tp = s1.tp.shift(); // tuplet parameters

    if (!s1.tp.length) delete s1.tp; // last tuplet

    // treat the slurs and the nested tuplets
    upstaff = s1.st;
    set_dscale(s1.st);
    for (s2 = s1; s2; s2 = s2.next) {
      switch (s2.type) {
        case C.GRACE:
          for (g = s2.extra; g; g = g.next) {
            if (g.sls || g.sl1) draw_slurs(g);
          }
        // fall thru
        default:
          continue;
        case C.NOTE:
        case C.REST:
          break;
      }
      if (s2.sls || s2.sl1) draw_slurs(s2);
      if (s2.st < upstaff) upstaff = s2.st;
      if (s2.tp) draw_tuplet(s2);
      if (s2.tpe) break;
    }

    if (s2) s2.tpe--;
    //YYMCode : 容错
    if (tp) {
      if (tp.f) if (tp.f[0] == 1) return;
    }
    // ******************/
    if (tp.f[0] == 1)
      // if 'when' == never
      return; // accept tuplets on many lines

    if (!s2) {
      error(1, s1, "No end of tuplet in this music line");
      return;
    }

    dir = tp.f[3]; // 'where'
    if (!dir) {
      // if auto
      s3 = s1;
      while (s3.type != C.NOTE) s3 = s3.next;
      dir = s3.stem > 0 ? C.SL_ABOVE : C.SL_BELOW;
    }

    if (
      s1 == s2 || // tuplet with 1 note (!)
      tp.f[1] == 2
    ) {
      // what == nothing
      nb_only = true;
    } else if (tp.f[1] == 1) {
      /* 'what' == slur */
      nb_only = true;
      draw_slur([s1, s2], null, { ty: dir });
    } else {
      /* search if a bracket is needed */
      if (
        tp.f[0] != 2 && // if 'when' != always
        s1.type == C.NOTE &&
        s2.type == C.NOTE
      ) {
        nb_only = true;
        for (s3 = s1; ; s3 = s3.next) {
          if (s3.type != C.NOTE && s3.type != C.REST) {
            if (s3.type == C.GRACE || s3.type == C.SPACE) continue;
            nb_only = false;
            break;
          }
          if (s3 == s2) break;
          if (s3.beam_end) {
            nb_only = false;
            break;
          }
        }
        if (nb_only && !s1.beam_st && !s1.beam_br1 && !s1.beam_br2) {
          for (s3 = s1.prev; s3; s3 = s3.prev) {
            if (s3.type == C.NOTE || s3.type == C.REST) {
              if (s3.nflags >= s1.nflags) nb_only = false;
              break;
            }
          }
        }
        if (nb_only && !s2.beam_end) {
          for (s3 = s2.next; s3; s3 = s3.next) {
            if (s3.type == C.NOTE || s3.type == C.REST) {
              if (!s3.beam_br1 && !s3.beam_br2 && s3.nflags >= s2.nflags)
                nb_only = false;
              break;
            }
          }
        }
      }
    }

    /* if number only, draw it */
    if (nb_only) {
      if (tp.f[2] == 1) /* if 'which' == none */ return;
      xm = (s2.x + s1.x) / 2;
      a = s2.x - s1.x; // width around the middle
      if (dir == C.SL_ABOVE) ym = y_get(upstaff, 1, xm - a / 2, a);
      else ym = y_get(upstaff, 0, xm - a / 2, a) - 8;

      if (s1.stem * s2.stem > 0) {
        if (s1.stem > 0) xm += 1.5;
        else xm -= 1.5;
      }

      if (tp.f[2] == 0) /* if 'which' == number */ out_bnum(xm, ym, tp.p);
      else out_bnum(xm, ym, tp.p + ":" + tp.q);

      for (s3 = s1; ; s3 = s3.next) {
        if (s3.x >= xm) break;
      }
      if (dir == C.SL_ABOVE) {
        ym += 12;
        if (s3.ymx < ym) s3.ymx = ym;
        y_set(upstaff, true, xm - 3, 6, ym);
      } else {
        if (s3.ymn > ym) s3.ymn = ym;
        y_set(upstaff, false, xm - 3, 6, ym);
      }
      return;
    }

    // here, what is square bracket

    /*fixme: two staves not treated*/
    /*fixme: to optimize*/

    // first, get the x offsets
    x1 = s1.x - 4;

    // end the bracket according to the last note duration
    if (s2.dur > s2.prev.dur) {
      s3 = s2.next;
      if (
        !s3 || // maybe a note in an overlay voice
        s3.time != s2.time + s2.dur
      ) {
        for (s3 = s2.ts_next; s3; s3 = s3.ts_next) {
          if (s3.seqst && s3.time >= s2.time + s2.dur) break;
        }
      }
      //fixme: s3 cannot be null (bar at end of staff)
      x2 = s3 ? s3.x - s3.wl - 5 : realwidth - 6;
    } else {
      x2 = s2.x + 4;
      r = s2.stem >= 0 ? 0 : s2.nhd;
      if (s2.notes[r].shhd > 0) x2 += s2.notes[r].shhd;
      if (s2.st == upstaff && s2.stem > 0) x2 += 3.5;
    }

    // above
    if (dir == C.SL_ABOVE) {
      /* sole or upper voice: the bracket is above the staff */
      if (s1.st == s2.st) {
        y1 = y2 = staff_tb[upstaff].topbar + 2;
      } else {
        y1 = s1.ymx;
        y2 = s2.ymx;
      }

      if (s1.st == upstaff) {
        for (s3 = s1; !s3.dur; s3 = s3.next);
        ym = y_get(upstaff, 1, s3.x - 4, 8);
        if (ym > y1) y1 = ym;
        if (s1.stem > 0) x1 += 3;
      }

      if (s2.st == upstaff) {
        for (s3 = s2; !s3.dur; s3 = s3.prev);
        ym = y_get(upstaff, 1, s3.x - 4, 8);
        if (ym > y2) y2 = ym;
      }

      xm = 0.5 * (x1 + x2);
      ym = 0.5 * (y1 + y2);

      a = (y2 - y1) / (x2 - x1);
      s0 = (3 * (s2.notes[s2.nhd].pit - s1.notes[s1.nhd].pit)) / (x2 - x1);
      if (s0 > 0) {
        if (a < 0) a = 0;
        else if (a > s0) a = s0;
      } else {
        if (a > 0) a = 0;
        else if (a < s0) a = s0;
      }
      if (a * a < 0.1 * 0.1) a = 0;

      /* shift up bracket if needed */
      dy = 0;
      for (s3 = s1; ; s3 = s3.next) {
        if (!s3.dur /* not a note or a rest */ || s3.st != upstaff) {
          if (s3 == s2) break;
          continue;
        }
        yy = ym + (s3.x - xm) * a;
        yx = y_get(upstaff, 1, s3.x - 4, 8) + 2;
        if (yx - yy > dy) dy = yx - yy;
        if (s3 == s2) break;
      }

      ym += dy;
      y1 = ym + a * (x1 - xm);
      y2 = ym + a * (x2 - xm);

      /* shift the slurs / decorations */
      ym += 8;
      for (s3 = s1; ; s3 = s3.next) {
        if (s3.st == upstaff) {
          yy = ym + (s3.x - xm) * a;
          if (s3.ymx < yy) s3.ymx = yy;
          if (s3 == s2) break;
          y_set(upstaff, true, s3.x, s3.next.x - s3.x, yy);
        } else if (s3 == s2) {
          break;
        }
      }

      // below
    } else {
      /* lower voice of the staff: the bracket is below the staff */
      /*fixme: think to all of that again..*/
      if (s1.stem < 0) x1 -= 2;

      if (s1.st == upstaff) {
        for (s3 = s1; !s3.dur; s3 = s3.next);
        y1 = y_get(upstaff, 0, s3.x - 4, 8);
      } else {
        y1 = 0;
      }
      if (s2.st == upstaff) {
        for (s3 = s2; !s3.dur; s3 = s3.prev);
        y2 = y_get(upstaff, 0, s3.x - 4, 8);
      } else {
        y2 = 0;
      }

      xm = 0.5 * (x1 + x2);
      ym = 0.5 * (y1 + y2);

      a = (y2 - y1) / (x2 - x1);
      s0 = (3 * (s2.notes[0].pit - s1.notes[0].pit)) / (x2 - x1);
      if (s0 > 0) {
        if (a < 0) a = 0;
        else if (a > s0) a = s0;
      } else {
        if (a > 0) a = 0;
        else if (a < s0) a = s0;
      }
      if (a * a < 0.1 * 0.1) a = 0;

      /* shift down the bracket if needed */
      dy = 0;
      for (s3 = s1; ; s3 = s3.next) {
        if (!s3.dur /* not a note nor a rest */ || s3.st != upstaff) {
          if (s3 == s2) break;
          continue;
        }
        yy = ym + (s3.x - xm) * a;
        yx = y_get(upstaff, 0, s3.x - 4, 8);
        if (yx - yy < dy) dy = yx - yy;
        if (s3 == s2) break;
      }

      ym += dy - 8;
      y1 = ym + a * (x1 - xm);
      y2 = ym + a * (x2 - xm);

      /* shift the slurs / decorations */
      ym -= 2;
      for (s3 = s1; ; s3 = s3.next) {
        if (s3.st == upstaff) {
          if (s3 == s2) break;
          yy = ym + (s3.x - xm) * a;
          if (s3.ymn > yy) s3.ymn = yy;
          y_set(upstaff, false, s3.x, s3.next.x - s3.x, yy);
        }
        if (s3 == s2) break;
      }
    } /* lower voice */

    if (tp.f[2] == 1) {
      /* if 'which' == none */
      out_tubr(x1, y1 + 4, x2 - x1, y2 - y1, dir == C.SL_ABOVE);
      return;
    }
    out_tubrn(
      x1,
      y1,
      x2 - x1,
      y2 - y1,
      dir == C.SL_ABOVE,
      tp.f[2] == 0 ? tp.p.toString() : tp.p + ":" + tp.q
    );

    if (dir == C.SL_ABOVE) y_set(upstaff, true, xm - 3, 6, yy + 2);
    else y_set(upstaff, false, xm - 3, 6, yy);
  }

  /* -- draw the ties between two notes/chords -- */
  function draw_note_ties(not1, job) {
    var m,
      x1,
      x2,
      s,
      y,
      h,
      time,
      not2 = not1.tie_n,
      p = job == 2 ? not1.pit : not2.pit,
      dir = (not1.tie_ty & 0x07) == C.SL_ABOVE ? 1 : -1,
      s1 = not1.s,
      st = s1.st,
      s2 = not2.s,
      x2 = s2.x,
      sh = not1.shhd; // head shift

    for (m = 0; m < s1.nhd; m++) if (s1.notes[m] == not1) break;
    if (dir > 0) {
      if (m < s1.nhd && p + 1 == s1.notes[m + 1].pit)
        if (s1.notes[m + 1].shhd > sh) sh = s1.notes[m + 1].shhd;
    } else {
      if (m > 0 && p == s1.notes[m - 1].pit + 1)
        if (s1.notes[m - 1].shhd > sh) sh = s1.notes[m - 1].shhd;
    }
    x1 = s1.x + sh; // * .6

    if (job != 2) {
      for (m = 0; m < s2.nhd; m++) if (s2.notes[m] == not2) break;
      sh = s2.notes[m].shhd;
      if (dir > 0) {
        if (m < s2.nhd && p + 1 == s2.notes[m + 1].pit)
          if (s2.notes[m + 1].shhd < sh) sh = s2.notes[m + 1].shhd;
      } else {
        if (m > 0 && p == s2.notes[m - 1].pit + 1)
          if (s2.notes[m - 1].shhd < sh) sh = s2.notes[m - 1].shhd;
      }
      x2 += sh; // * .6
    }

    switch (job) {
      case 0:
        p = not1.pit & 1 ? not1.pit : not2.pit;
        break;
      case 3 /* clef or staff change */:
        dir = -dir;
      // fall thru
      case 1 /* no starting note */:
        x1 = s1.x;
        if (x1 > x2 - 20) x1 = x2 - 20;
        p = not2.pit;
        st = s2.st;
        break;
      /*	case 2:				 * no ending note */
      default:
        if (s1 != s2) {
          x2 -= s2.wl;
          if (s2.type == C.BAR) x2 += 5;
        } else {
          time = s1.time + s1.dur;
          for (s = s1.ts_next; s; s = s.ts_next)
            //(fixme: must check if the staff continues??)
            if (s.time > time) break;
          x2 = s ? s.x : realwidth;
        }
        if (x2 < x1 + 16) x2 = x1 + 16;
        break;
    }
    if (x2 - x1 > 20) {
      x1 += 3.5;
      x2 -= 3.5;
    } else {
      x1 += 1.5;
      x2 -= 1.5;
    }

    if (
      s1.dots &&
      !(not1.pit & 1) &&
      ((dir > 0 && !s1.dot_low) || (dir < 0 && s1.dot_low))
    )
      x1 += 5;

    y = staff_tb[st].y + 3 * (p - 18) + /* 1.0 * */ dir;

    h = (0.03 * (x2 - x1) + 16) * dir * cfmt.tieheight;
    //	anno_start(k1, 'slur')
    slur_out(x1, y, x2, y, dir, h, not1.tie_ty & C.SL_DOTTED);
    //	anno_stop(k1, 'slur')
  }

  /* -- draw ties between neighboring notes/chords -- */
  function draw_ties(k1, k2, job) {
    // 0: normal
    // 1: no starting note
    // 2: no ending note
    // 3: no start for clef or staff change
    var k3,
      i,
      j,
      not1,
      not3,
      time,
      pit,
      pit2,
      mhead3 = [],
      nh1 = k1.nhd;

    /* half ties from last note in line or before new repeat */
    if (job == 2) {
      for (i = 0; i <= nh1; i++) {
        not1 = k1.notes[i];
        if (not1.tie_ty) {
          k3 = not1.tie_n;
          not1.tie_n = { s: k2 || k1 };
          draw_note_ties(not1, job);
          not1.tie_n = k3;
        }
      }
      return;
    }

    // draw the ties or memorize the ones without ending
    for (i = 0; i <= nh1; i++) {
      not1 = k1.notes[i];
      if (!not1.tie_ty) continue;
      if (!not1.s) not1.s = k1;
      if (not1.tie_n) draw_note_ties(not1, job);
      else mhead3.push(not1); /* no match */
    }

    /* if any bad tie, try an other voice of the same staff */
    if (!mhead3.length) return; /* no bad tie */

    time = k1.time + k1.dur;
    k3 = k1.ts_next;
    if (job != 1) job = 0;
    while (k3 && k3.time < time) k3 = k3.ts_next;
    while (k3 && k3.time == time) {
      if (k3.type != C.NOTE || k3.st != k1.st) {
        k3 = k3.ts_next;
        continue;
      }
      for (i = mhead3.length; --i >= 0; ) {
        not1 = mhead3[i];
        pit = not1.opit || not1.pit;
        for (j = k3.nhd; j >= 0; j--) {
          not3 = k3.notes[j];
          pit2 = not3.opit || not3.pit;
          if (pit2 == pit) {
            not1.tie_n = not3;
            if (!not3.s) not3.s = k3;
            draw_note_ties(not1, job);
            mhead3.splice(i, 1);
            break;
          }
        }
      }
      if (!mhead3.length) break;
      k3 = k3.ts_next;
    }

    if (mhead3.length) error(1, k1, "Bad tie");
  }

  /* -- draw all ties between neighboring notes -- */
  function draw_all_ties(p_voice) {
    var s, s1, s2, clef_chg, time, x, dx, s_next, m;

    function draw_ties_g(s1, s2, job) {
      if (s1.type == C.GRACE) {
        for (var g = s1.extra; g; g = g.next) {
          if (g.tie_s) draw_ties(g, s2, job);
        }
      } else {
        draw_ties(s1, s2, job);
      }
    } // draw_ties_g()

    /* search the start of ties */
    //	clef_chg = false
    s_next = p_voice.sym;
    set_color(s_next.color);
    while (1) {
      for (s1 = s_next; s1; s1 = s1.next) {
        if (
          s1.ti2 && // if no tie start
          (s1 != s_next || !s_next.prev)
        ) {
          // (at start of line)
          s = s1.ti2;
          s.x = s1.x;
          s2 = s.next;
          s.next = s1;
          s.st = s1.st;
          s.time = s1.time - s.dur;
          draw_ties(s, s1, 1);
          s.next = s2; // restore the linkage for play
        }
        if (s1.tie_s) break;
      }
      if (!s1) break;

      // check if the tied note is in this line
      s2 = s1.tie_s; // ending note of the tie
      if (s2.v == s1.v) {
        s_next = s2;
        s = s1;
        while (1) {
          if (!s.next) {
            s2 = s;
            s = null;
            break;
          }
          s = s.next;
          if (s == s2) break;
        }
      } else {
        s_next = s1.next;
        s = s1;
        while (1) {
          if (!s.ts_next) {
            s = null;
            break;
          }
          s = s.ts_next;
          if (s == s2) break;
        }
        if (!s) {
          s2 = s1;
          while (s2.next) s2 = s2.next;
        }
      }

      if (!s) {
        // end of line
        draw_ties_g(s1, s2, 2);
        break;
      }

      // check if some clef changes (may occur in an other voice)
      time = s1.time + s.dur;
      for (s = s1.ts_next; s != s2; s = s.ts_next) {
        if (s.st != s1.st) continue;
        if (s.time > time) break;
        if (s.type == C.CLEF) {
          clef_chg = true;
          break;
        }
      }

      /* ties with clef or staff change */
      if (clef_chg || s1.st != s2.st) {
        clef_chg = false;
        dx = (s2.x - s1.x) * 0.4;
        x = s2.x;
        s2.x -= dx;
        if (s2.x > s1.x + 32) s2.x = s1.x + 32;
        draw_ties_g(s1, s2, 2);
        s2.x = x;
        x = s1.x;
        s1.x += dx;
        if (s1.x < s2.x - 24) s1.x = s2.x - 24;
        draw_ties(s1, s2, 3);
        s1.x = x;
        continue;
      }
      draw_ties_g(s1, s2, s2.type == C.NOTE ? 0 : 2);
    }
  }

  /* -- draw the symbols near the notes -- */
  /* (the staves are not yet defined) */
  /* order:
   * - scaled
   *   - beams
   *   - decorations near the notes
   *   - measure bar numbers
   *   - decorations tied to the notes
   *   - tuplets and slurs
   * - not scaled
   *   - chord symbols
   *   - staff decorations
   *   - lyrics
   *   - measure numbers
   * The buffer output is delayed until the definition of the staff system
   */
  function draw_sym_near() {
    var p_voice,
      p_st,
      s,
      v,
      st,
      y,
      g,
      w,
      i,
      st,
      dx,
      top,
      bot,
      output_sav = output;

    output = "";

    /* calculate the beams but don't draw them (the staves are not yet defined) */
    for (v = 0; v < voice_tb.length; v++) {
      var bm = {},
        first_note = true;

      p_voice = voice_tb[v];
      for (s = p_voice.sym; s; s = s.next) {
        switch (s.type) {
          case C.GRACE:
            for (g = s.extra; g; g = g.next) {
              if (g.beam_st && !g.beam_end) self.calculate_beam(bm, g);
            }
            break;
          case C.NOTE:
            if ((s.beam_st && !s.beam_end) || (first_note && !s.beam_st)) {
              first_note = false;
              self.calculate_beam(bm, s);
            }
            break;
        }
      }
    }

    /* initialize the min/max vertical offsets */
    for (st = 0; st <= nstaff; st++) {
      p_st = staff_tb[st];
      if (!p_st.top) {
        p_st.top = new Float32Array(YSTEP);
        p_st.bot = new Float32Array(YSTEP);
      }
      for (i = 0; i < YSTEP; i++) {
        p_st.top[i] = 0;
        p_st.bot[i] = 24;
      }
      //		p_st.top.fill(0.);
      //		p_st.bot.fill(24.)
    }

    set_tie_room();
    draw_deco_near();

    /* set the min/max vertical offsets */
    for (s = tsfirst; s; s = s.ts_next) {
      if (s.invis) continue;
      switch (s.type) {
        case C.GRACE:
          for (g = s.extra; g; g = g.next) {
            y_set(s.st, true, g.x - 2, 4, g.ymx + 1);
            y_set(s.st, false, g.x - 2, 4, g.ymn - 1);
          }
          continue;
        case C.MREST:
          y_set(s.st, true, s.x + 16, 32, s.ymx + 2);
          continue;
        default:
          y_set(s.st, true, s.x - s.wl, s.wl + s.wr, s.ymx + 2);
          y_set(s.st, false, s.x - s.wl, s.wl + s.wr, s.ymn - 2);
          continue;
        case C.NOTE:
          break;
      }

      // (permit closer staves)
      if (s.stem > 0) {
        if (s.stemless) {
          dx = -5;
          w = 10;
        } else if (s.beam_st) {
          dx = 3;
          w = s.beam_end ? 4 : 10;
        } else {
          dx = -8;
          w = s.beam_end ? 11 : 16;
        }
        y_set(s.st, true, s.x + dx, w, s.ymx);
        y_set(s.st, false, s.x - s.wl, s.wl + s.wr, s.ymn);
      } else {
        y_set(s.st, true, s.x - s.wl, s.wl + s.wr, s.ymx);
        if (s.stemless) {
          dx = -5;
          w = 10;
        } else if (s.beam_st) {
          dx = -6;
          w = s.beam_end ? 4 : 10;
        } else {
          dx = -8;
          w = s.beam_end ? 5 : 16;
        }
        dx += s.notes[0].shhd;
        y_set(s.st, false, s.x + dx, w, s.ymn);
      }

      /* have room for the accidentals */
      if (s.notes[s.nhd].acc) {
        y = s.y + 8;
        if (s.ymx < y) s.ymx = y;
        y_set(s.st, true, s.x, 0, y);
      }
      if (s.notes[0].acc) {
        y = s.y;
        if (
          s.notes[0].acc == 1 || // sharp
          s.notes[0].acc == 3
        )
          // natural
          y -= 7;
        else y -= 5;
        if (s.ymn > y) s.ymn = y;
        y_set(s.st, false, s.x, 0, y);
      }
    }

    draw_deco_note();

    for (v = 0; v < voice_tb.length; v++) {
      p_voice = voice_tb[v];
      s = p_voice.sym;
      if (!s) continue;
      set_color(s.color);
      st = p_voice.st;
      //  if (st == undefined) {
      //error(1, s, "BUG: no staff for voice " + p_voice.id)
      //    continue
      //  }

      // draw the slurs and tuplets
      for (; s; s = s.next) {
        if (s.play) continue;
        if (s.tp) draw_tuplet(s);
        if (s.sls || s.sl1) draw_slurs(s);
      }
    }
    set_color();

    /* set the top and bottom out of the staves */
    for (st = 0; st <= nstaff; st++) {
      p_st = staff_tb[st];
      top = p_st.topbar + 2;
      bot = p_st.botbar - 2;
      /*fixme:should handle stafflines changes*/
      for (i = 0; i < YSTEP; i++) {
        if (top > p_st.top[i]) p_st.top[i] = top;
        if (bot < p_st.bot[i]) p_st.bot[i] = bot;
      }
    }

    if (cfmt.measurenb >= 0) draw_measnb();
    draw_deco_staff();

    /* if any lyric, draw them now as unscaled */
    set_dscale(-1);
    //	set_sscale(-1)
    for (v = 0; v < voice_tb.length; v++) {
      p_voice = voice_tb[v];
      if (p_voice.have_ly) {
        draw_all_lyrics();
        break;
      }
    }

    set_dscale(-1);
    output = output_sav;
  }

  /* -- draw the name/subname of the voices -- */
  function draw_vname(indent, stl) {
    var p_voice,
      n,
      st,
      v,
      a_p,
      p,
      y,
      name_type,
      h,
      h2,
      staff_d = [];

    for (st = stl.length; st >= 0; st--) {
      if (stl[st]) break;
    }
    if (st < 0) return;

    // check if full or sub names
    for (v = 0; v < voice_tb.length; v++) {
      p_voice = voice_tb[v];
      if (!p_voice.sym || !cur_sy.voices[v]) continue;
      st = cur_sy.voices[v].st;
      if (!stl[st]) continue;
      if (p_voice.new_name) {
        name_type = 2;
        break;
      }
      if (p_voice.snm) name_type = 1;
    }
    if (!name_type) return;
    for (v = 0; v < voice_tb.length; v++) {
      p_voice = voice_tb[v];
      if (!p_voice.sym || !cur_sy.voices[v]) continue;
      st = cur_sy.voices[v].st;
      if (!stl[st]) continue;
      if (p_voice.new_name) delete p_voice.new_name;
      p = name_type == 2 ? p_voice.nm : p_voice.snm;
      if (!p) continue;
      if (!staff_d[st]) staff_d[st] = p;
      else staff_d[st] += "\\n" + p;
    }
    if (staff_d.length == 0) return;
    set_font("voice");
    h = gene.curfont.size;
    h2 = h / 2;
    indent = -indent * 0.5; /* center */
    for (st = 0; st < staff_d.length; st++) {
      if (!staff_d[st]) continue;
      a_p = staff_d[st].split("\\n");
      y =
        staff_tb[st].y +
        staff_tb[st].topbar * 0.5 * staff_tb[st].staffscale +
        h2 * (a_p.length - 2);

      // if instrument with 2 staves, center the voice name
      if (
        cur_sy.staves[st].flags & OPEN_BRACE &&
        cur_sy.staves[st + 1].flags & CLOSE_BRACE &&
        !staff_d[st + 1]
      )
        y -= (staff_tb[st].y - staff_tb[st + 1].y) * 0.5;
      for (n = 0; n < a_p.length; n++) {
        p = a_p[n];
        xy_str(indent, y, p, "c");
        y -= h;
      }
    }
  }

  // -- set the y offset of the staves and return the height of the whole system --
  function set_staff() {
    var s,
      i,
      st,
      prev_staff,
      v,
      y,
      staffsep,
      dy,
      maxsep,
      mbot,
      val,
      p_voice,
      p_staff,
      sy = cur_sy;

    /* set the scale of the voices */
    for (v = 0; v < voice_tb.length; v++) {
      p_voice = voice_tb[v];
      if (p_voice.scale != 1)
        p_voice.scale_str =
          'transform="scale(' + p_voice.scale.toFixed(2) + ')"';
    }

    // search the top staff
    for (st = 0; st <= nstaff; st++) {
      if (gene.st_print[st]) break;
    }
    y = 0;
    if (st > nstaff) {
      st--; /* one staff, empty */
      p_staff = staff_tb[st];
    } else {
      p_staff = staff_tb[st];
      for (i = 0; i < YSTEP; i++) {
        val = p_staff.top[i];
        if (y < val) y = val;
      }
    }

    /* draw the parts and tempo indications if any */
    y += draw_partempo(st, y);

    if (!gene.st_print[st]) return y;

    /* set the vertical offset of the 1st staff */
    y *= p_staff.staffscale;
    staffsep = cfmt.staffsep * 0.5 + p_staff.topbar * p_staff.staffscale;
    if (y < staffsep) y = staffsep;
    if (y < p_staff.ann_top)
      // absolute annotation
      y = p_staff.ann_top;
    p_staff.y = -y;

    /* set the offset of the other staves */
    prev_staff = st;
    var sy_staff_prev = sy.staves[prev_staff];
    for (st++; st <= nstaff; st++) {
      if (!gene.st_print[st]) continue;
      p_staff = staff_tb[st];
      staffsep = sy_staff_prev.sep || cfmt.sysstaffsep;
      maxsep = sy_staff_prev.maxsep || cfmt.maxsysstaffsep;

      dy = 0;
      if (p_staff.staffscale == staff_tb[prev_staff].staffscale) {
        for (i = 0; i < YSTEP; i++) {
          val = p_staff.top[i] - staff_tb[prev_staff].bot[i];
          if (dy < val) dy = val;
        }
        dy *= p_staff.staffscale;
      } else {
        for (i = 0; i < YSTEP; i++) {
          val =
            p_staff.top[i] * p_staff.staffscale -
            staff_tb[prev_staff].bot[i] * staff_tb[prev_staff].staffscale;
          if (dy < val) dy = val;
        }
      }
      staffsep += p_staff.topbar * p_staff.staffscale;
      if (dy < staffsep) dy = staffsep;
      maxsep += p_staff.topbar * p_staff.staffscale;
      if (dy > maxsep) dy = maxsep;
      y += dy;
      p_staff.y = -y;

      prev_staff = st;
      while (1) {
        sy_staff_prev = sy.staves[prev_staff];
        if (sy_staff_prev) break;
        sy = sy.next;
      }
    }
    mbot = 0;
    for (i = 0; i < YSTEP; i++) {
      val = staff_tb[prev_staff].bot[i];
      if (mbot > val) mbot = val;
    }
    if (mbot > p_staff.ann_bot)
      // absolute annotation
      mbot = p_staff.ann_bot;
    mbot *= staff_tb[prev_staff].staffscale;

    /* output the staff offsets */
    for (st = 0; st <= nstaff; st++) {
      p_staff = staff_tb[st];
      dy = p_staff.y;
      if (p_staff.staffscale != 1) {
        p_staff.scale_str =
          'transform="translate(0,' +
          (posy - dy).toFixed(1) +
          ") " +
          "scale(" +
          p_staff.staffscale.toFixed(2) +
          ')"';
      }
    }

    if (mbot == 0) {
      for (st = nstaff; st >= 0; st--) {
        if (gene.st_print[st]) break;
      }
      if (st < 0) /* no symbol in this system ! */ return y;
    }
    dy = -mbot;
    staffsep = cfmt.staffsep * 0.5;
    if (dy < staffsep) dy = staffsep;
    maxsep = cfmt.maxstaffsep * 0.5;
    if (dy > maxsep) dy = maxsep;

    // return the height of the whole staff system
    return y + dy;
  }

  /* -- draw the staff systems and the measure bars -- */
  // YYMCode: 画小节框
  let line_index = 0;
  let measure_index = 0;
  var system_index_yym = 0;
  // ******************/
  function draw_systems(indent) {
    var s,
      s2,
      st,
      x,
      x2,
      res,
      sy,
      staves_bar,
      bar_force,
      xstaff = [],
      stl = [], // all staves in the line
      bar_bot = [],
      bar_height = [],
      ba = [], // bars [symbol, bottom, height]
      sb = [],
      thb = [];

    /* -- set the bottom and height of the measure bars -- */
    function bar_set() {
      var st,
        staffscale,
        top,
        bot,
        dy = 0;

      for (st = 0; st <= cur_sy.nstaff; st++) {
        if (xstaff[st] < 0) {
          bar_bot[st] = bar_height[st] = 0;
          continue;
        }
        staffscale = staff_tb[st].staffscale;
        top = staff_tb[st].topbar * staffscale;
        bot = staff_tb[st].botbar * staffscale;
        if (dy == 0) dy = staff_tb[st].y + top;
        bar_bot[st] = staff_tb[st].y + bot;
        bar_height[st] = dy - bar_bot[st];
        dy = cur_sy.staves[st].flags & STOP_BAR ? 0 : bar_bot[st];
      }
    } // bar_set()

    /* -- draw a staff -- */
    function draw_staff(st, x1, x2) {
      var w,
        ws,
        i,
        dy,
        ty,
        y = 0,
        ln = "",
        stafflines = staff_tb[st].stafflines,
        l = stafflines.length;

      if (!/[\[|]/.test(stafflines)) return; // no line
      w = x2 - x1;
      set_sscale(st);
      ws = w / stv_g.scale;

      // check if default staff
      if (cache && cache.st_l == stafflines && cache.st_ws == (ws | 0)) {
        xygl(x1, staff_tb[st].y, "stdef" + cfmt.fullsvg);
        return;
      }
      for (i = 0; i < l; i++, y -= 6) {
        if (stafflines[i] == ".") continue;
        dy = 0;
        for (; i < l; i++, y -= 6, dy -= 6) {
          switch (stafflines[i]) {
            case ".":
            case "-":
              continue;
            case ty:
              ln += "m-" + ws.toFixed(1) + " " + dy + "h" + ws.toFixed(1);
              dy = 0;
              continue;
          }
          if (ty != undefined) ln += '"/>\n';
          ty = stafflines[i];
          ln +=
            '<path class="' +
            (ty == "[" ? "slthW" : "slW") +
            '" d="m0 ' +
            y +
            "h" +
            ws.toFixed(1);
          dy = 0;
        }
        ln += '"/>';
      }
      y = staff_tb[st].y;
      if (!cache && w > get_lwidth() - 10) {
        cache = {
          st_l: stafflines,
          st_ws: ws | 0,
        };
        i = "stdef" + cfmt.fullsvg;
        if (ln.indexOf("<path", 1) < 0)
          glyphs[i] = ln.replace("path", 'path id="' + i + '"');
        else glyphs[i] = '<g id="' + i + '">\n' + ln + "\n</g>";
        xygl(x1, y, i);
        return;
      }
      out_XYAB('<g transform="translate(X, Y)">\n' + ln + "\n</g>\n", x1, y);
    } // draw_staff()

    // draw a measure bar
    function draw_bar(s, bot, h) {
      var i,
        s2,
        yb,
        w,
        bar_type = s.bar_type,
        st = s.st,
        p_staff = staff_tb[st],
        x = s.x;

      // don't put a line between the staves if there is no bar above
      if (
        st != 0 &&
        s.ts_prev &&
        //fixme: 's.ts_prev.st != st - 1' when floating voice in lower staff
        //	 && (s.ts_prev.type != C.BAR || s.ts_prev.st != st - 1))
        s.ts_prev.type != C.BAR
      )
        h = p_staff.topbar * p_staff.staffscale;

      s.ymx = s.ymn + h;

      anno_start(s);
      if (s.color) set_color(s.color);

      // compute the middle vertical offset of the staff
      yb = p_staff.y + 12;
      if (p_staff.stafflines != "|||||")
        yb += (p_staff.topbar + p_staff.botbar) / 2 - 12; // bottom

      // if measure repeat, draw the '%' like glyphs
      if (s.bar_mrep) {
        set_sscale(st);
        if (s.bar_mrep == 1) {
          for (s2 = s.prev; s2.type != C.REST; s2 = s2.prev);
          xygl(s2.x, yb, "mrep");
        } else {
          xygl(x, yb, "mrep2");
          if (s.v == cur_sy.top_voice)
            xy_str(x, yb + p_staff.topbar - 9, s.bar_mrep.toString(), "c");
        }
      }

      if (bar_type == "||:") bar_type = "[|:";

      for (i = bar_type.length; --i >= 0; ) {
        switch (bar_type[i]) {
          case "|":
            if (s.bar_dotted) {
              set_sscale(-1);
              w = (5 * p_staff.staffscale).toFixed(1);
              out_XYAB(
                '<path class="bW" stroke-dasharray="A,A" d="MX Yv-G"/>\n',
                x,
                bot,
                w,
                h
              );
            } else if (s.color) {
              out_XYAB('<path class="bW" d="MX Yv-F"/>\n', x, bot, h);
            } else {
              sb.push(new Float32Array([x, bot, h]));
            }
            break;
          default:
            //			case "[":
            //			case "]":
            x -= 3;
            if (s.color)
              out_XYAB('<path class="bthW" d="MX Yv-F"/>\n', x + 1.5, bot, h);
            else thb.push(new Float32Array([x + 1.5, bot, h]));
            break;
          case ":":
            x -= 2;
            set_sscale(st);
            xygl(x + 1, yb - 12, "rdots");
            break;
        }
        x -= 3;
      }
      set_color();
      anno_stop(s);
    } // draw_bar()

    // output all the bars
    // YYMCode: 添加画小节
    function draw_measure_rect(system_index_yym) {
      // YYMCode: 修改此处代码,走容错判断
      // ******************/
      if (ba.length <= 0 || !ba) return;
      // ******************/
      let st_tb_len = staff_tb.length,
        bar_pair_num = ba.length / st_tb_len,
        rect_x,
        rect_y,
        rect_w,
        rect_h,
        measure_notes = [],
        has_notes = false;
      for (let i = 0; i < st_tb_len; i++) {
        measure_notes[i] = [];
      }
      // the first measure
      //if(!ba[0]) return

      for (let s = ba[0][0]; s; s = s.ts_prev) {
        if (s.type === C.NOTE || (s.type === C.REST && !s.invis)) {
          measure_notes[s.st].unshift(s);
        }
        if (s.type === C.NOTE) has_notes = true;
      }
      //  防止出现反复小节,什么音符也没有, 也会被计算到 measrue 里面
      if (measure_notes[0].length || measure_notes[1].length) {
        //if(!ba[st_tb_len-1]) return
        rect_x = 0;
        rect_y = ba[0][1] + ba[0][2];
        rect_w = ba[0][0].x;
        rect_h = rect_y - ba[st_tb_len - 1][1];
        let measure_cls_name = `bottom_measure_id_${measure_id}`;
        out_XYAB(
          `<rect x="X" class="measures ${measure_cls_name}" tip="${system_index_yym}" y="Y" width="A" height="B" style="fill-opacity: 0;"/>`,
          rect_x,
          rect_y,
          rect_w,
          rect_h
        );

        measure_draw({
          measure_index: measure_index,
          line_index: line_index,
          measure_notes: measure_notes,
          bar_bot,
          bar_height,
          bar_start_x: 0,
          bar_end_x: ba[0][0].x,
          measure_id: measure_id,
          cls_name: measure_cls_name,
          has_notes: has_notes,
          posx: posx,
          posy: posy,
          stv_g: stv_g,
        });
        measure_index += 1;
        measure_id += 1;
      }

      for (let i = 0; i < bar_pair_num - 1; i++) {
        let bar_pair_left_up = ba[i * st_tb_len],
          bar_pair_left_bottom = ba[(i + 1) * st_tb_len - 1],
          bar_pair_right_up = ba[(i + 1) * st_tb_len],
          bar_pair_right_bottom = ba[(i + 2) * st_tb_len - 1];
        rect_x = bar_pair_left_up[0].x;
        rect_y = bar_pair_left_up[1] + bar_pair_left_up[2];
        rect_w = bar_pair_right_up[0].x - rect_x;
        rect_h = rect_y - bar_pair_left_bottom[1];
        let measure_cls_name = `bottom_measure_id_${measure_id}`;
        out_XYAB(
          `<rect x="X" class="measures ${measure_cls_name}" tip="${system_index_yym}"  y="Y" width="A" height="B" style="fill-opacity: 0;"/>`,
          rect_x,
          rect_y,
          rect_w,
          rect_h
        );

        measure_notes = [];
        for (let i = 0; i < st_tb_len; i++) {
          measure_notes[i] = [];
        }
        has_notes = false;
        for (
          let s = bar_pair_left_bottom[0];
          s && s !== bar_pair_right_up[0];
          s = s.ts_next
        ) {
          if (s.type === C.NOTE || (s.type === C.REST && !s.invis)) {
            measure_notes[s.st].push(s);
          }
          if (s.type === C.NOTE) has_notes = true;
        }
        measure_draw({
          measure_index: measure_index,
          line_index: line_index,
          measure_notes: measure_notes,
          bar_bot,
          bar_height,
          bar_start_x: bar_pair_left_up[0].x,
          bar_end_x: bar_pair_right_up[0].x,
          measure_id: measure_id,
          cls_name: measure_cls_name,
          has_notes: has_notes,
          posx: posx,
          posy: posy,
          stv_g: stv_g,
        });
        measure_index += 1;
        measure_id += 1;
      }
    }
    // ******************/
    function out_bars() {
      var i,
        b,
        bx,
        l = ba.length;

      set_font("annotation");
      if (gene.curfont.box) {
        gene.curfont.box = false;
        bx = true;
      }
      for (i = 0; i < l; i++) {
        b = ba[i]; // symbol, bottom, height
        draw_bar(b[0], b[1], b[2]);
      }
      if (bx) gene.curfont.box = true;

      set_sscale(-1);
      l = sb.length;
      if (l) {
        // single bars [x, y, h]
        output += '<path class="bW" d="';
        for (i = 0; i < l; i++) {
          b = sb[i];
          out_XYAB("MX Yv-F", b[0], b[1], b[2]);
        }
        output += '"/>\n';
      }

      l = thb.length;
      if (l) {
        // thick bars [x, y, h]
        output += '<path class="bthW" d="';
        for (i = 0; i < l; i++) {
          b = thb[i];
          out_XYAB("MX Yv-F", b[0], b[1], b[2]);
        }
        output += '"/>\n';
      }
    } // out_bars()

    // ---- draw_systems() ----

    /* draw the staff, skipping the staff breaks */
    for (st = 0; st <= nstaff; st++) {
      xstaff[st] = !cur_sy.st_print[st] ? -1 : 0;
      stl[st] = cur_sy.st_print[st]; // staff in the line
    }
    bar_set();
    draw_lstaff(0);
    for (s = tsfirst; s; s = s.ts_next) {
      if (bar_force && s.time != bar_force) {
        bar_force = 0;
        for (st = 0; st <= nstaff; st++) {
          if (!cur_sy.st_print[st]) xstaff[st] = -1;
        }
        bar_set();
      }
      switch (s.type) {
        case C.STAVES:
          staves_bar = s.ts_prev.type == C.BAR ? s.ts_prev.x : 0;
          if (!staves_bar) {
            for (s2 = s.ts_next; s2; s2 = s2.ts_next) {
              if (s2.time != s.time) break;
              switch (s2.type) {
                case C.BAR:
                case C.CLEF:
                case C.KEY:
                case C.METER:
                  staves_bar = s2.x;
                  continue;
              }
              break;
            }
            if (!s2) staves_bar = realwidth;
          }
          sy = s.sy;
          for (st = 0; st <= nstaff; st++) {
            x = xstaff[st];
            if (x < 0) {
              // no staff yet
              if (sy.st_print[st]) {
                xstaff[st] = staves_bar ? staves_bar : s.x - s.wl - 2;
                stl[st] = true;
              }
              continue;
            }
            if (
              sy.st_print[st] && // if not staff stop
              sy.staves[st].stafflines == cur_sy.staves[st].stafflines
            )
              continue;
            if (staves_bar) {
              x2 = staves_bar;
              bar_force = s.time;
            } else {
              x2 = s.x - s.wl - 2;
              xstaff[st] = -1;
            }
            draw_staff(st, x, x2);
            if (sy.st_print[st]) xstaff[st] = x2;
          }
          cur_sy = sy;
          bar_set();
          continue;
        case C.BAR: // display the bars after the staves
          if (s.second || s.invis || !s.bar_type) break;
          ba.push([s, bar_bot[s.st], bar_height[s.st]]);
          break;
        case C.STBRK:
          if (cur_sy.voices[s.v] && cur_sy.voices[s.v].range == 0) {
            if (s.xmx > 14) {
              /* draw the left system if stbrk in all voices */
              var nv = 0;
              for (var i = 0; i < voice_tb.length; i++) {
                if (cur_sy.voices[i] && cur_sy.voices[i].range > 0) nv++;
              }
              for (s2 = s.ts_next; s2; s2 = s2.ts_next) {
                if (s2.type != C.STBRK) break;
                nv--;
              }
              if (nv == 0) draw_lstaff(s.x);
            }
          }
          st = s.st;
          x = xstaff[st];
          if (x >= 0) {
            s2 = s.prev;
            if (!s2) break;
            x2 = s2.type == C.BAR ? s2.x : s.x - s.xmx;
            if (x >= x2) break;
            draw_staff(st, x, x2);
            xstaff[st] = s.x;
          }
          break;
        //		default:
        //fixme:does not work for "%%staves K: M: $" */
        //removed for K:/M: in empty staves
        //			if (!cur_sy.st_print[st])
        //				s.invis = true
        //			break
      }
    }

    // draw the end of the staves
    for (st = 0; st <= nstaff; st++) {
      if (bar_force && !cur_sy.st_print[st]) continue;
      x = xstaff[st];
      if (x < 0 || x >= realwidth) continue;
      draw_staff(st, x, realwidth);
    }

    // and the bars
    out_bars();
    //YYMCorder: 画小节框
    draw_measure_rect(system_index_yym);
    system_index_yym++;
    line_index += 1;
    // ******************/
    draw_vname(indent, stl);

    //	set_sscale(-1)
  }

  /* -- draw remaining symbols when the staves are defined -- */
  // (possible hook)
  Abc.prototype.draw_symbols = function (p_voice) {
    var bm = {},
      s,
      g,
      x,
      y,
      st;

    //	bm.s2 = undefined
    for (s = p_voice.sym; s; s = s.next) {
      if (s.invis) {
        switch (s.type) {
          case C.KEY:
            p_voice.ckey = s;
          default:
            continue;
          case C.NOTE: // (beams may start on invisible notes)
            break;
        }
      }
      st = s.st;
      x = s.x;
      set_color(s.color);
      switch (s.type) {
        case C.NOTE:
          //--fixme: recall set_scale if different staff
          set_scale(s);
          if (s.beam_st && !s.beam_end) {
            if (self.calculate_beam(bm, s)) draw_beams(bm);
          }
          if (!s.invis) {
            anno_start(s);
            draw_note(s, !bm.s2);
            anno_stop(s);
          }
          if (s == bm.s2) bm.s2 = null;
          break;
        case C.REST:
          if (!staff_tb[st].topbar) break;
          draw_rest(s);
          break;
        case C.BAR:
          break; /* drawn in draw_systems */
        case C.CLEF:
          if (s.time >= staff_tb[st].clef.time) staff_tb[st].clef = s;
          if (s.second || !staff_tb[st].topbar) break;
          set_color();
          set_sscale(st);
          anno_start(s);
          y = staff_tb[st].y;
          if (s.clef_name) xygl(x, y + s.y, s.clef_name);
          else if (!s.clef_small) xygl(x, y + s.y, s.clef_type + "clef");
          else xygl(x, y + s.y, "s" + s.clef_type + "clef");
          if (s.clef_octave) {
            /*fixme:break the compatibility and avoid strange numbers*/
            if (s.clef_octave > 0) {
              y += s.ymx - 10;
              if (s.clef_small) y -= 1;
            } else {
              y += s.ymn + 6;
              if (s.clef_small) y += 1;
            }
            xygl(x - 2, y, "oct");
          }
          anno_stop(s);
          break;
        case C.METER:
          p_voice.meter = s;
          if (s.second || !staff_tb[s.st].topbar) break;
          set_color();
          set_sscale(s.st);
          anno_start(s);
          draw_meter(s);
          anno_stop(s);
          break;
        case C.KEY:
          p_voice.ckey = s;
          if (s.second || !staff_tb[s.st].topbar) break;
          set_color();
          set_sscale(s.st);
          anno_start(s);
          self.draw_keysig(x, s);
          anno_stop(s);
          break;
        case C.MREST:
          set_scale(s);
          x += 32;
          anno_start(s);
          xygl(x, staff_tb[s.st].y + 12, "mrest");
          out_XYAB(
            '<text style="font:bold 15px serif"\n\
	x ="X" y="Y" text-anchor="middle">A</text>\n',
            x,
            staff_tb[s.st].y + 28,
            s.nmes
          );
          anno_stop(s);
          break;
        case C.GRACE:
          set_scale(s);
          draw_gracenotes(s);
          break;
        case C.SPACE:
        case C.STBRK:
          break; /* nothing */
        case C.CUSTOS:
          set_scale(s);
          draw_note(s, 0);
          break;
        case C.BLOCK: // no width
        case C.PART:
        case C.REMARK:
        case C.STAVES:
        case C.TEMPO:
          break;
        default:
          error(2, s, "draw_symbols - Cannot draw symbol " + s.type);
          break;
      }
    }
    set_scale(p_voice.sym);
  };

  /* -- draw all symbols -- */
  function draw_all_sym() {
    var p_voice,
      v,
      n = voice_tb.length;

    // draw all the helper/ledger lines
    function draw_all_hl() {
      var st, p_st;

      function hlud(hla, d) {
        var hl,
          hll,
          i,
          xp,
          dx2,
          x2,
          n = hla.length;

        if (!n) return;
        for (i = 0; i < n; i++) {
          // for all lines
          hll = hla[i];
          if (!hll || !hll.length) continue;
          xp = sx(hll[0][0]); // previous x
          output +=
            '<path class="stroke" stroke-width="1" d="M' +
            xp.toFixed(1) +
            " " +
            sy(p_st.y + d * i).toFixed(1);
          dx2 = 0;
          while (1) {
            hl = hll.shift();
            if (!hl) break;
            x2 = sx(hl[0]);
            output +=
              "m" +
              (x2 - xp + hl[1] - dx2).toFixed(1) +
              " 0h" +
              (-hl[1] + hl[2]).toFixed(1);
            xp = x2;
            dx2 = hl[2];
          }
          output += '"/>\n';
        }
      } // hlud()

      for (st = 0; st <= nstaff; st++) {
        p_st = staff_tb[st];
        if (!p_st.hlu) continue; // (staff not yet displayed)
        set_sscale(st);
        hlud(p_st.hlu, 6);
        hlud(p_st.hld, -6);
      }
    } // draw_all_hl()

    for (v = 0; v < n; v++) {
      p_voice = voice_tb[v];
      if (p_voice.sym && p_voice.sym.x != undefined) {
        self.draw_symbols(p_voice);
        draw_all_ties(p_voice);
        // no need to reset the scale as in abcm2ps
        set_color();
      }
    }

    draw_all_deco();
    draw_all_hl();
    set_sscale(-1); /* restore the scale */
  }

  /* -- set the tie directions for one voice -- */
  function set_tie_dir(s) {
    var i, ntie, dir, sec, pit, ty;

    for (; s; s = s.next) {
      if (!s.tie_s) continue;

      /* if other voice, set the ties in opposite direction */
      if (s.multi != 0) {
        dir = s.multi > 0 ? C.SL_ABOVE : C.SL_BELOW;
        for (i = 0; i <= s.nhd; i++) {
          ty = s.notes[i].tie_ty;
          if (!((ty & 0x07) == C.SL_AUTO)) continue;
          s.notes[i].tie_ty = (ty & C.SL_DOTTED) | dir;
        }
        continue;
      }

      /* if one note, set the direction according to the stem */
      sec = ntie = 0;
      pit = 128;
      for (i = 0; i <= s.nhd; i++) {
        if (s.notes[i].tie_ty) {
          ntie++;
          if (pit < 128 && s.notes[i].pit <= pit + 1) sec++;
          pit = s.notes[i].pit;
        }
      }
      if (ntie <= 1) {
        dir = s.stem < 0 ? C.SL_ABOVE : C.SL_BELOW;
        for (i = 0; i <= s.nhd; i++) {
          ty = s.notes[i].tie_ty;
          if (ty) {
            if ((ty & 0x07) == C.SL_AUTO)
              s.notes[i].tie_ty = (ty & C.SL_DOTTED) | dir;
            break;
          }
        }
        continue;
      }
      if (sec == 0) {
        if (ntie & 1) {
          /* in chords with an odd number of notes, the outer noteheads are paired off
           * center notes are tied according to their position in relation to the
           * center line */
          ntie = (ntie - 1) / 2;
          dir = C.SL_BELOW;
          for (i = 0; i <= s.nhd; i++) {
            ty = s.notes[i].tie_ty;
            if (!ty) continue;
            if (ntie == 0) {
              /* central tie */
              if (s.notes[i].pit >= 22) dir = C.SL_ABOVE;
            }
            if ((ty & 0x07) == C.SL_AUTO)
              s.notes[i].tie_ty = (ty & C.SL_DOTTED) | dir;
            if (ntie-- == 0) dir = C.SL_ABOVE;
          }
          continue;
        }
        /* even number of notes, ties divided in opposite directions */
        ntie /= 2;
        dir = C.SL_BELOW;
        for (i = 0; i <= s.nhd; i++) {
          ty = s.notes[i].tie_ty;
          if (!ty) continue;
          if ((ty & 0x07) == C.SL_AUTO)
            s.notes[i].tie_ty = (ty & C.SL_DOTTED) | dir;
          if (--ntie == 0) dir = C.SL_ABOVE;
        }
        continue;
      }
      /*fixme: treat more than one second */
      /*		if (nsec == 1) {	*/
      /* When a chord contains the interval of a second, tie those two notes in
       * opposition; then fill in the remaining notes of the chord accordingly */
      pit = 128;
      for (i = 0; i <= s.nhd; i++) {
        if (s.notes[i].tie_ty) {
          if (pit < 128 && s.notes[i].pit <= pit + 1) {
            ntie = i;
            break;
          }
          pit = s.notes[i].pit;
        }
      }
      dir = C.SL_BELOW;
      for (i = 0; i <= s.nhd; i++) {
        ty = s.notes[i].tie_ty;
        if (!ty) continue;
        if (ntie == i) dir = C.SL_ABOVE;
        if ((ty & 0x07) == C.SL_AUTO)
          s.notes[i].tie_ty = (ty & C.SL_DOTTED) | dir;
      }
      /*fixme..
			continue
		}
..*/
      /* if a chord contains more than one pair of seconds, the pair farthest
       * from the center line receives the ties drawn in opposition */
    }
  }

  /* -- have room for the ties out of the staves -- */
  function set_tie_room() {
    var p_voice, s, s2, v, dx, y, dy;

    for (v = 0; v < voice_tb.length; v++) {
      p_voice = voice_tb[v];
      s = p_voice.sym;
      if (!s) continue;
      s = s.next;
      if (!s) continue;
      set_tie_dir(s);
      for (; s; s = s.next) {
        if (!s.tie_s) continue;
        if (
          s.notes[0].pit < 20 &&
          s.notes[0].tie_ty &&
          (s.notes[0].tie_ty & 0x07) == C.SL_BELOW
        );
        else if (
          s.notes[s.nhd].pit > 24 &&
          s.notes[s.nhd].tie_ty &&
          (s.notes[s.nhd].tie_ty & 0x07) == C.SL_ABOVE
        );
        else continue;
        s2 = s.next;
        while (s2 && s2.type != C.NOTE) s2 = s2.next;
        if (s2) {
          if (s2.st != s.st) continue;
          dx = s2.x - s.x - 10;
        } else {
          dx = realwidth - s.x - 10;
        }
        if (dx < 100) dy = 9;
        else if (dx < 300) dy = 12;
        else dy = 16;
        if (s.notes[s.nhd].pit > 24) {
          y = 3 * (s.notes[s.nhd].pit - 18) + dy;
          if (s.ymx < y) s.ymx = y;
          if (s2 && s2.ymx < y) s2.ymx = y;
          y_set(s.st, true, s.x + 5, dx, y);
        }
        if (s.notes[0].pit < 20) {
          y = 3 * (s.notes[0].pit - 18) - dy;
          if (s.ymn > y) s.ymn = y;
          if (s2 && s2.ymn > y) s2.ymn = y;
          y_set(s.st, false, s.x + 5, dx, y);
        }
      }
    }
  }
  // abc2svg music font
  var musicfont =
    'url("data:application/octet-stream;base64,\
AAEAAAAOAIAAAwBgRkZUTYTd79wAAFggAAAAHEdERUYAFQAUAABYBAAAABxPUy8yWLxdCwAAAWgA\
AABWY21hcFxKS5kAAAQIAAADemN2dCAAIgKIAAAHhAAAAARnYXNw//8AAwAAV/wAAAAIZ2x5Zp27\
6QgAAAiwAABGeGhlYWQPFh8MAAAA7AAAADZoaGVhCWn/GwAAASQAAAAkaG10eNzF+scAAAHAAAAC\
SGxvY2GpopfcAAAHiAAAASZtYXhwANkBPQAAAUgAAAAgbmFtZbni4sIAAE8oAAADG3Bvc3Qtfw6A\
AABSRAAABbUAAQAAAAEAAI87udRfDzz1AAsEAAAAAADRlyIXAAAAANncuoH/OPzvBUsEiAAAAAgA\
AgAAAAAAAAABAAAEiPzvAFwEJf84/XQFSwABAAAAAAAAAAAAAAAAAAAAkgABAAAAkgEMAAUAAAAA\
AAIAAAABAAEAAABAAC4AAAAAAAEBhgGQAAUACAKZAswAAACPApkCzAAAAesAMwEJAAACAAUDAAAA\
AAAAAAAAARAAAAAAAAAAAAAAAFBmRWQAQAAA7LcDM/8zAFwEiAMRAAAAAQAAAAAAAAF2ACIAAAAA\
AVUAAAGQAAACWAAAAFcAAAFK/7ACE/+wANL/sAAjAAAAIwAAACMAAABkAAAEIwAABCUAAAHg/9wD\
XgB6AwsAAALSAAACv/+6AdYAAAMLAAADDgAAAyf/yADIAAABrgAAASIAAAGQAAABfAAAAZAAAAGQ\
AAABgQAAAZAAAAGQAAABgQAAAZkACQGYAAkB9AAAAQQAFAEEAAoCawAkAhIAAAHCAAABSQAAAUAA\
AAFK//4BLAAAAjAAAAFKAAABSgAAAGQAAAFAAAABQAAAAUAAAAFAAAAAZAAAATYAAADmAAABNgAA\
ATsAAAE7AAABOwAAATsAAAE7AAABOwAAATsAAAE7AAABOwAAATsAAAENAAAAyAAAAP8AAAELABQB\
bgAAAQ0AMgFu//UAqQAAAToAAAFA//0AUAAAAUAAAABkAAABGAAAAlgAAAC2AAAAggAAAIIAAAEs\
AAABLAAAAO4AAAD/AAABSQAAAY8AAAHYAAAB2AAAA1MAAAIz//ADIP/hAXv/tAG4/9sBFv9+ARP/\
2wDcAAAA6P/kAr//tAIz/7QCv/+0Ayv/2wFf/9sCaf9+AV//fgJp/34BXwAAAf0ABQG1AAABtQAA\
AkQADQJEAA0BGAAAATYAAAEs//8BLAAAAPoAAADIAAABGP84APoAAADIAAAEDQAAAhwADAH0AAAB\
9AAAAfQAAAH0AAAB9AAAAfQAAAB4AAAALQAAAhwAAAD6AAAA+v/oAcIAAAFIAAABQAAAAgoAAAIK\
AAAAZAAAAAAAAwAAAAMAAAAcAAEAAAAAAnQAAwABAAAAHAAEAlgAAACSAIAABgASAAAAIOAA4CTg\
MOA54EPgSOBQ4FzgYuBp4H3gjOCV4KTgqeCz4QHhueG74efh8uH04ffh+eH84gDiSeJk4oPkoOSi\
5KTkqOSs5MDkzuTq5O7lAeUl5S3lMeU55WflaeVt5YLl0OXi5hDmEuYU5hjmJOYw5lDmVekS6RXp\
GOkg6SXpXeoC6qTso+yl7Kfsqey3//8AAAAAACDgAOAi4DDgOOBD4EXgUOBc4GLgaeB64IDglOCg\
4Kngs+EB4bnhu+Hn4fLh9OH34fnh/OH+4kDiYOKA5KDkouSk5KjkrOTA5M7k4eTu5QDlIOUp5S/l\
OeVm5WnlbOWC5dDl4uYQ5hLmFOYY5iTmMOZQ5lXpEOkU6RjpIOkl6V3qAuqk7KLspeyn7Knst///\
AAP/5CAFH+Qf2R/SH8kfyB/BH7YfsR+rH5sfmR+SH4gfhB97Hy4edx52HkseQR5AHj4ePR47Hjod\
+x3lHcobrhutG6wbqRumG5Mbhht0G3EbYBtCGz8bPhs3GwsbChsIGvQapxqWGmkaaBpnGmQaWRpO\
Gi8aKxdxF3AXbhdnF2MXLBaIFecT6hPpE+gT5xPaAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\
AAAAAAAAAAAAAQYAAAMAAAAAAAAAAQIAAAACAAAAAAAAAAAAAAAAAAAAAQAABAAAAAAAAAAAAAAA\
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAiAogAAAAqACoAKgA2\
AD4AbgB8AIoAmACkALAAvgDcAVABrAIcAl4C6gN8A9wD8ASMBR4FdgW0BdYF6gY8BowGrAbyBzIH\
bAe4B/gIPgiYCKwI0gj4CSoJRgloCZQJqgnECfoKCAoUCiAKMgpOCnAKfgqSCqQKtAsACxALKgtE\
C3wLtAwCDE4MtA0WDZQODA4yDkwOfA6mDv4PJA9+D54P3BAEEBgQJBAyEEIQahCQEJwQqBC0EMAQ\
4hEIET4RjBHsEmASdhKcEsoTHhOSE+YUJhRqFMAWGhcmF+AYoBlwGgwa6hwGHQgdSh2OHdgd8h4W\
HioePh5uHn4ekB6sHsIe5h8WH/ggtCDcIPohLCFqIZwh3iHwIf4iGiI0IloifCKqIsQi7iMqIzwA\
AAACACIAAAEyAqoAAwAHAC6xAQAvPLIHBADtMrEGBdw8sgMCAO0yALEDAC88sgUEAO0ysgcGAfw8\
sgECAO0yMxEhESczESMiARDuzMwCqv1WIgJmAAABAAAAAAGRAZAAAwAAMREhEQGRAZD+cAABAAAA\
AAAAAAAAAAAAMQAAAQAAAAAAVwQDACAAABE1NjU0JyY1NDcGFRQXFhUUBxYVFAcGFRQXJjU0NzY1\
NDUjElc/FSVNTSUVP1cSIwIDAhhDNmA5NGY6MksiOWFNYRgYZkxgOSVKMjpmNDlgNkgAAf+w/+wB\
mgAUAAMAACchFSFQAer+FhQoAAAAAAH/sP/sAmIAFAADAAAnIRUhUAKy/U4UKAAAAAAB/7D/7AEi\
ABQAAwAAJyEVIVABcv6OFCgAAAAAAQAAAAAAIwPoAAMAABEzESMjIwPo/BgAAQAAAfQAIwPoAAMA\
ABEzESMjIwPo/gwAAQAAAvgAIwRWAAMAABE3ESMjIwRMCv6iAAAAAAIAAAFAAGQCngAHAA8AABIi\
JjQ2MhYUAiImNDYyFhRHKh0dKh0dKh0dKh0COh0qHR0q/ukdKh0dKgAAAAUAAAAABCQBrgAvADcA\
PwBHAFMAACE1Mx4BMzI2NTQnLgQ1NDYzMhYXNzMXIy4BIyIGFRQeAxceARUUBiMiJwcgIiY0NjIW\
FAQiJjQ2MhYUAREzMjY0JiMDNTMRIzUzMhYVFCMCTh4VTzIpO5QZGioWEVk9JCcZHh4HHg9KMB85\
ECIZMghOTVtPRS4jAZsqHR0qHf3qKh0dKh3+iSg8RkY83EZG3HGJ+qA8SyAhLSgHCBQUIxVDTQsO\
GZs6SCgbDxcPCQsCFTczOk4gIB0qHR0qHR0qHR0qAWn+mGGmYf56HgFoHmdr0gAFAAAAAAQkAa4A\
GgAiACoAMgA+AAAhIiY1NDYzMhYXNzMXByYjIgYUFjMyNjcXDgEyIiY0NjIWFAQiJjQ2MhYUAREz\
MjY0JiMDNTMRIzUzMhYVFCMDAmd1glolKRseHgghJF44NjY4Nk0RIxRZsSodHSod/eoqHR0qHf6J\
KDxGRjzcRkbccYn6a2dldwwSHqYEjG2YbUk+CkpRHSodHSodHSodHSoBaf6YYaZh/noeAWgeZ2vS\
AAAAA//cAAIB3gKzAAcADwBNAAAAIiY0NjIWFAQiJjQ2MhYUFzQ2MzIWFRQHFjMyNjU0LwEDJxMu\
ATU0PgE3NjMyFhUUBiMiJjU0NyYjIgYVFB8BExcDHgEVFA4BBwYjIiYBniAYGCAY/n4gGBggGFsb\
FBMeLBcpJjYme88r0VpIHBMUJjMwOBsUEx4sFykmNiZ61CvVWkgcExQmMzA4AVIYIBgYIFQYIBgY\
INMSHBoRHQ4XLSYtJmX+3iABJUdxOBYtERETOCESHBoRHQ4XLSYtJmUBJh/+10dyOBYtERETOAAF\
AHr/NANeAlQAFwAbAB8AIwAnAAABMxUeARczFSMOAQcVIzUuAScjNTM+ATcRIxYXNxU2NyczJicH\
NQYHAdgoVXgHiooHeFUoVXgHiooHeFVwBWsoawVwcAVrKGsFAlSJCItgKGCLCImJCItgKGKJCP7l\
ug7IyA66KLoOyMkOuwAAAAAEAAD9bwKnBIgACwBEAE4AYwAAAQYVFBc+ATU0Jw4BExcVFAYjIiY1\
NDYzMhYUBgcWMzI2PQEnBiMiJjU0Nz4GPwEmNTQ2NxYVFAYHFzYzMhYVFCc0JiMiBiMTPgEnDgEV\
FBYXLgE1NDcnDgEHHgEzMjcBbAcFSHU2OUJLF09NUl9AMi9BPy8tGC9AFxwNmNs6DSQgLh0xEhcW\
DWxJYlx5FBQLcYhOYlACBwIhW0HiNkYnHT0/phGPbAECoXkKFgNTNy0jWjGVSHINB177bOwDTFxT\
QS1IO1g3ARk8RgPpAsedhWYXMCUtGicOERCWZoyhBzrliKlfzwKcc866PmYB/p0SXfILRjEgQhIO\
RUepLr1yl2eNowIAAgAA/fwC0gIAAGQAaAAAATI2NTQnJiMiBw4CByYnJicRIxEzETY3NjceAxcW\
MzI2NTQnJiMiBxYXFBYVFAYrASY1NDc2NzYzMhcWFxUUBgcGIyInBxc2MzIWFxYdAQYHBiMiJjU0\
NzMyFhUUBhUGBxYBMxEjAd4+Sg0aSUY8AgYKBCIaHi4cHC4eGiIGFAwZDyclMT0SJFIvMTINAjMh\
BUQFGlUnI15VNwhaSB8tND8iIj80QmYeKAg3Vl1MckQFITMCDzA1/k17e/4geEotLWxJBQ4bCmIn\
Kx/+BAQA/hEfKydiCyoXHQkbe0IxNmIaECgDDQQeKxkyFAtEGQ1PNFMSTm8cDRdLShc+LDlDElM0\
UE48MhkrHgQOBCYQHAPe/AAAAAP/uv2lAsMA/wAqADYAQgAANzQ2MzIWFxYVFAYHDgEHNjc+ATc2\
NTQmJy4BIyIGBz4BMzIWFRQHBiMiJgUiJjU0NjMyFhUUBiciJjU0NjMyFhUUBhOLZ1VrKy9GVWbP\
leWFMTQTChEdHDQzO2EWGCMbLj0nITEzRQKCFh0aFBUeGhoXGxwVFBwbHWKANDk+cn+6T2BNCD2F\
MWNQK2ZHUCMiF09GHhdBLzIgHlGKHBcWHB0VFh3yHhkVGhsUGR4AAAIAAP8GAXIA+gADAAcAADcz\
EyMDMxMj3JQCltyUApb6/gwB9P4MAAAEAAD+CgIfA6oACQAgAGIAbQAAJRYXPgE1NCYjIgMCJw4B\
FRQXLgE1NDY3JicOAQceATMyFx4BHwEdARQjIiY1NDYzMhYVFAYHFjMyNjU0LwEGIyImNTQ3PgE3\
PgI3JjU0NjceARUUBgceARc2MzIXFhUUBwYDBhUUFz4BNTQnBgFJEwZNR1ZCDg0YASw5HyAqTDsF\
CXFVAQVtggMiAwYCAno2UzMoJTUxJxUiIywBDQkVjZkuDkweBSMnEg5ZQC8ZSWECCAQSCFw5MmM2\
ZAMGN14pX3XEWxJPMzZW/uABCxAJNCcpJhJBKThOED5aWnlTcX4aIEAXFxsHf0gxJDM3JCIoAQwz\
NQ8JjQGSimpRHFAYBCAhDcIHbn8TM2JbbYdMEW4kAkM2YncwGwNWHiI5JCV7M0YmJgACAAD+YwJC\
AZoAYwBnAAABMjY1NCcmIyIHDgEHJicmJxEjETMRNjc2Nx4DFxYzMjY1NCcmIyIHFhcUFhUUBisB\
JjU0NzY3NjMyFxYXFRQGBwYjIicHFzYzMhYXFh0BBgcGIyImNTQ3MzIWFRQGFQYHFgEzESMBfjI7\
ChU6ODACDAQdExglFhYlGBMdBBEKEwwgHScxDhxDJScoCgIqGgQ2BBVEIxhJRi0GSDoYJSsxGxs0\
KDVSGCAGLUZJPVs2BBoqAgwmK/6jYmL+gGA7JCRXOwUdC1IcIhn+agMz/nQZIhxSCCISFwgWYjUr\
KE4VDSACCwMYIhQoEAk1FQtAK0EOPloWChI8OxMyIy41D0ErQD8wKBQjGAMLAx8NFgMY/M0AAAAA\
A//I/h4CNgDMACYALwA7AAA3NDYzMhcWFRQHDgEHNjc2NzY1NCcuASMiBgc+ATMyFhUUBwYjIiYF\
IiY0NjIWFAYnIiY1NDYzMhYVFAYPcFKCPCN4Q8ZpwF5HHgktGC0gMFIKEhYWJTkgGSUsOQICEhcU\
IhgVFRIWFRIRFhUhTV5XM1rGbDtXBjNkSowvKWYzGhRCNhcNPCYoGhhTdRckFhciGMIYFBEUFRAT\
GQAAAAADAAAAAADIAPAACQATACkAADcGFRQWMzI2NTQnIgYVFBc2NTQmByImNTQ2Ny4BNTQ2MzIW\
FRQHFhUUBlAjGxARFAIOEyAjEzAlNSMiEQwoHiQ2PCg0dxQdFB4bERaGEQ4XGQshDxTcKB4XGgsP\
ExAaIiAcIxAgGyAmAAAAAgAA/wYBrgD6AAsAFAAAMxQWMzI2NTQmIyIGBzQ2MhYUBiImiiojIisn\
JiUoin20fX20fWJ4eWFldXZhZ5CR0pGSAAABAAD/BgEiAPoACQAAMTczERcVIzU3EWR9QfBB+v4+\
HhQUHgEsAAAAAQAA/wYBjwD6ADwAADcyFRQHDgMHNjMyFjMyNz4CMw4CBwYHBiMiJiMiBiMiNTQn\
PgU1NCciBzIWFRQGIyI1ND4Bx8gFDTZAbzYTIBtkHBgeBRAMAQEFBQEHEBopGnQVH1YCBwECLD5H\
PChTThocKTceTDxY+n4aDiEuHUQtDCMOAw0LBRYWAykOGCcmEAECIUU4PDI4GGIBNSUeHylnKDkZ\
AAABAAD/BgF1APoAOQAANzIWFRQGIyImNTQ3NjMyFxYVFAYHHgEVFAcGIyImJyY0NjMyFhUUBiMW\
MzI2NTQmJyY0Nz4BNCYjImYbIichGzIfM1lGJkRGPT5RSyRNJ1cYIzIgIiolGww/JCtILhYWL0sp\
JDyqHBcbIysjLxoqEyJILkQLC0UtQycTFhQdTC4hGxkeKTEnJjoIBCIECTdQMAAAAQAA/wYBkAD6\
ABEAAAUXIzc1IzU2NTMBMz8BETMVIwFFMsgy4ZOj/vuwAWNLS9EpKTEo8oD+jpaR/tkoAAAAAAEA\
AP8HAX4A+gAvAAAXNjMyFhUUBiMWMzI3PgE1NCcmIyIHEyEOASsBBzYzMhceARUUBw4CIyInLgE1\
NBIcIRsqIBwaJDEcEwkeHChOSAoBYgs1JdUGOUJTMSErQxZAKyU8KxAeXyAgFxwgIR4UHyA5HBo1\
ASIkOnkeHxVBJU8vEBACFAkyEiMAAAAAAgAA/wYBgQD6AAkALAAAFzI2NTQmIyIHFhMWFRQGIyIm\
NTQ2MyYjIgYVPgIzMhYVFAYjIiYnPgEzMhbIKS0qKCwwB90bIxgeIhsQFjc1LxUYLR5MT3FIYWYB\
AWxbMD/SRSwiMCWeAZ8aJhkoHhsMHiN4XwsKCUA2RFmCeGmREgABAAD/BgGQAPsAKAAANyIOAwc3\
PggzMhYzMjY3DgQVIzY3Njc2NwYjIiZhFBoUCREFCgEMAgsFCwkNEAkvdSMaOxEbRRoeCIIBCBFo\
Hi0RHiVgoQUOCRsGdAELAgkBBgEDASYXDkOnQVxCK0UbNocnOQooAAMAAP8GAYQA+gAOABwANAAA\
Fw4BFRQWMzI2NTQuAzc+ATU0JiIGFRQeAwcuATU0NjcyFhUUBgceARUUBiMiJjU0Npo2LFgsKj8P\
IB0xPjMjRFIzChwSMXAxKWZKS2UqMDoydU1MdjkqGSQbHTApHw4XEg0TWhoiHB0wKCAPFxMKFT8Y\
PDUzTQFGMic0Fxo6NTdKSDAkNQAAAgAA/wYBgQD6AAkALAAANyIGFRQWMzI3JgMmNTQ2MzIWFRQG\
IxYzMjY1DgIjIiY1NDYzMhYXDgEjIia5KS0qKCwwB90bIxgeIhsQFjc1LxUYLR5MT3FIYWYBAWxb\
MD/SRSwiMCWe/mEaJhkoHhsMHiN4XwsKCUA2RFmCeGmREgABAAn/CgGZAPkAMAAAJTAXNjU0JiMO\
ARUUFxYzMjc2NxQeARUOAQciJyYnNCY1NDcyFhcWFRQGIyImNT4BMwEvEgQ8HzNAJyEwKygcKgkI\
G1VWTzs7BAHbJEARIiQcICkCIBqkAwUIFB4CYmqOMyoiGFgBBAMBVVABOTlmAisC5gIeFCckJTku\
HBYmAAIACf6iAZkBXgA4AD8AACUwFzY1NCYjIgcRFjMyNzY3FB4BFQ4BByMVIzUmJyYnNCY1NDc1\
MxUyNjMyFhcWFRQGIyImNT4BMwMRBhUUFxYBLxIEPB8DEAwMKygcKgkIG1FVASM9LjsEAasjAwcD\
JEARIiQcICkCIBp6PScKpAMFCBQiBP5LBCIYWAEEAwFUUQFoawktOWYCKwLLGWlmAR4UJyQlOS4c\
Fib+lwGWLpGOMw0AAAEAAP8GAfQA+gALAAA1MzUzFTMVIxUjNSPXRtfXRtcj19dG19cAAAABABT+\
BgDjAgAAEwAAExYHBicmAjU0Ejc2FxYHBgIVFBLcBw0JBUlra0kJCwYGPEZH/hYIBQMGVwEgfXwB\
IlYLBwYISf7niIb+5QAAAQAK/gIA3AH9ABMAABM2EjU0AicmNzYXFhIVFAIHBicmFDtHRjwJDAoH\
SWtrSQgLBv4WSQEbhogBGUkLBAQJVv7efH3+4FcJCQQAAAQAJP9WAkwAqgALAA8AEwAeAAAFNCYj\
IgYVFBYzMjY3MxEjATMRIyQUBiMiJjU0NjMyAahUPCA0Vz0hL3IyMv4KMjIB9XtmZXx5aGYgNU4n\
HzVLI+r+rAFU/qzmeEZJOT9DAAACAAD/JAISANwAAwAPAAA3FSE1JTMVITUzESM1IRUjHgHW/gwe\
AdYeHv4qHkGCgps3N/5INzcAAAIAAP9/AcIAgQALABMAAAU0JiMiBhUUFjMyPgEUBiImNDYyAVFa\
NiA0XTchL3F9yH19yB40TycfNEwjdGxLS2xLAAAAAgAA/2wBSACUAA0AGwAAJSYjIgYVFBcWMzI2\
NTQ3FhUUBiMiJyY1NDYzMgEkDSU8lwYLJjyXEA9+SE8kD35IT0QXYSsKCRdhKwkXHh1DZ0MeHUNn\
AAAAAAEAAP95AUAAhwALAAAlFAYjIiY1NDYzMhYBQHlZMjx6WDI8KEZpOCdFajgAAf/+/28BTACR\
AAsAACc3FzcXBxcHJwcnNwIbjIwbhoYci4schnEgdnUgcHAhdXUhcAAAAAUAAP9qASwAlgAFAAsA\
EQAXAB8AABcHFjMyNy8BBhUUFz8BJiMiBx8BNjU0JwY0NjIWFAYilkcdKikfXUcdHVxIHykqHVxH\
HR3yWHxYWHwSSB0dWkkfKSodWEgdHVpIHykqHYV8WFh8WAAAAAEAAP8GAjAA+gADAAAVATMBAbh4\
/kf6AfT+DAABAAD/dAFKAIwAAwAAMTcXB6WlpYyMjAABAAD/dAFKAIwAAgAAFRsBpaWMARj+6AAB\
AAD/zgBkADIABwAAFiImNDYyFhRHKh0dKh0yHSodHSoAAAABAAD/eQFAAqgADwAAESERFAYjIiY1\
NDYzMhcRIQFAeVkyPHpYMR/+3gKo/YBGaTgnRWocAcUAAAEAAP95AUACqAATAAARIREUBiMiJjU0\
NjMyFxEhNSE1IQFAeVkyPHpYMR/+3gEi/t4CqP2ARmk4J0VqHAEReDwAAAAAAQAAAjABQAKoAAMA\
ABEhFSEBQP7AAqh4AAAAAAIAAAF8AUACqAADAAcAABEhFSERIRUhAUD+wAFA/sAB9HgBLHgAAAAB\
AAD/2gBkAD4ABwAAFiImNDYyFhRHKh0dKh0mHSodHSoAAAABAAADAgE2A8AABQAAESEVIRUjATb+\
6B4DwB6gAAAAAAEAAAMqAOYEOAA5AAATIiY1NDYzMhYVFA8BFDMyNjU0JisBIjU0OwEyNjU0JiMi\
FRQWFRQjIiY1NDYzMhYVFA4BFRQWFRQGUCcpEA4PEgsMIRUkEQ8SFBQoFyUODhUCIQwSJSsjLSMj\
FDMDKh4YDhYQDBIHBw0qHw8ZDhAlFQ0TDQMICBwRDBUeIhoYIxMCASIPIy0AAAAAAQAAAwIBNgPA\
AAUAAAEVIzUhNQE2Hv7oA8C+oB4AAAABAAD87wE7AAAADwAAFTUzHgQVFAc2NTQmJx4GP1FQNy4S\
kXDv7zVwZWyJSWBpQUmP3yoAAQAAAAABOwMRAA8AADE1Mz4BNTQnFhUUDgMHHnCSEy43UFE/Bu8f\
4ZNHSGdeSIptZ3E1AAIAAP1EATwAAAAYACYAABkBMx4GFRQHFhUUBzY1NC4DIzUeAxc0NjU0LgMe\
BiczOzguHBITHgUpPkhAFglETVYVASk+SEH+qQFXGzkzNzo9SCUsKykrNjkZITdkRTQYqyRUQ10p\
BAwEN2VFMxkAAAACAAD//wE8ArwAGAAmAAAVETMyPgM1NCcWFRQHFhUUDgUHNTI+AzU0JjUOAx4W\
QEg+KQUeExIcLjg7MycGFkFIPikBFVZNRAEBVxg0RWQ3IRk5NispKywlSD06NzM5G6sZM0VlNwQM\
AyldQ1MAAAAAAwAA/SoBPACRABsAKQA3AAAZATMeBhUUBxYVFAcWFRQHNjU0LgIjNR4DFzQ2NTQu\
AiMnHgMXNDY1NC4CIx4GJzM7OC4cEhISEx4FPVdVHAlETVYVATxWVR0CCURNVhUBPFZVHf6QAgEb\
OTM3Oj1IJSwrJy0sKykrNjkZIUR3SCmpJFRBXSkEDQNEdkgpqyRTQl0pBA0DRHZIKQAAAwAA/1YB\
PAK9ABwAKQA2AAARMzI+AzU0JxYVFAcWFRQHFhUUDgUHIzcyPgI1NCY1DgMnMj4CNTQmNQ4DHhZA\
SD4pBR4TEhISHC44OzMnBh4eHVVXPQEVVk1ECR1VVz0BFVZNRAFXGDRFZDchGTk2KykrLC0nKywl\
SD06NzM5G6opSXhEBAwEKV1DVIYpSXhEAw0EKV1DVAAEAAD9QgE8AVQAIAAuADwASgAAGQEzHgYV\
FAcWFRQHFhUUBxYVFAc2NTQuAyM1HgMXNDY1NC4DJx4DFzQ2NTQuAyceAxc0NjU0LgMeBiczOzgu\
HBISEhISEx4FKT5IQBYJRE1WFQEpPkhBFglETVYVASk+SEEWCURNVhUBKT5IQf6oAqwbOTM3Oj1I\
JSwrJy0sKyctLCspKzY5GSE3ZEU0GKskVENdKQQMBDdlRTMZqyRUQ10pAw4DN2VFMxmrJFRDXSkE\
DAQ3ZUUzGQAEAAD+jgE8AqAAHwAsADkARgAAGQEzMj4CNTQnFhUUBxYVFAcWFRQHFhUUDgUHNTI+\
AjU0JjUOAycyPgI1NCY1DgMnMj4CNTQmNQ4DHhxVVz0FHhMSEhISEhwuODszJwYdVVc9ARVWTUQJ\
HVVXPQEVVk1ECR1VVz0BFVZNRP6OAqwpSHdEIRk5NispKywtJyssLScrLCVIPTo3MzkbqilJeEQD\
DQQpXUNUhilJeEQDDQQpXUNUhilJeEQDDQQpXUNUAAAABQAA/VUBPAISACQAMgBAAE4AXAAAGQEz\
HgYVFAcWFRQHFhUUBxYVFAcWFRQHNjU0LgMjNR4DFzQ2NTQuAyceAxc0NjU0LgMnHgMXNDY1NC4D\
Jx4DFzQ2NTQuAx4GJzM7OC4cEhISEhISEhMeBSk+SEAWCURNVhUBKT5IQRYJRE1WFQEpPkhBFglE\
TVYVASk+SEEWCURNVhUBKT5IQf67A1cbOTM3Oj1IJSwrJy0sKyctLCsnLSwrKSs2ORkhN2RFNBir\
JFRDXSkDDQQ3ZUUzGaskVENdKQQMBDdlRTMZqyRUQ10pAw4DN2VFMxmrJFRDXSkEDAQ3ZUUzGQAA\
BQAA/bwBPAJ5ACMAMAA9AEoAVwAAGQEzMj4CNTQnFhUUBxYVFAcWFRQHFhUUBxYVFA4FBzUyPgI1\
NCY1DgMnMj4CNTQmNQ4DJzI+AjU0JjUOAycyPgI1NCY1DgMeHFVXPQUeExISEhISEhIcLjg7MycG\
HVVXPQEVVk1ECR1VVz0BFVZNRAkdVVc9ARVWTUQJHVVXPQEVVk1E/bwDVylId0QhGTk2KykrLC0n\
KywtJyssLScrLCVIPTo3MzkbqilJeEQDDQQpXUNUhilJeEQDDQQpXUNUhilJeEQDDQQpXUNUhilJ\
eEQDDQQpXUNUAAAAAgAA/2QA4QGwAAoAFgAANyIGHQE2NzY1NCY3MhYVFAcGIxEzETZnFCsiJisd\
ByM5S1JEKCN6JhO5Dzg7LxsmJjIjSUxSAkz+vDQAAAIAAP6GAMUBegADAAwAABc3NQcRFTcRIzUH\
ETcckJCpGawBZS2WLQFJ6DT9wOIzAkMBAAACAAD+mAD/AWgAAwAfAAA3FTc1AyM1BzU3NQc1NzUz\
FTc1MxU3FQcVNxUHFSM1B1NaWh41NTU1HlodNTU1NR1aRqcbp/43ow9cD6cPWg+onxyrow9cD6cP\
Wg+onxwAAAABABT/hAELAHoAHgAAFzUmJwcwFSM1MzcnMCM1MxUWFzcwNTMVIwYHFzAzFcMoDDNI\
OTMzOUghEjRIOSETNDl8OyYNMztKMjJIOSIRMzlHIhE0SAAEAAD/agFsAbAADgAcACsAOgAANw4B\
HQEyNzY3NjU0JyYjNzIWFRQHBgcGIxEzETYXDgEdATI3Njc2NTQnJiM3MhYVFAcGBw4BIxEzETZO\
ER4OHh8MBAoQERkdKwkYKzUvHxnRER0QHh0LBgsQDxYfKgsZKBY3Fh4bfQEeEMYpKzQNGR4UFSY5\
IRIgOTRAAkb+wTImAR0RxikvMBMTHBYVJjYkFhw+LxslAkb+wTIAAAIAMv9kAQ0BsAAKABYAADci\
BhUUFxYXNTQmJzIXETMRIicmNTQ2qxcgLi4aKjM6IyM6Uk85eiYbMEVCA8sSHiY0AUT9tFJQRSMy\
AAAE//X/agFsAbAADgAdACwAOwAANyMiBwYVFBcWFxYzNTQmJzIXETMRIiYnJicmNTQ2Fw4BHQEy\
NzY3NjU0JyYjNzIWFRQHBgcOASMRMxE2VwEREAoEDB8eDh4rMBkfFjcXKxgJK+kRHRAeHQsGCxAP\
Fh8qCxkoFjcWHht9FRQeGQ00KynGEB4nMgE//bolGzQ5IBIhOSYBHRHGKS8wExMcFhUmNiQWHD4v\
GyUCRv7BMgAAAAABAAD+wACpAUAAEwAAEzMVNxUHFTcVBxUjNQc1NzUHNTdEHkdHR0ceRERERAFA\
og5cDn8OWg+oog5cDn8OWg8AAwAA/pgBOgFoACMAJwArAAA3NTMVNxUHFTcVBxUjNQcVIzUPASM1\
BzU3NQc1NzUzFTc1MxUDNQcVNxU3NekeMzMzMx49HjwBHjMzMzMePR4ePVs9wKieD1wPnw9aD7Wq\
EqykEKieD1wPnw9aD7WqEqyk/v2eEZ+4nhGfAAH//QAAAT8A9AAYAAA3BiMiJjU0PwE2LwEmNTQ2\
MzIxFwUWFRQHEgIDBwkGzw4OzQgLBwECAR8ODgEBEAgKA0kHBk8DCwoSAWsGDg0FAAAAAQAAAAAA\
UABQAAkAADU0NjIWFAYjIiYXIhcXERAYKBEXFyIXGAAAAAEAAAAAAUAAKAADAAAxNSEVAUAoKAAA\
AAEAAAAAAGQBGAADAAAzAzMDKChkKAEY/ugAAAABAAAAAAEYATUABQAAMRsBIycHjIxBWFoBNf7L\
xsYAAAIAAAAAAlgBSgAOABkAADE0NjMyHgIVIy4BIgYHISImNDYzMhYVFAazeTlrVTMPC6LgogsB\
HBclJRcZIyOYsixRgE1uhoZuJDAkJBgZIwAAAQAAAAAAtgEtABcAABMyFhcWFRQHDgEjJyY1NDY1\
NCMuATU0NlYbGxAaMhlEEAYBRxQbKC0BLQwRHTA9PB0tAwECCGsTDwEmHB4xAAEAAP8GAIIA+gAD\
AAA1MxEjgoL6/gwAAAEAAAAAAIIA+gADAAA1MxUjgoL6+gAAAAEAAP+DASwAAAADAAAxIRUhASz+\
1H0AAAEAAAAAASwAfQADAAA1IRUhASz+1H19AAEAAP5+AOsBhwATAAATFwcXJiMiBhUUFyY1NDYz\
MhcnNym9Z2wyNB8mOHg0JSIih2QBh+XZzy4kHTU0S00jLRW8tAAAAQAA/w0BAADAABYAADcOAiMi\
JjU0NjIWFRQHMjY3NjIXAyerAxkaEys3JjgpFyIzIQIVA5YwPAEHBCkoHyAeGR0bISwCAv5vEAAA\
AAEAAP4MAUgAwAAkAAAXBiMiJjU0NjMyFhUUBzI/AQYjIiY1NDYzMhYVFAcyNzYyFwMnqyghKzcn\
GxwpF0ELPDYYKzcnGxwpF0guAhUDxS3EDCgoICAfGR0bIsoMKSgfIB4ZHRtNAgL9bgwAAAEAAP4M\
AY8BwAA2AAA3BiMiJjU0NjMyFhUUBzI/ASIOASMiJjU0NjMyFhUUBzI3NjIXAScTBiMiJjU0NjMy\
FhUUBzI39igfKzcnGxwpFz8LOgEgHBMrNycbHCkXSC4BFgP+9C1VKCErNycbHCkXQQs8DCgoICAf\
GR0bIssJBCkoHyAeGR0bTQIC/G4MASQMKCggIB8ZHRsiAAAAAAEAAP0MAdoBwABFAAATBiMiJjU0\
NjMyFhUUBzI/AQYjIiY1NDYzMhYVFAcyPwEGIyImNTQ2MzIWFRQHMj8BIg4BIyImNTQ2MhYVFAcy\
NzYyFwEnqyghKzcnGxwpF0ELOighKzcnGxwpF0ELOigfKzcnGxwpFz8LOgEgHBMrNyY4KRdILgIV\
A/6pLf48DCgoICAfGR0bIsoMKCggIB8ZHRsiygwoKCAgHxkdGyLLCQQpKB8gHhkdG00CAvtuDAAA\
AAEAAP0MAhkCrgBWAAAlBiMiJjU0NjMyFhUUBzI/AQYjIiY1NDYzMhYVFAcyPwEiDgEjIiY1NDYz\
MhYVFAcyNzYyFwEnEwYjIiY1NDYzMhYVFAcyPwEGIyImNTQ2MzIWFRQHMjcBPyghKzcnGxwpF0EL\
NigfKzcnGxwpFz8LNAEgHBMrNycbHCkXSC4BFgP+ai1VKCErNycbHCkXQQs6KCErNycbHCkXQQs0\
DCgoICAfGR0bIsQMKCggIB8ZHRsixwkEKSgfIB4ZHRtNAgL6gAwBJAwoKCAgHxkdGyLIDCgoICAf\
GR0bIgABAAD/GgNSAOYACwAANTMVITUzESM1IRUjGQMgGRn84BnmfX3+NH19AAAAAAP/8P8GAiYA\
+gAHAA8AEwAANiImNDYyFhQAIiY0NjIWFAUBMwFQMiMjMiMBiDIjIzIj/dIBuH7+R0sjMiMjMv7P\
IzIjIzJaAfT+DAAE/+H/BgMHAPoABwAPABMAFwAANiImNDYyFhQAIiY0NjIWFAUBMwEzATMBQTIj\
IzIjAncyIyMyI/zjAbh7/kd5Abh7/kdLIzIjIzL+zyMyIyMyWgH0/gwB9P4MAAL/tP+IAXwBGAAR\
ADsAADcWMzI2NzY1NCcmIyIGBwYVFBciJwczMhQrASI0OwETNjU0IyIOAwcGJjc2NzYzMhYXPgEz\
MhYVFAbFAgUSMg4NDwIEEjULDycqGS00CwvhCwtLaAYLCAwPCxkKBRsFMQ8YJCMkBx0mIx4tWSgB\
NSQgJiUFATMcJyQpLiB6Hh4BHRIMDwcUEiwQCA8JWBAZExoeDzQwSWsAAAH/2//2Ab4BGABTAAA3\
BgcGKwEiPwE2JiMiBgcGJjc+AzMyFzYzMhc+ATMyFhUUDwEGFRQzMjc+BTc2FgcOAiMiJjU0PwE2\
NTQjIg8BBgcnBiY/ATY1NCMiB1AHCAQENQ0NQgQGCA0WJAUVBBQQIh8SNwskJC0JCykTGSQFLwQI\
AQQFCwcMAw0BBhUGEhctHxUZBTQBFRsIQQgPJg0IBEMBFRsIFREDARqnDQ8aOQgMCSUaMBIoKCgQ\
GCMaCw99CwkOAgMJBg8FEgEJDQsfHxoWEw0NiAIEDhSrFgEBAQ8IqwIEDhQAAAAB/37/YAFeAbgA\
QQAAByImNTQ2MzIWFRQHBhUUMzI+BzcjIjU0OwE+ATMyFhUUBiMiJjU0NzY0IyIOBwczMhQrAQ4B\
MiAwFxMSFxIKGQsQDwsNCg4NFAo1ExFBFGk0IDAXExIXEgoZBwwKBwgFBgMGATYTEz8hdqAmIBoi\
FA8OCwcNDgYREyUkPDdVJxUTS18mIBoiFA8OCwYcBQsKFA0aDR4GKMXBAAAB/9sAAAETARMAKgAA\
Nz4BJiMiBg8BBgcGKwEiPwE2JiMiBgcGJjc+ATMyFhc2MzIWFRQjIiY1NNAFAwMFFCQJPwcIBAQ1\
DQ1CBAYIDhciBRUEITgiGx0EHyQaICsPG+cDBwQsGJwRAwEaow0PGjUIDAk8QBoNJx4ZNxYNFAAA\
AAEAAAAAANwBGAAxAAAzIiY1NDYyFhUUBxYzMjY1NC4CJyY1NDYzMhYVFAYjIiY1NDcmIyIGFRQe\
AhcWFRRQHjIVGhcQDBMWIQkLGAY6Ny0iNhYQDRYHDxEPGRESHgUwKxsQFhAMEhAQFhILDwcNBCUw\
IygkGBAYFA4DDhMRDQkTDBEDICtVAAAB/+T//ADnAQ8APAAAJwYuAT8BIgYjIiYOAQcGJyY3PgE3\
HgEzMjYzMhcWFA8BBhUUMzI2MzIXFjc2JyI1NDYzMhUUBisBLgEjIgoGCwEFsAUfDAMUDB8FDwQD\
CAwLAQ4vFSIrBAgFCweeAgIBDQYaIw0IBQckEg0mKB4dGCUIDgMECA0GwQYGAjIFDQsJEh4wAgEG\
CwEBEQenBgIDAxoKDg0DHQ4VNx4vAxgABf+0/4gFSwEYABsANQDZAPABCwAAJRYzMj4BNz4GNTQm\
JyYjIgYHDgIVFAUWMzI2Nz4FNTQmJyYjIgYHBhUUHgEXIicHMzIUKwEiNDsBEz4CNTQuAiMiDgMH\
BiY3Njc2MzIWFz4BMzIXPgEzMhYXPgEzMhc+ATMyFhc+ATMyFz4BMzIWFz4BMzIWFRQGIyInBzMy\
FCsBIjQ7ARM+AjU0JiMiBgcVFAYjIicHMzIUKwEiNDsBEz4CNTQmIyIGBxUUBiMiJwczMhQrASI0\
OwETND4DNDU0JiMiBgcVFAYlFjMyNjc+BDU0JicmIyIGBwYVFAUWMzI2Nz4GNTQmJyYjIg4BBwYV\
FBYCCgMEDB8eCQIDAgICAQEHCAMDEzQLBQcD/ssDBBIyDgIDAwMBAQcIAwMTNAsPBAcIFhktNAsL\
4QsLS2gBAwIBAgUDCAwPCxkKBRsFMQ8YJCMkBx0mIy8TEiIbIyQHHSYjLxMSIhsjJAcdJiMvExIi\
GyMkBx0mIx4ta0kWGS00CwvhCwtLaAEDAgUGDhQUa0kWGS00CwvhCwtLaAEDAgUGDhQUa0kWGS00\
CwvhCwtLaAECAQIFBg4UFGsDgwMEEjIOAgQDAwEHCAMDEzQLD/7LAwQSMg4CAwICAgEBBwgDAwwh\
HgcPCSgBGCoXBAoJCwoKCwUQFwMBMxwNGxgLKAcBNSQFCwwMDAwGEBcDATMcJiUMFA0qIHoeHgEd\
AggOBgMFBQIHFBIsEAgPCVgQGRMaHg8yHBYTGh4PMhwWExoeDzIcFhMaHg80MEdtIHoeHgEdAggO\
BgcIGCMBR20geh4eAR0CCA4GBwgYIwFHbSB6Hh4BHQEDBQUGBwMHCBgjAUdtKAE1JAYNDw4PBxAX\
AwEzHCYlKAcBNSQECgkLCgoLBRAXAwEYJRImJRIaAAAE/7T/iAQGARgAfQCYALQAzgAAISInBzMy\
FCsBIjQ7ARM+AjU0JiMiBgcVFAYjIicHMzIUKwEiNDsBEzQ+AzQ1NCYjIgYHFRQGIyInBzMyFCsB\
IjQ7ARM+AjU0LgIjIg4DBwYmNzY3NjMyFhc+ATMyFz4BMzIWFz4BMzIXPgEzMhYXPgEzMhYVFAYn\
FjMyNjc+BjU0JicmIyIOAQcGFRQWBRYzMj4BNz4GNTQmJyYjIgYHDgIVFAUWMzI2Nz4FNTQmJyYj\
IgYHBhUUHgEDUhYZLTQLC+ELC0toAQMCBQYOFBRrSRYZLTQLC+ELC0toAQIBAgUGDhQUa0kWGS00\
CwvhCwtLaAEDAgECBQMIDA8LGQoFGwUxDxgkIyQHHSYjLxMSIhsjJAcdJiMvExIiGyMkBx0mIx4t\
a0wDBBIyDgIDAgICAQEHCAMDDCEeBw8J/sIDBAwfHgkCAwICAgEBBwgDAxM0CwUHA/7LAwQSMg4C\
AwMDAQEHCAMDEzQLDwQHIHoeHgEdAggOBgcIGCMBR20geh4eAR0BAwUFBgcDBwgYIwFHbSB6Hh4B\
HQIIDgYDBQUCBxQSLBAIDwlYEBkTGh4PMhwWExoeDzIcFhMaHg80MEdtKAE1JAQKCQsKCgsFEBcD\
ARglEiYlEhoDARgqFwQKCQsKCgsFEBcDATMcDRsYCygHATUkBQsMDAwMBhAXAwEzHCYlDBQNAAP/\
tP+IAsEBGABXAHEAjQAAMyInBzMyFCsBIjQ7ARM+AjU0LgIjIg4DBwYmNzY3NjMyFhc+ATMyFz4B\
MzIWFz4BMzIWFRQGIyInBzMyFCsBIjQ7ARM0PgM0NTQmIyIGBxUUBicWMzI2Nz4FNTQmJyYjIgYH\
BhUUHgEFFjMyPgE3PgY1NCYnJiMiBgcOAhUUyBYZLTQLC+ELC0toAQMCAQIFAwgMDwsZCgUbBTEP\
GCQjJAcdJiMvExIiGyMkBx0mIx4ta0kWGS00CwvhCwtLaAECAQIFBg4UFGtMAwQSMg4CAwMDAQEH\
CAMDEzQLDwQHAUoDBAwfHgkCAwICAgEBBwgDAxM0CwUHAyB6Hh4BHQIIDgYDBQUCBxQSLBAIDwlY\
EBkTGh4PMhwWExoeDzQwR20geh4eAR0BAwUFBgcDBwgYIwFHbSgBNSQFCwwMDAwGEBcDATMcJiUM\
FA0CARgqFwQKCQsKCgsFEBcDATMcDRsYCygAAAL/2/+IAysBGAB6AI8AACU2NzYzMhYXPgEzMhYV\
FAYjIicHMzIUKwEiNDsBEz4DNTQmIyIOAwcOASMiJjU0Nj8CNCMiDwEGBycGJj8BNjU0JiMiDwEG\
BwYrASI/ATYmIyIGBwYmNz4DMzIXNjMyFz4BMzIeAxUUDwEGFRQzMjc+ARcWMzI2Nz4BNTQmJyYj\
IgYHBhUUFgGtMRQYIiMkBx0mIx4ta0kWGS00CwvhCwtLaAEBAwEFBgcPEg4YCBo8LRUZAgM0ARUb\
CEEIDyYNCARDAQwJGwhEBwgEBDUNDUIEBggNFiQFFQQUECIfEjcLJCQtCQspEwoSDwsHBS8ECAID\
DyXRAwQSMg4GBwcIAwMTNAsPCXdsGB0TGh4PNDBHbSB6Hh4BHQIFCQkFBwgNHxs1EDY4FRQGDQeI\
Bg4UqxYBAQEPCKsDAwYIFKwRAwEapw0PGjkIDAklGjASKCgoEBgGCw8TCg0NfQsJDgIINTkBNSQP\
JhEQFwMBMxwmJRIaAAL/2/9gAxkBuABXAJ8AADcGBwYrASI/ATYmIyIGBwYmNz4DMzIXNjMyFz4B\
MzIeAxUUDwEGFRQzMjc+BTc2FgcOAiMiJjU0Nj8CNCMiDwEGBycGJj8BNjU0JiMiBxMiJjU0NjMy\
FhUUBwYVFDMyPgc3IyImNTQ2OwE+ATMyFhUUBiMiJjU0NzY0IyIOBwczMhYVFA4BKwEOAVAHCAQE\
NQ0NQgQGCA0WJAUVBBQQIh8SNwskJC0JCykTChIPCwcFLwQIAgMFCwcMAw0BBhUGEhctHxUZAgM0\
ARUbCEEIDyYNCARDAQwJGwj1IDAXExIXEgoZCxAPCw0KDg0UCjUJCgkIQRRpNCAwFxMSFxIKGQcM\
CgcIBQYDBgE2CQsFCQY/IXYVEQMBGqcNDxo5CAwJJRowEigoKBAYBgsPEwoNDX0LCQ4CAwkGDwUS\
AQkNCx8fGhUUBg0HiAYOFKsWAQEBDwirAwMGCBT+nyYgGiIUDw4LBw0OBhETJSQ8N1UnDAkIC0tf\
JiAaIhQPDgsGHAULChQNGg0eBgwIBQkGxcEAAAAAAf9+/2ACaQG4AHsAACUjDgEjIiY1NDYzMhYV\
FAcGFRQzMj4HNyMiJjU0PgM7AT4BMzIWFRQGIyImNTQ3NjQjIgcGBxc+ATMyFhUUBiMiJjU0NzY0\
IyIOBwczMhYUBisBDgEjIiY1NDYzMhYVFAcGFRQzMj4HAV+bIXZfIDAXExIXEgoZCxAPCw0KDg0U\
CjUJCgEDBAYDQRRpNCAwFxMSFxIKGSYXAwGbFGk0IDAXExIXEgoZBwwKBwgFBgMGATYJCwsJPyF2\
XyAwFxMSFxIKGQsQDwsNCg8NFObFwSYgGiIUDw4LBw0OBhETJSQ8N1UnDAkDBQUEAktfJiAaIhQP\
DgsGHHMMBgFLXyYgGiIUDw4LBhwFCwoUDRoNHgYMEAzFwSYgGiIUDw4LBw0OBhETJSQ8N1UAAAAA\
Af9+/2ADdAG4ALMAABMzPgEzMhYVFAYjIiY1NDc2NCMiBwYHFz4BMzIWFRQGIyImNTQ3NjQjIg4H\
BzMyFhUUDgErAQ4BIyImNTQ2MzIWFRQHBhUUMzI+BzcjDgEjIiY1NDYzMhYVFAcGFRQzMj4HNyMO\
ASMiJjU0NjMyFhUUBwYVFDMyPgc3IyImNTQ+AzsBPgEzMhYVFAYjIiY1NDc2NCMiDgIHBsycFGk0\
IDAXExIXEgoZJhcDAZsUaTQgMBcTEhcSChkHDAoHCAUGAwYBNgkKBAkGPyF2XyAwFxMSFxIKGQsQ\
DwsNCg8NFAqbIXZfIDAXExIXEgoZCxAPCw0KDg0VCpshdl8gMBcTEhcSChkLEA8LDQoODRQKNQkK\
AQMEBgNBFGk0IDAXExIXEgoZDhUOCAYCAQ5LXyYgGiIUDw4LBhxzDAYBS18mIBoiFA8OCwYcBQsK\
FA0aDR4GDAgFCQbFwSYgGiIUDw4LBw0OBhETJSQ8N1UnxcEmIBoiFA8OCwcNDgYREyUkOzhVJ8XB\
JiAaIhQPDgsHDQ4GERMlJDw3VScMCQMFBQQCS18mIBoiFA8OCwYcEyciGwoAAf9+/2AEgAG4AOcA\
AAEXPgEzMhYVFAYjIiY1NDc2NCMiBwYHFz4BMzIWFRQGIyImNTQ3NjQjIg4HBzMyFhQGKwEOASMi\
JjU0NjMyFhUUBwYVFDMyPgc3Iw4BIyImNTQ2MzIWFRQHBhUUMzI+BzcjDgEjIiY1NDYzMhYVFAcG\
FRQzMj4HNyMOASMiJjU0NjMyFhUUBwYVFDMyPgc3IyImNTQ+AzsBPgEzMhYVFAYjIiY1NDc2NCMi\
BwYHFz4BMzIWFRQGIyImNTQ3NjQjIg4HAdicFGk0IDAXExIXEgoZJhcDAZsUaTQgMBcTEhcSChkH\
DAoHCAUGAwYBNgkKCgk/IXZfIDAXExIXEgoZCxAPCw0KDw0UCpshdl8gMBcTEhcSChkLEA8LDQoO\
DRQKmyF2XyAwFxMSFxIKGQsQDwsNCg8NFAqbIXZfIDAXExIXEgoZCxAPCw0KDg0UCjUJCgEDBAYD\
QRRpNCAwFxMSFxIKGSYXAwGbFGk0IDAXExIXEgoZBwwKBwgFBgMGAQ8BS18mIBoiFA8OCwYccwwG\
AUtfJiAaIhQPDgsGHAULChQNGg0eBgwQDMXBJiAaIhQPDgsHDQ4GERMlJDw3VSfFwSYgGiIUDw4L\
Bw0OBhETJSM8N1YnxcEmIBoiFA8OCwcNDgYREyUkPDdVJ8XBJiAaIhQPDgsHDQ4GERMlJDw3VScM\
CQMFBQQCS18mIBoiFA8OCwYccwwGAUtfJiAaIhQPDgsGHAUKCxMOGQ4dAAMAAP9gAt8BuAA3AHsA\
xQAAMyImNTQ2MzIWFRQHFjMyNjU0LgMnLgI1NDYzMhYVFAYjIi4BNTQ3JiMiBhUUHgIXHgEVFCUG\
LgE/AS4CIyIGIyIOAQcGJyY3PgE3HgEzMjYzMhYXFhQPAQ4BFRQeARcWPgEnLgE1NDYzMhUUBwYj\
IiMuAiMiBgUiJjU0NjMyFhUUBw4BHgEVFBYyPgc3IyIuATU0NjsBPgEzMhYVFAYjIiY1NDc2NCMi\
DgcHMzIWFAYrAQ4BUB4yEgwOFwwGGBYhAwwFFwMUGBQ3LSI2FhAIEAsFEA4PGRESHgUbFwEmBgsB\
Ba4ECQoHBhwGBRASBRAFAwcLDAEYJQ4gKAcECwcLB5oCAhoqDQUJBQIDJBQMJiYSEwMDEiMYCAoS\
/r0gMBcTEhcSBAEBAgYWEA8LDQoODRQKNQYJBAkIQRRpNCAwFxMSFxIKGQcMCgcIBQYDBgE2CQoK\
CT8hdisbEBYNCxgMEhYSCQwNBA4CDRIeDyMtJBgQGAkPCggIFBENCRMMEQMSHxVaAwQIDQa/AgIB\
ARgfBA0LCBMeLgQCAQgBAQERB6MDBQIHAwcLAwQNBggIFAsTNysUCQEIBgerJiAaIhQPDgsCBQQG\
AwgGBhETJSQ8N1UnBgkGCAtLXyYgGiIUDw4LBhwFCwoUDRoNHgYMEAzFwQAAAAIABf/7AfwBmgAJ\
ACwAAAEPAQYVFDMyNjcHDgEjIiY1ND8BIzUzPwEHNzIVNjMyFhUUBiImNTQ3Bg8BIwE2fzkCFBhE\
EgwpMh8iIgM3aXMWWSaYGSA1GB0YIBYJNxBCSAEJB7gIAxUXDygZFCQaCwuzIEoueAotKRwVEhsR\
DhITDyfYAAEAAP/9AbUA1AAvAAAlMjU0JwYiJjU+ATMyFhUUBwYjIi8BJiMiFRQXNjMyFhUUBgci\
JyY1NDc2MxYfARYBcC0aEBwUARcJJC0pFx4mHqIaES4ZEA8NFRQNHRgcKBYiKheiHDE5IBMQFg0O\
FjM1MyQVFXoSOiASEBcODxICGiItMyQTAhB6EwABAAD/zQG1AQMANgAAFyImNTQ3NjMWHwE1MxUX\
FjMyNjU0JwYjIjU+ATMyFhUUBwYjIi8BFSM1JyYjIgYVFBc2MzIVFE0gLSgWICgXLh5cIg8VHBYU\
EhwBDwkgLSkXHCQeLh5cIA8WHBUUExwDQyYzJBMCECRpgEcXKRwnEAwbDxVCJjMkFRUkbINHFige\
Jw8MHSAAAQANAAACRQDgAAsAADcnNxc3FzcXBycHJyIVjmV4ak0Wkml0aS4ZmXx8fFQXoXx8fAAA\
AAEADf/LAkUBEQATAAAlBycHJzcXNzUzFzcXNxcHJwcVIwEWQGlLFY5lFhsBRmpPFJJpGRtGRnxO\
GZl8F5Z7SnxVGKF8G5YAAAEAAAAAARgBGAALAAAzNSM1MzUzFTMVIxV7e3sie3t7Int7InsAAAAB\
AAAAAAE2AXIACgAAMTU+BDczFAYkMUw0NA8ewDwHDys9b0mO2gAAAf//AAABLQCgAB0AADc+AjMy\
HgEXFjMyNzYWBw4CIyIuAScmIyIHBiYBCRApHBgmJg8JCh4YBA4CCBEpHBgkJRIHCB0dBQ1GGSEg\
ITEKBiQGBwcZIh8hMQoEIwYIAAAAAQAAAAABLAEsAAcAADERIREjNSMVASwj5gEs/tS0tAABAAAA\
AAD6AcIABgAAMwMzGwEzA2lpKFVVKGkBwv6YAWj+PgACAAAAAADIAMgABwAPAAA2MjY0JiIGFBYi\
JjQ2MhYURT4sLD4sdFI7O1I7GSw+LCw+RTtSOztSAAH/OAAAAMgAyAALAAAjNDYyFhUjNCYiBhXI\
dqR2HmCUYFJ2dlJKYGBKAAAAAgAAAAAAtAEsAAcAFQAANjI2NCYiBhQXNS4BNTQ2MhYVFAYHFUse\
GxseGxgdKzdGNysdeDU2NTU2rWQINScoPDwoJzUIZAAAAgAAAAAAyAEsAA8AHwAANy4BNTQ2MhYV\
FAYHHQEjNTc+ATU0JiIGFRQWFz0BMxVUJDA7UjswJCAgGSIsPiwiGSBmBTglKTs7KSU4BQFlZRkG\
KRsfLCwfGykGAUlJAAAABAAA//wD9AJ/AIcAkQCdAKcAADc+ATU0LgEnLgE1ND4CPwIOARUUMzI3\
Fw4BIyImNTQ+AjMyFhUUBiMiJic3HgEzMjU0LgInBwYVFB4CFRQGDwEeAjM6ATMyNyY1NDc2MzIW\
FRQHBgceATMyNjU0NjcuAj0BHgEVFAYjIicGIyIuAScOASImJyYjIg4BBwYjIjU0NgUiJjQ2MzIW\
FAYlPgE1NCcmIyIGFRQFNjU0JicOARUUmDZFAQICA1IDBAUBAj1iaiAeHRoVKSUeLR8+cEh9cjIu\
HDYSGBEUFDMMHEAtGwkdIh0fEBAOKR8MAwgCECMhHCJMGyMKHTwTIBsWMUNdIIFeurRRQkEjJDwh\
MxYOLCggGxwaEgoUGQZaIQowA1wLExMLDBIR/g8zJAQFFRwuATxaFxI/MFoYPyAEBwcECHQiBQ4O\
DAQEpQRjLCM8DUIvJhohR0QsUTcwNTArDh4RMgoaIhoCQiQbHjYhLBUmTxQUCikaHjUoNSUuKyAh\
EzkwFxIqGVJfGSxZNAYBPLFrRl85OhUUEiYZFiAtCxUEOgcNOE8SGBISGBKALy8bBw4SOSsedAWB\
IkkVHVhEPwAAAAACAAwACgHTAc8ACgCPAAAlNCYjIgYUFjMyNicOASMiJjQ2MzIWFzY1NCcmIyIm\
NDYzMhceARcWMzI1NCcuATU0NjMyFhUUBgcUMzI3PgE3NjMyFhUUBiMiBgcGFRQzMjYzMhYUBiMi\
JiMiBhUUFx4BFxYVFAYjIicuAScmIyIVFBYVFAYjIiY0NjU0IyIHDgEHBiMiJjU0NzYzMjc2NTQB\
FhgPEBUWDxAXiRkmDhkbGhkNKhglDBQYHRwZFxIQCwMUCxIUAQInHhQSGyMBFhANEQENDBoTHhsS\
GxUNECEbKw4cGx0ZDycUFxILFDgNDhkXExQMARMRChIqIBMSHSYXDQ4SAxESDBQaDQwWIxIN7hAU\
EyIWFQoBJRkqGyUCAxYOChMcKB0MCz4WDRgNCBcnDxcaGxYRIxkqEBM4Dw4bFBEjBgsODxYnHSga\
JggKFgoSAwsNGRMbDgs5FQ8fHjATFBgaJDEXJA4SPQwHFhQYDg0SDQwaAAAAAwAA/wYB9AD6AAcA\
DwAXAAA2FBYyNjQmIgI0NjIWFAYiNiImNDYyFhQteKp4eKqlktCSktCBMiMjMiNVqnh4qnj+y9CS\
ktCSviMyIyMyAAACAAD/BgH0APoABwAPAAA2FBYyNjQmIgI0NjIWFAYiLXiqeHiqpZLQkpLQVap4\
eKp4/svQkpLQkgAAAAADAAD+ogH0AV4AEQAXAB0AABMzFR4BFRQGBxUjNS4BNTQ2NxkBDgEUFhc+\
ATQmJ+QtYIODYC1ghINhTmlpe01paU0BXmQKjmJhjwpkZQiPYmOOCP47AZgIdZ51CAh2nHYIAAAA\
AgAA/wYB0gD6ACEAKQAAJRYVFAcGIyInJiMiBhQWMzI3NjMyFxYVFAcGIyImNDYzMgIiJjQ2MhYU\
Ac8CCwUGDQozd1V4eFV4MgYSBwMMA0CVaJKSaJR7MiMjMiOCBgQPBgMOX3iqeF8NAgcMBgZ4ktCS\
/sojMiMjMgAAAAEAAP8GAdIA+gAhAAAlFhUUBwYjIicmIyIGFBYzMjc2MzIXFhUUBwYjIiY0NjMy\
Ac8CCwUGDQozd1V4eFV4MgYSBwMMA0CVaJKSaJSCBgQPBgMOX3iqeF8NAgcMBgZ4ktCSAAACAAD+\
ogHSAV4AJAAqAAAlFhcWFRQHBiMiJyYnETY3NjMyFxYVFAcGBxUjNS4BNTQ2NzUzAxEOARQWARGE\
OgILBQYNCi1mZS4GEgcDDAM8gi1ghINhLS1OaWn5Cm0GBA8GAw5UCv5oB1cNAgcMBgZwB2VlCI9i\
Y44IZf3WAZgIdZ51AAABAAD/xAB4ADwABwAAFiImNDYyFhRVMiMjMiM8IzIjIzIAAAABAAD+ogAt\
AV4AAwAAExEjES0tAV79RAK8AAAAAgAA/RIBSgC+AAMADwAANxUhNSUzFSE1MxEjESEVIx4BDv7U\
HgEOHh7+8h5GjIx4MjL8VAJiMgABAAAAAAJWAXIACwAANTcXNxc3FwEnBycHiVRWUq8i/vxUVlM1\
Qblzc3HpFv6kdHRwRwAAAf/oAL0BEgE3ABcAACY+ATMyFjI3NjMyFRQOASMiJiIHBiMiNRgwIRwU\
VSgUAwcOMCEcFFUoFAQHDfYwET0UAwcMMBE9FAQIAAAAAAIAAP+JAcIAiwALABMAAAU0JiMiBhUU\
FjMyPgEUBiImNDYyAVFaNiA0XTchL3F9yH19yBQ0TycfNEwjdGxLS2xLAAAAAgAA/2wBSAKoAA0A\
HAAAJSYjIgYVFBcWMzI2NTQTMxEUBiMiJyY1NDYzMhcBJA0lPJcGCyY8lwIdfkhPJA9+SEAkRBdh\
KwoJF2ErCQJu/W5DZ0MeHUNnLQAAAAABAAD/eQFAAqgADQAAATMRFAYjIiY1NDYzMhcBIh55WTI8\
elgxHwKo/YBGaTgnRWocAAAAAQAA/3kCCgKoABoAAAERFAYjIiY1NDYzMhcRNTMeBBUUBzY1NAFA\
eVkyPHpYMR8eBi45OCUyEgG5/m9GaTgnRWocAU7vNVxHTnVJSHJBSe8AAAAAAgAA/3kCCwKoAB8A\
KAAAJTURMx4EFRQHFhUUBzY1NCYjERQGIyImNTQ2MzITHgEXNDY1NCYBIh4JMDg2IxUWIgV2OHlZ\
Mjx6WDE9DoUbAXZr5gFXJEc7QlgzJTIwJC5BGSFfnv7WRmk4J0VqAXY7ojUDDgNfnwAAAQAA/84A\
ZAAyAAcAABYiJjQ2MhYURyodHSodMh0qHR0qAAAAAAAOAK4AAQAAAAAAAACDAQgAAQAAAAAAAQAH\
AZwAAQAAAAAAAgAHAbQAAQAAAAAAAwAgAf4AAQAAAAAABAAHAi8AAQAAAAAABQAJAksAAQAAAAAA\
BgAHAmUAAwABBAkAAAEGAAAAAwABBAkAAQAOAYwAAwABBAkAAgAOAaQAAwABBAkAAwBAAbwAAwAB\
BAkABAAOAh8AAwABBAkABQASAjcAAwABBAkABgAOAlUAQwBvAHAAeQByAGkAZwBoAHQAIABcADIA\
NQAxACAAMgAwADEAOAAtADIAMAAxADkAIABKAGUAYQBuAC0ARgByAGEAbgBjAG8AaQBzACAATQBv\
AGkAbgBlAC4AIABUAGgAaQBzACAAZgBvAG4AdAAgAGkAcwAgAGwAaQBjAGUAbgBzAGUAZAAgAHUA\
bgBkAGUAcgAgAHQAaABlACAAUwBJAEwAIABPAHAAZQBuACAARgBvAG4AdAAgAEwAaQBjAGUAbgBz\
AGUAIABcACgAaAB0AHQAcAA6AC8ALwBzAGMAcgBpAHAAdABzAC4AcwBpAGwALgBvAHIAZwAvAE8A\
RgBMAFwAKQAuAABDb3B5cmlnaHQgXDI1MSAyMDE4LTIwMTkgSmVhbi1GcmFuY29pcyBNb2luZS4g\
VGhpcyBmb250IGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBTSUwgT3BlbiBGb250IExpY2Vuc2UgXCho\
dHRwOi8vc2NyaXB0cy5zaWwub3JnL09GTFwpLgAAYQBiAGMAMgBzAHYAZwAAYWJjMnN2ZwAAUgBl\
AGcAdQBsAGEAcgAAUmVndWxhcgAARgBvAG4AdABGAG8AcgBnAGUAIAA6ACAAYQBiAGMAMgBzAHYA\
ZwAgADoAIAAyADgALQAxADAALQAyADAAMQA5AABGb250Rm9yZ2UgOiBhYmMyc3ZnIDogMjgtMTAt\
MjAxOQAAYQBiAGMAMgBzAHYAZwAAYWJjMnN2ZwAAVgBlAHIAcwBpAG8AbgAgACAAAFZlcnNpb24g\
IAAAYQBiAGMAMgBzAHYAZwAAYWJjMnN2ZwAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\
AAAAkgAAAAEAAgECAAMBAwEEAQUBBgEHAQgBCQEKAQsBDAENAQ4BDwEQAREBEgETARQBFQEWARcB\
GAEZARoBGwEcAR0BHgEfASABIQEiASMBJAElASYBJwEoASkBKgErASwBLQEuAS8BMAExATIBMwE0\
ATUBNgE3ATgBOQE6ATsBPAE9AT4BPwFAAUEBQgFDAUQBRQFGAUcBSAFJAUoBSwFMAU0BTgFPAVAB\
UQFSAVMBVAFVAVYBVwFYAVkBWgFbAVwBXQFeAV8BYAFhAWIBYwFkAWUBZgFnAWgBaQFqAWsBbAFt\
AW4BbwFwAXEBcgFzAXQBdQF2AXcBeAF5AXoBewF8AX0BfgF/AYABgQGCAYMBhAGFAYYBhwGIAYkB\
igGLAYwBjQGOAY8GLm5vZGVmB3VuaUUwMDAHdW5pRTAyMgd1bmlFMDIzB3VuaUUwMjQHdW5pRTAz\
MAd1bmlFMDM4B3VuaUUwMzkHdW5pRTA0Mwd1bmlFMDQ1B3VuaUUwNDYHdW5pRTA0Nwd1bmlFMDQ4\
B3VuaUUwNTAHdW5pRTA1Qwd1bmlFMDYyB3VuaUUwNjkHdW5pRTA3QQd1bmlFMDdCB3VuaUUwN0MH\
dW5pRTA3RAd1bmlFMDgwB3VuaUUwODEHdW5pRTA4Mgd1bmlFMDgzB3VuaUUwODQHdW5pRTA4NQd1\
bmlFMDg2B3VuaUUwODcHdW5pRTA4OAd1bmlFMDg5B3VuaUUwOEEHdW5pRTA4Qgd1bmlFMDhDB3Vu\
aUUwOTQHdW5pRTA5NQd1bmlFMEEwB3VuaUUwQTEHdW5pRTBBMgd1bmlFMEEzB3VuaUUwQTQHdW5p\
RTBBOQd1bmlFMEIzB3VuaUUxMDEHdW5pRTFCOQd1bmlFMUJCB3VuaUUxRTcHdW5pRTFGMgd1bmlF\
MUY0B3VuaUUxRjcHdW5pRTFGOQd1bmlFMUZDB3VuaUUxRkUHdW5pRTFGRgd1bmlFMjAwB3VuaUUy\
NDAHdW5pRTI0MQd1bmlFMjQyB3VuaUUyNDMHdW5pRTI0NAd1bmlFMjQ1B3VuaUUyNDYHdW5pRTI0\
Nwd1bmlFMjQ4B3VuaUUyNDkHdW5pRTI2MAd1bmlFMjYxB3VuaUUyNjIHdW5pRTI2Mwd1bmlFMjY0\
B3VuaUUyODAHdW5pRTI4MQd1bmlFMjgyB3VuaUUyODMHdW5pRTRBMAd1bmlFNEEyB3VuaUU0QTQH\
dW5pRTRBOAd1bmlFNEFDB3VuaUU0QzAHdW5pRTRDRQd1bmlFNEUxB3VuaUU0RTIHdW5pRTRFMwd1\
bmlFNEU0B3VuaUU0RTUHdW5pRTRFNgd1bmlFNEU3B3VuaUU0RTgHdW5pRTRFOQd1bmlFNEVBB3Vu\
aUU0RUUHdW5pRTUwMAd1bmlFNTAxB3VuaUU1MjAHdW5pRTUyMQd1bmlFNTIyB3VuaUU1MjMHdW5p\
RTUyNAd1bmlFNTI1B3VuaUU1MjkHdW5pRTUyQQd1bmlFNTJCB3VuaUU1MkMHdW5pRTUyRAd1bmlF\
NTJGB3VuaUU1MzAHdW5pRTUzMQd1bmlFNTM5B3VuaUU1NjYHdW5pRTU2Nwd1bmlFNTY5B3VuaUU1\
NkMHdW5pRTU2RAd1bmlFNTgyB3VuaUU1RDAHdW5pRTVFMgd1bmlFNjEwB3VuaUU2MTIHdW5pRTYx\
NAd1bmlFNjE4B3VuaUU2MjQHdW5pRTYzMAd1bmlFNjUwB3VuaUU2NTUHdW5pRTkxMAd1bmlFOTEx\
B3VuaUU5MTIHdW5pRTkxNAd1bmlFOTE1B3VuaUU5MTgHdW5pRTkyMAd1bmlFOTI1B3VuaUU5NUQH\
dW5pRUEwMgd1bmlFQUE0B3VuaUVDQTIHdW5pRUNBMwd1bmlFQ0E1B3VuaUVDQTcHdW5pRUNBOQd1\
bmlFQ0I3AAAAAAAAAf//AAIAAQAAAAAAAAAMABQABAAAAAIAAAABAAAAAQAAAAAAAQAAAADZahND\
AAAAANGXIhcAAAAA2dy6gQ==\
") format("truetype")';
  // abc2svg - format.js - formatting functions
  //
  // Copyright (C) 2014-2020 Jean-Francois Moine
  //
  // This file is part of abc2svg-core.
  //
  // abc2svg-core is free software: you can redistribute it and/or modify
  // it under the terms of the GNU Lesser General Public License as published by
  // the Free Software Foundation, either version 3 of the License, or
  // (at your option) any later version.
  //
  // abc2svg-core is distributed in the hope that it will be useful,
  // but WITHOUT ANY WARRANTY; without even the implied warranty of
  // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  // GNU Lesser General Public License for more details.
  //
  // You should have received a copy of the GNU Lesser General Public License
  // along with abc2svg-core.  If not, see <http://www.gnu.org/licenses/>.

  var font_tb = [],
    font_st = {}, // font style => font_tb index for incomplete user fonts
    font_scale_tb = {
      serif: 1,
      serifBold: 1,
      "sans-serif": 1,
      "sans-serifBold": 1,
      Palatino: 1.1,
      monospace: 1.35,
    },
    fmt_lock = {};

  var cfmt = {
    annotationfont: { name: "sans-serif", size: 12 },
    aligncomposer: 1,
    beamslope: 0.4, // max slope of a beam
    //	botmargin: .7 * IN,		// != 1.8 * CM,
    breaklimit: 0.7,
    breakoneoln: true,
    cancelkey: true,
    composerfont: { name: "serif", style: "italic", size: 14 },
    composerspace: 6,
    //	contbarnb: false,
    dblrepbar: ":][:",
    decoerr: true,
    dynalign: true,
    footerfont: { name: "serif", size: 16 },
    fullsvg: "",
    gchordfont: { name: "sans-serif", size: 12 },
    gracespace: new Float32Array([4, 8, 11]), // left, inside, right
    graceslurs: true,
    headerfont: { name: "serif", size: 16 },
    historyfont: { name: "serif", size: 16 },
    hyphencont: true,
    indent: 0,
    infofont: { name: "serif", style: "italic", size: 14 },
    infoname:
      'R "Rhythm: "\n\
B "Book: "\n\
S "Source: "\n\
D "Discography: "\n\
N "Notes: "\n\
Z "Transcription: "\n\
H "History: "',
    infospace: 0,
    keywarn: true,
    // YYMCode: 没有边距
    leftmargin: user.no_margin_yym ? 0 : 1.4 * CM,
    // ******************/
    lineskipfac: 1.1,
    linewarn: true,
    maxshrink: 0.65, // nice scores
    maxstaffsep: 2000,
    maxsysstaffsep: 2000,
    measurefont: { name: "serif", style: "italic", size: 10 },
    measurenb: -1,
    musicfont: { name: "music", src: musicfont, size: 24 },
    musicspace: 6,
    //	notespacingfactor: 1.33
    partsfont: { name: "serif", size: 15 },
    parskipfac: 0.4,
    partsspace: 8,
    //	pageheight: 29.7 * CM,
    pagewidth: 21 * CM,
    printmargin: 0,
    // YYMCode:
    rightmargin: user.no_margin_yym ? 0 : 1.4 * CM,
    // ******************/
    rbdbstop: true,
    rbmax: 4,
    rbmin: 2,
    repeatfont: { name: "serif", size: 13 },
    scale: 1,
    slurheight: 1.0,
    staffsep: 46,
    stemheight: 21, // one octave
    stretchlast: 0.25,
    stretchstaff: true,
    subtitlefont: { name: "serif", size: 16 },
    subtitlespace: 3,
    sysstaffsep: 34,
    tempofont: { name: "serif", weight: "bold", size: 12 },
    textfont: { name: "serif", size: 16 },
    //	textoption: undefined,
    textspace: 14,
    tieheight: 1.0,
    titlefont: { name: "serif", size: 20 },
    //	titleleft: false,
    titlespace: 6,
    titletrim: true,
    //	transp: 0,			// global transpose
    //	topmargin: .7 * IN,
    topspace: 22,
    tuplets: [0, 0, 0, 0],
    vocalfont: { name: "serif", weight: "bold", size: 13 },
    vocalspace: 10,
    voicefont: { name: "serif", weight: "bold", size: 13 },
    //	voicescale: 1,
    writefields: "CMOPQsTWw",
    wordsfont: { name: "serif", size: 16 },
    wordsspace: 5,
  };

  function get_bool(param) {
    return !param || !/^(0|n|f)/i.test(param); // accept void as true !
  }

  // %%font <font> [<encoding>] [<scale>]
  function get_font_scale(param) {
    var i,
      font,
      a = info_split(param); // a[0] = font name

    if (a.length <= 1) return;
    var scale = parseFloat(a[a.length - 1]);

    if (isNaN(scale) || scale <= 0.5) {
      syntax(1, "Bad scale value in %%font");
      return;
    }
    font_scale_tb[a[0]] = scale;
  }

  // set the width factor of a font
  function set_font_fac(font) {
    var scale = font_scale_tb[font.name];

    if (!scale) scale = 1.1;
    font.swfac = font.size * scale;
  }

  // %%xxxfont fontname|* [encoding] [size|*]
  function param_set_font(xxxfont, p) {
    var font, n, a;

    // "setfont-<n>" goes to "u<n>font"
    if (xxxfont[xxxfont.length - 2] == "-") {
      n = xxxfont[xxxfont.length - 1];
      if (n < "1" || n > "9") return;
      xxxfont = "u" + n + "font";
    }

    // create a new font
    font = cfmt[xxxfont];
    if (!font) {
      // set-font-<n> or new element
      font = {};
    } else {
      font = {
        name: font.name,
        size: font.size,
        box: font.box,
      };
    }
    cfmt[xxxfont] = font;

    // fill the values
    a = p.match(/\s+(no)?box(\s|$)/);
    if (a) {
      // if box
      if (a[1]) font.box = false;
      // nobox
      else font.box = true;
      p = p.replace(a[0], a[2]);
    }

    a = p.match(/\s+class=(.*?)(\s|$)/);
    if (a) {
      font.class = a[1];
      p = p.replace(a[0], a[2]);
    }
    a = p.match(/\s+wadj=(.*?)(\s|$)/);
    if (a) {
      if (typeof document == "undefined")
        // useless if in browser
        switch (a[1]) {
          case "none":
            font.wadj = "";
            break;
          case "space":
            font.wadj = "spacing";
            break;
          case "glyph":
            font.wadj = "spacingAndGlyphs";
            break;
          default:
            syntax(1, errs.bad_val, "%%" + xxxfont);
            break;
        }
      p = p.replace(a[0], a[2]);
    }

    // the font size is the last item
    a = p.match(/\s+([0-9.]+|\*)$/);
    if (a) {
      if (a[1] != "*") font.size = Number(a[1]);
      p = p.replace(a[0], "");
    }

    a = p.match(/[- ]?[nN]ormal/);
    if (a) {
      font.normal = true;
      p = p.replace(a[0], "");
    }

    a = p.match(/[- ]?[bB]old/);
    if (a) {
      font.weight = "bold";
      p = p.replace(a[0], "");
    }
    a = p.match(/[- ]?[iI]talic/);
    if (a) {
      font.style = "italic";
      p = p.replace(a[0], "");
    }
    a = p.match(/[- ]?[oO]blique/);
    if (a) {
      font.style = "oblique";
      p = p.replace(a[0], "");
    }
    if (font.size) set_font_fac(font);
    else font.swfac = 0;
    switch (p) {
      case "":
      case "*":
        return;
      case "Times-Roman":
      case "Times":
        p = "serif";
        break;
      case "Helvetica":
        p = "sans-serif";
        break;
      case "Courier":
        p = "monospace";
        break;
    }

    // accept url(...) as the font name
    if (p[3] == "(") {
      font.src = p;
      font.fid = font_tb.length;
      font_tb.push(font);
      p = "ft" + font.fid;
    }
    font.name = p;
  }

  // get a length with a unit - return the number of pixels
  function get_unit(param) {
    var v = param.toLowerCase().match(/([\d.]+)(.*)/);

    v[1] = Number(v[1]);
    switch (v[2]) {
      case "cm":
        return v[1] * CM;
      case "in":
        return v[1] * IN;
      case "pt": // paper point in 1/72 inch
        return v[1] * 0.75;
      case "px": // screen pixel in 1/96 inch
      case "":
        return v[1];
    }
    return NaN;
  }

  // set the infoname
  function set_infoname(param) {
    //fixme: check syntax: '<letter> ["string"]'
    var tmp = cfmt.infoname.split("\n"),
      letter = param[0];

    for (var i = 0; i < tmp.length; i++) {
      var infoname = tmp[i];
      if (infoname[0] != letter) continue;
      if (param.length == 1) tmp.splice(i, 1);
      else tmp[i] = param;
      cfmt.infoname = tmp.join("\n");
      return;
    }
    cfmt.infoname += "\n" + param;
  }

  // get the text option
  var textopt = {
    align: "j",
    center: "c",
    fill: "f",
    justify: "j",
    ragged: "f",
    right: "r",
    skip: "s",
  };
  function get_textopt(param) {
    return textopt[param];
  }

  /* -- position of a voice element -- */
  var posval = {
    above: C.SL_ABOVE,
    auto: 0, // !! not C.SL_AUTO !!
    below: C.SL_BELOW,
    down: C.SL_BELOW,
    hidden: C.SL_HIDDEN,
    opposite: C.SL_HIDDEN,
    under: C.SL_BELOW,
    up: C.SL_ABOVE,
  };

  /* -- set the position of elements in a voice -- */
  function set_pos(k, v) {
    // keyword, value
    k = k.slice(0, 3);
    if (k == "ste") k = "stm";
    set_v_param("pos", k + " " + v);
  }

  // set/unset the fields to write
  function set_writefields(parm) {
    var c,
      i,
      a = parm.split(/\s+/);

    if (get_bool(a[1])) {
      for (i = 0; i < a[0].length; i++) {
        // set
        c = a[0][i];
        if (cfmt.writefields.indexOf(c) < 0) cfmt.writefields += c;
      }
    } else {
      for (i = 0; i < a[0].length; i++) {
        // unset
        c = a[0][i];
        if (cfmt.writefields.indexOf(c) >= 0)
          cfmt.writefields = cfmt.writefields.replace(c, "");
      }
    }
  }

  // set a voice specific parameter
  function set_v_param(k, v) {
    k = [k + "=", v];
    if (curvoice) set_kv_parm(k);
    else memo_kv_parm("*", k);
  }

  function set_page() {
    if (!img.chg) return;
    img.chg = false;
    img.lm = cfmt.leftmargin - cfmt.printmargin;
    if (img.lm < 0) img.lm = 0;
    img.rm = cfmt.rightmargin - cfmt.printmargin;
    if (img.rm < 0) img.rm = 0;
    img.width = cfmt.pagewidth - 2 * cfmt.printmargin;

    // must have 100pt at least as the staff width
    if (img.width - img.lm - img.rm < 100) {
      error(0, undefined, "Bad staff width");
      img.width = img.lm + img.rm + 150;
    }
    set_posx();
  } // set_page()

  // set a format parameter
  // (possible hook)
  Abc.prototype.set_format = function (cmd, param) {
    var f, f2, v, i;

    //fixme: should check the type and limits of the parameter values
    if (/.+font(-[\d])?$/.test(cmd)) {
      param_set_font(cmd, param);
      return;
    }

    switch (cmd) {
      case "aligncomposer":
      case "barsperstaff":
      case "infoline":
      case "measurenb":
      case "rbmax":
      case "rbmin":
      case "shiftunison":
        v = parseInt(param);
        if (isNaN(v)) {
          syntax(1, "Bad integer value");
          break;
        }
        cfmt[cmd] = v;
        break;
      case "bgcolor":
      case "fgcolor":
      case "dblrepbar":
      case "titleformat":
        cfmt[cmd] = param;
        break;
      case "beamslope":
      case "breaklimit": // float values
      case "lineskipfac":
      case "maxshrink":
      case "pagescale":
      case "parskipfac":
      case "scale":
      case "slurheight":
      case "stemheight":
      case "stretchlast":
      case "tieheight":
        f = parseFloat(param);
        if (isNaN(f)) {
          syntax(1, errs.bad_val, "%%" + cmd);
          break;
        }
        switch (cmd) {
          case "scale": // old scale
            f /= 0.75;
          case "pagescale":
            cmd = "scale";
            img.chg = true;
            break;
        }
        cfmt[cmd] = f;
        break;
      case "annotationbox":
      case "gchordbox":
      case "measurebox":
      case "partsbox":
        cfmt[cmd.replace("box", "font")].box = get_bool(param); // font
        break;
      case "bstemdown":
      case "breakoneoln":
      case "cancelkey":
      case "contbarnb":
      case "custos":
      case "decoerr":
      case "dynalign":
      case "flatbeams":
      case "graceslurs":
      case "graceword":
      case "hyphencont":
      case "keywarn":
      case "linewarn":
      case "quiet":
      case "rbdbstop":
      case "singleline":
      case "squarebreve":
      case "splittune":
      case "straightflags":
      case "stretchstaff":
      case "timewarn":
      case "titlecaps":
      case "titleleft":
        cfmt[cmd] = get_bool(param);
        break;
      case "chordnames":
        v = param.split(",");
        cfmt.chordnames = {};
        for (i = 0; i < v.length; i++) cfmt.chordnames["CDEFGAB"[i]] = v[i];
        break;
      case "composerspace":
      case "indent":
      case "infospace":
      case "maxstaffsep":
      case "maxsysstaffsep":
      case "musicspace":
      case "partsspace":
      case "staffsep":
      case "subtitlespace":
      case "sysstaffsep":
      case "textspace":
      case "titlespace":
      case "topspace":
      case "vocalspace":
      case "wordsspace":
        f = get_unit(param); // normally, unit in points - 72 DPI accepted
        if (isNaN(f)) syntax(1, errs.bad_val, "%%" + cmd);
        else cfmt[cmd] = f;
        break;
      case "print-leftmargin": // to remove
        syntax(0, "$1 is deprecated - use %%printmargin instead", "%%" + cmd);
        cmd = "printmargin";
      // fall thru
      case "printmargin":
      //	case "botmargin":
      case "leftmargin":
      //	case "pageheight":
      case "pagewidth":
      case "rightmargin":
        //	case "topmargin":
        f = get_unit(param); // normally unit in cm or in - 96 DPI
        if (isNaN(f)) {
          syntax(1, errs.bad_val, "%%" + cmd);
          break;
        }
        cfmt[cmd] = f;
        img.chg = true;
        break;
      case "concert-score":
        if (cfmt.sound != "play") cfmt.sound = "concert";
        break;
      case "writefields":
        set_writefields(param);
        break;
      case "dynamic":
      case "gchord":
      case "gstemdir":
      case "ornament":
      case "stemdir":
      case "vocal":
      case "volume":
        set_pos(cmd, param);
        break;
      case "font":
        get_font_scale(param);
        break;
      case "fullsvg":
        if (parse.state != 0) {
          syntax(1, errs.not_in_tune, "%%fullsvg");
          break;
        }
        //fixme: should check only alpha, num and '_' characters
        cfmt[cmd] = param;
        break;
      case "gracespace":
        v = param.split(/\s+/);
        for (i = 0; i < 3; i++)
          if (isNaN(Number(v[i]))) {
            syntax(1, errs.bad_val, "%%gracespace");
            break;
          }
        for (i = 0; i < 3; i++) cfmt[cmd][i] = Number(v[i]);
        break;
      case "tuplets":
        cfmt[cmd] = param.split(/\s+/);
        v = cfmt[cmd][3];
        if (
          v && // if 'where'
          posval[v]
        )
          // translate the keyword
          cfmt[cmd][3] = posval[v];
        break;
      case "infoname":
        set_infoname(param);
        break;
      case "notespacingfactor":
        f = parseFloat(param);
        if (isNaN(f) || f < 1 || f > 2) {
          syntax(1, errs.bad_val, "%%" + cmd);
          break;
        }
        i = 5; // index of crotchet
        f2 = space_tb[i];
        for (; --i >= 0; ) {
          f2 /= f;
          space_tb[i] = f2;
        }
        i = 5;
        f2 = space_tb[i];
        for (; ++i < space_tb.length; ) {
          f2 *= f;
          space_tb[i] = f2;
        }
        break;
      case "play":
        cfmt.sound = "play"; // without clef
        break;
      case "pos":
        cmd = param.split(/\s+/);
        set_pos(cmd[0], cmd[1]);
        break;
      case "sounding-score":
        if (cfmt.sound != "play") cfmt.sound = "sounding";
        break;
      case "staffwidth":
        v = get_unit(param);
        if (isNaN(v)) {
          syntax(1, errs.bad_val, "%%" + cmd);
          break;
        }
        if (v < 100) {
          syntax(1, "%%staffwidth too small");
          break;
        }
        v = cfmt.pagewidth - v - cfmt.leftmargin;
        if (v < 2) {
          syntax(1, "%%staffwidth too big");
          break;
        }
        cfmt.rightmargin = v;
        img.chg = true;
        break;
      case "textoption":
        cfmt[cmd] = get_textopt(param);
        break;
      case "titletrim":
        v = Number(param);
        if (isNaN(v)) cfmt[cmd] = get_bool(param);
        else cfmt[cmd] = v;
        break;
      case "combinevoices":
        syntax(1, "%%combinevoices is deprecated - use %%voicecombine instead");
        break;
      case "voicemap":
        set_v_param("map", param);
        break;
      case "voicescale":
        set_v_param("scale", param);
        break;
      default:
        // memorize all global commands
        if (parse.state == 0)
          // (needed for modules)
          cfmt[cmd] = param;
        break;
    }
  };

  // font stuff

  // build a font style
  function st_font(font) {
    var n = font.name,
      r = "";

    if (font.weight) r += font.weight + " ";
    if (font.style) r += font.style + " ";
    if (n.indexOf('"') < 0 && n.indexOf(" ") > 0) n = '"' + n + '"';
    return r + font.size.toFixed(1) + "px " + n;
  }
  function style_font(font) {
    return "font:" + st_font(font);
  }
  Abc.prototype.style_font = style_font;

  // build a font class
  function font_class(font) {
    if (font.class) return "f" + font.fid + cfmt.fullsvg + " " + font.class;
    return "f" + font.fid + cfmt.fullsvg;
  }

  // use the font
  function use_font(font) {
    if (!font.used) {
      font.used = true;
      if (font.fid == undefined) {
        // if default font
        font.fid = font_tb.length;
        font_tb.push(font);
        if (!font.swfac) set_font_fac(font);
      }
      font_style +=
        "\n.f" + font.fid + cfmt.fullsvg + "{" + style_font(font) + "}";
      if (font.src)
        font_style +=
          "\n@font-face{\n\
 font-family:" +
          font.name +
          ";\n\
 src:" +
          font.src +
          "}";
    }
  }

  // get the font of the 'xxxfont' parameter
  function get_font(fn) {
    var font, font2, fid, st;

    fn += "font";
    font = cfmt[fn];
    if (!font) {
      syntax(1, "Unknown font $1", "$" + fn[1]);
      return gene.curfont;
    }

    if (!font.name || !font.size) {
      // if incomplete user font
      font2 = Object.create(gene.curfont);
      if (font.name) font2.name = font.name;
      if (font.normal) {
        if (font2.weight)
          // !! don't use delete !!
          font2.weight = null;
        if (font2.style) font2.style = null;
      } else {
        if (font.weight) font2.weight = font.weight;
        if (font.style) font2.style = font.style;
      }
      //		if (font.class)
      //			font2.class = font.class
      if (font.size) font2.size = font.size;
      st = st_font(font2);
      if (font.class) {
        font2.class = font.class;
        st += " " + font.class;
      }
      fid = font_st[st];
      if (fid != undefined) return font_tb[fid];
      font_st[st] = font_tb.length; // will be the font id
      font2.fid = font2.used = undefined;
      font = font2;
    }
    use_font(font);
    return font;
  }
  // abc2svg - front.js - ABC parsing front-end
  //
  // Copyright (C) 2014-2020 Jean-Francois Moine
  //
  // This file is part of abc2svg-core.
  //
  // abc2svg-core is free software: you can redistribute it and/or modify
  // it under the terms of the GNU Lesser General Public License as published by
  // the Free Software Foundation, either version 3 of the License, or
  // (at your option) any later version.
  //
  // abc2svg-core is distributed in the hope that it will be useful,
  // but WITHOUT ANY WARRANTY; without even the implied warranty of
  // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  // GNU Lesser General Public License for more details.
  //
  // You should have received a copy of the GNU Lesser General Public License
  // along with abc2svg-core.  If not, see <http://www.gnu.org/licenses/>.

  var sav = {}, // save global (between tunes) definitions
    mac = {}, // macros (m:)
    maci = {}; // first letters of macros

  // translation table from the ABC draft version 2.2
  var abc_utf = {
    "=D": "Đ",
    "=H": "Ħ",
    "=T": "Ŧ",
    "=d": "đ",
    "=h": "ħ",
    "=t": "ŧ",
    "/O": "Ø",
    "/o": "ø",
    //	"/D": "Đ",
    //	"/d": "đ",
    "/L": "Ł",
    "/l": "ł",
    vL: "Ľ",
    vl: "ľ",
    vd: "ď",
    ".i": "ı",
    AA: "Å",
    aa: "å",
    AE: "Æ",
    ae: "æ",
    DH: "Ð",
    dh: "ð",
    //	"ng": "ŋ",
    OE: "Œ",
    oe: "œ",
    ss: "ß",
    TH: "Þ",
    th: "þ",
  };

  // accidentals as octal values (abcm2ps compatibility)
  var oct_acc = {
    "1": "\u266f",
    "2": "\u266d",
    "3": "\u266e",
    "4": "&#x1d12a;",
    "5": "&#x1d12b;",
  };

  // convert the escape sequences to utf-8
  function cnv_escape(src, flag) {
    var c,
      c2,
      dst = "",
      i,
      j = 0;

    while (1) {
      i = src.indexOf("\\", j);
      if (i < 0) break;
      dst += src.slice(j, i);
      c = src[++i];
      if (!c) return dst + "\\";
      switch (c) {
        case "0":
        case "2":
          if (src[i + 1] != "0") break;
          c2 = oct_acc[src[i + 2]];
          if (c2) {
            dst += c2;
            j = i + 3;
            continue;
          }
          break;
        case "u":
          j = Number("0x" + src.slice(i + 1, i + 5));
          if (isNaN(j) || j < 0x20) {
            dst += src[++i] + "\u0306"; // breve accent
            j = i + 1;
            continue;
          }
          c = String.fromCharCode(j);
          if (c == "\\") {
            i += 4;
            break;
          }
          dst += c;
          j = i + 5;
          continue;
        case "t": // TAB
          dst += " ";
          j = i + 1;
          continue;
        default:
          c2 = abc_utf[src.slice(i, i + 2)];
          if (c2) {
            dst += c2;
            j = i + 2;
            continue;
          }

          // try unicode combine characters
          c2 = src[i + 1];
          if (!/[A-Za-z]/.test(c2)) break;
          switch (c) {
            case "`":
              dst += c2 + "\u0300"; // grave
              j = i + 2;
              continue;
            case "'":
              dst += c2 + "\u0301"; // acute
              j = i + 2;
              continue;
            case "^":
              dst += c2 + "\u0302"; // circumflex
              j = i + 2;
              continue;
            case "~":
              dst += c2 + "\u0303"; // tilde
              j = i + 2;
              continue;
            case "=":
              dst += c2 + "\u0304"; // macron
              j = i + 2;
              continue;
            case "_":
              dst += c2 + "\u0305"; // overline
              j = i + 2;
              continue;
            case ".":
              dst += c2 + "\u0307"; // dot
              j = i + 2;
              continue;
            case '"':
              dst += c2 + "\u0308"; // dieresis
              j = i + 2;
              continue;
            case "o":
              dst += c2 + "\u030a"; // ring
              j = i + 2;
              continue;
            case "H":
              dst += c2 + "\u030b"; // hungarumlaut
              j = i + 2;
              continue;
            case "v":
              dst += c2 + "\u030c"; // caron
              j = i + 2;
              continue;
            //			case ',':
            //				dst += c2 + "\u0326"	// comma below
            //				j = i + 2
            //				continue
            case "c":
              dst += c2 + "\u0327"; // cedilla
              j = i + 2;
              continue;
            case ";":
              dst += c2 + "\u0328"; // ogonek
              j = i + 2;
              continue;
          }
          break;
      }
      if (flag == "w") dst += "\\";
      dst += c;
      j = i + 1;
    }
    return dst + src.slice(j);
  }

  // ABC include
  var include = 0;

  function do_include(fn) {
    var file, parse_sav;

    if (!user.read_file) {
      syntax(1, "No read_file support");
      return;
    }
    if (include > 2) {
      syntax(1, "Too many include levels");
      return;
    }
    file = user.read_file(fn);
    if (!file) {
      syntax(1, "Cannot read file '$1'", fn);
      return;
    }
    include++;
    parse_sav = clone(parse);
    tosvg(fn, file);
    parse_sav.state = parse.state;
    parse = parse_sav;
    include--;
  }
  // YYMComment: 由外部js调用
  // parse ABC code
  function tosvg(
    in_fname, // file name
    file, // file content
    bol,
    eof
  ) {
    // beginning/end of file
    var i,
      c,
      eol,
      end,
      select,
      line0,
      line1,
      last_info,
      opt,
      text,
      a,
      b,
      s,
      pscom,
      txt_add = "\n"; // for "+:"
    // YYMCode: 读取abcString
    Abc.prototype.myfileString = file;
    // ******************/
    // check if a tune is selected
    function tune_selected() {
      var re,
        res,
        i = file.indexOf("K:", bol);

      if (i < 0) {
        //			syntax(1, "No K: in tune")
        return false;
      }
      i = file.indexOf("\n", i);
      if (parse.select.test(file.slice(parse.bol, i))) return true;
      re = /\n\w*\n/;
      re.lastIndex = i;
      res = re.exec(file);
      if (res) eol = re.lastIndex;
      else eol = eof;
      return false;
    } // tune_selected()

    // remove the comment at end of text
    // if flag, handle the escape sequences
    // if flag is 'w' (lyrics), keep the '\'s
    function uncomment(src, flag) {
      if (!src) return src;
      if (src.indexOf("%") >= 0)
        src = src.replace(/([^\\])%.*/, "$1").replace(/\\%/g, "%");
      src = src.replace(/\s+$/, "");
      if (flag && src.indexOf("\\") >= 0) return cnv_escape(src, flag);
      return src;
    } // uncomment()

    function end_tune() {
      generate();
      set_page(); // the page layout may have changed
      if (info.W) put_words(info.W);
      put_history();
      parse.state = 0; // file header
      blk_flush(); // (force end of block)
      cfmt = sav.cfmt;
      info = sav.info;
      char_tb = sav.char_tb;
      glovar = sav.glovar;
      maps = sav.maps;
      mac = sav.mac;
      maci = sav.maci;
      parse.tune_v_opts = null;
      parse.scores = null;
      init_tune();
      img.chg = true;
      set_page();
    } // end_tune()

    // get %%voice
    function do_voice(select, in_tune) {
      var opt, bol;
      if (select == "end") return; // end of previous %%voice

      // get the options
      if (in_tune) {
        if (!parse.tune_v_opts) parse.tune_v_opts = {};
        opt = parse.tune_v_opts;
      } else {
        if (!parse.voice_opts) parse.voice_opts = {};
        opt = parse.voice_opts;
      }
      opt[select] = [];
      while (1) {
        bol = ++eol;
        if (file[bol] != "%") break;
        eol = file.indexOf("\n", eol);
        if (file[bol + 1] != line1) continue;
        bol += 2;
        if (eol < 0) text = file.slice(bol);
        else text = file.slice(bol, eol);
        a = text.match(/\S+/);
        switch (a[0]) {
          default:
            opt[select].push(uncomment(text, true));
            continue;
          case "score":
          case "staves":
          case "tune":
          case "voice":
            bol -= 2;
            break;
        }
        break;
      }
      eol = parse.eol = bol - 1;
    } // do_voice()

    // apply the options to the current tune
    function tune_filter() {
      var o,
        opts,
        j,
        pc,
        h,
        i = file.indexOf("K:", bol);

      i = file.indexOf("\n", i);
      h = file.slice(parse.bol, i); // tune header

      for (i in parse.tune_opts) {
        if (!parse.tune_opts.hasOwnProperty(i)) continue;
        if (!new RegExp(i).test(h)) continue;
        opts = parse.tune_opts[i];
        for (j = 0; j < opts.t_opts.length; j++) {
          pc = opts.t_opts[j];
          switch (pc.match(/\S+/)[0]) {
            case "score":
            case "staves":
              if (!parse.scores) parse.scores = [];
              parse.scores.push(pc);
              break;
            default:
              self.do_pscom(pc);
              break;
          }
        }
        opts = opts.v_opts;
        if (!opts) continue;
        for (j in opts) {
          if (!opts.hasOwnProperty(j)) continue;
          if (!parse.tune_v_opts) parse.tune_v_opts = {};
          if (!parse.tune_v_opts[j]) parse.tune_v_opts[j] = opts[j];
          else parse.tune_v_opts[j] = parse.tune_v_opts[j].concat(opts[j]);
        }
      }
    } // tune_filter()

    // export functions and/or set module hooks
    if (
      abc2svg.modules &&
      (abc2svg.modules.hooks.length || abc2svg.modules.g_hooks.length)
    )
      set_hooks();

    // initialize
    parse.file = file; // used for errors
    parse.fname = in_fname;

    // scan the file
    if (bol == undefined) bol = 0;
    // YYMComment: eof代表着 该abcStr的长度
    if (!eof) eof = file.length;
    for (; bol < eof; bol = parse.eol + 1) {
      // YYMComment: 每一个字段
      eol = file.indexOf("\n", bol); // get a line
      if (eol < 0 || eol > eof) eol = eof;
      parse.eol = eol;
      // YYMComment: 从改行最后一个开始到这查看, 一直到不是“ ” 和 tab 换行符为止
      // remove the ending white spaces
      while (1) {
        eol--;
        switch (file[eol]) {
          case " ":
          case "\t":
            continue;
        }
        break;
      }
      eol++;
      if (eol == bol) {
        // empty line
        if (parse.state == 1) {
          parse.istart = bol;
          syntax(1, "Empty line in tune header - ignored");
        } else if (parse.state >= 2) {
          end_tune();
          if (parse.select) {
            // skip to next tune
            eol = file.indexOf("\nX:", parse.eol);
            if (eol < 0) eol = eof;
            parse.eol = eol;
          }
        }
        continue;
      }
      //YYMComment: 读取每一行, 并设置每一行的开始结束位置
      parse.istart = parse.bol = bol;
      parse.iend = eol;
      parse.line.index = 0;

      // check if the line is a pseudo-comment or I:
      line0 = file[bol];
      line1 = file[bol + 1];
      // YYMComment:  如果 abcStr 是 指令

      if (line0 == "%") {
        if (parse.prefix.indexOf(line1) < 0) continue; // comment

        // change "%%abc xxxx" to "xxxx"
        if (
          file[bol + 2] == "a" &&
          file[bol + 3] == "b" &&
          file[bol + 4] == "c" &&
          file[bol + 5] == " "
        ) {
          bol += 6;
          line0 = file[bol];
          line1 = file[bol + 1];
        } else {
          pscom = true;
        }
      } else if (line0 == "I" && line1 == ":") {
        // YYMComment: 说明就是 linkebreak 是拿什么来换行

        pscom = true;
      }
      // YYMComment: 如果是滑换行符表示, 那么就要通知他们这个是一个换行符
      // YYMComment: I:$ 告诉他们$是一个换行符号
      // pseudo-comments
      if (pscom) {
        pscom = false;
        bol += 2; // skip %%/I:
        text = file.slice(bol, eol);
        a = text.match(/([^\s]+)\s*(.*)/);
        if (!a || a[1][0] == "%") continue;
        switch (a[1]) {
          case "abcm2ps":
          case "ss-pref":
            parse.prefix = a[2]; // may contain a '%'
            continue;
          case "abc-include":
            do_include(uncomment(a[2]));
            continue;
        }

        // beginxxx/endxxx
        if (a[1].slice(0, 5) == "begin") {
          b = a[1].substr(5);
          end = "\n" + line0 + line1 + "end" + b;
          i = file.indexOf(end, eol);
          if (i < 0) {
            syntax(1, "No $1 after %%$2", end.slice(1), a[1]);
            parse.eol = eof;
            continue;
          }
          self.do_begin_end(
            b,
            uncomment(a[2]),
            file
              .slice(eol + 1, i)
              .replace(new RegExp("^" + line0 + line1, "gm"), "")
          );
          parse.eol = file.indexOf("\n", i + 6);
          if (parse.eol < 0) parse.eol = eof;
          continue;
        }
        switch (a[1]) {
          case "select":
            if (parse.state != 0) {
              syntax(1, errs.not_in_tune, "%%select");
              continue;
            }
            select = uncomment(text.slice(7));
            if (select[0] == '"') select = select.slice(1, -1);
            if (!select) {
              delete parse.select;
              continue;
            }
            select = select.replace(/\(/g, "\\(");
            select = select.replace(/\)/g, "\\)");
            //				select = select.replace(/\|/g, '\\|');
            parse.select = new RegExp(select, "m");
            continue;
          case "tune":
            if (parse.state != 0) {
              syntax(1, errs.not_in_tune, "%%tune");
              continue;
            }
            select = uncomment(a[2]);

            // if void %%tune, free all tune options
            if (!select) {
              parse.tune_opts = {};
              continue;
            }

            if (select == "end") continue; // end of previous %%tune

            if (!parse.tune_opts) parse.tune_opts = {};
            parse.tune_opts[select] = opt = {
              t_opts: [],
              //						v_opts: {}
            };
            while (1) {
              bol = ++eol;
              if (file[bol] != "%") break;
              eol = file.indexOf("\n", eol);
              if (file[bol + 1] != line1) continue;
              bol += 2;
              if (eol < 0) text = file.slice(bol);
              else text = file.slice(bol, eol);
              a = text.match(/([^\s]+)\s*(.*)/);
              switch (a[1]) {
                case "tune":
                  break;
                case "voice":
                  do_voice(uncomment(a[2], true), true);
                  continue;
                default:
                  opt.t_opts.push(uncomment(text, true));
                  continue;
              }
              break;
            }
            if (parse.tune_v_opts) {
              opt.v_opts = parse.tune_v_opts;
              parse.tune_v_opts = null;
            }
            parse.eol = bol - 1;
            continue;
          case "voice":
            if (parse.state != 0) {
              syntax(1, errs.not_in_tune, "%%voice");
              continue;
            }
            select = uncomment(a[2]);

            /* if void %%voice, free all voice options */
            if (!select) {
              parse.voice_opts = null;
              continue;
            }

            do_voice(select);
            continue;
        }
        self.do_pscom(uncomment(text, true));
        continue;
      }
      // YYMComment: 如果第二个char 不是 : 或者不是 a-z里面的字母的话, 进到这里面说到进入正文了
      // music line (or free text)
      if (line1 != ":" || !/[A-Za-z+]/.test(line0)) {
        last_info = undefined;
        // YYMComment: "某种情况" 就 跳过这行
        if (parse.state < 2) continue;
        // YYMComment: 如果不是 就继续读取改行
        parse.line.buffer = uncomment(file.slice(bol, eol));
        if (parse.line.buffer) parse_music_line();
        continue;
      }
      // YYMComment: bol代表已经读取过的字符, 因为读了 line0 和line 所以这个时候继续读, 知道读到 空格 或者 换行

      // information fields
      bol += 2;
      while (1) {
        switch (file[bol]) {
          // YYMComment: 如果读到的char 是 " " 或者是 tab换行符号,就一致往下读取下一个字符, 如果不是则就打断
          case " ":
          case "\t":
            bol++;
            continue;
        }
        break;
      }
      if (line0 == "+") {
        if (!last_info) {
          syntax(1, "+: without previous info field");
          continue;
        }
        txt_add = " "; // concatenate
        line0 = last_info;
      }
      text = uncomment(file.slice(bol, eol), line0);

      switch (line0) {
        case "X": // start of tune
          if (parse.state != 0) {
            syntax(1, errs.ignored, line0);
            continue;
          }
          if (parse.select && !tune_selected()) {
            // skip to the next tune
            eol = file.indexOf("\nX:", parse.eol);
            if (eol < 0) eol = eof;
            parse.eol = eol;
            continue;
          }

          sav.cfmt = clone(cfmt);
          sav.info = clone(info, 2); // (level 2 for info.V[])
          sav.char_tb = clone(char_tb);
          sav.glovar = clone(glovar);
          sav.maps = clone(maps, 1);
          sav.mac = clone(mac);
          sav.maci = clone(maci);
          info.X = text;
          parse.state = 1; // tune header
          if (blkdiv < 1)
            // (if no newpage)
            blkdiv = 1; // the tune starts by the next SVG
          if (parse.tune_opts) tune_filter();
          continue;
        case "T":
          switch (parse.state) {
            case 0:
              continue;
            case 1:
            case 2:
              if (info.T == undefined)
                // (keep empty T:)
                info.T = text;
              else info.T += "\n" + text;
              continue;
          }
          s = new_block("title");
          s.text = text;
          continue;
        case "K":
          switch (parse.state) {
            case 0:
              continue;
            case 1: // tune header
              info.K = text;
              break;
          }
          do_info(line0, text);
          continue;
        case "W":
          if (parse.state == 0 || cfmt.writefields.indexOf(line0) < 0) break;
          if (info.W == undefined) info.W = text;
          else info.W += txt_add + text;
          break;

        case "m":
          if (parse.state >= 2) {
            syntax(1, errs.ignored, line0);
            continue;
          }
          a = text.match(/(.*?)[= ]+(.*)/);
          if (!a || !a[2]) {
            syntax(1, errs.bad_val, "m:");
            continue;
          }
          mac[a[1]] = a[2];
          maci[a[1][0]] = true; // first letter
          break;

        // info fields in tune body only
        case "s":
          if (parse.state != 3 || cfmt.writefields.indexOf(line0) < 0) break;
          get_sym(text, txt_add == " ");
          break;
        case "w":
          if (parse.state != 3 || cfmt.writefields.indexOf(line0) < 0) break;
          get_lyrics(text, txt_add == " ");
          if (text.slice(-1) == "\\") {
            // old continuation
            txt_add = " ";
            last_info = line0;
            continue;
          }
          break;
        case "|": // "|:" starts a music line
          if (parse.state < 2) continue;
          parse.line.buffer = text;
          parse_music_line();
          continue;
        default:
          if ("ABCDFGHNOSZ".indexOf(line0) >= 0) {
            if (parse.state >= 2) {
              syntax(1, errs.ignored, line0);
              continue;
            }
            //				if (cfmt.writefields.indexOf(c) < 0)
            //					break
            if (!info[line0]) info[line0] = text;
            else info[line0] += txt_add + text;
            break;
          }

          // info field which may be embedded
          do_info(line0, text);
          continue;
      }
      txt_add = "\n";
      last_info = line0;
    }
    if (include) return;
    if (parse.state >= 2) end_tune();
    parse.state = 0;
  }
  Abc.prototype.tosvg = tosvg;
  // abc2svg - music.js - music generation
  //
  // Copyright (C) 2014-2020 Jean-Francois Moine
  //
  // This file is part of abc2svg-core.
  //
  // abc2svg-core is free software: you can redistribute it and/or modify
  // it under the terms of the GNU Lesser General Public License as published by
  // the Free Software Foundation, either version 3 of the License, or
  // (at your option) any later version.
  //
  // abc2svg-core is distributed in the hope that it will be useful,
  // but WITHOUT ANY WARRANTY; without even the implied warranty of
  // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  // GNU Lesser General Public License for more details.
  //
  // You should have received a copy of the GNU Lesser General Public License
  // along with abc2svg-core.  If not, see <http://www.gnu.org/licenses/>.

  var gene,
    staff_tb,
    nstaff, // current number of staves
    tsnext, // next line when cut
    realwidth, // real staff width while generating
    insert_meter, // insert time signature (1) and indent 1st line (2)
    spf_last, // spacing for last short line
    /* width of notes indexed by log2(note_length) */
    // YYMCode:
    measure_id = 0,
    // ******************/
    space_tb = new Float32Array([
      // factor 1.3 instead of 1.414 and crotchet 30px instead of 40px
      // change again:
      // factor 1.33 instead of 1.3 and crotchet 35px instead of 30px
      8.4,
      11.2,
      14.9,
      19.8,
      26.3,
      35,
      46.6,
      61.9,
      82.3,
      109.5,
    ]),
    smallest_duration;

  /* -- decide whether to shift heads to other side of stem on chords -- */
  /* this routine is called only once per tune */

  // distance for no overlap - index: [prev acc][cur acc]
  //var dt_tb = [
  //	[5, 5, 5, 5],		/* dble sharp */
  //	[5, 6, 6, 6],		/* sharp */
  //	[5, 6, 5, 6],		/* natural */
  //	[5, 5, 5, 5]		/* flat / dble flat */
  //]

  // accidental x offset - index = note head type
  var dx_tb = new Float32Array([
    10, // FULL
    10, // EMPTY
    11, // OVAL
    13, // OVALBARS
    15, // SQUARE
  ]);

  // head width  - index = note head type
  var hw_tb = new Float32Array([
    4.7, // FULL
    5, // EMPTY
    6, // OVAL
    7.2, // OVALBARS
    7.5, // SQUARE
  ]);

  /* head width for voice overlap - index = note head type */
  var w_note = new Float32Array([
    3.5, // FULL
    3.7, // EMPTY
    5, // OVAL
    6, // OVALBARS
    7, // SQUARE
  ]);

  // get head type, dots, flags of note/rest for a duration
  function identify_note(s, dur_o) {
    var head,
      flags,
      dots = 0,
      dur = dur_o;

    if (dur % 12 != 0) error(1, s, "Invalid note duration $1", dur);
    dur /= 12; /* see C.BLEN for values */
    if (!dur) error(1, s, "Note too short");
    for (flags = 5; dur != 0; dur >>= 1, flags--) {
      if (dur & 1) break;
    }
    dur >>= 1;
    if ((dur + 1) & dur) {
      if (s.type != C.REST || dur_o != s.p_v.wmeasure)
        error(0, s, "Non standard note duration $1", dur_o);
    }
    while (dur >> dots > 0) dots++;

    flags -= dots;
    if (flags >= 0) {
      head = C.FULL;
    } else
      switch (flags) {
        default:
          error(1, s, "Note too long");
          flags = -4;
        /* fall thru */
        case -4:
          head = C.SQUARE;
          break;
        case -3:
          head = cfmt.squarebreve ? C.SQUARE : C.OVALBARS;
          break;
        case -2:
          head = C.OVAL;
          break;
        case -1:
          head = C.EMPTY;
          break;
      }
    return [head, dots, flags];
  }

  function set_head_shift(s) {
    var i,
      i1,
      i2,
      d,
      ps,
      dx,
      dx_head = dx_tb[s.head],
      dir = s.stem,
      n = s.nhd;

    if (!n) return; // single note

    /* set the head shifts */
    dx = dx_head * 0.78;
    if (s.grace) dx *= 0.5;
    if (dir >= 0) {
      i1 = 1;
      i2 = n + 1;
      ps = s.notes[0].pit;
    } else {
      dx = -dx;
      i1 = n - 1;
      i2 = -1;
      ps = s.notes[n].pit;
    }
    var shift = false,
      dx_max = 0;
    for (i = i1; i != i2; i += dir) {
      d = s.notes[i].pit - ps;
      ps = s.notes[i].pit;
      if (!d) {
        if (shift) {
          /* unison on shifted note */
          var new_dx = (s.notes[i].shhd = s.notes[i - dir].shhd + dx);
          if (dx_max < new_dx) dx_max = new_dx;
          continue;
        }
        if (
          i + dir != i2 /* second after unison */ &&
          //fixme: should handle many unisons after second
          ps + dir == s.notes[i + dir].pit
        ) {
          s.notes[i].shhd = -dx;
          if (dx_max < -dx) dx_max = -dx;
          continue;
        }
      }
      if (d < 0) d = -d;
      if (d > 3 || (d >= 2 && s.head != C.SQUARE)) {
        shift = false;
      } else {
        shift = !shift;
        if (shift) {
          s.notes[i].shhd = dx;
          if (dx_max < dx) dx_max = dx;
        }
      }
    }
    s.xmx = dx_max; /* shift the dots */
  }

  // set the accidental shifts for a set of chords
  function acc_shift(notes, dx_head) {
    var i,
      i1,
      i2,
      dx,
      dx1,
      dx2,
      ps,
      p1,
      acc,
      n = notes.length;

    // set the shifts from the head shifts
    for (i = n - 1; --i >= 0; ) {
      // (no shift on top)
      dx = notes[i].shhd;
      if (!dx || dx > 0) continue;
      dx = dx_head - dx;
      ps = notes[i].pit;
      for (i1 = n; --i1 >= 0; ) {
        if (!notes[i1].acc) continue;
        p1 = notes[i1].pit;
        if (p1 < ps - 3) break;
        if (p1 > ps + 3) continue;
        if (notes[i1].shac < dx) notes[i1].shac = dx;
      }
    }

    // set the shifts of the highest and lowest notes
    for (i1 = n; --i1 >= 0; ) {
      if (notes[i1].acc) {
        p1 = notes[i1].pit; // top note with accidental
        dx1 = notes[i1].shac;
        if (!dx1) {
          dx1 = notes[i1].shhd;
          if (dx1 < 0) dx1 = dx_head - dx1;
          else dx1 = dx_head;
        }
        break;
      }
    }
    if (i1 < 0)
      // no accidental
      return;
    for (i2 = 0; i2 < i1; i2++) {
      if (notes[i2].acc) {
        ps = notes[i2].pit; // bottom note with accidental
        dx2 = notes[i2].shac;
        if (!dx2) {
          dx2 = notes[i2].shhd;
          if (dx2 < 0) dx2 = dx_head - dx2;
          else dx2 = dx_head;
        }
        break;
      }
    }
    if (i1 == i2) {
      // only one accidental
      notes[i1].shac = dx1;
      return;
    }

    if (p1 > ps + 4) {
      // if interval greater than a sixth
      if (dx1 > dx2) dx2 = dx1; // align the accidentals
      notes[i1].shac = notes[i2].shac = dx2;
    } else {
      notes[i1].shac = dx1;
      notes[i2].shac = dx2 = dx1 + 7;
    }
    dx2 += 7;

    // shift the remaining accidentals
    for (i = i1; --i > i2; ) {
      // from top to bottom
      acc = notes[i].acc;
      if (!acc) continue;
      dx = notes[i].shac;
      if (dx < dx2) dx = dx2;
      ps = notes[i].pit;
      for (i1 = n; --i1 > i; ) {
        if (!notes[i1].acc) continue;
        p1 = notes[i1].pit;
        if (p1 >= ps + 4) {
          // pitch far enough
          if (
            p1 > ps + 4 || // if more than a fifth
            acc < 0 || // if flat/dble flat
            notes[i1].acc < 0
          )
            continue;
        }
        if (dx > notes[i1].shac - 6) {
          dx1 = notes[i1].shac + 7;
          if (dx1 > dx) dx = dx1;
        }
      }
      notes[i].shac = dx;
    }
  }

  /* set the horizontal shift of accidentals */
  /* this routine is called only once per tune */
  function set_acc_shft() {
    var s, s2, st, i, acc, st, t, dx_head, notes;

    // search the notes with accidentals at the same time
    s = tsfirst;
    while (s) {
      if (s.type != C.NOTE || s.invis) {
        s = s.ts_next;
        continue;
      }
      st = s.st;
      t = s.time;
      acc = false;
      for (s2 = s; s2; s2 = s2.ts_next) {
        if (s2.time != t || s2.type != C.NOTE || s2.st != st) break;
        if (acc) continue;
        for (i = 0; i <= s2.nhd; i++) {
          if (s2.notes[i].acc) {
            acc = true;
            break;
          }
        }
      }
      if (!acc) {
        s = s2;
        continue;
      }

      dx_head = dx_tb[s.head];

      // build a pseudo chord and shift the accidentals
      notes = [];
      for (; s != s2; s = s.ts_next) Array.prototype.push.apply(notes, s.notes);
      notes.sort(abc2svg.pitcmp);
      acc_shift(notes, dx_head);
    }
  }

  // link a symbol before an other one
  function lkvsym(s, next) {
    // voice linkage
    s.next = next;
    s.prev = next.prev;
    if (s.prev) s.prev.next = s;
    else s.p_v.sym = s;
    next.prev = s;
  }
  function lktsym(s, next) {
    // time linkage
    if (next) {
      s.ts_next = next;
      s.ts_prev = next.ts_prev;
      if (s.ts_prev) s.ts_prev.ts_next = s;
      next.ts_prev = s;
    } else {
      //fixme
      error(2, s, "Bad linkage");
      s.ts_next = s.ts_prev = null;
    }
    s.seqst =
      !s.ts_prev ||
      s.time != s.ts_prev.time ||
      w_tb[s.ts_prev.type] != w_tb[s.type];
    s = s.ts_next;
    if (s)
      s.seqst =
        s.time != s.ts_prev.time || w_tb[s.ts_prev.type] != w_tb[s.type];
  }

  /* -- unlink a symbol -- */
  function unlksym(s) {
    if (s.next) s.next.prev = s.prev;
    if (s.prev) s.prev.next = s.next;
    else s.p_v.sym = s.next;
    if (s.ts_next) {
      if (s.seqst) {
        if (s.ts_next.seqst) {
          s.ts_next.shrink += s.shrink;
          s.ts_next.space += s.space;
        } else {
          s.ts_next.seqst = true;
          s.ts_next.shrink = s.shrink;
          s.ts_next.space = s.space;
        }
      } else {
        if (
          s.ts_next.seqst &&
          s.ts_prev &&
          s.ts_prev.seqst &&
          !w_tb[s.ts_prev.type]
        ) {
          s.ts_next.seqst = false;
          s.shrink = s.ts_next.shrink;
          s.space = s.ts_next.space;
        }
      }
      s.ts_next.ts_prev = s.ts_prev;
    }
    if (s.ts_prev) s.ts_prev.ts_next = s.ts_next;
    if (tsfirst == s) tsfirst = s.ts_next;
    if (tsnext == s) tsnext = s.ts_next;
  }

  /* -- insert a clef change (treble or bass) before a symbol -- */
  function insert_clef(s, clef_type, clef_line) {
    var p_voice = s.p_v,
      new_s,
      st = s.st;

    /* don't insert the clef between two bars */
    if (
      s.type == C.BAR &&
      s.prev &&
      s.prev.type == C.BAR &&
      s.prev.bar_type[0] != ":"
    )
      s = s.prev;

    /* create the symbol */
    p_voice.last_sym = s.prev;
    if (!p_voice.last_sym) p_voice.sym = null;
    p_voice.time = s.time;
    new_s = sym_add(p_voice, C.CLEF);
    new_s.next = s;
    s.prev = new_s;

    new_s.clef_type = clef_type;
    new_s.clef_line = clef_line;
    new_s.st = st;
    new_s.clef_small = true;
    delete new_s.second;
    new_s.notes = [];
    new_s.notes[0] = {
      pit: s.notes[0].pit,
    };
    new_s.nhd = 0;

    /* link in time */
    while (!s.seqst) s = s.ts_prev;
    lktsym(new_s, s);
    return new_s;
  }

  /* -- set the staff of the floating voices -- */
  /* this function is called only once per tune */
  function set_float() {
    var p_voice, st, staff_chg, v, s, s1, up, down;

    for (v = 0; v < voice_tb.length; v++) {
      p_voice = voice_tb[v];
      //		if (!p_voice.floating)
      //			continue
      staff_chg = false;
      st = p_voice.st;
      for (s = p_voice.sym; s; s = s.next) {
        if (!s.floating) {
          while (s && !s.floating) s = s.next;
          if (!s) break;
          staff_chg = false;
        }
        if (!s.dur) {
          if (staff_chg) s.st++;
          continue;
        }
        if (s.notes[0].pit >= 19) {
          /* F */
          staff_chg = false;
          continue;
        }
        if (s.notes[s.nhd].pit <= 12) {
          /* F, */
          staff_chg = true;
          s.st++;
          continue;
        }
        up = 127;
        for (s1 = s.ts_prev; s1; s1 = s1.ts_prev) {
          if (s1.st != st || s1.v == s.v) break;
          if (s1.type == C.NOTE) if (s1.notes[0].pit < up) up = s1.notes[0].pit;
        }
        if (up == 127) {
          if (staff_chg) s.st++;
          continue;
        }
        if (s.notes[s.nhd].pit > up - 3) {
          staff_chg = false;
          continue;
        }
        down = -127;
        for (s1 = s.ts_next; s1; s1 = s1.ts_next) {
          if (s1.st != st + 1 || s1.v == s.v) break;
          if (s1.type == C.NOTE)
            if (s1.notes[s1.nhd].pit > down) down = s1.notes[s1.nhd].pit;
        }
        if (down == -127) {
          if (staff_chg) s.st++;
          continue;
        }
        if (s.notes[0].pit < down + 3) {
          staff_chg = true;
          s.st++;
          continue;
        }
        up -= s.notes[s.nhd].pit;
        down = s.notes[0].pit - down;
        if (!staff_chg) {
          if (up < down + 3) continue;
          staff_chg = true;
        } else {
          if (up < down - 3) {
            staff_chg = false;
            continue;
          }
        }
        s.st++;
      }
    }
  }

  /* -- set the x offset of the grace notes -- */
  function set_graceoffs(s) {
    var next,
      m,
      dx,
      x,
      gspleft = cfmt.gracespace[0],
      gspinside = cfmt.gracespace[1],
      gspright = cfmt.gracespace[2],
      g = s.extra;

    if (s.prev && s.prev.type == C.BAR) gspleft -= 3;
    x = gspleft;

    g.beam_st = true;
    for (; ; g = g.next) {
      set_head_shift(g);
      acc_shift(g.notes, 7);
      dx = 0;
      for (m = g.nhd; m >= 0; m--) {
        if (g.notes[m].shac > dx) dx = g.notes[m].shac;
      }
      x += dx;
      g.x = x;

      if (g.nflags <= 0) {
        g.beam_st = true;
        g.beam_end = true;
      }
      next = g.next;
      if (!next) {
        g.beam_end = true;
        break;
      }
      if (next.nflags <= 0) g.beam_end = true;
      if (g.beam_end) {
        next.beam_st = true;
        x += gspinside / 4;
      }
      if (g.nflags <= 0) x += gspinside / 4;
      if (g.y > next.y + 8) x -= 1.5;
      x += gspinside;
    }

    next = s.next;
    if (next && next.type == C.NOTE) {
      /* if before a note */
      if (g.y >= 3 * (next.notes[next.nhd].pit - 18)) gspright -= 1;
      // above, a bit closer
      else if (g.beam_st && g.y < 3 * (next.notes[next.nhd].pit - 18) - 4)
        gspright += 2; // below with flag, a bit further
    }
    x += gspright;

    /* return the whole width */
    return x;
  }

  // Compute the smallest spacing between symbols according to chord symbols
  //	so that they stay at the same offset.
  // Constraints:
  // - assume the chord symbols are only in the first staff
  // - treat only the first chord symbol of each symbol
  // - the chord symbols under the staff are ignored
  function set_w_chs(s) {
    var i,
      ch,
      w0,
      s0,
      dw,
      x = 0,
      n = 0;

    for (; s; s = s.ts_next) {
      if (s.shrink) {
        x += s.shrink;
        n++;
      }
      if (!s.a_gch) continue;
      for (i = 0; i < s.a_gch.length; i++) {
        ch = s.a_gch[i];
        if (ch.type != "g" || ch.y < 0)
          // upper chord symbol only
          continue;
        if (w0) {
          // width of the previous chord symbol
          if (w0 > x + ch.x) {
            if (s.prev.type == C.BAR)
              // don't move away
              n--; // the symbol from a bar
            dw = (w0 - x - ch.x) / n;
            while (1) {
              s0 = s0.ts_next;
              if (s0.shrink) s0.shrink += dw;
              if (s0 == s || s0.type == C.BAR) break;
            }
          }
        }
        s0 = s;
        w0 = ch.wh[0];
        n = 0;
        //			x = ch.font.box ? -2 : 0
        x = 0;
        break;
      }
    }
  }

  // compute the width needed by the left and right annotations
  function gchord_width(s, wlnote, wlw) {
    var gch,
      w,
      ix,
      arspc = 0;

    for (ix = 0; ix < s.a_gch.length; ix++) {
      gch = s.a_gch[ix];
      switch (gch.type) {
        case "<" /* left */:
          w = gch.wh[0] + wlnote;
          if (w > wlw) wlw = w;
          break;
        case ">" /* right */:
          w = gch.wh[0] + s.wr;
          if (w > arspc) arspc = w;
          break;
      }
    }
    if (s.wr < arspc) s.wr = arspc;

    return wlw;
  }

  /* -- set the width of a symbol -- */
  /* This routine sets the minimal left and right widths wl,wr
   * so that successive symbols are still separated when
   * no extra glue is put between them */
  // (possible hook)
  Abc.prototype.set_width = function (s) {
    var s2,
      i,
      m,
      xx,
      w,
      wlnote,
      wlw,
      acc,
      bar_type,
      meter,
      last_acc,
      n1,
      n2,
      esp,
      tmp;

    if (s.play) {
      // if play symbol
      s.wl = s.wr = 0;
      return;
    }

    switch (s.type) {
      case C.NOTE:
      case C.REST:
        /* set the note widths */
        s.wr = wlnote = hw_tb[s.head];

        /* room for shifted heads and accidental signs */
        if (s.xmx > 0) s.wr += s.xmx + 4;
        for (s2 = s.prev; s2; s2 = s2.prev) {
          if (w_tb[s2.type] != 0) break;
        }
        if (s2) {
          switch (s2.type) {
            case C.BAR:
            case C.CLEF:
            case C.KEY:
            case C.METER:
              wlnote += 3;
              break;
          }
        }
        for (m = 0; m <= s.nhd; m++) {
          xx = s.notes[m].shhd;
          if (xx < 0) {
            if (wlnote < -xx + 5) wlnote = -xx + 5;
          }
          acc = s.notes[m].acc;
          if (acc) {
            tmp = s.notes[m].shac + (typeof acc != "number" ? 5.5 : 3.5);
            if (wlnote < tmp) wlnote = tmp;
          }
        }
        if (s2) {
          switch (s2.type) {
            case C.BAR:
            case C.CLEF:
            case C.KEY:
            case C.METER:
              wlnote -= 3;
              break;
          }
        }

        /* room for the decorations */
        if (s.a_dd) wlnote += deco_width(s);

        /* space for flag if stem goes up on standalone note */
        if (s.beam_st && s.beam_end && s.stem > 0 && s.nflags > 0) {
          if (s.wr < s.xmx + 9) s.wr = s.xmx + 9;
        }

        /* leave room for dots and set their offset */
        if (s.dots) {
          if (s.wl == undefined)
            // don't recompute if new music line
            switch (s.head) {
              case C.SQUARE:
              case C.OVALBARS:
                s.xmx += 3;
                break;
              case C.OVAL:
                s.xmx += 1;
                break;
            }
          if (s.wr < s.xmx + 8) s.wr = s.xmx + 8;
          if (s.dots >= 2) s.wr += 3.5 * (s.dots - 1);
        }

        /* if a tremolo on 2 notes, have space for the small beam(s) */
        if (s.trem2 && s.beam_end && wlnote < 20) wlnote = 20;

        wlw = wlnote;

        if (s2) {
          switch (s2.type) {
            case C.NOTE /* extra space when up stem - down stem */:
              if (s2.stem > 0 && s.stem < 0) {
                if (wlw < 7) wlw = 7;
              }

              /* make sure helper lines don't overlap */
              if ((s.y > 27 && s2.y > 27) || (s.y < -3 && s2.y < -3)) {
                if (wlw < 6) wlw = 6;
              }

              /* have ties wide enough */
              if (s2.tie) {
                if (wlw < 14) wlw = 14;
              }
              break;
            case C.CLEF /* extra space at start of line */:
              if (s2.second || s2.clef_small) break;
              wlw += 8;
              break;
            case C.KEY:
              /*			case C.METER:	*/
              wlw += 4;
              break;
          }
        }

        /* leave room for guitar chord */
        if (s.a_gch) wlw = gchord_width(s, wlnote, wlw);

        /* leave room for vocals under note */
        /* related to draw_lyrics() */
        if (s.a_ly) wlw = ly_width(s, wlw);

        /* if preceeded by a grace note sequence, adjust */
        if (s2 && s2.type == C.GRACE) s.wl = wlnote - 4.5;
        else s.wl = wlw;
        return;
      case C.SPACE:
        xx = s.width / 2;
        s.wr = xx;
        if (s.a_gch) xx = gchord_width(s, xx, xx);
        if (s.a_dd) xx += deco_width(s);
        s.wl = xx;
        return;
      case C.BAR:
        bar_type = s.bar_type;
        switch (bar_type) {
          case "|":
            w = 5; // 3 + 2
            break;
          default:
            w = 2 + 2.8 * bar_type.length;
            for (i = 0; i < bar_type.length; i++) {
              switch (bar_type[i]) {
                case "[":
                case "]":
                  w += 3;
                  break;
                case ":":
                  w += 2;
                  break;
              }
            }
            break;
        }
        s.wl = w;
        if (s.next && s.next.type != C.METER) s.wr = 7;
        else s.wr = 5;
        //			s.notes[0].shhd = (w - 5) * -.5

        /* if preceeded by a grace note sequence, adjust */
        for (s2 = s.prev; s2; s2 = s2.prev) {
          if (w_tb[s2.type] != 0) {
            if (s2.type == C.GRACE) s.wl -= 8;
            break;
          }
        }

        if (s.a_dd) s.wl += deco_width(s);

        /* have room for the repeat numbers / chord indication */
        if (s.text && s.text.length < 4 && s.next && s.next.a_gch) {
          set_font("repeat");
          s.wr += strwh(s.text)[0] + 2;
        }
        return;
      case C.CLEF:
        // (there may be invisible clefs in empty staves)
        if (s.invis) {
          s.wl = s.wr = 1; // (!! not 0 !!)
          return;
        }
        s.wl = s.clef_small ? 9 : 12;
        s.wr = s.clef_small ? 7 : 12;
        return;
      case C.KEY:
        if (
          (!s.k_a_acc && !s.k_sf && !s.k_old_sf) || // if no accidental
          s.k_none || // or no key
          s.k_play
        ) {
          // or key for play
          s.wl = s.wr = 0; // no width
          return;
        }
        s.wl = 3;
        esp = 4;
        if (!s.k_a_acc) {
          n1 = s.k_sf; /* new key sig */
          if (s.k_old_sf && (cfmt.cancelkey || n1 == 0)) n2 = s.k_old_sf;
          /* old key */ else n2 = 0;
          if (n1 * n2 >= 0) {
            /* if no natural */
            if (n1 < 0) n1 = -n1;
            if (n2 < 0) n2 = -n2;
            if (n2 > n1) n1 = n2;
          } else {
            n1 -= n2;
            if (n1 < 0) n1 = -n1;
            esp += 3; /* see extra space in draw_keysig() */
          }
        } else {
          n1 = n2 = s.k_a_acc.length;
          if (n2) last_acc = s.k_a_acc[0].acc;
          for (i = 1; i < n2; i++) {
            acc = s.k_a_acc[i];
            if (
              acc.pit > s.k_a_acc[i - 1].pit + 6 ||
              acc.pit < s.k_a_acc[i - 1].pit - 6
            )
              n1--;
            // no clash
            else if (acc.acc != last_acc) esp += 3;
            last_acc = acc.acc;
          }
        }
        s.wr = 5.5 * n1 + esp;
        return;
      case C.METER:
        wlw = 0;
        s.x_meter = [];
        for (i = 0; i < s.a_meter.length; i++) {
          meter = s.a_meter[i];
          switch (meter.top[0]) {
            case "C":
            case "c":
            case "o":
              s.x_meter[i] = wlw + 6;
              wlw += 12;
              break;
            case ".":
            case "|":
              s.x_meter[i] = s.x_meter[i - 1];
              break;
            default:
              w = 0;
              if (!meter.bot || meter.top.length > meter.bot.length)
                meter = meter.top;
              else meter = meter.bot;
              for (m = 0; m < meter.length; m++) {
                switch (meter[m]) {
                  case "(":
                    wlw += 4;
                  // fall thru
                  case ")":
                  case "1":
                    w += 4;
                    break;
                  default:
                    w += 12;
                    break;
                }
              }
              s.x_meter[i] = wlw + w / 2;
              wlw += w;
          }
        }
        s.wl = 0;
        s.wr = wlw + 6;
        return;
      case C.MREST:
        s.wl = 6;
        s.wr = 66;
        return;
      case C.GRACE:
        if (s.invis) break;
        s.wl = set_graceoffs(s);
        s.wr = 0;
        if (s.a_ly) ly_width(s, wlw);
        return;
      case C.STBRK:
        s.wl = s.xmx;
        if (s.next && s.next.type == C.CLEF) {
          s.wr = 2;
          delete s.next.clef_small; /* big clef */
        } else {
          s.wr = 8;
        }
        return;
      case C.CUSTOS:
        s.wl = s.wr = 4;
        return;
      case C.TEMPO: // no width, but build the tempo string
        tempo_build(s);
        break;
      case C.BLOCK: // no width
      case C.PART:
      case C.REMARK:
      case C.STAVES:
        break;
      default:
        error(2, s, "set_width - Cannot set width for symbol $1", s.type);
        break;
    }
    s.wl = s.wr = 0;
  };

  // convert delta time to natural spacing
  function time2space(s, len) {
    var i, l, space;

    if (smallest_duration >= C.BLEN / 2) {
      if (smallest_duration >= C.BLEN) len /= 4;
      else len /= 2;
    } else if (!s.next && len >= C.BLEN) {
      len /= 2;
    }
    if (len >= C.BLEN / 4) {
      if (len < C.BLEN / 2) i = 5;
      else if (len < C.BLEN) i = 6;
      else if (len < C.BLEN * 2) i = 7;
      else if (len < C.BLEN * 4) i = 8;
      else i = 9;
    } else {
      if (len >= C.BLEN / 8) i = 4;
      else if (len >= C.BLEN / 16) i = 3;
      else if (len >= C.BLEN / 32) i = 2;
      else if (len >= C.BLEN / 64) i = 1;
      else i = 0;
    }
    l = len - ((C.BLEN / 16 / 8) << i);
    space = space_tb[i];
    if (l) {
      if (l < 0) {
        space = (space_tb[0] * len) / (C.BLEN / 16 / 8);
      } else {
        if (i >= 9) i = 8;
        space +=
          ((space_tb[i + 1] - space_tb[i]) * l) / ((C.BLEN / 16 / 8) << i);
      }
    }
    return space;
  }

  // set the natural space
  function set_space(s, ptime) {
    var space, len, s2, stemdir;

    len = s.time - ptime; // time skip

    if (!len) {
      switch (s.type) {
        case C.MREST:
          return s.wl;
        ///*fixme:do same thing at start of line*/
        //		case C.NOTE:
        //		case C.REST:
        //			if (s.ts_prev.type == C.BAR) {
        //				if (s.nflags < -2)
        //					return space_tb[0]
        //				return space_tb[2]
        //			}
        //			break
      }
      return 0;
    }
    if (s.ts_prev.type == C.MREST)
      //		return s.ts_prev.wr + 16
      //				+ 3		// (bar wl=5 wr=8)
      return 71; // 66 (mrest.wl) + 5 (bar.wl)

    space = time2space(s, len);

    while (!s.dur) {
      switch (s.type) {
        case C.BAR:
          // (hack to have quite the same note widths between measures)
          return space * 0.9 - 7;
        case C.CLEF:
          return space - s.wl - s.wr;
        case C.BLOCK: // no space
        case C.PART:
        case C.REMARK:
        case C.STAVES:
        case C.TEMPO:
          s = s.ts_next;
          if (!s) return space;
          continue;
      }
      break;
    }

    /* reduce spacing within a beam */
    if (s.dur && len <= C.BLEN / 4) {
      s2 = s;
      while (s2) {
        if (!s2.beam_st) {
          space *= 0.9; // ex fnnp
          break;
        }
        s2 = s2.ts_next;
        if (!s2 || s2.seqst) break;
      }
    }

    /* decrease spacing when stem down followed by stem up */
    /*fixme:to be done later, after x computed in sym_glue*/
    if (s.type == C.NOTE && s.nflags >= -1 && s.stem > 0) {
      stemdir = true;

      for (s2 = s.ts_prev; s2 && s2.time == ptime; s2 = s2.ts_prev) {
        if (s2.type == C.NOTE && (s2.nflags < -1 || s2.stem > 0)) {
          stemdir = false;
          break;
        }
      }
      if (stemdir) {
        for (s2 = s.ts_next; s2 && s2.time == s.time; s2 = s2.ts_next) {
          if (s2.type == C.NOTE && (s2.nflags < -1 || s2.stem < 0)) {
            stemdir = false;
            break;
          }
        }
        if (stemdir) space *= 0.9;
      }
    }
    return space;
  }

  // set the spacing inside tuplets or L: factor
  function set_sp_tup(s, s_et) {
    s = s.ts_prev; // previous normal time
    var tim = s.time,
      ttim = s_et.time - tim,
      s2 = s,
      wsp = 0,
      f;

    // compute the whole spacing
    while (1) {
      do {
        s2 = s2.ts_next;
      } while (!s2.seqst);
      wsp += s2.space;
      if (s2 == s_et) break;
    }

    // spacing factor: for mean of total and sum of individual spacing
    f = (time2space(s, ttim) + wsp) / 2 / wsp;

    while (1) {
      do {
        s = s.ts_next;
      } while (!s.seqst);
      s.space *= f;
      if (s == s_et) break;
      tim = s.time;
    }
  }

  // return an empty bar
  function _bar(s) {
    return {
      type: C.BAR,
      bar_type: "|",
      fname: s.fname,
      istart: s.istart,
      iend: s.iend,
      v: s.v,
      p_v: s.p_v,
      st: s.st,
      dur: 0,
      nhd: 0,
      notes: [
        {
          pit: s.notes ? s.notes[0].pit : 22,
        },
      ],
      prev: s,
    };
  } // _bar()

  // create an invisible bar for end of music lines
  function add_end_bar(s) {
    var b = _bar(s);

    b.seqst = true;
    b.invis = true;
    b.time = s.time + s.dur / 2;
    b.wl = 0;
    b.wr = 0;
    b.ts_prev = s;
    b.next = s.next;
    b.ts_next = s.ts_next;
    b.shrink = s.wr + 3;

    if (s.next) s.next.prev = b;
    if (s.ts_next) s.ts_next.ts_prev = b;
    s.next = s.ts_next = b;
    b.space = set_space(b, s.time);
    return b;
  }

  /* -- set the width and space of all symbols -- */
  // this function is called once for the whole tune
  function set_allsymwidth() {
    var maxx,
      val,
      st,
      s_chs,
      tim,
      stup,
      s = tsfirst,
      s2 = s,
      xa = 0,
      xl = [],
      wr = [];

    /* loop on all symbols */
    maxx = xa;
    tim = s.time;
    while (1) {
      do {
        if (s.a_gch && !s_chs) s_chs = s;
        self.set_width(s);
        st = s.st;
        if (xl[st] == undefined) xl[st] = 0;
        if (wr[st] == undefined) wr[st] = 0;
        val = xl[st] + wr[st] + s.wl;
        if (val > maxx) maxx = val;
        s = s.ts_next;
      } while (s && !s.seqst);

      // set the spaces of the time sequence
      s2.shrink = maxx - xa;
      s2.space = s2.ts_prev ? set_space(s2, tim) : 0;
      val = s2.time / 12; // check if time is integer
      if (val != (val | 0)) {
        // no => tuplet or L: factor
        if (!stup) stup = s2;
      } else if (stup) {
        set_sp_tup(stup, s2);
        stup = null;
      }

      if (!s2.shrink && !s2.space && s2.type == C.CLEF) {
        delete s2.seqst; /* no space */
        s2.time = tim;
      }
      tim = s2.time;
      if (!s) break;

      // update the min left space per staff
      for (st = 0; st < wr.length; st++) wr[st] = 0;
      xa = maxx;
      do {
        st = s2.st;
        xl[st] = xa;
        if (s2.wr > wr[st]) wr[st] = s2.wr;
        s2 = s2.ts_next;
      } while (!s2.seqst);
    }

    // let the chord symbols at the same offset
    if (s_chs) set_w_chs(s_chs);
  }

  // insert a rest, this one replacing a sequence or a measure
  function to_rest(so) {
    var s = clone(so);

    s.prev.next = so.ts_prev = so.prev = s.ts_prev.ts_next = s;
    s.next = s.ts_next = so;
    so.seqst = false;
    so.invis = so.play = true;

    s.type = C.REST;
    // just keep nl and seqst
    delete s.in_tuplet;
    delete s.sl1;
    delete s.a_dd;
    delete s.a_gch;
    delete s.sls;
    //fixme: what if chord / slur in notes / ... ?
    /*fixme: should set many parameters for set_width*/
    //	set_width(s)
    return s;
  }

  /* -- set the repeat sequences / measures -- */
  function set_repeat(s) {
    // first note
    var s2,
      s3,
      i,
      j,
      dur,
      n = s.repeat_n,
      k = s.repeat_k,
      st = s.st,
      v = s.v;

    s.repeat_n = 0; // treated

    /* treat the sequence repeat */
    if (n < 0) {
      /* number of notes / measures */
      n = -n;
      i = n; /* number of notes to repeat */
      for (s3 = s.prev; s3; s3 = s3.prev) {
        if (!s3.dur) {
          if (s3.type == C.BAR) {
            error(1, s3, "Bar in repeat sequence");
            return;
          }
          continue;
        }
        if (--i <= 0) break;
      }
      if (!s3) {
        error(1, s, errs.not_enough_n);
        return;
      }
      dur = s.time - s3.time;

      i = k * n; /* whole number of notes/rests to repeat */
      for (s2 = s; s2; s2 = s2.next) {
        if (!s2.dur) {
          if (s2.type == C.BAR) {
            error(1, s2, "Bar in repeat sequence");
            return;
          }
          continue;
        }
        if (--i <= 0) break;
      }
      if (!s2 || !s2.next) {
        /* should have some symbol */
        error(1, s, errs.not_enough_n);
        return;
      }
      for (s2 = s.prev; s2 != s3; s2 = s2.prev) {
        if (s2.type == C.NOTE) {
          s2.beam_end = true;
          break;
        }
      }
      for (j = k; --j >= 0; ) {
        i = n; /* number of notes/rests */
        if (s.dur) i--;
        s2 = s.ts_next;
        while (i > 0) {
          if (s2.st == st) {
            s2.invis = s2.play = true;
            if (s2.seqst && s2.ts_next.seqst) s2.seqst = false;
            if (s2.v == v && s2.dur) i--;
          }
          s2 = s2.ts_next;
        }
        s = to_rest(s);
        s.dur = s.notes[0].dur = dur;
        s.rep_nb = -1; // single repeat
        s.beam_st = true;
        self.set_width(s);
        s.head = C.SQUARE;
        for (s = s2; s; s = s.ts_next) {
          if (s.st == st && s.v == v && s.dur) break;
        }
      }
      return;
    }

    /* check the measure repeat */
    i = n; /* number of measures to repeat */
    for (s2 = s.prev.prev; s2; s2 = s2.prev) {
      if (s2.type == C.BAR || s2.time == tsfirst.time) {
        if (--i <= 0) break;
      }
    }
    if (!s2) {
      error(1, s, errs.not_enough_m);
      return;
    }

    dur = s.time - s2.time; /* repeat duration */

    if (n == 1) i = k;
    /* repeat number */ else i = n; /* check only 2 measures */
    for (s2 = s; s2; s2 = s2.next) {
      if (s2.type == C.BAR) {
        if (--i <= 0) break;
      }
    }
    if (!s2) {
      error(1, s, errs.not_enough_m);
      return;
    }

    /* if many 'repeat 2 measures'
     * insert a new %%repeat after the next bar */
    i = k; /* repeat number */
    if (n == 2 && i > 1) {
      s2 = s2.next;
      if (!s2) {
        error(1, s, errs.not_enough_m);
        return;
      }
      s2.repeat_n = n;
      s2.repeat_k = --i;
    }

    /* replace */
    dur /= n;
    if (n == 2) {
      /* repeat 2 measures (once) */
      s3 = s;
      for (s2 = s.ts_next; ; s2 = s2.ts_next) {
        if (s2.st != st) continue;
        if (s2.type == C.BAR) {
          if (s2.v == v) break;
          continue;
        }
        s2.invis = s2.play = true;
        if (s2.seqst && s2.ts_next.seqst) s2.seqst = false;
      }
      s3 = to_rest(s3);
      s3.dur = s3.notes[0].dur = dur;
      s3.invis = true;
      s2.bar_mrep = 2;
      s3 = s2.next;
      for (s2 = s3.ts_next; ; s2 = s2.ts_next) {
        if (s2.st != st) continue;
        if (s2.type == C.BAR) {
          if (s2.v == v) break;
          continue;
        }
        s2.invis = s2.play = true;
        if (s2.seqst && s2.ts_next.seqst) s2.seqst = false;
      }
      s3 = to_rest(s3);
      s3.dur = s3.notes[0].dur = dur;
      s3.invis = true;
      self.set_width(s3);
      return;
    }

    /* repeat 1 measure */
    s3 = s;
    for (j = k; --j >= 0; ) {
      for (s2 = s3.ts_next; ; s2 = s2.ts_next) {
        if (s2.st != st) continue;
        if (s2.type == C.BAR) {
          if (s2.v == v) break;
          continue;
        }
        s2.invis = s2.play = true;
        if (s2.seqst && s2.ts_next.seqst) s2.seqst = false;
      }
      s3 = to_rest(s3);

      s3.dur = s3.notes[0].dur = dur;
      s3.beam_st = true;
      if (k == 1) {
        s3.rep_nb = 1;
        break;
      }
      s3.rep_nb = k - j + 1; // number to print above the repeat rest
      s3 = s2.next;
    }
  }

  /* add a custos before the symbol of the next line */
  function custos_add(s) {
    var p_voice,
      new_s,
      i,
      s2 = s;

    while (1) {
      if (s2.type == C.NOTE) break;
      s2 = s2.next;
      if (!s2) return;
    }

    p_voice = s.p_v;
    p_voice.last_sym = s.prev;
    //	if (!p_voice.last_sym)
    //		p_voice.sym = null;
    p_voice.time = s.time;
    new_s = sym_add(p_voice, C.CUSTOS);
    new_s.next = s;
    s.prev = new_s;
    lktsym(new_s, s);

    new_s.shrink = s.shrink;
    if (new_s.shrink < 8 + 4) new_s.shrink = 8 + 4;
    new_s.space = s2.space;
    new_s.wl = 0;
    new_s.wr = 4;

    new_s.nhd = s2.nhd;
    new_s.notes = [];
    for (i = 0; i < s.notes.length; i++) {
      new_s.notes[i] = {
        pit: s2.notes[i].pit,
        shhd: 0,
        dur: C.BLEN / 4,
      };
    }
    new_s.stemless = true;
  }

  /* -- define the beginning of a new music line -- */
  function set_nl(s) {
    // s = start of line
    var p_voice, done, tim;

    // set the end of line marker
    function set_eol(s) {
      if (cfmt.custos && voice_tb.length == 1) custos_add(s);
      s.nl = true;
      s = s.ts_prev;
      if (s.type != C.BAR) add_end_bar(s);
    } // set_eol()

    // set the eol on the next symbol
    function set_eol_next(s) {
      if (!s.next) {
        // special case: the voice stops here
        set_eol(s);
        return s;
      }
      for (s = s.ts_next; s; s = s.ts_next) {
        if (s.seqst) {
          set_eol(s);
          break;
        }
      }
      return s;
    } // set_eol_next()

    // 's' is the last symbol of the previous line
    function do_warn(s) {
      var s2, s3;

      // advance in the next line
      for (s2 = s.ts_next; s2; s2 = s2.ts_next) {
        switch (s2.type) {
          //			case C.BAR:
          case C.KEY:
            if (
              !cfmt.keywarn ||
              (!s2.k_a_acc && !s2.k_sf && !s2.k_old_sf) ||
              s2.k_none ||
              s2.k_play
            )
              // play only
              continue;
          // fall thru
          case C.METER:
            if (s2.type == C.METER && !cfmt.timewarn) continue;
          // fall thru
          case C.CLEF:
            // put the warning symbol at end of line
            s3 = clone(s2); // duplicate the K:/M:/clef
            lktsym(s3, s.ts_next); // link in time at eol
            if (s3.ts_next == s2) s2.seqst = true; // keep new line here
            if (!s3.prev)
              // if start of voice
              continue;
            s = s3; // new last symbol
            while (1) {
              // link in voice
              s3 = s3.ts_prev;
              if (s3.v == s.v) {
                s.next = s3.next;
                s.prev = s3;
                s.next.prev = s;
                s3.next = s;
                break;
              }
            }

            // care with spacing
            if (s.type != s.ts_prev.type) {
              s.shrink = s.wl + s.prev.wr;
              s.space = s.ts_next.space;
              s.ts_next.space = 0;
            }
            continue;
        }
        if (w_tb[s2.type]) break; // symbol with a width
      }
      return s;
    } // do_warn()

    s = s.ts_prev; // end of previous line

    // if on a note or rest, go to the next time
    if (s.dur) {
      tim = s.time + s.dur;
      while (s) {
        if (!s.ts_next) return; // null
        if (s.time >= tim) break;
        s = s.ts_next;
      }
      s = s.ts_prev;
    }

    // add the warning symbols at the end of the previous line
    s = do_warn(s);

    /* if normal symbol, cut here */
    switch (s.type) {
      case C.CLEF:
      case C.BAR:
      case C.STAVES:
        break;
      case C.GRACE /* don't cut on a grace note */:
        s = s.next;
        if (!s) return s;
      /* fall thru */
      default:
        return set_eol_next(s);
    }

    /* go back to handle the staff breaks at end of line */
    for (; s; s = s.ts_prev) {
      if (s.seqst && s.type != C.CLEF) break;
    }
    done = 0;
    for (; ; s = s.ts_next) {
      if (!s) return s;
      if (!s.seqst) continue;
      if (done < 0) break;
      switch (s.type) {
        case C.STAVES:
          if (!s.ts_prev) return; // null		// no music yet
          if (s.ts_prev.type == C.BAR) break;
          while (s.ts_next) {
            if (w_tb[s.ts_next.type] != 0 && s.ts_next.type != C.CLEF) break;
            s = s.ts_next;
          }
          if (!s.ts_next || s.ts_next.type != C.BAR) continue;
          s = s.ts_next;
        // fall thru
        case C.BAR:
          if (done) break;
          done = 1;
          continue;
        case C.STBRK:
          if (!s.stbrk_forced) unlksym(s);
          /* remove */ else done = -1; // keep the next symbols on the next line
          continue;
        case C.CLEF:
          if (done) break;
          continue;
        default:
          if (!done || (s.prev && s.prev.type == C.GRACE)) continue;
          break;
      }
      break;
    }
    set_eol(s);
    return s;
  }

  /* get the width of the starting clef and key signature */
  // return
  //	r[0] = width of clef and key signature
  //	r[1] = width of the meter
  function get_ck_width() {
    var r0,
      r1,
      p_voice = voice_tb[0];

    self.set_width(p_voice.clef);
    self.set_width(p_voice.ckey);
    self.set_width(p_voice.meter);
    return [
      p_voice.clef.wl + p_voice.clef.wr + p_voice.ckey.wl + p_voice.ckey.wr,
      p_voice.meter.wl + p_voice.meter.wr,
    ];
  }

  // get the width of the symbols up to the next soln or eof
  // also, set a x (nice spacing) to all symbols
  // two returned values: width of nice spacing, width with max shrinking
  function get_width(s, next) {
    var shrink,
      space,
      w = 0,
      wmx = 0,
      sp_fac = 1 - cfmt.maxshrink;

    while (s != next) {
      if (s.seqst) {
        shrink = s.shrink;
        wmx += shrink;
        if ((space = s.space) < shrink) w += shrink;
        else w += shrink * cfmt.maxshrink + space * sp_fac;
        s.x = w;
      }
      s = s.ts_next;
    }
    if (next) wmx += next.wr; // big key signatures may be wide enough
    return [w, wmx];
  }

  /* -- search where to cut the lines according to the staff width -- */
  function set_lines(
    s /* first symbol */,
    next /* symbol of the next line / null */,
    lwidth /* w - (clef & key sig) */,
    indent
  ) {
    /* for start of tune */
    var first,
      s2,
      s3,
      x,
      xmin,
      xmid,
      xmax,
      wwidth,
      shrink,
      space,
      ws,
      nlines,
      last = next ? next.ts_prev : null;

    ws = get_width(s, next); // 2 widths: nice and shrinked

    // take care of big key signatures at end of line
    if (cfmt.keywarn && next && next.type == C.KEY && !last.dur) {
      ws[0] += next.wr;
      ws[1] += next.wr;
    }

    // check if the symbols can enter in one line
    if (ws[1] + indent < lwidth) {
      if (next) next = set_nl(next);
      return next || last;
    }

    /* loop on cutting the tune into music lines */
    wwidth = ws[0] + indent;
    while (1) {
      nlines = Math.ceil(wwidth / lwidth);
      if (nlines <= 1) {
        if (next) next = set_nl(next);
        return next || last;
      }

      s2 = first = s;
      xmin = s.x - s.shrink - indent;
      xmax = xmin + lwidth;
      xmid = xmin + wwidth / nlines;
      xmin += (wwidth / nlines) * cfmt.breaklimit;
      for (s = s.ts_next; s != next; s = s.ts_next) {
        if (!s.x) continue;
        if (s.type == C.BAR) s2 = s;
        if (s.x >= xmin) break;
      }
      //fixme: can this occur?
      if (s == next) {
        if (next) next = set_nl(next);
        return next;
      }

      /* try to cut on a measure bar */
      s3 = null;
      for (; s != next; s = s.ts_next) {
        x = s.x;
        if (!x) continue;
        if (x > xmax) break;
        if (s.type != C.BAR) continue;

        // cut on the bar closest to the middle
        if (x < xmid) {
          s3 = s; // closest bar before middle
          continue;
        }
        if (!s3 || x - xmid < xmid - s3.x) s3 = s; // closest bar after middle
        break;
      }

      // no bar, try to avoid to cut a beam or a tuplet */
      if (!s3) {
        var beam = 0,
          bar_time = s2.time;

        xmax -= 8; // (left width of the inserted bar in set_allsymwidth)
        s = s2; // restart from start or last bar
        for (; s != next; s = s.ts_next) {
          if (s.beam_st) beam++;
          if (s.beam_end && beam > 0) beam--;
          x = s.x;
          if (!x) continue;
          if (x + s.wr >= xmax) break;
          if (beam || s.in_tuplet) continue;
          //fixme: this depends on the meter
          if ((s.time - bar_time) % (C.BLEN / 4) == 0) {
            s3 = s;
            continue;
          }
          if (!s3 || s.x < xmid) {
            s3 = s;
            continue;
          }
          if (s3 > xmid) break;
          if (xmid - s3.x < s.x - xmid) break;
          s3 = s;
          break;
        }
      }

      // cut anyhere
      if (!s3) {
        s3 = s = s2;
        for (; s != next; s = s.ts_next) {
          x = s.x;
          if (!x) continue;
          if (s.x < xmid) {
            s3 = s;
            continue;
          }
          if (s3 > xmid) break;
          if (xmid - s3.x < s.x - xmid) break;
          s3 = s;
          break;
        }
      }
      s = s3.ts_next;
      while (!s.seqst) s = s.ts_next;

      if (s.nl) {
        /* already set here - advance */
        error(0, s, "Line split problem - adjust maxshrink and/or breaklimit");
        nlines = 2;
        for (s = s.ts_next; s != next; s = s.ts_next) {
          if (!s.x) continue;
          if (--nlines <= 0) break;
        }
      }
      s = set_nl(s);
      if (!s || (next && s.time >= next.time)) break;
      wwidth -= s.x - first.x;
      indent = 0;
    }
    return s;
  }

  /* -- cut the tune into music lines -- */
  function cut_tune(lwidth, indent) {
    var s2,
      i,
      //fixme: not usable yet
      //		pg_sav = {
      //			leftmargin: cfmt.leftmargin,
      //			rightmargin: cfmt.rightmargin,
      //			pagewidth: cfmt.pagewidth,
      //			scale: cfmt.scale
      //		},
      s = tsfirst;

    // take care of the voice subnames
    if (indent) {
      i = set_indent();
      lwidth -= i;
      indent -= i;
    }

    /* adjust the line width according to the starting clef
     * and key signature */
    /*fixme: may change in the tune*/
    i = get_ck_width();
    lwidth -= i[0];
    indent += i[1];

    if (cfmt.custos && voice_tb.length == 1) lwidth -= 12;

    /* if asked, count the measures and set the EOLNs */
    if (cfmt.barsperstaff) {
      i = cfmt.barsperstaff;
      for (s2 = s; s2; s2 = s2.ts_next) {
        if (s2.type != C.BAR || !s2.bar_num || --i > 0) continue;
        while (s2.ts_next && s2.ts_next.type == C.BAR) s2 = s2.ts_next;
        if (s2.ts_next) s2.ts_next.soln = true;
        i = cfmt.barsperstaff;
      }
    }

    /* cut at explicit end of line, checking the line width */
    s2 = s;
    for (; s; s = s.ts_next) {
      //fixme: not usable yet
      //		if (s.type == C.BLOCK) {
      //			switch (s.subtype) {
      //			case "leftmargin":
      //			case "rightmargin":
      //			case "pagescale":
      //			case "pagewidth":
      //			case "scale":
      //			case "staffwidth":
      //				set_format(s.subtype, s.param)
      //				break
      //			}
      //			continue
      //		}
      if (!s.ts_next) {
        s = null;
      } else if (!s.soln) {
        continue;
      } else {
        s.soln = false;
        while (!s.seqst) s = s.ts_prev;
      }
      s2 = set_lines(s2, s, lwidth, indent);
      if (!s2) break;

      //--fixme
      //		s = s2.ts_prev;		// don't miss an eoln
      s = s2;
      indent = 0;
    }

    //fixme: not usable yet
    //	// restore the page parameters at start of line
    //	cfmt.leftmargin = pg_sav.leftmargin;
    //	cfmt.rightmargin = pg_sav.rightmargin;
    //	cfmt.pagewidth = pg_sav.pagewidth;
    //	cfmt.scale = pg_sav.scale
  }

  /* -- set the y values of some symbols -- */
  function set_yval(s) {
    //fixme: staff_tb is not yet defined
    //	var top = staff_tb[s.st].topbar
    //	var bot = staff_tb[s.st].botbar
    switch (s.type) {
      case C.CLEF:
        if (s.second || s.invis) {
          //			s.ymx = s.ymn = (top + bot) / 2
          s.ymx = s.ymn = 12;
          break;
        }
        s.y = (s.clef_line - 1) * 6;
        switch (s.clef_type) {
          default:
            /* treble / perc */
            s.ymx = s.y + 28;
            s.ymn = s.y - 14;
            break;
          case "c":
            s.ymx = s.y + 13;
            s.ymn = s.y - 11;
            break;
          case "b":
            s.ymx = s.y + 7;
            s.ymn = s.y - 12;
            break;
        }
        if (s.clef_small) {
          s.ymx -= 2;
          s.ymn += 2;
        }
        if (s.ymx < 26) s.ymx = 26;
        if (s.ymn > -1) s.ymn = -1;
        //		s.y += s.clef_line * 6
        //		if (s.y > 0)
        //			s.ymx += s.y
        //		else if (s.y < 0)
        //			s.ymn += s.y
        if (s.clef_octave) {
          if (s.clef_octave > 0) s.ymx += 12;
          else s.ymn -= 12;
        }
        break;
      case C.KEY:
        if (s.k_sf > 2) s.ymx = 24 + 10;
        else if (s.k_sf > 0) s.ymx = 24 + 6;
        else s.ymx = 24 + 2;
        s.ymn = -2;
        break;
      default:
        //		s.ymx = top;
        s.ymx = 24;
        s.ymn = 0;
        break;
    }
  }

  // set the ottava decorations and the associated pitch shift
  function set_ottava() {
    var s,
      st,
      delta,
      note,
      g,
      o,
      m = nstaff + 1,
      staff_d = new Int16Array(new Array(m * 2)), // (-ottava)
      staff_noo = new Int8Array(new Array(m)); // number of ottava values

    // add an ottava decoration
    function ottava_add(s, ottava, start) {
      var dc_st = ["15mb(", "8vb(", null, "8va(", "15ma("],
        dc_en = ["15mb)", "8vb)", null, "8va)", "15ma)"];

      deco_cnv([(start ? dc_st : dc_en)[2 + ottava]], s);
    }

    for (st = 0; st <= nstaff; st++) {
      staff_d[st] = 0;
      staff_noo[st] = 0;
    }
    for (s = tsfirst; s; s = s.ts_next) {
      st = s.st;
      if (s.ottava != undefined)
        while (s.ottava.length) {
          o = s.ottava.shift();
          if (o) {
            if (staff_noo[st]++ == 0) {
              // if first ottava
              ottava_add(s, o, true);
              staff_d[st] = -o * 7;
            }
          } else {
            if (--staff_noo[st] == 0) {
              // if last ottava
              ottava_add(s, -staff_d[st] / 7);
              staff_d[st] = 0;
            }
          }
        }
      switch (s.type) {
        case C.REST:
          if (voice_tb.length == 1) break;
        case C.NOTE:
          delta = staff_d[st];
          if (delta && !s.p_v.ckey.k_drum) {
            for (m = s.nhd; m >= 0; m--) {
              note = s.notes[m];
              if (!note.opit) note.opit = note.pit;
              note.pit += delta;
            }
          }
          break;
        case C.GRACE:
          for (g = s.extra; g; g = g.next) {
            delta = staff_d[st];
            if (delta && !s.p_v.ckey.k_drum) {
              for (m = 0; m <= g.nhd; m++) {
                note = g.notes[m];
                if (!note.opit) note.opit = note.pit;
                note.pit += delta;
              }
            }
          }
          break;
      }
    }
  }

  // expand the multi-rests as needed
  function mrest_expand() {
    var s, s2;

    // expand a multi-rest into a set of rest + bar
    function mexp(s) {
      var s2,
        s3,
        s4,
        next,
        tim,
        nb = s.nmes,
        dur = s.dur / nb;
      //		a_dd = s.a_dd

      // change the multi-rest into a single rest
      //		s.a_dd = null
      s.type = C.REST;
      s.dur = s.dur_orig = dur;
      s.nflags = -2;
      s.head = C.FULL;

      /* add the bar(s) and rest(s) */
      tim = s.time + dur;
      next = s.next; // bar
      s3 = s2 = s;
      while (--nb > 0) {
        // add the bar
        if (next) {
          s2 = clone(next);
          delete s2.soln;
          lkvsym(s2, next);
        } else {
          s2 = _bar(s); // end of tune
          s.next = s2;
        }
        s2.time = tim;
        while (s3.time < tim) s3 = s3.ts_next; // bar at end of measure
        while (s3 && s3.v < s.v && s3.type == C.BAR) s3 = s3.ts_next; // keep in order
        if (s3) {
          lktsym(s2, s3);
        } else {
          s3 = s;
          while (s3.ts_next) s3 = s3.ts_next;
          s3.ts_next = s2;
          s2.ts_prev = s3;
          s2.ts_next = null;
        }
        if (s2.seqst) s2.bar_type = s2.ts_next.bar_type;
        else s2.bar_type = s2.ts_prev.bar_type;

        // add the rest
        s4 = clone(s);
        delete s4.a_dd;
        delete s4.soln;
        if (s2.next) {
          s4.next = s2.next;
          s4.next.prev = s4;
        } else {
          s4.next = null;
        }
        s2.next = s4;
        s4.prev = s2;
        s4.time = tim;

        while (s3 && s3.type == C.BAR && s3.time == tim) s3 = s3.ts_next;
        while (s3 && s3.v < s.v) {
          s3 = s3.ts_next; // keep in order
          if (s3 && s3.seqst) break;
        }
        if (s3) {
          lktsym(s4, s3);
        } else {
          s3 = s;
          while (s3.ts_next) s3 = s3.ts_next;
          s3.ts_next = s4;
          s4.ts_prev = s3;
          s4.ts_next = null;
        }

        tim += dur;
        s = s3 = s4;
      }

      //		// copy the mrest decorations to the last rest
      //		s2.a_dd = a_dd
    } // mexp()

    for (s = tsfirst; s; s = s.ts_next) {
      if (s.type != C.MREST) continue;
      if (!s.seqst && w_tb[s.ts_prev.type]) {
        s2 = s;
      } else {
        s2 = s.ts_next;
        while (!s2.seqst) {
          if (s2.type != C.MREST) break;
          s2 = s2.ts_next;
        }
      }
      if (!s2.seqst) {
        while (s.type == C.MREST) {
          mexp(s);
          s = s.ts_next;
        }
      } else {
        s = s2.ts_prev;
      }
    }
  } // mrest_expand()

  // set the clefs (treble or bass) in a 'auto clef' sequence
  // return the starting clef type
  function set_auto_clef(st, s_start, clef_type_start) {
    var s, min, max, time, s2, s3;

    /* get the max and min pitches in the sequence */
    max = 12; /* "F," */
    min = 20; /* "G" */
    for (s = s_start; s; s = s.ts_next) {
      if (s.type == C.STAVES && s != s_start) break;
      if (s.st != st) continue;
      if (s.type != C.NOTE) {
        if (s.type == C.CLEF) {
          if (s.clef_type != "a") break;
          unlksym(s);
        }
        continue;
      }
      if (s.notes[0].pit < min) min = s.notes[0].pit;
      else if (s.notes[s.nhd].pit > max) max = s.notes[s.nhd].pit;
    }

    if (min >= 19 /* upper than 'F' */ || (min >= 13 && clef_type_start != "b"))
      /* or 'G,' */
      return "t";
    if (
      max <= 13 /* lower than 'G,' */ ||
      (max <= 19 && clef_type_start != "t")
    )
      /* or 'F' */
      return "b";

    /* set clef changes */
    if (clef_type_start == "a") {
      if ((max + min) / 2 >= 16) clef_type_start = "t";
      else clef_type_start = "b";
    }
    var clef_type = clef_type_start,
      s_last = s,
      s_last_chg = null;
    for (s = s_start; s != s_last; s = s.ts_next) {
      if (s.type == C.STAVES && s != s_start) break;
      if (s.st != st || s.type != C.NOTE) continue;

      /* check if a clef change may occur */
      time = s.time;
      if (clef_type == "t") {
        if (s.notes[0].pit > 12 /* F, */ || s.notes[s.nhd].pit > 20) {
          /* G */
          if (s.notes[0].pit > 20) s_last_chg = s;
          continue;
        }
        s2 = s.ts_prev;
        if (
          s2 &&
          s2.time == time &&
          s2.st == st &&
          s2.type == C.NOTE &&
          s2.notes[0].pit >= 19
        )
          /* F */
          continue;
        s2 = s.ts_next;
        if (
          s2 &&
          s2.st == st &&
          s2.time == time &&
          s2.type == C.NOTE &&
          s2.notes[0].pit >= 19
        )
          /* F */
          continue;
      } else {
        if (s.notes[0].pit < 12 /* F, */ || s.notes[s.nhd].pit < 20) {
          /* G */
          if (s.notes[s.nhd].pit < 12) s_last_chg = s;
          continue;
        }
        s2 = s.ts_prev;
        if (
          s2 &&
          s2.time == time &&
          s2.st == st &&
          s2.type == C.NOTE &&
          s2.notes[0].pit <= 13
        )
          /* G, */
          continue;
        s2 = s.ts_next;
        if (
          s2 &&
          s2.st == st &&
          s2.time == time &&
          s2.type == C.NOTE &&
          s2.notes[0].pit <= 13
        )
          /* G, */
          continue;
      }

      /* if first change, change the starting clef */
      if (!s_last_chg) {
        clef_type = clef_type_start = clef_type == "t" ? "b" : "t";
        s_last_chg = s;
        continue;
      }

      /* go backwards and search where to insert a clef change */
      s3 = s;
      for (s2 = s.ts_prev; s2 != s_last_chg; s2 = s2.ts_prev) {
        if (s2.st != st) continue;
        if (s2.type == C.BAR && s2.v == s.v) {
          s3 = s2.bar_type[0] != ":" ? s2 : s2.next;
          break;
        }
        if (s2.type != C.NOTE) continue;

        /* have a 2nd choice on beam start */
        if (s2.beam_st && !s2.p_v.second) s3 = s2;
      }

      /* no change possible if no insert point */
      if (s3.time == s_last_chg.time) {
        s_last_chg = s;
        continue;
      }
      s_last_chg = s;

      /* insert a clef change */
      clef_type = clef_type == "t" ? "b" : "t";
      s2 = insert_clef(s3, clef_type, clef_type == "t" ? 2 : 4);
      s2.clef_auto = true;
      //		s3.prev.st = st
    }
    return clef_type_start;
  }

  /* set the clefs */
  /* this function is called once at start of tune generation */
  /*
   * global variables:
   *	- staff_tb[st].clef = clefs at start of line (here, start of tune)
   *				(created here, updated on clef draw)
   *	- voice_tb[v].clef = clefs at end of generation
   *				(created on voice creation, updated here)
   */
  function set_clefs() {
    var s,
      s2,
      st,
      v,
      p_voice,
      g,
      new_type,
      new_line,
      p_staff,
      pit,
      staff_clef = new Array(nstaff + 1), // st -> { clef, autoclef }
      sy = cur_sy,
      mid = [];

    // create the staff table
    staff_tb = new Array(nstaff + 1);
    for (st = 0; st <= nstaff; st++) {
      staff_clef[st] = {
        autoclef: true,
      };
      staff_tb[st] = {
        output: "",
        sc_out: "",
      };
    }

    // set the starting clefs of the staves
    for (v = 0; v < voice_tb.length; v++) {
      p_voice = voice_tb[v];
      if (!sy.voices[v]) continue;
      st = sy.voices[v].st;
      if (!sy.voices[v].second) {
        // main voices
        if (p_voice.staffnonote != undefined)
          sy.staves[st].staffnonote = p_voice.staffnonote;
        if (p_voice.staffscale) sy.staves[st].staffscale = p_voice.staffscale;
        if (sy.voices[v].sep) sy.staves[st].sep = sy.voices[v].sep;
        if (sy.voices[v].maxsep) sy.staves[st].maxsep = sy.voices[v].maxsep;

        if (!p_voice.clef.clef_auto) staff_clef[st].autoclef = false;
      }
    }
    for (v = 0; v < voice_tb.length; v++) {
      p_voice = voice_tb[v];
      if (!sy.voices[v] || sy.voices[v].second)
        // main voices
        continue;
      st = sy.voices[v].st;
      s = p_voice.clef;
      if (staff_clef[st].autoclef) {
        s.clef_type = set_auto_clef(st, tsfirst, s.clef_type);
        s.clef_line = s.clef_type == "t" ? 2 : 4;
      }
      staff_clef[st].clef = staff_tb[st].clef = s;
    }
    for (st = 0; st <= sy.nstaff; st++)
      mid[st] = (sy.staves[st].stafflines.length - 1) * 3;

    for (s = tsfirst; s; s = s.ts_next) {
      if (s.repeat_n) set_repeat(s);

      switch (s.type) {
        case C.STAVES:
          sy = s.sy;
          for (st = 0; st <= nstaff; st++) staff_clef[st].autoclef = true;
          for (v = 0; v < voice_tb.length; v++) {
            if (!sy.voices[v]) continue;
            p_voice = voice_tb[v];
            st = sy.voices[v].st;
            if (!sy.voices[v].second) {
              if (p_voice.staffnonote != undefined)
                sy.staves[st].staffnonote = p_voice.staffnonote;
              if (p_voice.staffscale)
                sy.staves[st].staffscale = p_voice.staffscale;
              if (sy.voices[v].sep) sy.staves[st].sep = sy.voices[v].sep;
              if (sy.voices[v].maxsep)
                sy.staves[st].maxsep = sy.voices[v].maxsep;
            }
            s2 = p_voice.clef;
            if (!s2.clef_auto) staff_clef[st].autoclef = false;
          }
          for (st = 0; st <= sy.nstaff; st++)
            mid[st] = (sy.staves[st].stafflines.length - 1) * 3;
          for (v = 0; v < voice_tb.length; v++) {
            if (!sy.voices[v] || sy.voices[v].second)
              // main voices
              continue;
            p_voice = voice_tb[v];
            st = sy.voices[v].st;
            s2 = p_voice.clef;
            if (s2.clef_auto) {
              //fixme: the staff may have other voices with explicit clefs...
              //					if (!staff_clef[st].autoclef)
              //						???
              new_type = set_auto_clef(
                st,
                s,
                staff_clef[st].clef ? staff_clef[st].clef.clef_type : "a"
              );
              new_line = new_type == "t" ? 2 : 4;
            } else {
              new_type = s2.clef_type;
              new_line = s2.clef_line;
            }
            if (!staff_clef[st].clef) {
              // new staff
              if (s2.clef_auto) {
                if (s2.type != "a") p_voice.clef = clone(p_voice.clef);
                p_voice.clef.clef_type = new_type;
                p_voice.clef.clef_line = new_line;
              }
              staff_tb[st].clef = staff_clef[st].clef = p_voice.clef;
              continue;
            }
            // old staff
            if (
              new_type == staff_clef[st].clef.clef_type &&
              new_line == staff_clef[st].clef.clef_line
            )
              continue;
            g = s.ts_prev;
            while (g && g.time == s.time && (g.v != v || g.st != st))
              g = g.ts_prev;
            if (!g || g.time != s.time) {
              g = s.ts_next;
              while (g && (g.v != v || g.st != st)) g = g.ts_next;
              if (!g || g.time != s.time) g = s;
            }
            if (g.type != C.CLEF) {
              g = insert_clef(g, new_type, new_line);
              if (s2.clef_auto) g.clef_auto = true;
            }
            staff_clef[st].clef = p_voice.clef = g;
          }
          continue;
        default:
          s.mid = mid[s.st];
          continue;
        case C.CLEF:
          break;
      }

      if (s.clef_type == "a") {
        s.clef_type = set_auto_clef(
          s.st,
          s.ts_next,
          staff_clef[s.st].clef.clef_type
        );
        s.clef_line = s.clef_type == "t" ? 2 : 4;
      }

      p_voice = s.p_v;
      p_voice.clef = s;
      if (s.second) {
        /*fixme:%%staves:can this happen?*/
        //			if (!s.prev)
        //				break
        unlksym(s);
        continue;
      }
      st = s.st;
      // may have been inserted on %%staves
      //		if (s.clef_auto) {
      //			unlksym(s)
      //			continue
      //		}

      if (staff_clef[st].clef) {
        if (
          s.clef_type == staff_clef[st].clef.clef_type &&
          s.clef_line == staff_clef[st].clef.clef_line
        ) {
          //				unlksym(s)
          continue;
        }
      } else {
        // the voice moved to a new staff with a forced clef
        staff_tb[st].clef = s;
      }
      staff_clef[st].clef = s;
    }

    /* set a pitch to the symbols of voices with no note */
    sy = cur_sy;
    for (v = 0; v < voice_tb.length; v++) {
      if (!sy.voices[v]) continue;
      s2 = voice_tb[v].sym;
      if (!s2 || s2.notes[0].pit != 127) continue;
      st = sy.voices[v].st;
      switch (staff_tb[st].clef.clef_type) {
        default:
          pit = 22; /* 'B' */
          break;
        case "c":
          pit = 16; /* 'C' */
          break;
        case "b":
          pit = 10; /* 'D,' */
          break;
      }
      for (s = s2; s; s = s.next) s.notes[0].pit = pit;
    }
  }

  /* set the pitch of the notes according to the clefs
   * and set the vertical offset of the symbols */
  /* this function is called at start of tune generation and
   * then, once per music line up to the old sequence */

  var delta_tb = {
    t: 0 - 2 * 2,
    c: 6 - 3 * 2,
    b: 12 - 4 * 2,
    p: 0 - 3 * 2,
  };

  /* upper and lower space needed by rests */
  var rest_sp = [
    [18, 18],
    [12, 18],
    [12, 12],
    [0, 12],
    [6, 8],
    [10, 10] /* crotchet */,
    [6, 4],
    [10, 0],
    [10, 4],
    [10, 10],
  ];

  // (possible hook)
  Abc.prototype.set_pitch = function (last_s) {
    var s,
      s2,
      g,
      st,
      delta,
      pitch,
      note,
      dur = C.BLEN,
      m = nstaff + 1,
      staff_delta = new Int16Array(new Array(m * 2)), // delta clef
      sy = cur_sy;

    // set the starting clefs of the staves
    for (st = 0; st <= nstaff; st++) {
      s = staff_tb[st].clef;
      staff_delta[st] = delta_tb[s.clef_type] + s.clef_line * 2;
      if (s.clefpit) staff_delta[st] += s.clefpit;
      if (cfmt.sound) {
        if (s.clef_octave && !s.clef_oct_transp)
          staff_delta[st] += s.clef_octave;
      } else {
        if (s.clef_oct_transp) staff_delta[st] -= s.clef_octave;
      }
    }

    for (s = tsfirst; s != last_s; s = s.ts_next) {
      st = s.st;
      switch (s.type) {
        case C.CLEF:
          staff_delta[st] = delta_tb[s.clef_type] + s.clef_line * 2;
          if (s.clefpit) staff_delta[st] += s.clefpit;
          if (cfmt.sound) {
            if (s.clef_octave && !s.clef_oct_transp)
              staff_delta[st] += s.clef_octave;
          } else {
            if (s.clef_oct_transp) staff_delta[st] -= s.clef_octave;
          }
          set_yval(s);
          break;
        case C.GRACE:
          for (g = s.extra; g; g = g.next) {
            delta = staff_delta[g.st];
            if (delta && !s.p_v.ckey.k_drum) {
              for (m = 0; m <= g.nhd; m++) {
                note = g.notes[m];
                note.opit = note.pit;
                note.pit += delta;
              }
            }
            g.ymn = 3 * (g.notes[0].pit - 18) - 2;
            g.ymx = 3 * (g.notes[g.nhd].pit - 18) + 2;
          }
          set_yval(s);
          break;
        case C.KEY:
          s.k_y_clef = staff_delta[st]; /* keep the y delta */
        /* fall thru */
        default:
          set_yval(s);
          break;
        case C.MREST:
          if (s.invis) break;
          s.y = 12;
          s.ymx = 24 + 15;
          s.ymn = -2;
          break;
        case C.REST:
          if (voice_tb.length == 1) {
            s.y = 12; /* rest single voice */
            //				s.ymx = 12 + 8;
            //				s.ymn = 12 - 8
            s.ymx = 24;
            s.ymn = 0;
            break;
          }
        // fall thru
        case C.NOTE:
          delta = staff_delta[st];
          if (delta && !s.p_v.ckey.k_drum) {
            for (m = s.nhd; m >= 0; m--) {
              note = s.notes[m];
              note.opit = note.pit;
              note.pit += delta;
            }
          }
          if (s.type == C.NOTE) {
            s.ymx = 3 * (s.notes[s.nhd].pit - 18) + 4;
            s.ymn = 3 * (s.notes[0].pit - 18) - 4;
          } else {
            s.y = (((s.notes[0].pit - 18) / 2) | 0) * 6;
            s.ymx = s.y + rest_sp[5 - s.nflags][0];
            s.ymn = s.y - rest_sp[5 - s.nflags][1];
          }
          if (s.dur < dur) dur = s.dur;
          break;
      }
    }
    if (!last_s) smallest_duration = dur;
  };

  /* -- set the stem direction when multi-voices -- */
  /* this function is called only once per tune */
  // (possible hook)
  Abc.prototype.set_stem_dir = function () {
    var t,
      u,
      i,
      st,
      rvoice,
      v,
      v_st, // voice -> staff 1 & 2
      st_v,
      vobj, // staff -> (v, ymx, ymn)*
      v_st_tb, // array of v_st
      st_v_tb = [], // array of st_v
      s = tsfirst,
      sy = cur_sy,
      nst = sy.nstaff;

    while (s) {
      for (st = 0; st <= nst; st++) st_v_tb[st] = [];
      v_st_tb = [];

      /* get the max/min offsets in the delta time */
      /*fixme: the stem height is not calculated yet*/
      for (u = s; u; u = u.ts_next) {
        if (u.type == C.BAR) break;
        if (u.type == C.STAVES) {
          if (u != s) break;
          sy = s.sy;
          for (st = nst; st <= sy.nstaff; st++) st_v_tb[st] = [];
          nst = sy.nstaff;
          continue;
        }
        if ((u.type != C.NOTE && u.type != C.REST) || u.invis) continue;
        st = u.st;
        /*fixme:test*/
        if (st > nst) {
          var msg =
            "*** fatal set_stem_dir(): bad staff number " + st + " max " + nst;
          error(2, null, msg);
          throw new Error(msg);
        }
        v = u.v;
        v_st = v_st_tb[v];
        if (!v_st) {
          v_st = {
            st1: -1,
            st2: -1,
          };
          v_st_tb[v] = v_st;
        }
        if (v_st.st1 < 0) {
          v_st.st1 = st;
        } else if (v_st.st1 != st) {
          if (st > v_st.st1) {
            if (st > v_st.st2) v_st.st2 = st;
          } else {
            if (v_st.st1 > v_st.st2) v_st.st2 = v_st.st1;
            v_st.st1 = st;
          }
        }
        st_v = st_v_tb[st];
        rvoice = sy.voices[v].range;
        for (i = st_v.length; --i >= 0; ) {
          vobj = st_v[i];
          if (vobj.v == rvoice) break;
        }
        if (i < 0) {
          vobj = {
            v: rvoice,
            ymx: 0,
            ymn: 24,
          };
          for (i = 0; i < st_v.length; i++) {
            if (rvoice < st_v[i].v) {
              st_v.splice(i, 0, vobj);
              break;
            }
          }
          if (i == st_v.length) st_v.push(vobj);
        }

        if (u.type != C.NOTE) continue;
        if (u.ymx > vobj.ymx) vobj.ymx = u.ymx;
        if (u.ymn < vobj.ymn) vobj.ymn = u.ymn;

        if (u.xstem) {
          if (u.ts_prev.st != st - 1 || u.ts_prev.type != C.NOTE) {
            error(1, s, "Bad !xstem!");
            u.xstem = false;
            /*fixme:nflags KO*/
          } else {
            u.ts_prev.multi = 1;
            u.multi = 1;
            u.stemless = true;
          }
        }
      }

      for (; s != u; s = s.ts_next) {
        if (s.multi) continue;
        switch (s.type) {
          default:
            continue;
          case C.REST:
            // handle %%voicecombine 0
            if (
              (s.combine != undefined && s.combine < 0) ||
              !s.ts_next ||
              s.ts_next.type != C.REST ||
              s.ts_next.st != s.st ||
              s.time != s.ts_next.time ||
              s.dur != s.ts_next.dur ||
              (s.a_dd && s.ts_next.a_dd) ||
              (s.a_gch && s.ts_next.a_gch) ||
              s.invis
            )
              break;
            if (s.ts_next.a_dd) s.a_dd = s.ts_next.a_dd;
            if (s.ts_next.a_gch) s.a_gch = s.ts_next.a_gch;
            unlksym(s.ts_next);
            break;
          case C.NOTE:
          case C.GRACE:
            break;
        }

        st = s.st;
        v = s.v;
        v_st = v_st_tb[v];
        st_v = st_v_tb[st];
        if (v_st && v_st.st2 >= 0) {
          if (st == v_st.st1) s.multi = -1;
          else if (st == v_st.st2) s.multi = 1;
          continue;
        }
        if (st_v.length <= 1) {
          /* voice alone on the staff */
          //				if (s.multi)
          //					continue
          /*fixme:could be done in set_var()*/
          if (s.floating) s.multi = st == voice_tb[v].st ? -1 : 1;
          continue;
        }
        rvoice = sy.voices[v].range;
        for (i = st_v.length; --i >= 0; ) {
          if (st_v[i].v == rvoice) break;
        }
        if (i < 0) continue; /* voice ignored */
        if (i == st_v.length - 1) {
          s.multi = -1; /* last voice */
        } else {
          s.multi = 1; /* first voice(s) */

          /* if 3 voices, and vertical space enough,
           * have stems down for the middle voice */
          if (i != 0 && i + 2 == st_v.length) {
            if (st_v[i].ymn - cfmt.stemheight > st_v[i + 1].ymx) s.multi = -1;

            /* special case for unison */
            t = s.ts_next;
            //fixme: pb with ../lacerda/evol-7.5.5.abc
            if (
              s.ts_prev &&
              s.ts_prev.time == s.time &&
              s.ts_prev.st == s.st &&
              s.notes[s.nhd].pit == s.ts_prev.notes[0].pit &&
              s.beam_st &&
              s.beam_end &&
              (!t || t.st != s.st || t.time != s.time)
            )
              s.multi = -1;
          }
        }
      }
      while (s && s.type == C.BAR) s = s.ts_next;
    }
  };

  /* -- adjust the offset of the rests when many voices -- */
  /* this function is called only once per tune */
  function set_rest_offset() {
    var s,
      s2,
      v,
      end_time,
      not_alone,
      v_s,
      y,
      ymax,
      ymin,
      shift,
      dots,
      dx,
      v_s_tb = [],
      sy = cur_sy;

    for (s = tsfirst; s; s = s.ts_next) {
      if (s.invis) continue;
      if (s.type == C.STAVES) sy = s.sy;
      if (!s.dur) continue;
      v_s = v_s_tb[s.v];
      if (!v_s) {
        v_s = {};
        v_s_tb[s.v] = v_s;
      }
      v_s.s = s;
      v_s.st = s.st;
      v_s.end_time = s.time + s.dur;
      if (s.type != C.REST) continue;

      /* check if clash with previous symbols */
      ymin = -127;
      ymax = 127;
      not_alone = dots = false;
      for (v = 0; v <= v_s_tb.length; v++) {
        v_s = v_s_tb[v];
        if (!v_s || !v_s.s || v_s.st != s.st || v == s.v) continue;
        if (v_s.end_time <= s.time) continue;
        not_alone = true;
        s2 = v_s.s;
        if (sy.voices[v].range < sy.voices[s.v].range) {
          if (s2.time == s.time) {
            if (s2.ymn < ymax) {
              ymax = s2.ymn;
              if (s2.dots) dots = true;
            }
          } else {
            if (s2.y < ymax) ymax = s2.y;
          }
        } else {
          if (s2.time == s.time) {
            if (s2.ymx > ymin) {
              ymin = s2.ymx;
              if (s2.dots) dots = true;
            }
          } else {
            if (s2.y > ymin) ymin = s2.y;
          }
        }
      }

      /* check if clash with next symbols */
      end_time = s.time + s.dur;
      for (s2 = s.ts_next; s2; s2 = s2.ts_next) {
        if (s2.time >= end_time) break;
        if (
          s2.st != s.st ||
          //			 || (s2.type != C.NOTE && s2.type != C.REST)
          !s2.dur ||
          s2.invis
        )
          continue;
        not_alone = true;
        if (sy.voices[s2.v].range < sy.voices[s.v].range) {
          if (s2.time == s.time) {
            if (s2.ymn < ymax) {
              ymax = s2.ymn;
              if (s2.dots) dots = true;
            }
          } else {
            if (s2.y < ymax) ymax = s2.y;
          }
        } else {
          if (s2.time == s.time) {
            if (s2.ymx > ymin) {
              ymin = s2.ymx;
              if (s2.dots) dots = true;
            }
          } else {
            if (s2.y > ymin) ymin = s2.y;
          }
        }
      }
      if (!not_alone) {
        s.y = 12;
        s.ymx = 24;
        s.ymn = 0;
        continue;
      }
      if (ymax == 127 && s.y < 12) {
        shift = 12 - s.y;
        s.y += shift;
        s.ymx += shift;
        s.ymn += shift;
      }
      if (ymin == -127 && s.y > 12) {
        shift = s.y - 12;
        s.y -= shift;
        s.ymx -= shift;
        s.ymn -= shift;
      }
      shift = ymax - s.ymx;
      if (shift < 0) {
        shift = Math.ceil(-shift / 6) * 6;
        if (s.ymn - shift >= ymin) {
          s.y -= shift;
          s.ymx -= shift;
          s.ymn -= shift;
          continue;
        }
        dx = dots ? 15 : 10;
        s.notes[0].shhd = dx;
        s.xmx = dx;
        continue;
      }
      shift = ymin - s.ymn;
      if (shift > 0) {
        shift = Math.ceil(shift / 6) * 6;
        if (s.ymx + shift <= ymax) {
          s.y += shift;
          s.ymx += shift;
          s.ymn += shift;
          continue;
        }
        dx = dots ? 15 : 10;
        s.notes[0].shhd = dx;
        s.xmx = dx;
        continue;
      }
    }
  }

  /* -- create a starting symbol -- */
  // last_s = symbol at same time
  function new_sym(s, p_v, last_s) {
    s.p_v = p_v;
    s.v = p_v.v;
    s.st = p_v.st;
    s.time = last_s.time;

    if (p_v.last_sym) {
      s.next = p_v.last_sym.next;
      if (s.next) s.next.prev = s;
      p_v.last_sym.next = s;
      s.prev = p_v.last_sym;
    }
    p_v.last_sym = s;

    lktsym(s, last_s);
  }

  /* -- init the symbols at start of a music line -- */
  function init_music_line() {
    var p_voice,
      s,
      s1,
      s2,
      s3,
      last_s,
      v,
      st,
      shr,
      shrmx,
      shl,
      shlp,
      p_st,
      top,
      nv = voice_tb.length;

    /* initialize the voices */
    for (v = 0; v < nv; v++) {
      if (!cur_sy.voices[v]) continue;
      p_voice = voice_tb[v];
      p_voice.second = cur_sy.voices[v].second;
      p_voice.last_sym = p_voice.sym;

      /* move the voice to a printed staff */
      st = cur_sy.voices[v].st;
      while (st < nstaff && !cur_sy.st_print[st]) st++;
      p_voice.st = st;
      if (!p_voice.second) {
        staff_tb[st].key = p_voice.ckey;
        staff_tb[st].meter = p_voice.meter;
      }
    }

    // move the first clefs, key signatures and time signatures
    // to the staves
    s = tsfirst;
    while (s) {
      switch (s.type) {
        case C.CLEF:
        case C.KEY:
        case C.METER:
          switch (s.type) {
            case C.CLEF:
              staff_tb[s.st].clef = s;
              break;
            case C.KEY:
              s.p_v.ckey = s;
              break;
            case C.METER:
              s.p_v.meter = s;
              insert_meter |= 1;
              break;
          }
          unlksym(s);
        // fall thru
        case C.PART:
        case C.TEMPO:
        case C.BLOCK:
        case C.REMARK:
          s = s.ts_next;
          continue;
      }
      break;
    }

    // generate the starting clefs, key signatures and time signatures

    // add a clef at start of the main voices
    last_s = tsfirst;
    for (v = 0; v < nv; v++) {
      p_voice = voice_tb[v];
      if (!cur_sy.voices[v] || (cur_sy.voices[v].second && !p_voice.bar_start))
        // needed for correct linkage
        continue;
      st = cur_sy.voices[v].st;
      if (!staff_tb[st] || !staff_tb[st].clef) continue;
      s = clone(staff_tb[st].clef);
      s.v = v;
      s.p_v = p_voice;
      s.st = st;
      s.time = tsfirst.time;
      s.prev = null;
      s.next = p_voice.sym;
      if (s.next) s.next.prev = s;
      p_voice.sym = p_voice.last_sym = s;
      s.ts_next = last_s;
      if (last_s) s.ts_prev = last_s.ts_prev;
      else s.ts_prev = null;
      if (!s.ts_prev) {
        tsfirst = s;
      } else {
        s.ts_prev.ts_next = s;
        delete s.seqst;
      }
      if (last_s) {
        last_s.ts_prev = s;
        if (last_s.type == C.CLEF) delete last_s.seqst;
      }
      delete s.clef_small;
      s.second = cur_sy.voices[v].second;
      // (fixme: needed for sample5 X:3 Fugue & staffnonote.xhtml)
      if (!cur_sy.st_print[st]) s.invis = true;
    }

    /* add keysig */
    for (v = 0; v < nv; v++) {
      if (
        !cur_sy.voices[v] ||
        cur_sy.voices[v].second ||
        !cur_sy.st_print[cur_sy.voices[v].st]
      )
        continue;
      p_voice = voice_tb[v];
      s2 = p_voice.ckey;
      if (s2.k_sf || s2.k_a_acc) {
        s = clone(s2);
        new_sym(s, p_voice, last_s);
        delete s.invis;
        s.k_old_sf = s2.k_sf; // no key cancel
      }
    }

    /* add time signature (meter) if needed */
    if (insert_meter & 1) {
      for (v = 0; v < nv; v++) {
        p_voice = voice_tb[v];
        s2 = p_voice.meter;
        if (
          !cur_sy.voices[v] ||
          cur_sy.voices[v].second ||
          !cur_sy.st_print[cur_sy.voices[v].st] ||
          !s2.a_meter.length
        )
          continue;
        s = clone(s2);
        new_sym(s, p_voice, last_s);
      }
      insert_meter &= ~1; // no meter any more
    }

    // add an invisible bar for the various continued elements
    for (v = 0; v < nv; v++) {
      p_voice = voice_tb[v];
      if (p_voice.sls.length) {
        s = {
          type: C.BAR,
          fname: last_s.fname,
          bar_type: "|",
          dur: 0,
          multi: 0,
          invis: true,
          sls: p_voice.sls,
        };
        new_sym(s, p_voice, last_s);
        p_voice.sls = [];
      }
    }

    // add a bar for the continuation of repeat brackets
    for (v = 0; v < nv; v++) {
      p_voice = voice_tb[v];
      s2 = p_voice.bar_start;
      p_voice.bar_start = null;

      // if bar already, keep it in sequence
      if (last_s && last_s.v == v) {
        for (s3 = last_s; s3; s3 = s3.ts_next) {
          if (s3.v != v) break;
          switch (s3.type) {
            case C.PART:
            case C.TEMPO:
              continue;
            case C.BAR:
              p_voice.last_sym = s3;
              last_s = s3.ts_next;
              break;
          }
          break;
        }
      }

      if (!s2) continue;
      if (!cur_sy.voices[v] || !cur_sy.st_print[cur_sy.voices[v].st]) continue;

      if (p_voice.last_sym.type == C.BAR) {
        if (!p_voice.last_sym.rbstop) p_voice.last_sym.rbstart = 1;
      } else {
        new_sym(s2, p_voice, last_s);
      }
    }

    // compute the spacing of the added symbols
    self.set_pitch(last_s);

    s = tsfirst;
    s.seqst = true;
    shlp = 0;
    while (1) {
      s2 = s;
      shl = shrmx = 0;
      do {
        self.set_width(s);
        shr = s.wl + shlp;
        if (shr > shrmx) shrmx = shr;
        if (s.wr > shl) shl = s.wr; // left width for next symbol
        s = s.ts_next;
      } while (s != last_s && !s.seqst);
      s2.shrink = shrmx;
      s2.space = 0;
      if (s == last_s) break;
      shlp = shl;
    }

    // update the spacing before the first old time sequence
    shr = 0;
    do {
      self.set_width(s);
      if (shr < s.wl) shr = s.wl;
      s = s.ts_next;
    } while (s && !s.seqst);
    last_s.shrink = shl + shr;
    last_s.space = 0;
  } // init_music_line()

  // check if the tune ends on a measure bar
  function check_end_bar() {
    var s2,
      s = tsfirst;
    while (s.ts_next) s = s.ts_next;
    if (s.type != C.BAR) {
      s2 = _bar(s);
      s2.seqst = true;
      s2.invis = true;
      s2.time = s.time + (s.dur || 0);
      s2.ts_prev = s;

      s.next = s.ts_next = s2;
    }
  } // check_end_bar()

  /* -- set a pitch in all symbols and the start/stop of the beams -- */
  // and sort the pitches in the chords
  function set_words(p_voice) {
    var s,
      s2,
      nflags,
      lastnote,
      res,
      start_flag = true,
      pitch = 127; /* no note */

    for (s = p_voice.sym; s; s = s.next) {
      if (s.type == C.NOTE) {
        pitch = s.notes[0].pit;
        break;
      }
    }
    for (s = p_voice.sym; s; s = s.next) {
      switch (s.type) {
        case C.MREST:
          start_flag = true;
          break;
        case C.BAR:
          s.bar_type = bar_cnv(s.bar_type);
          if (!s.beam_on) start_flag = true;
          if (
            !s.next &&
            s.prev &&
            //			 && s.prev.type == C.NOTE
            //			 && s.prev.dur >= C.BLEN * 2)
            s.prev.head == C.OVALBARS
          )
            s.prev.head = C.SQUARE;
          break;
        case C.GRACE:
          for (s2 = s.extra; s2; s2 = s2.next) s2.notes.sort(abc2svg.pitcmp);
          break;
        case C.NOTE:
        case C.REST:
          res = identify_note(s, s.dur_orig);
          s.head = res[0];
          s.dots = res[1];
          s.nflags = res[2];
          if (s.nflags <= -2) s.stemless = true;

          if (s.xstem) s.nflags = 0; // beam break
          if (s.trem1) {
            if (s.nflags > 0) s.nflags += s.ntrem;
            else s.nflags = s.ntrem;
          }
          if (s.next && s.next.trem2) break;
          if (s.trem2) {
            s.prev.trem2 = true;
            s.prev.nflags = --s.nflags;
            s.prev.head = ++s.head;
            if (s.nflags > 0) {
              s.nflags += s.ntrem;
            } else {
              if (s.nflags <= -2) {
                s.stemless = true;
                s.prev.stemless = true;
              }
              s.nflags = s.ntrem;
            }
            s.prev.nflags = s.nflags;
            break;
          }

          nflags = s.nflags;

          if (s.ntrem) nflags += s.ntrem;
          if (s.type == C.REST && s.beam_end && !s.beam_on) {
            s.beam_end = false;
            start_flag = true;
          }
          if (start_flag || nflags <= 0) {
            if (lastnote) {
              lastnote.beam_end = true;
              lastnote = null;
            }
            if (nflags <= 0) {
              s.beam_st = true;
              s.beam_end = true;
            } else if (s.type == C.NOTE || s.beam_on) {
              s.beam_st = true;
              start_flag = false;
            }
          }
          if (s.beam_end) start_flag = true;
          if (s.type == C.NOTE || s.beam_on) lastnote = s;
          break;
      }
      if (s.type == C.NOTE) {
        if (s.nhd) s.notes.sort(abc2svg.pitcmp);
        pitch = s.notes[0].pit;
        //			if (s.prev
        //			 && s.prev.type != C.NOTE) {
        //				s.prev.notes[0].pit = (s.prev.notes[0].pit
        //						    + pitch) / 2
        for (s2 = s.prev; s2; s2 = s2.prev) {
          if (s2.type != C.REST) break;
          s2.notes[0].pit = pitch;
        }
      } else {
        if (!s.notes) {
          s.notes = [];
          s.notes[0] = {};
          s.nhd = 0;
        }
        s.notes[0].pit = pitch;
      }
    }
    if (lastnote) lastnote.beam_end = true;
  }

  /* -- set the end of the repeat sequences -- */
  function set_rb(p_voice) {
    var s2,
      n,
      s = p_voice.sym;

    while (s) {
      if (s.type != C.BAR || !s.rbstart || s.norepbra) {
        s = s.next;
        continue;
      }
      n = 0;
      s2 = null;
      for (s = s.next; s; s = s.next) {
        if (s.type != C.BAR) continue;
        n++;
        if (s.rbstop) break;
        if (!s.next) {
          s.rbstop = 2; // right repeat with end
          break;
        }
        if (n == cfmt.rbmin) s2 = s;
        if (n == cfmt.rbmax) {
          if (s2) s = s2;
          s.rbstop = 1; // right repeat without end
          break;
        }
      }
    }
  }

  /* -- initialize the generator -- */
  /* this function is called only once per tune  */

  var delpit = [0, -7, -14, 0];

  function set_global() {
    var p_voice,
      v,
      nv = voice_tb.length,
      sy = cur_sy,
      st = sy.nstaff;

    /* get the max number of staves */
    while (1) {
      sy = sy.next;
      if (!sy) break;
      if (sy.nstaff > st) st = sy.nstaff;
    }
    nstaff = st;

    // there must be a bar at end of tune
    check_end_bar();

    /* set the pitches, the words (beams) and the repeat brackets */
    for (v = 0; v < nv; v++) {
      p_voice = voice_tb[v];
      set_words(p_voice);
      p_voice.ckey = p_voice.key; // starting key
      // (test removed because v.second may change after %%staves)
      //		if (!p_voice.second && !p_voice.norepbra)
      set_rb(p_voice);
    }

    /* set the staff of the floating voices */
    if (nv > 1) {
      set_float();

      // expand the multi-rests as needed
      if (glovar.mrest_p) mrest_expand();
    }

    if (glovar.ottava && cfmt.sound != "play") set_ottava();

    // set the clefs and adjust the pitches of all symbol
    set_clefs();
    self.set_pitch(null);
  }

  /* -- return the left indentation of the staves -- */
  function set_indent(first) {
    var st,
      v,
      w,
      p_voice,
      p,
      i,
      j,
      font,
      nv = voice_tb.length,
      maxw = 0;

    for (v = 0; v < nv; v++) {
      p_voice = voice_tb[v];
      if (!cur_sy.voices[v]) continue;
      st = cur_sy.voices[v].st;
      //		if (!cur_sy.st_print[st])
      //			continue
      p = (first || p_voice.new_name) && p_voice.nm ? p_voice.nm : p_voice.snm;
      if (!p) continue;
      if (!font) {
        set_font("voice");
        font = gene.curfont;
      }
      i = 0;
      while (1) {
        j = p.indexOf("\\n", i);
        if (j < 0) w = strwh(p.slice(i));
        else w = strwh(p.slice(i, j));
        w = w[0];
        if (w > maxw) maxw = w;
        if (j < 0) break;
        i = j + 1;
      }
    }
    if (font) maxw += 4 * cwidf(" ");

    w = 0.5; // (width of left bar)
    for (st = 0; st <= cur_sy.nstaff; st++) {
      if (cur_sy.staves[st].flags & (OPEN_BRACE2 | OPEN_BRACKET2)) {
        w = 12;
        break;
      }
      if (cur_sy.staves[st].flags & (OPEN_BRACE | OPEN_BRACKET)) w = 6;
    }
    maxw += w;

    if (first)
      // if %%indent
      maxw += cfmt.indent;
    return maxw;
  }

  /* -- decide on beams and on stem directions -- */
  /* this routine is called only once per tune */
  function set_beams(sym) {
    var s,
      t,
      g,
      beam,
      s_opp,
      n,
      m,
      mid_p,
      pu,
      pd,
      laststem = -1;

    for (s = sym; s; s = s.next) {
      if (s.type != C.NOTE) {
        if (s.type != C.GRACE) continue;
        g = s.extra;
        if (g.stem == 2) {
          /* opposite gstem direction */
          s_opp = s;
          continue;
        }
        if (!s.stem && (s.stem = s.multi) == 0) s.stem = 1;
        for (; g; g = g.next) {
          g.stem = s.stem;
          g.multi = s.multi;
        }
        continue;
      }

      if (!s.stem /* if not explicitly set */ && (s.stem = s.multi) == 0) {
        /* and alone on the staff */
        mid_p = s.mid / 3 + 18;

        /* notes in a beam have the same stem direction */
        if (beam) {
          s.stem = laststem;
        } else if (s.beam_st && !s.beam_end) {
          // beam start
          beam = true;

          // count the number of notes above the mid-line
          n = pu = 0;
          for (g = s; g; g = g.next) {
            if (g.type != C.NOTE) {
              //						if (g.beam_end)
              //							break
              continue;
            }
            if (g.stem || g.multi) {
              // if forced direction
              s.stem = g.stem || g.multi;
              break;
            }
            n += g.nhd + 1;
            for (m = 0; m <= g.nhd; m++) {
              if (g.notes[m].pit >= mid_p) pu++;
            }
            if (g.beam_end) break;
          }

          if (!s.stem) {
            pu *= 2;
            if (pu > n) {
              s.stem = -1;
            } else if (pu < n) {
              s.stem = 1;

              // same number of note above and below the mid-line
              // get the highest and lowest pitches
            } else {
              pu = s.notes[s.nhd].pit;
              pd = s.notes[0].pit;
              for (g = s.next; g; g = g.next) {
                if (g.type != C.NOTE) {
                  //								if (g.beam_end)
                  //									break
                  continue;
                }
                if (g.notes[g.nhd].pit > pu) pu = g.notes[g.nhd].pit;
                if (g.notes[0].pit < pd) pd = g.notes[0].pit;
                if (g.beam_end) break;
              }
              if (g.beam_end) {
                if (pu + pd < mid_p * 2) {
                  s.stem = 1;
                } else if (pu + pd > mid_p * 2) {
                  s.stem = -1;
                } else {
                  //--fixme: equal: check all notes of the beam
                  if (cfmt.bstemdown) s.stem = -1;
                }
              }
            }
          }
          if (!s.stem) s.stem = laststem;
        } else {
          // no beam
          n = (s.notes[s.nhd].pit + s.notes[0].pit) / 2;
          if (n == mid_p) {
            for (m = 0; m <= s.nhd; m++) {
              if (s.notes[m].pit >= mid_p) break;
            }
            n = m * 2 < s.nhd ? mid_p - 1 : mid_p + 1;
          }
          if (n < mid_p) s.stem = 1;
          else if (n > mid_p) s.stem = -1;
          else if (cfmt.bstemdown) s.stem = -1;
          else s.stem = laststem;
        }
      } else {
        /* stem set by set_stem_dir */
        if (s.beam_st && !s.beam_end) beam = true;
      }
      if (s.beam_end) beam = false;
      laststem = s.stem;

      if (s_opp) {
        /* opposite gstem direction */
        for (g = s_opp.extra; g; g = g.next) g.stem = -laststem;
        s_opp.stem = -laststem;
        s_opp = null;
      }
    }
  }

  // check if there may be one head for unison when voice overlap
  function same_head(s1, s2) {
    var i1, i2, l1, l2, head, i11, i12, i21, i22, sh1, sh2;

    if (s1.shiftunison && s1.shiftunison >= 3) return false;
    if ((l1 = s1.dur) >= C.BLEN) return false;
    if ((l2 = s2.dur) >= C.BLEN) return false;
    if (s1.stemless && s2.stemless) return false;
    if (s1.dots != s2.dots) {
      if ((s1.shiftunison && s1.shiftunison & 1) || s1.dots * s2.dots != 0)
        return false;
    }
    if (s1.stem * s2.stem > 0) return false;

    /* check if a common unison */
    i1 = i2 = 0;
    if (s1.notes[0].pit > s2.notes[0].pit) {
      //fixme:dots
      if (s1.stem < 0) return false;
      while (s2.notes[i2].pit != s1.notes[0].pit) {
        if (++i2 > s2.nhd) return false;
      }
    } else if (s1.notes[0].pit < s2.notes[0].pit) {
      //fixme:dots
      if (s2.stem < 0) return false;
      while (s2.notes[0].pit != s1.notes[i1].pit) {
        if (++i1 > s1.nhd) return false;
      }
    }
    if (s2.notes[i2].acc != s1.notes[i1].acc) return false;
    i11 = i1;
    i21 = i2;
    sh1 = s1.notes[i1].shhd;
    sh2 = s2.notes[i2].shhd;
    do {
      //fixme:dots
      i1++;
      i2++;
      if (i1 > s1.nhd) {
        //fixme:dots
        //			if (s1.notes[0].pit < s2.notes[0].pit)
        //				return false
        break;
      }
      if (i2 > s2.nhd) {
        //fixme:dots
        //			if (s1.notes[0].pit > s2.notes[0].pit)
        //				return false
        break;
      }
      if (s2.notes[i2].acc != s1.notes[i1].acc) return false;
      if (sh1 < s1.notes[i1].shhd) sh1 = s1.notes[i1].shhd;
      if (sh2 < s2.notes[i2].shhd) sh2 = s2.notes[i2].shhd;
    } while (s2.notes[i2].pit == s1.notes[i1].pit);
    //fixme:dots
    if (i1 <= s1.nhd) {
      if (i2 <= s2.nhd) return false;
      if (s2.stem > 0) return false;
    } else if (i2 <= s2.nhd) {
      if (s1.stem > 0) return false;
    }
    i12 = i1;
    i22 = i2;

    head = 0;
    if (l1 != l2) {
      if (l1 < l2) {
        l1 = l2;
        l2 = s1.dur;
      }
      if (l1 < C.BLEN / 2) {
        if (s2.dots) head = 2;
        else if (s1.dots) head = 1;
      } else if (l2 < C.BLEN / 4) {
        /* (l1 >= C.BLEN / 2) */
        //			if ((s1.shiftunison && s1.shiftunison == 2)
        //			 || s1.dots != s2.dots)
        if (s1.shiftunison && s1.shiftunison & 2) return false;
        head = s2.dur >= C.BLEN / 2 ? 2 : 1;
      } else {
        return false;
      }
    }
    if (!head) head = s1.p_v.scale < s2.p_v.scale ? 2 : 1;
    if (head == 1) {
      for (i2 = i21; i2 < i22; i2++) {
        s2.notes[i2].invis = true;
        delete s2.notes[i2].acc;
      }
      for (i2 = 0; i2 <= s2.nhd; i2++) s2.notes[i2].shhd += sh1;
    } else {
      for (i1 = i11; i1 < i12; i1++) {
        s1.notes[i1].invis = true;
        delete s1.notes[i1].acc;
      }
      for (i1 = 0; i1 <= s1.nhd; i1++) s1.notes[i1].shhd += sh2;
    }
    return true;
  }

  /* handle unison with different accidentals */
  function unison_acc(s1, s2, i1, i2) {
    var m, d, acc;

    acc = s2.notes[i2].acc;
    if (!acc) {
      d = w_note[s2.head] * 2 + s2.xmx + s1.notes[i1].shac + 2;
      acc = s1.notes[i1].acc;
      if (typeof acc != "number")
        // microtone
        d += 2;
      if (s2.dots) d += 6;
      for (m = 0; m <= s1.nhd; m++) {
        s1.notes[m].shhd += d;
        s1.notes[m].shac -= d;
      }
      s1.xmx += d;
    } else {
      d = w_note[s1.head] * 2 + s1.xmx + s2.notes[i2].shac + 2;
      if (typeof acc != "number")
        // microtone
        d += 2;
      if (s1.dots) d += 6;
      for (m = 0; m <= s2.nhd; m++) {
        s2.notes[m].shhd += d;
        s2.notes[m].shac -= d;
      }
      s2.xmx += d;
    }
  }

  var MAXPIT = 48 * 2;

  /* set the left space of a note/chord */
  function set_left(s) {
    var m,
      i,
      j,
      shift,
      w_base = w_note[s.head],
      w = w_base,
      left = [];

    for (i = 0; i < MAXPIT; i++) left.push(-100);

    /* stem */
    if (s.nflags > -2) {
      if (s.stem > 0) {
        w = -w;
        i = s.notes[0].pit * 2;
        j = (Math.ceil((s.ymx - 2) / 3) + 18) * 2;
      } else {
        i = (Math.ceil((s.ymn + 2) / 3) + 18) * 2;
        j = s.notes[s.nhd].pit * 2;
      }
      if (i < 0) i = 0;
      if (j >= MAXPIT) j = MAXPIT - 1;
      while (i <= j) left[i++] = w;
    }

    /* notes */
    shift = s.notes[s.stem > 0 ? 0 : s.nhd].shhd; /* previous shift */
    for (m = 0; m <= s.nhd; m++) {
      w = -s.notes[m].shhd + w_base + shift;
      i = s.notes[m].pit * 2;
      if (i < 0) i = 0;
      else if (i >= MAXPIT - 1) i = MAXPIT - 2;
      if (w > left[i]) left[i] = w;
      if (s.head != C.SQUARE) w -= 1;
      if (w > left[i - 1]) left[i - 1] = w;
      if (w > left[i + 1]) left[i + 1] = w;
    }

    return left;
  }

  /* set the right space of a note/chord */
  function set_right(s) {
    var m,
      i,
      j,
      k,
      shift,
      w_base = w_note[s.head],
      w = w_base,
      flags = s.nflags > 0 && s.beam_st && s.beam_end,
      right = [];

    for (i = 0; i < MAXPIT; i++) right.push(-100);

    /* stem and flags */
    if (s.nflags > -2) {
      if (s.stem < 0) {
        w = -w;
        i = (Math.ceil((s.ymn + 2) / 3) + 18) * 2;
        j = s.notes[s.nhd].pit * 2;
        k = i + 4;
      } else {
        i = s.notes[0].pit * 2;
        j = (Math.ceil((s.ymx - 2) / 3) + 18) * 2;
      }
      if (i < 0) i = 0;
      if (j > MAXPIT) j = MAXPIT;
      while (i < j) right[i++] = w;
    }

    if (flags) {
      if (s.stem > 0) {
        if (s.xmx == 0) i = s.notes[s.nhd].pit * 2;
        else i = s.notes[0].pit * 2;
        i += 4;
        if (i < 0) i = 0;
        for (; i < MAXPIT && i <= j - 4; i++) right[i] = 11;
      } else {
        i = k;
        if (i < 0) i = 0;
        for (; i < MAXPIT && i <= s.notes[0].pit * 2 - 4; i++) right[i] = 3.5;
      }
    }

    /* notes */
    shift = s.notes[s.stem > 0 ? 0 : s.nhd].shhd; /* previous shift */
    for (m = 0; m <= s.nhd; m++) {
      w = s.notes[m].shhd + w_base - shift;
      i = s.notes[m].pit * 2;
      if (i < 0) i = 0;
      else if (i >= MAXPIT - 1) i = MAXPIT - 2;
      if (w > right[i]) right[i] = w;
      if (s.head != C.SQUARE) w -= 1;
      if (w > right[i - 1]) right[i - 1] = w;
      if (w > right[i + 1]) right[i + 1] = w;
    }

    return right;
  }

  /* -- shift the notes horizontally when voices overlap -- */
  /* this routine is called only once per tune */
  function set_overlap() {
    var s,
      s1,
      s2,
      s3,
      i,
      i1,
      i2,
      m,
      sd,
      t,
      dp,
      d,
      d2,
      dr,
      dr2,
      dx,
      left1,
      right1,
      left2,
      right2,
      right3,
      pl,
      pr,
      sy = cur_sy;

    // invert the voices
    function v_invert() {
      s1 = s2;
      s2 = s;
      d = d2;
      pl = left1;
      pr = right1;
      dr2 = dr;
    }

    for (s = tsfirst; s; s = s.ts_next) {
      if (s.type != C.NOTE || s.invis) {
        if (s.type == C.STAVES) sy = s.sy;
        continue;
      }

      /* treat the stem on two staves with different directions */
      if (s.xstem && s.ts_prev.stem < 0) {
        for (m = 0; m <= s.nhd; m++) {
          s.notes[m].shhd -= 7; // stem_xoff
          s.notes[m].shac += 16;
        }
      }

      /* search the next note at the same time on the same staff */
      s2 = s;
      while (1) {
        s2 = s2.ts_next;
        if (!s2) break;
        if (s2.time != s.time) {
          s2 = null;
          break;
        }
        if (s2.type == C.NOTE && !s2.invis && s2.st == s.st) break;
      }
      if (!s2) continue;
      s1 = s;

      /* set the dot vertical offset */
      if (sy.voices[s1.v].range < sy.voices[s2.v].range) s2.dot_low = true;
      else s1.dot_low = true;

      /* no shift if no overlap */
      if (s1.ymn > s2.ymx || s1.ymx < s2.ymn) continue;

      if (same_head(s1, s2)) continue;

      // special case when only a second and no dots
      if (!s1.dots && !s2.dots)
        if (
          (s1.stem > 0 &&
            s2.stem < 0 &&
            s1.notes[0].pit == s2.notes[s2.nhd].pit + 1) ||
          (s1.stem < 0 &&
            s2.stem > 0 &&
            s1.notes[s1.nhd].pit + 1 == s2.notes[0].pit)
        ) {
          if (s1.stem < 0) {
            s1 = s2;
            s2 = s;
          }
          d = s1.notes[0].shhd + 7;
          for (
            m = 0;
            m <= s2.nhd;
            m++ // shift the lower note(s)
          )
            s2.notes[m].shhd += d;
          s2.xmx += d;
          s1.xmx = s2.xmx; // align the dots
          continue;
        }

      /* compute the minimum space for 's1 s2' and 's2 s1' */
      right1 = set_right(s1);
      left2 = set_left(s2);

      s3 = s1.ts_prev;
      if (
        s3 &&
        s3.time == s1.time &&
        s3.st == s1.st &&
        s3.type == C.NOTE &&
        !s3.invis
      ) {
        right3 = set_right(s3);
        for (i = 0; i < MAXPIT; i++) {
          if (right3[i] > right1[i]) right1[i] = right3[i];
        }
      } else {
        s3 = null;
      }
      d = -10;
      for (i = 0; i < MAXPIT; i++) {
        if (left2[i] + right1[i] > d) d = left2[i] + right1[i];
      }
      if (d < -3) {
        // no clash if no dots clash
        if (
          !s1.dots ||
          !s2.dots ||
          !s2.dot_low ||
          s1.stem > 0 ||
          s2.stem < 0 ||
          s1.notes[s1.nhd].pit + 2 != s2.notes[0].pit ||
          s2.notes[0].pit & 1
        )
          continue;
      }

      right2 = set_right(s2);
      left1 = set_left(s1);
      if (s3) {
        right3 = set_left(s3);
        for (i = 0; i < MAXPIT; i++) {
          if (right3[i] > left1[i]) left1[i] = right3[i];
        }
      }
      d2 = dr = dr2 = -100;
      for (i = 0; i < MAXPIT; i++) {
        if (left1[i] + right2[i] > d2) d2 = left1[i] + right2[i];
        if (right2[i] > dr2) dr2 = right2[i];
        if (right1[i] > dr) dr = right1[i];
      }

      /* check for unison with different accidentals
       * and clash of dots */
      t = 0;
      i1 = s1.nhd;
      i2 = s2.nhd;
      while (1) {
        dp = s1.notes[i1].pit - s2.notes[i2].pit;
        switch (dp) {
          case 0:
            if (
              s1.notes[i1].acc != s2.notes[i2].acc &&
              !s1.notes[i1].acc &&
              !s2.notes[i2].acc
            ) {
              t = -1;
              break;
            }
            if (s2.notes[i2].acc) {
              if (!s1.notes[i1].acc) s1.notes[i1].acc = s2.notes[i2].acc;
              s2.notes[i2].acc = 0;
            }
            if (s1.dots && s2.dots && s1.notes[i1].pit & 1) t = 1;
            break;
          case -1:
            if (s1.dots && s2.dots) {
              if (s1.notes[i1].pit & 1) {
                s1.dot_low = false;
                s2.dot_low = false;
              } else {
                s1.dot_low = true;
                s2.dot_low = true;
              }
            }
            break;
          case -2:
            if (s1.dots && s2.dots && !(s1.notes[i1].pit & 1)) {
              s1.dot_low = false;
              s2.dot_low = false;
              break;
            }
            break;
        }
        if (t < 0) break;
        if (dp >= 0) {
          if (--i1 < 0) break;
        }
        if (dp <= 0) {
          if (--i2 < 0) break;
        }
      }

      if (t < 0) {
        /* unison and different accidentals */
        unison_acc(s1, s2, i1, i2);
        continue;
      }

      sd = 0;
      if (s1.dots) {
        if (s2.dots) {
          if (!t) /* if no dot clash */ sd = 1; /* align the dots */
        } else {
          v_invert(); // shift the first voice
        }
      } else if (s2.dots) {
        if (d2 + dr < d + dr2) sd = 1; /* align the dots */
      }
      pl = left2;
      pr = right2;
      if (!s3 && d2 + dr < d + dr2) v_invert();
      d += 3;
      if (d < 0) d = 0; // (not return!)

      /* handle the previous shift */
      m = s1.stem >= 0 ? 0 : s1.nhd;
      d += s1.notes[m].shhd;
      m = s2.stem >= 0 ? 0 : s2.nhd;
      d -= s2.notes[m].shhd;

      /*
       * room for the dots
       * - if the dots of v1 don't shift, adjust the shift of v2
       * - otherwise, align the dots and shift them if clash
       */
      if (s1.dots) {
        dx =
          7.7 +
          s1.xmx + // x 1st dot
          3.5 * s1.dots -
          3.5 + // x last dot
          3; // some space
        if (!sd) {
          d2 = -100;
          for (i1 = 0; i1 <= s1.nhd; i1++) {
            i = s1.notes[i1].pit;
            if (!(i & 1)) {
              if (!s1.dot_low) i++;
              else i--;
            }
            i *= 2;
            if (i < 1) i = 1;
            else if (i >= MAXPIT - 1) i = MAXPIT - 2;
            if (pl[i] > d2) d2 = pl[i];
            if (pl[i - 1] + 1 > d2) d2 = pl[i - 1] + 1;
            if (pl[i + 1] + 1 > d2) d2 = pl[i + 1] + 1;
          }
          if (dx + d2 + 2 > d) d = dx + d2 + 2;
        } else {
          if (dx < d + dr2 + s2.xmx) {
            d2 = 0;
            for (i1 = 0; i1 <= s1.nhd; i1++) {
              i = s1.notes[i1].pit;
              if (!(i & 1)) {
                if (!s1.dot_low) i++;
                else i--;
              }
              i *= 2;
              if (i < 1) i = 1;
              else if (i >= MAXPIT - 1) i = MAXPIT - 2;
              if (pr[i] > d2) d2 = pr[i];
              if (pr[i - 1] + 1 > d2) d2 = pr[i - 1] = 1;
              if (pr[i + 1] + 1 > d2) d2 = pr[i + 1] + 1;
            }
            if (d2 > 4.5 && 7.7 + s1.xmx + 2 < d + d2 + s2.xmx)
              s2.xmx = d2 + 3 - 7.7;
          }
        }
      }

      for (m = s2.nhd; m >= 0; m--) {
        s2.notes[m].shhd += d;
        //			if (s2.notes[m].acc
        //			 && s2.notes[m].pit < s1.notes[0].pit - 4)
        //				s2.notes[m].shac -= d
      }
      s2.xmx += d;
      if (sd) s1.xmx = s2.xmx; // align the dots
    }
  }

  /* -- set the stem height -- */
  /* this routine is called only once per tune */
  // (possible hook)
  Abc.prototype.set_stems = function () {
    var s, s2, g, slen, scale, ymn, ymx, nflags, ymin, ymax, res;

    for (s = tsfirst; s; s = s.ts_next) {
      if (s.type != C.NOTE) {
        if (s.type != C.GRACE) continue;
        ymin = ymax = s.mid;
        for (g = s.extra; g; g = g.next) {
          res = identify_note(s, g.dur);
          g.head = res[0];
          g.dots = res[1];
          g.nflags = res[2];
          slen = GSTEM;
          if (g.nflags > 1) slen += 1.2 * (g.nflags - 1);
          ymn = 3 * (g.notes[0].pit - 18);
          ymx = 3 * (g.notes[g.nhd].pit - 18);
          if (s.stem >= 0) {
            g.y = ymn;
            g.ys = ymx + slen;
            ymx = Math.round(g.ys);
          } else {
            g.y = ymx;
            g.ys = ymn - slen;
            ymn = Math.round(g.ys);
          }
          ymx += 2;
          ymn -= 2;
          if (ymn < ymin) ymin = ymn;
          else if (ymx > ymax) ymax = ymx;
          g.ymx = ymx;
          g.ymn = ymn;
        }
        s.ymx = ymax;
        s.ymn = ymin;
        continue;
      }

      /* shift notes in chords (need stem direction to do this) */
      set_head_shift(s);

      /* if start or end of beam, adjust the number of flags
       * with the other end */
      nflags = s.nflags;
      if (s.beam_st && !s.beam_end) {
        if (s.feathered_beam) nflags = ++s.nflags;
        for (s2 = s.next /*s2*/; ; s2 = s2.next) {
          if (s2.type == C.NOTE) {
            if (s.feathered_beam) s2.nflags++;
            if (s2.beam_end) break;
          }
        }
        /*			if (s2) */
        if (s2.nflags > nflags) nflags = s2.nflags;
      } else if (!s.beam_st && s.beam_end) {
        //fixme: keep the start of beam ?
        for (s2 = s.prev /*s2*/; ; s2 = s2.prev) {
          if (s2.beam_st) break;
        }
        /*			if (s2) */
        if (s2.nflags > nflags) nflags = s2.nflags;
      }

      /* set height of stem end */
      slen = cfmt.stemheight;
      switch (nflags) {
        case 2:
          slen += 0;
          break;
        case 3:
          slen += 4;
          break;
        case 4:
          slen += 8;
          break;
        case 5:
          slen += 12;
          break;
      }
      if ((scale = s.p_v.scale) != 1) slen *= (scale + 1) * 0.5;
      ymn = 3 * (s.notes[0].pit - 18);
      if (s.nhd > 0) {
        slen -= 2;
        ymx = 3 * (s.notes[s.nhd].pit - 18);
      } else {
        ymx = ymn;
      }
      if (s.ntrem) slen += 2 * s.ntrem; /* tremolo */
      if (s.stemless) {
        if (s.stem >= 0) {
          s.y = ymn;
          s.ys = ymx;
        } else {
          s.ys = ymn;
          s.y = ymx;
        }
        s.ymx = ymx + 4;
        s.ymn = ymn - 4;
      } else if (s.stem >= 0) {
        if (
          s.notes[s.nhd].pit > 26 &&
          (nflags <= 0 || !s.beam_st || !s.beam_end)
        ) {
          slen -= 2;
          if (s.notes[s.nhd].pit > 28) slen -= 2;
        }
        s.y = ymn;
        if (s.notes[0].tie) ymn -= 3;
        s.ymn = ymn - 4;
        s.ys = ymx + slen;
        if (s.ys < s.mid) s.ys = s.mid;
        s.ymx = (s.ys + 2.5) | 0;
      } else {
        /* stem down */
        if (s.notes[0].pit < 18 && (nflags <= 0 || !s.beam_st || !s.beam_end)) {
          slen -= 2;
          if (s.notes[0].pit < 16) slen -= 2;
        }
        s.ys = ymn - slen;
        if (s.ys > s.mid) s.ys = s.mid;
        s.ymn = (s.ys - 2.5) | 0;
        s.y = ymx;
        /*fixme:the tie may be lower*/
        if (s.notes[s.nhd].tie) ymx += 3;
        s.ymx = ymx + 4;
      }
    }
  };

  /* -- split up unsuitable bars at end of staff -- */
  // return true if the bar type has changed
  function check_bar(s) {
    var bar_type,
      i,
      b1,
      b2,
      s_bs,
      s2,
      p_voice = s.p_v;

    if (s.type == C.BAR && s.invis) {
      // bar at end of line
      s = s.prev;
      if (!s) return;
    }

    /* search the last bar */
    while (s.type == C.CLEF || s.type == C.KEY || s.type == C.METER) {
      s = s.prev;
      if (!s) return;
    }
    if (s.type != C.BAR) return;

    bar_type = s.bar_type;
    if (bar_type == ":") return;
    if (
      bar_type.slice(-1) != ":" && // if not a left repeat bar
      s.text == undefined
    )
      // nor a variant
      return;

    // add a bar in the next music line
    s2 = p_voice.s_next;
    while (1) {
      if (w_tb[s2.type]) break;
      s2 = s2.next;
      if (!s2) return;
    }
    if (s2.type == C.BAR) {
      s_bs = s2; // bar start
    } else {
      s_bs = clone(s);
      s_bs.next = s2;
      s_bs.prev = s2.prev;
      if (s2 == p_voice.s_next) p_voice.s_next = s_bs;
      else s2.prev.next = s_bs;
      s2.prev = s_bs;

      while (!s2.seqst || s2.time > s_bs.time) s2 = s2.ts_prev;
      s_bs.ts_next = s2;
      s_bs.ts_prev = s2.ts_prev;
      if (s2 == tsnext) tsnext = s_bs;
      else s2.ts_prev.ts_next = s_bs;
      delete s_bs.seqst;
      if (s_bs == tsnext || s2.ts_prev.type != C.BAR) {
        if (s2.seqst) {
          s_bs.seqst = true;
        } else {
          s2.seqst = true;
          s2.shrink = s_bs.wr + s2.wl;
          s2.space = 0;
        }
      }
      s2.ts_prev = s_bs;
    }

    if (s.text != undefined) {
      // if a variant
      s_bs.bar_type = "";
      s_bs.text = s.text;
      s_bs.a_gch = s.a_gch;
      delete s.text;
      delete s.a_gch;
      return true;
    }

    if (bar_type[0] != ":") {
      // 'xx:' (not ':xx:')
      if (bar_type == "||:") {
        s_bs.bar_type = "[|:";
        s.bar_type = "||";
        return true;
      }
      s_bs.bar_type = bar_type;
      if (s.prev && s.prev.type == C.BAR) unlksym(s);
      else s.bar_type = "|";
      return;
    }

    // ':xx:' -> ':x|]' and '[|x:'
    i = 0;
    while (bar_type[i] == ":") i++;
    if (i < bar_type.length) {
      s.bar_type = bar_type.slice(0, i) + "|]";
      i = bar_type.length - 1;
      while (bar_type[i] == ":") i--;
      s_bs.bar_type = "[|" + bar_type.slice(i + 1);
    } else {
      i = (bar_type.length / 2) | 0; // '::::' !
      s.bar_type = bar_type.slice(0, i) + "|]";
      s_bs.bar_type = "[|" + bar_type.slice(i);
    }
    return true;
  }

  /* -- move the symbols of an empty staff to the next one -- */
  function sym_staff_move(st) {
    for (var s = tsfirst; s; s = s.ts_next) {
      if (s.nl) break;
      if (s.st == st && s.type != C.CLEF) {
        s.st++;
        s.invis = true;
      }
    }
  }

  // generate a block symbol
  var blocks = []; // array of delayed block symbols

  // (possible hook)
  Abc.prototype.block_gen = function (s) {
    switch (s.subtype) {
      case "leftmargin":
      case "rightmargin":
      case "pagescale":
      case "pagewidth":
      case "scale":
      case "staffwidth":
        blk_flush();
        self.set_format(s.subtype, s.param);
        break;
      case "mc_start": // multicol start
        multicol = {
          posy: posy,
          maxy: posy,
          lmarg: cfmt.leftmargin,
          rmarg: cfmt.rightmargin,
        };
        break;
      case "mc_new": // multicol new
        if (!multicol) {
          error(1, s, "%%multicol new without start");
          break;
        }
        if (posy > multicol.maxy) multicol.maxy = posy;
        cfmt.leftmargin = multicol.lmarg;
        cfmt.rightmargin = multicol.rmarg;
        img.chg = true;
        set_page();
        posy = multicol.posy;
        break;
      case "mc_end": // multicol end
        if (!multicol) {
          error(1, s, "%%multicol new without start");
          break;
        }
        if (posy < multicol.maxy) posy = multicol.maxy;
        cfmt.leftmargin = multicol.lmarg;
        cfmt.rightmargin = multicol.rmarg;
        multicol = undefined;
        blk_flush();
        img.chg = true;
        set_page();
        break;
      case "ml":
        blk_flush();
        user.img_out(s.text);
        break;
      case "newpage":
        svg_flush();
        if (blkdiv < 0)
          // split the tune
          user.img_out("</div>");
        blkdiv = 2; // start the next SVG in a new page
        break;
      case "sep":
        set_page();
        vskip(s.sk1);
        output += '<path class="stroke"\n\td="M';
        out_sxsy((img.width - s.l) / 2 - img.lm, " ", 0);
        output += "h" + s.l.toFixed(1) + '"/>\n';
        vskip(s.sk2);
        break;
      case "text":
        write_text(s.text, s.opt);
        break;
      case "title":
        write_title(s.text, true);
        break;
      case "vskip":
        vskip(s.sk);
        break;
    }
  };

  /* -- define the start and end of a piece of tune -- */
  /* tsnext becomes the beginning of the next line */
  function set_piece() {
    var s,
      last,
      p_voice,
      st,
      v,
      nv,
      tmp,
      non_empty = [],
      non_empty_gl = [],
      sy = cur_sy;

    function reset_staff(st) {
      var p_staff = staff_tb[st],
        sy_staff = sy.staves[st];

      if (!p_staff) p_staff = staff_tb[st] = {};
      p_staff.y = 0; // staff system not computed yet
      p_staff.stafflines = sy_staff.stafflines;
      p_staff.staffscale = sy_staff.staffscale;
      p_staff.ann_top = p_staff.ann_bot = 0;
    } // reset_staff()

    // adjust the empty flag of brace systems
    function set_brace() {
      var st,
        i,
        empty_fl,
        n = sy.staves.length;

      // if a system brace has empty and non empty staves, keep all staves
      for (st = 0; st < n; st++) {
        if (!(sy.staves[st].flags & (OPEN_BRACE | OPEN_BRACE2))) continue;
        empty_fl = 0;
        i = st;
        while (st < n) {
          empty_fl |= non_empty[st] ? 1 : 2;
          if (sy.staves[st].flags & (CLOSE_BRACE | CLOSE_BRACE2)) break;
          st++;
        }
        if (empty_fl == 3) {
          // if both empty and not empty staves
          while (i <= st) {
            non_empty[i] = true;
            non_empty_gl[i++] = true;
          }
        }
      }
    } // set_brace()

    // set the top and bottom of the staves
    function set_top_bot() {
      var st, p_staff, i, j, l;

      for (st = 0; st <= nstaff; st++) {
        p_staff = staff_tb[st];
        if (!non_empty_gl[st]) {
          p_staff.botbar = p_staff.topbar = 0;
          continue;
        }
        l = p_staff.stafflines.length;
        p_staff.topbar = 6 * (l - 1);

        for (i = 0; i < l - 1; i++) {
          switch (p_staff.stafflines[i]) {
            case ".":
            case "-":
              continue;
          }
          break;
        }
        p_staff.botline = p_staff.botbar = i * 6;
        if (i >= l - 2) {
          // 0, 1 or 2 lines
          if (p_staff.stafflines[i] != ".") {
            p_staff.botbar -= 6;
            p_staff.topbar += 6;
          } else {
            // no line: big bar
            p_staff.botbar -= 12;
            p_staff.topbar += 12;
            continue; // no helper line
          }
        }

        // define the helper lines
        p_staff.hll = 17 + i; // pitch of lowest note
        // without helper line
        // ('D' when standard staff)
        p_staff.hlmap = new Int8Array(new Array((l - i + 1) * 2));
        for (j = 1; i < l; i++, j += 2) {
          switch (p_staff.stafflines[i]) {
            case "|":
            case "[":
              p_staff.hlmap[j - 1] = 1; // no helper line
              p_staff.hlmap[j] = 1;
              p_staff.hlmap[j + 1] = 1;
              break;
          }
        }

        // ledger lines
        // index = line number
        // values = [x symbol, x start, x stop]
        p_staff.hlu = []; // above the staff
        p_staff.hld = []; // under the staff
      }
    } // set_top_bot()

    // remove the staff system at start of line
    if (tsfirst.type == C.STAVES) {
      s = tsfirst;
      tsfirst = tsfirst.ts_next;
      tsfirst.ts_prev = null;
      if (s.seqst) tsfirst.seqst = true;
      s.p_v.sym = s.next;
      if (s.next) s.next.prev = null;
    }

    /* reset the staves */
    nstaff = sy.nstaff;
    for (st = 0; st <= nstaff; st++) reset_staff(st);

    /*
     * search the next end of line,
     * and mark the empty staves
     */
    for (s = tsfirst; s; s = s.ts_next) {
      if (s.nl) break;
      switch (s.type) {
        case C.STAVES:
          set_brace();
          sy.st_print = new Uint8Array(non_empty);
          sy = s.sy;
          while (nstaff < sy.nstaff) reset_staff(++nstaff);
          non_empty = [];
          continue;

        // the block symbols will be treated after music line generation
        case C.BLOCK:
          if (!s.play) {
            blocks.push(s);
            unlksym(s);
          }
          continue;
      }
      st = s.st;
      if (st > nstaff) {
        switch (s.type) {
          case C.CLEF:
            staff_tb[st].clef = s; // clef warning/change for new staff
            break;
          case C.KEY:
            s.p_v.ckey = s;
            break;
          //useless ?
          case C.METER:
            s.p_v.meter = s;
            break;
        }
        unlksym(s);
        continue;
      }
      if (non_empty[st]) continue;
      switch (s.type) {
        default:
          continue;
        case C.BAR:
          if (s.bar_mrep || sy.staves[st].staffnonote > 1) break;
          continue;
        case C.GRACE:
          break;
        case C.NOTE:
        case C.REST:
        case C.SPACE:
        case C.MREST:
          if (sy.staves[st].staffnonote > 1) break;
          if (s.invis) continue;
          if (sy.staves[st].staffnonote != 0 || s.type == C.NOTE) break;
          continue;
      }
      non_empty_gl[st] = non_empty[st] = true;
    }
    tsnext = s;

    /* set the last empty staves */
    set_brace();
    sy.st_print = new Uint8Array(non_empty);

    /* define the offsets of the measure bars */
    set_top_bot();

    /* move the symbols of the empty staves to the next staff */
    //fixme: could be optimized (use a old->new staff array)
    for (st = 0; st < nstaff; st++) {
      if (!non_empty_gl[st]) sym_staff_move(st);
    }

    /* let the last empty staff have a full height */
    if (!non_empty_gl[nstaff]) staff_tb[nstaff].topbar = 0;

    /* initialize the music line */
    init_music_line();

    // keep the array of the staves to be printed
    gene.st_print = new Uint8Array(non_empty_gl);

    // if not the end of the tune, set the end of the music line
    if (tsnext) {
      s = tsnext;
      delete s.nl;
      last = s.ts_prev;
      last.ts_next = null;

      // and the end of the voices
      nv = voice_tb.length;
      for (v = 0; v < nv; v++) {
        p_voice = voice_tb[v];
        if (p_voice.sym && p_voice.sym.time <= tsnext.time) {
          for (s = tsnext.ts_prev; s; s = s.ts_prev) {
            if (s.v == v) {
              p_voice.s_next = s.next;
              s.next = null;
              if (check_bar(s)) {
                tmp = s.wl;
                self.set_width(s);
                s.shrink += s.wl - tmp;
              }
              break;
            }
          }
          if (s) continue;
        }
        p_voice.s_next = p_voice.sym;
        p_voice.sym = null;
      }
    }
  }

  /* -- position the symbols along the staff -- */
  // (possible hook)
  Abc.prototype.set_sym_glue = function (width) {
    var s,
      g,
      ll,
      some_grace,
      spf, // spacing factor
      xmin = 0, // sigma shrink = minimum spacing
      xx = 0, // sigma natural spacing
      x = 0, // sigma expandable elements
      xs = 0, // sigma unexpandable elements with no space
      xse = 0; // sigma unexpandable elements with space

    /* calculate the whole space of the symbols */
    for (s = tsfirst; s; s = s.ts_next) {
      if (s.type == C.GRACE && !some_grace) some_grace = s;
      if (s.seqst) {
        xmin += s.shrink;
        if (s.space) {
          if (s.space < s.shrink) {
            xse += s.shrink;
            xx += s.shrink;
          } else {
            xx += s.space;
          }
        } else {
          xs += s.shrink;
        }
      }
    }

    // can occur when bar alone in a staff system
    if (!xx) {
      realwidth = 0;
      return;
    }

    // last line?
    ll =
      !tsnext || // yes
      (tsnext.type == C.BLOCK && // no, but followed by %%command
        !tsnext.play) ||
      blocks.length; //	(abcm2ps compatibility)

    // strong shrink
    if (xmin >= width) {
      if (xmin > width)
        error(
          1,
          s,
          "Line too much shrunk $1 $2 $3",
          xmin.toFixed(1),
          xx.toFixed(1),
          width.toFixed(1)
        );
      x = 0;
      for (s = tsfirst; s; s = s.ts_next) {
        if (s.seqst) x += s.shrink;
        s.x = x;
      }
      //		realwidth = width
      spf_last = 0;
    } else if (
      (ll && xx + xs > width * (1 - cfmt.stretchlast)) ||
      (!ll && (xx + xs > width || cfmt.stretchstaff))
    ) {
      if (xx == xse)
        // if no space
        xx += 5;
      for (var cnt = 4; --cnt >= 0; ) {
        spf = (width - xs - xse) / (xx - xse);
        xx = 0;
        xse = 0;
        x = 0;
        for (s = tsfirst; s; s = s.ts_next) {
          if (s.seqst) {
            if (s.space) {
              if (s.space * spf <= s.shrink) {
                xse += s.shrink;
                xx += s.shrink;
                x += s.shrink;
              } else {
                xx += s.space;
                x += s.space * spf;
              }
            } else {
              x += s.shrink;
            }
          }
          s.x = x;
        }
        if (Math.abs(x - width) < 0.1) break;
      }
      spf_last = spf;
    } else {
      // shorter line
      spf = (width - xs - xse) / xx;
      if (spf_last < spf) spf = spf_last;
      for (s = tsfirst; s; s = s.ts_next) {
        if (s.seqst) x += s.space * spf <= s.shrink ? s.shrink : s.space * spf;
        s.x = x;
      }
    }
    realwidth = x;

    /* set the x offsets of the grace notes */
    for (s = some_grace; s; s = s.ts_next) {
      if (s.type != C.GRACE) continue;
      if (s.gr_shift) x = s.prev.x + s.prev.wr;
      else x = s.x - s.wl;
      for (g = s.extra; g; g = g.next) g.x += x;
    }
  };

  // set the starting symbols of the voices for the new music line
  function set_sym_line() {
    var p_v,
      s,
      v = voice_tb.length;

    // set the first symbol of each voice
    while (--v >= 0) {
      p_v = voice_tb[v];
      if (p_v.sym && p_v.s_prev) p_v.sym.prev = p_v.s_prev;
      s = p_v.s_next; // (set in set_piece)
      p_v.sym = s;
      if (s) {
        if (s.prev) s.prev.next = s;
        p_v.s_prev = s.prev; // (save for play)
        s.prev = null;
      } else {
        p_v.s_prev = null;
      }
    }
  }

  // set the left offset the images
  function set_posx() {
    posx = img.lm / cfmt.scale;
  }

  // initialize the start of generation / new music line
  // and output the inter-staff blocks if any
  function gen_init() {
    var s = tsfirst,
      tim = s.time;

    for (; s; s = s.ts_next) {
      if (s.time != tim) {
        set_page();
        return;
      }
      switch (s.type) {
        case C.NOTE:
        case C.REST:
        case C.MREST:
        case C.SPACE:
          set_page();
          return;
        default:
          continue;
        case C.STAVES:
          cur_sy = s.sy;
          //			break
          continue;
        case C.BLOCK:
          if (s.play) continue; // keep for play
          self.block_gen(s);
          break;
      }
      unlksym(s);
      if (s.p_v.s_next == s) s.p_v.s_next = s.next;
    }
    tsfirst = null; /* no more notes */
  }

  /* -- generate the music -- */
  // (possible hook)
  Abc.prototype.output_music = function () {
    var v,
      lwidth,
      indent,
      line_height,
      ts1st,
      tslast,
      p_v,
      nv = voice_tb.length;

    gen_init();
    if (!tsfirst) return;
    set_global();
    if (nv > 1)
      // if many voices
      self.set_stem_dir(); // set the stems direction in 'multi'

    for (v = 0; v < nv; v++) set_beams(voice_tb[v].sym); /* decide on beams */

    self.set_stems(); // set the stem lengths
    if (nv > 1) {
      // if many voices
      set_rest_offset(); /* set the vertical offset of rests */
      set_overlap(); /* shift the notes on voice overlap */
      //		set_rp_bars()		// set repeat bars
    }
    set_acc_shft(); // set the horizontal offset of accidentals

    set_allsymwidth(); /* set the width of all symbols */

    indent = set_indent(true);

    /* if single line, adjust the page width */
    if (cfmt.singleline) {
      v = get_ck_width();
      lwidth = indent + v[0] + v[1] + get_width(tsfirst, null)[0];
      img.width = lwidth * cfmt.scale + img.lm + img.rm + 2;
    } else {
      /* else, split the tune into music lines */
      lwidth = get_lwidth();
      cut_tune(lwidth, indent);
    }

    // save symbol pointers for play
    ts1st = tsfirst;
    v = nv;
    while (--v >= 0) voice_tb[v].osym = voice_tb[v].sym;

    spf_last = 1.2; // last spacing factor
    while (1) {
      /* loop per music line */
      set_piece();
      self.set_sym_glue(lwidth - indent);
      if (realwidth) {
        if (indent) posx += indent;
        draw_sym_near(); // delayed output
        line_height = set_staff();
        draw_systems(indent);
        draw_all_sym();
        delayed_update();
        vskip(line_height);
        if (indent) {
          posx -= indent;
          insert_meter &= ~2; // no more indentation
        }
        while (blocks.length) self.block_gen(blocks.shift());
      }

      blk_flush();
      if (tslast) tslast.ts_next.ts_prev = tslast;
      if (!tsnext) break;
      tsnext.ts_prev.ts_next = tsfirst = tsnext; // (restore for play)

      // next line
      gen_init();
      if (!tsfirst) break;
      tslast = tsfirst.ts_prev;
      tsfirst.ts_prev = null;
      set_sym_line();
      lwidth = get_lwidth(); // the image size may have changed
      indent = set_indent();
    }

    // restore for play
    tsfirst = ts1st;
    v = nv;
    while (--v >= 0) {
      p_v = voice_tb[v];
      if (p_v.sym && p_v.s_prev) p_v.sym.prev = p_v.s_prev;
      p_v.sym = p_v.osym;
    }
  };

  /* -- reset the generator -- */
  function reset_gen() {
    insert_meter =
      cfmt.writefields.indexOf("M") >= 0
        ? 3 /* insert meter and indent */
        : 2; /* indent only */
  }
  // abc2svg - parse.js - ABC parse
  //
  // Copyright (C) 2014-2020 Jean-Francois Moine
  //
  // This file is part of abc2svg-core.
  //
  // abc2svg-core is free software: you can redistribute it and/or modify
  // it under the terms of the GNU Lesser General Public License as published by
  // the Free Software Foundation, either version 3 of the License, or
  // (at your option) any later version.
  //
  // abc2svg-core is distributed in the hope that it will be useful,
  // but WITHOUT ANY WARRANTY; without even the implied warranty of
  // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  // GNU Lesser General Public License for more details.
  //
  // You should have received a copy of the GNU Lesser General Public License
  // along with abc2svg-core.  If not, see <http://www.gnu.org/licenses/>.

  var a_gch, // array of parsed guitar chords
    a_dcn, // array of parsed decoration names
    multicol, // multi column object
    maps = {}; // maps object - see set_map()
  var qplet_tb = new Int8Array([0, 1, 3, 2, 3, 0, 2, 0, 3, 0]),
    ntb = "CDEFGABcdefgab";

  // set the source references of a symbol
  function set_ref(s) {
    s.fname = parse.fname;
    s.istart = parse.istart;
    s.iend = parse.iend;
  }

  // -- %% pseudo-comment

  // clef definition (%%clef, K: and V:)
  function new_clef(clef_def) {
    var s = {
        type: C.CLEF,
        clef_line: 2,
        clef_type: "t",
        v: curvoice.v,
        p_v: curvoice,
        time: curvoice.time,
        dur: 0,
      },
      i = 1;

    set_ref(s);

    switch (clef_def[0]) {
      case '"':
        i = clef_def.indexOf('"', 1);
        s.clef_name = clef_def.slice(1, i);
        i++;
        break;
      case "a":
        if (clef_def[1] == "u") {
          // auto
          s.clef_type = "a";
          s.clef_auto = true;
          i = 4;
          break;
        }
        i = 4; // alto
      case "C":
        s.clef_type = "c";
        s.clef_line = 3;
        break;
      case "b": // bass
        i = 4;
      case "F":
        s.clef_type = "b";
        s.clef_line = 4;
        break;
      case "n": // none
        i = 4;
        s.invis = true;
        break;
      case "t":
        if (clef_def[1] == "e") {
          // tenor
          s.clef_type = "c";
          s.clef_line = 4;
          break;
        }
        i = 6;
      case "G":
        //		s.clef_type = "t"		// treble
        break;
      case "p":
        i = 4;
      case "P": // perc
        s.clef_type = "p";
        s.clef_line = 3;
        curvoice.key.k_sf = 0; // no accidental
        curvoice.ckey.k_sf = 0;
        curvoice.ckey.k_map = abc2svg.keys[7];
        curvoice.ckey.k_b40 = 2;
        curvoice.ckey.k_drum = true; // no transpose
        break;
      default:
        syntax(1, "Unknown clef '$1'", clef_def);
        return; //undefined
    }
    if (clef_def[i] >= "1" && clef_def[i] <= "9") {
      s.clef_line = Number(clef_def[i]);
      i++;
    }
    if (clef_def[i + 1] != "8") return s;
    switch (
      clef_def[i] // octave
    ) {
      case "^":
        s.clef_oct_transp = true;
      case "+":
        s.clef_octave = 7;
        if (!s.clef_oct_transp) curvoice.snd_oct = 12; // MIDI higher octave
        break;
      case "_":
        s.clef_oct_transp = true;
      case "-":
        s.clef_octave = -7;
        if (!s.clef_oct_transp) curvoice.snd_oct = -12; // MIDI lower octave
        break;
    }
    return s;
  }

  // convert an interval to a base-40 interval
  function get_interval(param, score) {
    var i, val, tmp, note, pit;

    tmp = new scanBuf();
    tmp.buffer = param;
    pit = [];
    for (i = 0; i < 2; i++) {
      note = tmp.buffer[tmp.index] ? parse_acc_pit(tmp) : null;
      if (!note) {
        if (i != 1 || !score) {
          syntax(1, errs.bad_transp);
          return;
        }
        pit[i] = 242; // 'c' (C5)
      } else {
        pit[i] = abc2svg.pab40(note.pit, note.acc);
      }
    }
    return pit[1] - pit[0];
  }

  // set the linebreak character
  function set_linebreak(param) {
    var i, item;

    for (i = 0; i < 128; i++) {
      if (char_tb[i] == "\n") char_tb[i] = nil; // remove old definition
    }
    param = param.split(/\s+/);
    for (i = 0; i < param.length; i++) {
      item = param[i];
      switch (item) {
        case "!":
        case "$":
        case "*":
        case ";":
        case "?":
        case "@":
          break;
        case "<none>":
          continue;
        case "<EOL>":
          item = "\n";
          break;
        default:
          syntax(1, "Bad value '$1' in %%linebreak - ignored", item);
          continue;
      }
      char_tb[item.charCodeAt(0)] = "\n";
    }
  }

  // set a new user character (U: or %%user)
  function set_user(parm) {
    var k,
      c,
      v,
      a = parm.match(/(.)[=\s]*(\[I:.+\]|".+"|!.+!)$/);

    if (!a) {
      syntax(1, 'Lack of starting [, ! or " in U: / %%user');
      return;
    }
    c = a[1];
    v = a[2];
    if (c[0] == "\\") {
      if (c[1] == "t") c = "\t";
      else if (!c[1]) c = " ";
    }

    k = c.charCodeAt(0);
    if (k >= 128) {
      syntax(1, errs.not_ascii);
      return;
    }
    switch (char_tb[k][0]) {
      case "0": // nil
      case "d":
      case "i":
      case " ":
        break;
      case '"':
      case "!":
      case "[":
        if (char_tb[k].length > 1) break;
      // fall thru
      default:
        syntax(1, "Bad user character '$1'", c);
        return;
    }
    switch (v) {
      case "!beambreak!":
        v = " ";
        break;
      case "!ignore!":
        v = "i";
        break;
      case "!nil!":
      case "!none!":
        v = "d";
        break;
    }
    char_tb[k] = v;
  }

  // get a stafflines value
  function get_st_lines(param) {
    if (!param) return;
    if (/^[\]\[|.-]+$/.test(param)) return param.replace(/\]/g, "[");

    var n = parseInt(param);
    switch (n) {
      case 0:
        return "...";
      case 1:
        return "..|";
      case 2:
        return ".||";
      case 3:
        return ".|||";
    }
    if (isNaN(n) || n < 0 || n > 16) return; //undefined
    return "||||||||||||||||".slice(0, n);
  }

  // create a block symbol in the tune body
  function new_block(subtype) {
    var s = {
      type: C.BLOCK,
      subtype: subtype,
      dur: 0,
    };

    if (parse.state == 2) goto_tune();
    if (subtype.slice(0, 4) != "midi")
      // if not a play command
      curvoice = voice_tb[0]; // set the block in the first voice
    sym_link(s);
    return s;
  }

  // set the voice parameters
  // (possible hook)
  Abc.prototype.set_vp = function (a) {
    var s, item, pos, val, clefpit;

    while (1) {
      item = a.shift();
      if (!item) break;
      if (item.slice(-1) == "=" && !a.length) {
        syntax(1, errs.bad_val, item);
        break;
      }
      switch (item) {
        case "clef=":
          s = a.shift(); // keep last clef
          break;
        case "clefpitch=":
          item = a.shift(); // (<note><octave>)
          if (item) {
            val = ntb.indexOf(item[0]);
            if (val >= 0) {
              switch (item[1]) {
                case "'":
                  val += 7;
                  break;
                case ",":
                  val -= 7;
                  if (item[2] == ",") val -= 7;
                  break;
              }
              clefpit = 4 - val; // 4 = 'G'
              break;
            }
          }
          syntax(1, errs.bad_val, item);
          break;
        case "octave=":
          val = parseInt(a.shift());
          if (isNaN(val)) syntax(1, errs.bad_val, item);
          else curvoice.octave = val;
          break;
        case "cue=":
          curvoice.scale = a.shift() == "on" ? 0.7 : 1;
          break;
        case "instrument=":
          // instrument=M/N => score=MN and sound=cN
          // (instrument=M == instrument=M/M)
          item = a.shift();
          val = item.indexOf("/");
          if (val < 0) {
            val = 0;
            curvoice.sndtran = get_interval("c" + item);
          } else {
            curvoice.sndtran = get_interval("c" + item.slice(val + 1));
            val = get_interval(item.replace("/", ""));
          }
          curvoice.transp = cfmt.sound ? curvoice.sndtran : val;
          break;
        case "map=": // %%voicemap
          curvoice.map = a.shift();
          break;
        case "name=":
        case "nm=":
          curvoice.nm = a.shift();
          if (curvoice.nm[0] == '"') curvoice.nm = curvoice.nm.slice(1, -1);
          curvoice.new_name = true;
          break;
        case "stem=":
        case "pos=":
          if (item == "pos=") item = a.shift().split(" ");
          else item = ["stm", a.shift()];
          val = posval[item[1]];
          if (val == undefined) {
            syntax(1, errs.bad_val, item[0]);
            break;
          }
          if (!pos) pos = {};
          pos[item[0]] = val;
          break;
        case "scale=": // %%voicescale
          val = parseFloat(a.shift());
          if (isNaN(val) || val < 0.6 || val > 1.5)
            syntax(1, errs.bad_val, "%%voicescale");
          else curvoice.scale = val;
          break;
        case "score=":
          if (cfmt.nedo) {
            syntax(1, errs.notransp);
            break;
          }
          // score=MN
          // (score=M == score=Mc)
          item = a.shift();
          if (cfmt.sound) break;
          curvoice.transp = get_interval(item, true);
          break;
        case "shift=":
          if (cfmt.nedo) {
            syntax(1, errs.notransp);
            break;
          }
          curvoice.shift = curvoice.sndsh = get_interval(a.shift());
          break;
        case "sound=":
          if (cfmt.nedo) {
            syntax(1, errs.notransp);
            break;
          }
          // concert-score display: apply sound=
          // sounding-score display: apply sound= only if M != c/C
          // sound: apply sound=
          curvoice.sndtran = get_interval(a.shift());
          if (cfmt.sound) curvoice.transp = curvoice.sndtran;
          break;
        case "subname=":
        case "sname=":
        case "snm=":
          curvoice.snm = a.shift();
          if (curvoice.snm[0] == '"') curvoice.snm = curvoice.snm.slice(1, -1);
          break;
        case "stafflines=":
          val = get_st_lines(a.shift());
          if (val == undefined) syntax(1, "Bad %%stafflines value");
          else if (curvoice.st != undefined)
            par_sy.staves[curvoice.st].stafflines = val;
          else curvoice.stafflines = val;
          break;
        case "staffnonote=":
          val = parseInt(a.shift());
          if (isNaN(val)) syntax(1, "Bad %%staffnonote value");
          else curvoice.staffnonote = val;
          break;
        case "staffscale=":
          val = parseFloat(a.shift());
          if (isNaN(val) || val < 0.3 || val > 2)
            syntax(1, "Bad %%staffscale value");
          else curvoice.staffscale = val;
          break;
        case "transpose=": // (abcMIDI compatibility)
          if (cfmt.nedo) {
            syntax(1, errs.notransp);
            break;
          }
          val = get_transp(a.shift());
          if (val == undefined) {
            syntax(1, errs.bad_transp);
          } else {
            curvoice.sndtran = val;
            if (cfmt.sound) curvoice.transp = val;
          }
          break;
        default:
          switch (item.slice(0, 4)) {
            case "treb":
            case "bass":
            case "alto":
            case "teno":
            case "perc":
              s = item;
              break;
            default:
              if ("GFC".indexOf(item[0]) >= 0) s = item;
              else if (item.slice(-1) == "=") a.shift();
              break;
          }
          break;
      }
    }
    if (pos) {
      curvoice.pos = clone(curvoice.pos);
      for (item in pos)
        if (pos.hasOwnProperty(item)) curvoice.pos[item] = pos[item];
    }

    if (s) {
      s = new_clef(s);
      if (s) {
        if (clefpit) s.clefpit = clefpit;
        get_clef(s);
      }
    }
  }; // set_vp()

  // set the K: / V: parameters
  function set_kv_parm(a) {
    // array of items
    if (!curvoice.init) {
      // add the global parameters if not done yet
      curvoice.init = true;
      if (info.V) {
        if (info.V["*"]) a = info.V["*"].concat(a);
        if (info.V[curvoice.id]) a = info.V[curvoice.id].concat(a);
      }
    }
    if (a.length) self.set_vp(a);
  } // set_kv_parm()

  // memorize the K:/V: parameters
  function memo_kv_parm(
    vid, // voice ID (V:) / '*' (K:/V:*)
    a
  ) {
    // array of items
    if (!a.length) return;
    if (!info.V) info.V = {};
    if (info.V[vid]) Array.prototype.push.apply(info.V[vid], a);
    else info.V[vid] = a;
  }

  // K: key signature
  // return the key and the voice/clef parameters
  function new_key(param) {
    var i,
      clef,
      key_end,
      c,
      tmp,
      exp,
      sf = "FCGDAEB".indexOf(param[0]) - 1,
      mode = 0,
      s = {
        type: C.KEY,
        dur: 0,
      };

    // set the accidentals when K: with modified accidentals
    function set_k_acc(s, sf) {
      var i,
        j,
        n,
        nacc,
        p_acc,
        accs = [],
        pits = [];

      if (sf > 0) {
        for (nacc = 0; nacc < sf; nacc++) {
          accs[nacc] = 1; // sharp
          pits[nacc] = [26, 23, 27, 24, 21, 25, 22][nacc];
        }
      } else {
        for (nacc = 0; nacc < -sf; nacc++) {
          accs[nacc] = -1; // flat
          pits[nacc] = [22, 25, 21, 24, 20, 23, 26][nacc];
        }
      }
      n = s.k_a_acc.length;
      for (i = 0; i < n; i++) {
        p_acc = s.k_a_acc[i];
        for (j = 0; j < nacc; j++) {
          if (pits[j] == p_acc.pit) {
            accs[j] = p_acc.acc;
            break;
          }
        }
        if (j == nacc) {
          accs[j] = p_acc.acc;
          pits[j] = p_acc.pit;
          nacc++;
        }
      }
      for (i = 0; i < nacc; i++) {
        p_acc = s.k_a_acc[i];
        if (!p_acc) p_acc = s.k_a_acc[i] = {};
        p_acc.acc = accs[i];
        p_acc.pit = pits[i];
      }
    } // set_k_acc()

    // code of new_key()
    set_ref(s);

    // tonic
    i = 1;
    if (sf < -1) {
      switch (param[0]) {
        case "H": // bagpipe
          if (param[1].toLowerCase() != "p") {
            syntax(1, "Unknown bagpipe-like key");
            key_end = true;
            break;
          }
          s.k_bagpipe = param[1];
          sf = param[1] == "P" ? 0 : 2;
          i++;

          // initialize the temperament if not done yet
          if (!cfmt.temper)
            // detune in cents for just intonation in A
            //  C    ^C     D    _E     E     F    ^F     G    _A     A    _B     B
            // 15.3 -14.0  -2.0 -10.0   1.9  13.3 -16.0 -31.8 -12.0   0.0  11.4   3.8
            // (C is ^C,			F is ^F and G is =G)
            // 86				 84
            // temp = [100-14, -14, -2, -10, 2, 100-16, -16, -32, -12, 0, 11, 4]
            // but 'A' bagpipe = 480Hz => raise Math.log2(480/440)*1200 = 151
            cfmt.temper = new Float32Array([
              //	2.37, 1.37, 1.49, 1.41, 1.53, 2.35, 1.35, 1.19, 1.39, 1.51, 1.62, 1.55
              //   C    ^C     D    _E     E     F    ^F     G    _A      A     _B      B
              11.62,
              12.55,
              2.37,
              2.37,
              3.49,
              0,
              2.37,
              2.37,
              3.49,
              4.41,
              5.53,
              0,
              3.49,
              4.41,
              5.53,
              7.35,
              7.35,
              4.41,
              5.53,
              7.35,
              7.35,
              8.19,
              0,
              7.35,
              7.35,
              8.19,
              9.39,
              10.51,
              0,
              8.19,
              9.39,
              10.51,
              11.62,
              12.55,
              0,
              10.51,
              11.62,
              12.55,
              2.37,
              2.37,
            ]);
          break;
        case "P":
          syntax(1, "K:P is deprecated");
          sf = 0;
          s.k_drum = true;
          key_end = true;
          break;
        case "n": // none
          if (param.indexOf("none") == 0) {
            sf = 0;
            s.k_none = true;
            i = 4;
            break;
          }
        // fall thru
        default:
          s.k_map = [];
          s.k_mode = 0;
          return [s, info_split(param)];
      }
    }

    if (!key_end) {
      switch (param[i]) {
        case "#":
          sf += 7;
          i++;
          break;
        case "b":
          sf -= 7;
          i++;
          break;
      }
      param = param.slice(i).trim();
      switch (param.slice(0, 3).toLowerCase()) {
        default:
          if (
            param[0] != "m" ||
            (param[1] != " " && param[1] != "\t" && param[1] != "\n")
          ) {
            key_end = true;
            break;
          }
        // fall thru ('m')
        case "aeo":
        case "m":
        case "min":
          sf -= 3;
          mode = 5;
          break;
        case "dor":
          sf -= 2;
          mode = 1;
          break;
        case "ion":
        case "maj":
          break;
        case "loc":
          sf -= 5;
          mode = 6;
          break;
        case "lyd":
          sf += 1;
          mode = 3;
          break;
        case "mix":
          sf -= 1;
          mode = 4;
          break;
        case "phr":
          sf -= 4;
          mode = 2;
          break;
      }
      if (!key_end) param = param.replace(/\w+\s*/, "");

      // [exp] accidentals
      if (param.indexOf("exp ") == 0) {
        param = param.replace(/\w+\s*/, "");
        if (!param) syntax(1, "No accidental after 'exp'");
        exp = true;
      }
      c = param[0];
      if (c == "^" || c == "_" || c == "=") {
        s.k_a_acc = [];
        tmp = new scanBuf();
        tmp.buffer = param;
        do {
          var note = parse_acc_pit(tmp);
          if (!note) break;
          s.k_a_acc.push(note);
          c = param[tmp.index];
          while (c == " ") c = param[++tmp.index];
        } while (c == "^" || c == "_" || c == "=");
        if (!exp) set_k_acc(s, sf);
        param = param.slice(tmp.index);
      } else if (exp && param.indexOf("none") == 0) {
        sf = 0;
        param = param.replace(/\w+\s*/, "");
      }
    }

    s.k_sf = sf;

    // set the map of the notes with accidentals
    if (s.k_a_acc) {
      s.k_map = [];
      i = s.k_a_acc.length;
      while (--i >= 0) {
        note = s.k_a_acc[i];
        s.k_map[(note.pit + 19) % 7] = note.acc;
      }
    } else {
      s.k_map = abc2svg.keys[sf + 7];
    }
    s.k_mode = mode;

    // key note as base-40
    s.k_b40 = [1, 24, 7, 30, 13, 36, 19, 2, 25, 8, 31, 14, 37, 20, 3][sf + 7];

    return [s, info_split(param)];
  }

  // M: meter
  function new_meter(p) {
    var s = {
        type: C.METER,
        dur: 0,
        a_meter: [],
      },
      meter = {},
      val,
      v,
      m1 = 0,
      m2,
      i = 0,
      j,
      wmeasure,
      in_parenth;

    set_ref(s);

    if (p.indexOf("none") == 0) {
      i = 4; /* no meter */
      wmeasure = 1; // simplify measure numbering and C.MREST conversion
    } else {
      wmeasure = 0;
      while (i < p.length) {
        if (p[i] == "=") break;
        switch (p[i]) {
          case "C":
            meter.top = p[i++];
            if (!m1) {
              m1 = 4;
              m2 = 4;
            }
            break;
          case "c":
          case "o":
            meter.top = p[i++];
            if (!m1) {
              if (p[i - 1] == "c") {
                m1 = 2;
                m2 = 4; // c = 2/4
              } else {
                m1 = 3;
                m2 = 4; // o = 3/4
              }
              switch (p[i]) {
                case "|":
                  m2 /= 2; // c| = 2/2, o| = 3/2
                  break;
                case ".":
                  m1 *= 3;
                  m2 *= 2; // c. = 6/8, o. = 9/8
                  break;
              }
            }
            break;
          case ".":
          case "|":
            m1 = 0;
            meter.top = p[i++];
            break;
          case "(":
            if (p[i + 1] == "(") {
              /* "M:5/4 ((2+3)/4)" */
              in_parenth = true;
              meter.top = p[i++];
              s.a_meter.push(meter);
              meter = {};
            }
            j = i + 1;
            while (j < p.length) {
              if (p[j] == ")" || p[j] == "/") break;
              j++;
            }
            if (p[j] == ")" && p[j + 1] == "/") {
              /* "M:5/4 (2+3)/4" */
              i++; /* remove the parenthesis */
              continue;
            } /* "M:5 (2+3)" */
          /* fall thru */
          case ")":
            in_parenth = p[i] == "(";
            meter.top = p[i++];
            s.a_meter.push(meter);
            meter = {};
            continue;
          default:
            if (p[i] <= "0" || p[i] > "9") {
              syntax(1, "Bad char '$1' in M:", p[i]);
              return;
            }
            m2 = 2; /* default when no bottom value */
            meter.top = p[i++];
            for (;;) {
              while (p[i] >= "0" && p[i] <= "9") meter.top += p[i++];
              if (p[i] == ")") {
                if (p[i + 1] != "/") break;
                i++;
              }
              if (p[i] == "/") {
                i++;
                if (p[i] <= "0" || p[i] > "9") {
                  syntax(1, "Bad char '$1' in M:", p[i]);
                  return;
                }
                meter.bot = p[i++];
                while (p[i] >= "0" && p[i] <= "9") meter.bot += p[i++];
                break;
              }
              if (p[i] != " " && p[i] != "+") break;
              if (i >= p.length || p[i + 1] == "(") /* "M:5 (2/4+3/4)" */ break;
              meter.top += p[i++];
            }
            m1 = parseInt(meter.top);
            break;
        }
        if (!in_parenth) {
          if (meter.bot) m2 = parseInt(meter.bot);
          wmeasure += (m1 * C.BLEN) / m2;
        }
        s.a_meter.push(meter);
        meter = {};
        while (p[i] == " ") i++;
        if (p[i] == "+") {
          meter.top = p[i++];
          s.a_meter.push(meter);
          meter = {};
        }
      }
    }
    if (p[i] == "=") {
      val = p.substring(++i).match(/^(\d+)\/(\d+)$/);
      if (!val) {
        syntax(1, "Bad duration '$1' in M:", p.substring(i));
        return;
      }
      wmeasure = (C.BLEN * val[1]) / val[2];
    }
    s.wmeasure = wmeasure;

    if (cfmt.writefields.indexOf("M") < 0) s.a_meter = [];

    if (parse.state != 3) {
      info.M = p;
      glovar.meter = s;
      if (parse.state >= 1) {
        /* in the tune header, change the unit note length */
        if (!glovar.ulen) {
          if (wmeasure <= 1 || wmeasure >= (C.BLEN * 3) / 4)
            glovar.ulen = C.BLEN / 8;
          else glovar.ulen = C.BLEN / 16;
        }
        for (v = 0; v < voice_tb.length; v++) {
          voice_tb[v].meter = s;
          voice_tb[v].wmeasure = wmeasure;
        }
      }
    } else {
      curvoice.wmeasure = wmeasure;
      if (is_voice_sig()) {
        curvoice.meter = s;
        reset_gen();
      } else {
        sym_link(s);
      }
    }
  }

  /* Q: tempo */
  function new_tempo(text) {
    var i,
      c,
      d,
      nd,
      txt = text, // (for info.Q)
      s = {
        type: C.TEMPO,
        dur: 0,
      };

    // get a note duration
    function get_nd(p) {
      var n,
        d,
        nd = p.match(/(\d+)\/(\d+)/);

      if (nd) {
        d = Number(nd[2]);
        if (d && !isNaN(d) && !(d & (d - 1))) {
          n = Number(nd[1]);
          if (!isNaN(n)) return (C.BLEN * n) / d;
        }
      }
      syntax(1, "Invalid note duration $1", c);
    } // get_nd()

    set_ref(s);

    if (cfmt.writefields.indexOf("Q") < 0) s.invis = true; // don't display

    /* string before */
    if (text[0] == '"') {
      c = text.match(/"([^"]*)"/); // "
      if (!c) {
        syntax(1, "Unterminated string in Q:");
        return;
      }
      s.tempo_str1 = c[1];
      text = text.slice(c[0].length).replace(/^\s+/, "");
    }

    // string after
    if (text.slice(-1) == '"') {
      i = text.indexOf('"');
      s.tempo_str2 = text.slice(i + 1, -1);
      text = text.slice(0, i).replace(/\s+$/, "");
    }

    /* beat */
    i = text.indexOf("=");
    if (i > 0) {
      d = text.slice(0, i).split(/\s+/);
      text = text.slice(i + 1).replace(/^\s+/, "");
      while (1) {
        c = d.shift();
        if (!c) break;
        nd = get_nd(c);
        if (!nd) return;
        if (!s.tempo_notes) s.tempo_notes = [];
        s.tempo_notes.push(nd);
      }

      // tempo value
      if (text.slice(0, 4) == "ca. ") {
        s.tempo_ca = "ca. ";
        text = text.slice(4);
      }
      i = text.indexOf("/");
      if (i > 0) {
        nd = get_nd(text);
        if (!nd) return;
        s.new_beat = nd;
      } else {
        s.tempo = Number(text);
        if (!s.tempo || isNaN(s.tempo)) {
          syntax(1, "Bad tempo value");
          return;
        }
      }
    }

    if (parse.state != 3) {
      if (parse.state == 1) {
        // tune header
        info.Q = txt;
        glovar.tempo = s;
        return;
      }
      goto_tune();
    }
    sym_link(s);
    if (glovar.tempo && curvoice.time == 0) glovar.tempo.invis = true;
  }

  // treat the information fields which may embedded
  function do_info(info_type, text) {
    var s, d1, d2, a, vid;

    switch (info_type) {
      // info fields in any state
      case "I":
        self.do_pscom(text);
        break;
      case "L":
        //fixme: ??
        if (parse.state == 2) goto_tune();
        a = text.match(/^1\/(\d+)(=(\d+)\/(\d+))?$/);
        if (a) {
          d1 = Number(a[1]);
          if (!d1 || (d1 & (d1 - 1)) != 0) break;
          d1 = C.BLEN / d1;
          if (a[2]) {
            // if '='
            d2 = Number(a[4]);
            d2 = d2 ? (Number(a[3]) / d2) * C.BLEN : 0;
          } else {
            d2 = d1;
          }
        } else if (text == "auto") {
          d1 = d2 = -1;
        }
        if (!d2) {
          syntax(1, "Bad L: value");
          break;
        }
        if (parse.state < 2) {
          glovar.ulen = d1;
        } else {
          curvoice.ulen = d1;
          curvoice.dur_fact = d2 / d1;
        }
        break;
      case "M":
        new_meter(text);
        break;
      case "U":
        set_user(text);
        break;

      // fields in tune header or tune body
      case "P":
        if (parse.state == 0) break;
        if (parse.state == 1) {
          info.P = text;
          break;
        }
        if (parse.state == 2) goto_tune();
        s = {
          type: C.PART,
          text: text,
          dur: 0,
        };
        if (cfmt.writefields.indexOf(info_type) < 0) s.invis = true;
        sym_link(s);
        break;
      case "Q":
        if (parse.state == 0) break;
        new_tempo(text);
        break;
      case "V":
        get_voice(text);
        if (parse.state == 3) curvoice.ignore = !par_sy.voices[curvoice.v];
        break;

      // key signature at end of tune header or in tune body
      case "K":
        if (!parse.state)
          // ignore if in file header
          break;
        get_key(text);
        break;

      // info in any state
      case "N":
      case "R":
        if (!info[info_type]) info[info_type] = text;
        else info[info_type] += "\n" + text;
        break;
      case "r":
        if (!user.keep_remark || parse.state != 3) break;
        s = {
          type: C.REMARK,
          text: text,
          dur: 0,
        };
        sym_link(s);
        break;
      default:
        syntax(0, "'$1:' line ignored", info_type);
        break;
    }
  }

  // music line parsing functions

  /* -- adjust the duration and time of symbols in a measure when L:auto -- */
  function adjust_dur(s) {
    var s2, time, auto_time, i, fac;

    /* search the start of the measure */
    s2 = curvoice.last_sym;
    if (!s2) return;

    /* the bar time is correct if there are multi-rests */
    if (s2.type == C.MREST || s2.type == C.BAR) /* in second voice */ return;
    while (s2.type != C.BAR && s2.prev) s2 = s2.prev;
    time = s2.time;
    auto_time = curvoice.time - time;
    fac = curvoice.wmeasure / auto_time;

    /* remove the invisible rest at start of tune */
    if (time == 0) {
      while (s2 && !s2.dur) s2 = s2.next;
      if (s2 && s2.type == C.REST && s2.invis) {
        time += s2.dur * fac;
        if (s2.prev) s2.prev.next = s2.next;
        else curvoice.sym = s2.next;
        if (s2.next) s2.next.prev = s2.prev;
        s2 = s2.next;
      }
    }
    if (curvoice.wmeasure == auto_time) return; /* already good duration */

    for (; s2; s2 = s2.next) {
      s2.time = time;
      if (!s2.dur || s2.grace) continue;
      s2.dur *= fac;
      s2.dur_orig *= fac;
      time += s2.dur;
      if (s2.type != C.NOTE && s2.type != C.REST) continue;
      for (i = 0; i <= s2.nhd; i++) s2.notes[i].dur *= fac;
    }
    curvoice.time = s.time = time;
  }

  /* -- parse a bar -- */
  function new_bar(dotted) {
    var s2,
      c,
      bar_type,
      line = parse.line,
      s = {
        type: C.BAR,
        fname: parse.fname,
        istart: parse.bol + line.index,
        dur: 0,
        multi: 0, // needed for decorations
      };

    if (dotted) s.bar_dotted = true;
    if (vover && vover.bar)
      // end of voice overlay
      get_vover("|");
    if (glovar.new_nbar) {
      // %%setbarnb
      s.bar_num = glovar.new_nbar;
      glovar.new_nbar = 0;
    }
    bar_type = line.char();
    while (1) {
      c = line.next_char();
      switch (c) {
        case "|":
        case "[":
        case "]":
        case ":":
          bar_type += c;
          continue;
      }
      break;
    }
    if (bar_type[0] == ":") {
      if (bar_type.length == 1) {
        // ":" alone
        bar_type = "|";
        s.bar_dotted = true;
      } else {
        s.rbstop = 2; // right repeat with end
        if (curvoice.tie_s) curvoice.tie_s.tie_s = s;
      }
    }

    // set the guitar chord and the decorations
    if (a_gch) self.gch_build(s);
    if (a_dcn) {
      deco_cnv(a_dcn, s);
      a_dcn = null;
    }
    // YYMComment:  如果有高八度
    // set the start/stop of ottava
    if (parse.ottava.length) {
      s2 = s;
      if (curvoice.cst != curvoice.st) {
        // if staff change
        s2 = {
          type: C.SPACE, // put the decoration on a ...
          fname: parse.fname,
          istart: parse.bol + line.index,
          dur: 0,
          multi: 0,
          invis: true,
          width: 1, // .. small space
        };
        sym_link(s2);
      }
      s2.ottava = parse.ottava;
      parse.ottava = [];
    }

    /* if the last element is '[', it may start
     * a chord or an embedded header */
    switch (bar_type.slice(-1)) {
      case "[":
        if (/[0-9" ]/.test(c))
          // "
          break;
        bar_type = bar_type.slice(0, -1);
        line.index--;
        c = "[";
        break;
      case ":": // left repeat
        s.rbstop = 2; // with bracket end
        break;
    }

    // check if repeat bar
    if (c > "0" && c <= "9") {
      s.text = c;
      while (1) {
        c = line.next_char();
        if ("0123456789,.-".indexOf(c) < 0) break;
        s.text += c;
      }
      s.rbstop = 2;
      s.rbstart = 2;
    } else if (c == '"' && bar_type.slice(-1) == "[") {
      s.text = "";
      while (1) {
        c = line.next_char();
        if (!c) {
          syntax(1, "No end of repeat string");
          return;
        }
        if (c == '"') {
          line.index++;
          break;
        }
        s.text += c;
      }
      s.rbstop = 2;
      s.rbstart = 2;
    }

    // ']' as the first character indicates a repeat bar stop
    if (bar_type[0] == "]") {
      s.rbstop = 2; // with end
      if (bar_type.length != 1) bar_type = bar_type.slice(1);
      else s.invis = true;
    }

    s.iend = parse.bol + line.index;

    if (s.rbstart && curvoice.norepbra && !curvoice.second) s.norepbra = true;

    // handle the accidentals (ties and repeat)
    if (s.text) {
      if (bar_type.slice(-1) == "[" && bar_type != "[")
        bar_type = bar_type.slice(0, -1);
      if (s.text[0] == "1") {
        if (curvoice.tie_s) curvoice.tie_s_rep = curvoice.tie_s;
        if (curvoice.acc_tie) curvoice.acc_tie_rep = curvoice.acc_tie.slice();
        else if (curvoice.acc_tie_rep) curvoice.acc_tie_rep = null;
      } else {
        if (curvoice.tie_s_rep) {
          curvoice.tie_s = clone(curvoice.tie_s_rep);
          curvoice.tie_s.notes = clone(curvoice.tie_s.notes);
          for (var m = 0; m <= curvoice.tie_s.nhd; m++) {
            curvoice.tie_s.notes[m] = clone(curvoice.tie_s.notes[m]);
            curvoice.tie_s.notes[m].s = curvoice.tie_s;
          }
        }
        if (curvoice.acc_tie_rep)
          curvoice.acc_tie = curvoice.acc_tie_rep.slice();
      }
    }
    if (curvoice.ulen < 0)
      // L:auto
      adjust_dur(s);

    s2 = curvoice.last_sym;
    if (s2 && s2.time == curvoice.time) {
      if (bar_type == "[" || bar_type == "|:") {
        // search if a previous bar at this time
        do {
          if (s2.type == C.BAR) break;
          if (w_tb[s2.type])
            // symbol with a width
            break;
          s2 = s2.prev;
        } while (s2);
        if (s2 && s2.type == C.BAR) {
          //		&& !s2.a_gch && !s2.a_dd
          //		&& !s.a_gch && !s.a_dd) {

          // remove the invisible repeat bars
          // when no shift is needed
          if (
            bar_type == "[" &&
            !s2.text &&
            (curvoice.st == 0 ||
              par_sy.staves[curvoice.st - 1].flags & STOP_BAR ||
              s.norepbra)
          ) {
            if (s.text) s2.text = s.text;
            if (s.a_gch) s2.a_gch = s.a_gch;
            if (s.norepbra) s2.norepbra = s.norepbra;
            if (s.rbstart) s2.rbstart = s.rbstart;
            if (s.rbstop) s2.rbstop = s.rbstop;
            //--fixme: pb when on next line and empty staff above
            return;
          }

          // merge back-to-back repeat bars
          if (s2.st == curvoice.st && bar_type == "|:") {
            if (s2.bar_type == ":|") {
              s2.bar_type = "::";
              s2.rbstop = 2;
              return;
            }
            if (s2.bar_type == "||") {
              s2.bar_type = "||:";
              s2.rbstop = 2;
              return;
            }
          }
        }
      }
    }

    /* set some flags */
    switch (bar_type) {
      case "[":
        s.rbstop = 2;
      case "[]":
      case "[|]":
        s.invis = true;
        bar_type = "[]";
        break;
      case ":|:":
      case ":||:":
        bar_type = "::";
        break;
      case "||":
        if (!cfmt.rbdbstop) break;
      case "[|":
      case "|]":
        s.rbstop = 2;
        break;
    }
    s.bar_type = bar_type;
    if (!curvoice.lyric_restart) curvoice.lyric_restart = s;
    if (!curvoice.sym_restart) curvoice.sym_restart = s;

    sym_link(s);

    s.st = curvoice.st; /* original staff */

    /* if repeat bar and shift, add a repeat bar */
    if (
      s.rbstart &&
      !curvoice.norepbra &&
      curvoice.st > 0 &&
      !(par_sy.staves[curvoice.st - 1].flags & STOP_BAR)
    ) {
      s2 = {
        type: C.BAR,
        fname: s.fname,
        istart: s.istart,
        iend: s.iend,
        bar_type: "[",
        multi: 0,
        invis: true,
        text: s.text,
        rbstart: 2,
      };
      sym_link(s2);
      s2.st = curvoice.st;
      delete s.text;
      s.rbstart = 0;
    }

    if (!s.bar_dotted && !s.invis) curvoice.acc = []; // no accidental anymore
  }

  // parse %%staves / %%score
  // return an array of [vid, flags] / null
  function parse_staves(p) {
    var v,
      vid,
      vids = {},
      a_vf = [],
      err = false,
      flags = 0,
      brace = 0,
      bracket = 0,
      parenth = 0,
      flags_st = 0,
      e,
      a = p.match(/[^[\]|{}()*+\s]+|[^\s]/g);

    if (!a) {
      syntax(1, errs.bad_val, "%%score");
      return; // null
    }
    while (1) {
      e = a.shift();
      if (!e) break;
      switch (e) {
        case "[":
          if (parenth || brace + bracket >= 2) {
            syntax(1, errs.misplaced, "[");
            err = true;
            break;
          }
          flags |= brace + bracket == 0 ? OPEN_BRACKET : OPEN_BRACKET2;
          bracket++;
          flags_st <<= 8;
          flags_st |= OPEN_BRACKET;
          break;
        case "{":
          if (parenth || brace || bracket >= 2) {
            syntax(1, errs.misplaced, "{");
            err = true;
            break;
          }
          flags |= !bracket ? OPEN_BRACE : OPEN_BRACE2;
          brace++;
          flags_st <<= 8;
          flags_st |= OPEN_BRACE;
          break;
        case "(":
          if (parenth) {
            syntax(1, errs.misplaced, "(");
            err = true;
            break;
          }
          flags |= OPEN_PARENTH;
          parenth++;
          flags_st <<= 8;
          flags_st |= OPEN_PARENTH;
          break;
        case "*":
          if (brace && !parenth && !(flags & (OPEN_BRACE | OPEN_BRACE2)))
            flags |= FL_VOICE;
          break;
        case "+":
          flags |= MASTER_VOICE;
          break;
        case "]":
        case "}":
        case ")":
          syntax(1, "Bad voice ID in %%score");
          err = true;
          break;
        default:
          // get / create the voice in the voice table
          vid = e;
          while (1) {
            e = a.shift();
            if (!e) break;
            switch (e) {
              case "]":
                if (!(flags_st & OPEN_BRACKET)) {
                  syntax(1, errs.misplaced, "]");
                  err = true;
                  break;
                }
                bracket--;
                flags |= brace + bracket == 0 ? CLOSE_BRACKET : CLOSE_BRACKET2;
                flags_st >>= 8;
                continue;
              case "}":
                if (!(flags_st & OPEN_BRACE)) {
                  syntax(1, errs.misplaced, "}");
                  err = true;
                  break;
                }
                brace--;
                flags |= !bracket ? CLOSE_BRACE : CLOSE_BRACE2;
                flags &= ~FL_VOICE;
                flags_st >>= 8;
                continue;
              case ")":
                if (!(flags_st & OPEN_PARENTH)) {
                  syntax(1, errs.misplaced, ")");
                  err = true;
                  break;
                }
                parenth--;
                flags |= CLOSE_PARENTH;
                flags_st >>= 8;
                continue;
              case "|":
                flags |= STOP_BAR;
                continue;
            }
            break;
          }
          if (vids[vid]) {
            syntax(1, "Double voice in %%score");
            //				err = true
          } else {
            vids[vid] = true;
            a_vf.push([vid, flags]);
          }
          flags = 0;
          if (!e) break;
          a.unshift(e);
          break;
      }
    }
    if (flags_st != 0) {
      syntax(1, "'}', ')' or ']' missing in %%score");
      err = true;
    }
    if (err || !a_vf.length) return; //null
    return a_vf;
  }

  // split an info string
  function info_split(text) {
    if (!text) return [];
    var a = text.match(/=?[^\s"=]+=?|".+?"/g); // "
    if (!a) {
      //fixme: bad error text
      syntax(1, "Unterminated string");
      return [];
    }
    return a;
  }

  // parse a duration and return [numerator, denominator]
  // 'line' is not always 'parse.line'
  var reg_dur = /(\d*)(\/*)(\d*)/g; /* (stop comment) */

  function parse_dur(line) {
    var res, num, den;

    reg_dur.lastIndex = line.index;
    res = reg_dur.exec(line.buffer);
    if (!res[0]) return [1, 1];
    num = res[1] || 1;
    den = res[3] || 1;
    if (!res[3]) den *= 1 << res[2].length;
    line.index = reg_dur.lastIndex;
    return [num, den];
  }
  // YYMComment: 解析 音符的附加属性和 pitch值
  // parse the note accidental and pitch
  function parse_acc_pit(line) {
    var note,
      acc,
      pit,
      d,
      nd,
      c = line.char();

    // optional accidental
    switch (c) {
      case "^":
        c = line.next_char();
        if (c == "^") {
          acc = 2;
          c = line.next_char();
        } else {
          acc = 1;
        }
        break;
      case "=":
        acc = 3;
        c = line.next_char();
        break;
      case "_":
        c = line.next_char();
        if (c == "_") {
          acc = -2;
          c = line.next_char();
        } else {
          acc = -1;
        }
        break;
    }

    /* look for microtone value */
    if (acc == 1 || acc == -1) {
      if ((c >= "1" && c <= "9") || c == "/") {
        // shortcut
        nd = parse_dur(line);
        if (acc < 0) nd[0] = -nd[0];
        if (cfmt.nedo && nd[1] == 1) {
          nd[0] *= 12;
          nd[1] *= cfmt.nedo;
        }
        acc = nd;
        c = line.char();
      }
    }

    /* get the pitch */
    pit = ntb.indexOf(c) + 16;
    c = line.next_char();
    if (pit < 16) {
      syntax(1, "'$1' is not a note", line.buffer[line.index - 1]);
      return; //undefined
    }

    // octave
    while (c == "'") {
      pit += 7;
      c = line.next_char();
    }
    while (c == ",") {
      pit -= 7;
      c = line.next_char();
    }
    note = {
      pit: pit,
      shhd: 0,
      shac: 0,
    };
    // YYMCode: 添加音符 id 的值
    if (c === "I") {
      let index_str = "";
      c = line.next_char();
      while (c !== "J") {
        index_str += c;
        c = line.next_char();
      }
      c = line.next_char();
      let note_id = parseInt(index_str);
      if (!isNaN(note_id)) {
        note.note_id = note_id;
      }
    }
    // ******************/
    if (acc) note.acc = acc;
    return note;
  }

  /* set the mapping of a note */
  //
  // The global 'maps' object is indexed by the map name.
  // Its content is an object ('map') indexed from the map type:
  // - normal = b40 pitch
  // - octave = 'o' + b40 pitch in C..B interval
  // - key    = 'k' + scale index
  // - all    = 'all'
  // The 'map' is stored in the note. It is an array of
  //	[0] array of heads (glyph names)
  //	[1] print (note)
  //	[2] color
  //	[3] play (note)
  function set_map(note) {
    var map = maps[curvoice.map], // never null
      n = abc2svg.pab40(note.pit, note.acc),
      nn = n.toString();

    if (!map[nn]) {
      nn = "o" + (n % 40).toString(); // octave
      if (!map[nn]) {
        n += 2 - curvoice.ckey.k_b40; // key
        nn = "k" + abc2svg.b40_p[n % 40].toString();
        if (!map[nn]) {
          nn = "all"; // 'all'
          if (!map[nn]) return;
        }
      }
    }
    note.map = map[nn];
  }

  /* -- parse note or rest with pitch and length -- */
  // 'line' is not always 'parse.line'
  function parse_basic_note(line, ulen) {
    var nd,
      note = parse_acc_pit(line);

    if (!note) return; //null

    // duration
    if (line.char() == "0") {
      // compatibility
      parse.stemless = true;
      line.index++;
    }
    nd = parse_dur(line);
    note.dur = (ulen * nd[0]) / nd[1];
    return note;
  }

  function parse_vpos() {
    var line = parse.line,
      ty = 0;

    if (line.buffer[line.index - 1] == "." && !a_dcn) ty = C.SL_DOTTED;
    switch (line.next_char()) {
      case "'":
        line.index++;
        return ty + C.SL_ABOVE;
      case ",":
        line.index++;
        return ty + C.SL_BELOW;
    }
    return ty + C.SL_AUTO;
  }

  // on end of slur, create the slur
  function slur_add(enote, e_is_note) {
    var i, s, sl, snote, s_is_note;

    // go back and find the last start of slur
    for (i = curvoice.sls.length; --i >= 0; ) {
      sl = curvoice.sls[i];
      snote = sl.note;
      s_is_note = sl.is_note;
      delete sl.is_note;

      // the slur must not start and stop on a same symbol
      if (snote.s != enote.s) {
        sl.note = enote;
        if (e_is_note) sl.is_note = e_is_note;
        s = s_is_note ? snote : snote.s;
        if (!s.sls) s.sls = [];
        s.sls.push(sl);
        curvoice.sls.splice(i, 1);

        // set a flag on the start symbol if slur from a note
        if (s_is_note) snote.s.sl1 = true;

        // set a flag if the slur starts on a grace note
        if (sl.grace) sl.grace.sl1 = true;

        // set a flag if the slur ends on a grace note
        if (enote.s.grace) enote.s.sl2 = true;
        return;
      }
    }

    if (enote.grace) {
      error(1, enote.s, errs.bad_slur_end);
      return;
    }

    // the lack of a starting slur may be due to a repeat
    for (s = enote.s.prev; s; s = s.prev) {
      if (s.type == C.BAR && s.bar_type[0] == ":" && s.text) {
        if (!s.sls) s.sls = [];
        s.sls.push({
          note: enote,
          //fixme: should go back to the bar "|1" and find the slur type...
          ty: C.SL_AUTO,
        });
        if (e_is_note) s.sls[s.sls.length - 1].is_note = e_is_note;
        return;
      }
    }
    syntax(1, "End of slur without start");
  }
  // YYMComment: 将C1 这种 给转为pitch值
  // convert a diatonic pitch and accidental to a MIDI pitch with cents
  function pit2mid(pit, acc) {
    var p = [0, 2, 4, 5, 7, 9, 11][pit % 7], // chromatic pitch
      o = ((pit / 7) | 0) * 12, // octave
      p0,
      p1,
      s,
      b40;

    if (curvoice.snd_oct) o += curvoice.snd_oct;
    if (acc == 3)
      // if natural accidental
      acc = 0;
    if (acc) {
      if (typeof acc != "number") {
        s = acc[0] / acc[1]; // microtonal accidental
        if (acc[1] == 100)
          // in cents
          return p + o + s;
      } else {
        s = acc; // simple accidental
      }
    } else {
      if (cfmt.temper) return cfmt.temper[abc2svg.p_b40[pit % 7]] + o;
      return p + o;
    }
    if (!cfmt.nedo) {
      // non equal temperament
      if (!cfmt.temper) {
        p += o + s; // standard temperament
        return p;
      }
    } else {
      // equal temperament
      if (typeof acc == "number") {
        // if not a fraction
        b40 = abc2svg.p_b40[pit % 7] + acc;
        return cfmt.temper[b40] + o;
      }

      if (acc[1] == cfmt.nedo) {
        // fraction of the edo divider
        b40 = abc2svg.p_b40[pit % 7];
        return cfmt.temper[b40] + o + s;
      }
    }

    p0 = cfmt.temper[abc2svg.p_b40[pit % 7]]; // main note
    if (s > 0) {
      // sharp
      p1 = cfmt.temper[(abc2svg.p_b40[pit % 7] + 1) % 40];
      if (p1 < p0) p1 += 12;
    } else {
      // flat
      p1 = cfmt.temper[(abc2svg.p_b40[pit % 7] + 39) % 40];
      if (p1 > p0) p1 -= 12;
      s = -s;
    }
    return p0 + o + (p1 - p0) * s;
  } // pit2mid()

  // (possible hook)
  Abc.prototype.new_note = function (grace, sls) {
    var note,
      s,
      in_chord,
      c,
      dcn,
      type,
      tie_s,
      acc_tie,
      i,
      n,
      s2,
      nd,
      res,
      num,
      dur,
      apit,
      sl1 = [],
      line = parse.line,
      a_dcn_sav = a_dcn; // save parsed decoration names

    // handle the ties
    function do_ties(s, tie_s) {
      var m, note, mid;

      for (m = 0; m <= s.nhd; m++) {
        note = s.notes[m];
        mid = note.midi;
        if (tie_s.type != C.GRACE) {
          for (i = 0; i <= tie_s.nhd; i++) {
            if (!tie_s.notes[i].tie_ty) continue;
            // (tie_s.notes[i].tie_n may exist
            //  on repeat restart)
            if (tie_s.notes[i].midi == mid) {
              tie_s.notes[i].tie_n = note;
              note.s = s;
              tie_s.tie_s = s;
              break;
            }
          }
        } else {
          for (s2 = tie_s.extra; s2; s2 = s2.next) {
            if (!s2.notes[0].tie_ty) continue;
            if (s2.notes[0].midi == mid) {
              s2.tie_s = s;
              s2.notes[0].tie_n = note;
              note.s = s;
              s2.notes[0].s = s2;
              tie_s.tie_s = s;
              break;
            }
          }
        }
        s.ti2 = tie_s; // pointer to the tie start
      }
    } // do_ties()

    a_dcn = null;
    parse.stemless = false;
    s = {
      type: C.NOTE,
      fname: parse.fname,
      stem: 0,
      multi: 0,
      nhd: 0,
      xmx: 0,
    };
    s.istart = parse.bol + line.index;

    if (curvoice.color) s.color = curvoice.color;

    if (curvoice.tie_s) {
      // if tie from previous note / grace note
      tie_s = curvoice.tie_s;
      curvoice.tie_s = null;
    }
    if (grace) {
      s.grace = true;
    } else {
      if (a_gch) self.gch_build(s);
      if (parse.repeat_n) {
        s.repeat_n = parse.repeat_n;
        s.repeat_k = parse.repeat_k;
        parse.repeat_n = 0;
      }
    }
    c = line.char();
    switch (c) {
      case "X":
        s.invis = true;
      case "Z":
        s.type = C.MREST;
        c = line.next_char();
        s.nmes = c > "0" && c <= "9" ? line.get_int() : 1;
        s.dur = curvoice.wmeasure * s.nmes;

        // ignore if in second voice
        if (curvoice.second) {
          curvoice.time += s.dur;
          return; //null
        }

        // convert 'Z'/'Z1' to a whole measure rest
        if (s.nmes == 1) {
          s.type = C.REST;
          s.dur_orig = s.dur;
          s.notes = [
            {
              pit: 18,
              dur: s.dur,
            },
          ];
        } else {
          glovar.mrest_p = true;
        }
        break;
      case "y":
        s.type = C.SPACE;
        s.invis = true;
        s.dur = 0;
        c = line.next_char();
        if (c >= "0" && c <= "9") s.width = line.get_int();
        else s.width = 10;
        if (tie_s) {
          curvoice.tie_s = tie_s;
          tie_s = null;
        }
        break;
      case "x":
        s.invis = true;
      case "z":
        s.type = C.REST;
        line.index++;
        nd = parse_dur(line);
        s.dur_orig =
          ((curvoice.ulen < 0 ? C.BLEN : curvoice.ulen) * nd[0]) / nd[1];
        s.dur = s.dur_orig * curvoice.dur_fact;
        s.notes = [
          {
            pit: 18,
            dur: s.dur_orig,
          },
        ];
        break;
      case "[": // chord
        in_chord = true;
        c = line.next_char();
      // fall thru
      default:
        // accidental, chord, note
        if (curvoice.acc_tie) {
          acc_tie = curvoice.acc_tie;
          curvoice.acc_tie = null;
        }
        s.notes = [];

        // loop on the chord
        while (1) {
          // when in chord, get the slurs and decorations
          if (in_chord) {
            while (1) {
              if (!c) break;
              i = c.charCodeAt(0);
              if (i >= 128) {
                syntax(1, errs.not_ascii);
                return; //null
              }
              type = char_tb[i];
              switch (type[0]) {
                case "(":
                  sl1.push(parse_vpos());
                  c = line.char();
                  continue;
                case "!":
                  if (!a_dcn) a_dcn = [];
                  if (type.length > 1) {
                    a_dcn.push(type.slice(1, -1));
                  } else {
                    dcn = "";
                    while (1) {
                      c = line.next_char();
                      if (!c) {
                        syntax(1, "No end of decoration");
                        return; //null
                      }
                      if (c == "!") break;
                      dcn += c;
                    }
                    a_dcn.push(dcn);
                  }
                  c = line.next_char();
                  continue;
              }
              break;
            }
          }
          note = parse_basic_note(
            line,
            s.grace ? C.BLEN / 4 : curvoice.ulen < 0 ? C.BLEN : curvoice.ulen
          );
          if (!note) return; //null

          // transpose
          if (curvoice.octave) note.pit += curvoice.octave * 7;
          apit = note.pit + 19; // pitch from C-1

          // get the explicit or implicit accidental
          // and keep the absolute pitch in (MIDI + cents) format
          i = note.acc;
          if (i) {
            curvoice.acc[apit] = i;
          } else {
            i = curvoice.acc[apit];
            if (!i && acc_tie) i = acc_tie[apit];
            if (!i) i = curvoice.ckey.k_map[apit % 7] || 0;
          }
          note.midi = pit2mid(apit, i);
          if (curvoice.ckey.k_sndtran)
            note.midi += abc2svg.b40m(curvoice.ckey.k_sndtran + 122) - 36;

          if (curvoice.map && maps[curvoice.map]) set_map(note);

          // starting slurs
          if (sl1.length) {
            while (1) {
              i = sl1.shift();
              if (!i) break;
              curvoice.sls.push({
                is_note: true,
                note: note,
                ty: i,
              });
            }
            note.s = s; // link the note to the chord
          }
          if (a_dcn) {
            note.a_dcn = a_dcn;
            a_dcn = null;
          }
          s.notes.push(note);
          if (!in_chord) break;

          // in chord: get the ending slurs and the ties
          c = line.char();
          while (1) {
            switch (c) {
              case ")":
                note.s = s;
                slur_add(note, true);
                c = line.next_char();
                continue;
              case "-":
                note.tie_ty = parse_vpos();
                note.s = s;
                curvoice.tie_s = s;
                if (curvoice.acc[apit] || (acc_tie && acc_tie[apit])) {
                  if (!curvoice.acc_tie) curvoice.acc_tie = [];
                  curvoice.acc_tie[apit] = curvoice.acc[apit] || acc_tie[apit];
                }
                c = line.char();
                continue;
              case ".":
                c = line.next_char();
                switch (c) {
                  case "-":
                  case "(":
                    continue;
                }
                syntax(1, "Misplaced dot");
                break;
            }
            break;
          }
          if (c == "]") {
            line.index++;

            // adjust the chord duration
            nd = parse_dur(line);
            s.nhd = s.notes.length - 1;
            for (i = 0; i <= s.nhd; i++) {
              note = s.notes[i];
              note.dur = (note.dur * nd[0]) / nd[1];
            }
            break;
          }
        }

        // handle the starting slurs
        if (sls.length) {
          while (1) {
            i = sls.shift();
            if (!i) break;
            s.notes[0].s = s;
            curvoice.sls.push({
              note: s.notes[0],
              ty: i,
            });
            if (grace) curvoice.sls[curvoice.sls.length - 1].grace = grace;
          }
        }

        // the duration of the chord is the duration of the 1st note
        s.dur_orig = s.notes[0].dur;
        s.dur = s.notes[0].dur * curvoice.dur_fact;
    }
    if (s.grace && s.type != C.NOTE) {
      syntax(1, errs.bad_grace);
      return; //null
    }
    if (tie_s && s.type != C.NOTE) {
      syntax(1, "Bad tie");
      tie_s = null;
    }

    if (s.notes) {
      // if note or rest
      if (!grace) {
        switch (curvoice.pos.stm) {
          case C.SL_ABOVE:
            s.stem = 1;
            break;
          case C.SL_BELOW:
            s.stem = -1;
            break;
          case C.SL_HIDDEN:
            s.stemless = true;
            break;
        }

        // adjust the symbol duration
        num = curvoice.brk_rhythm;
        if (num) {
          curvoice.brk_rhythm = 0;
          s2 = curvoice.last_note;
          if (num > 0) {
            n = num * 2 - 1;
            s.dur = (s.dur * n) / num;
            s.dur_orig = (s.dur_orig * n) / num;
            for (i = 0; i <= s.nhd; i++)
              s.notes[i].dur = (s.notes[i].dur * n) / num;
            s2.dur /= num;
            s2.dur_orig /= num;
            for (i = 0; i <= s2.nhd; i++) s2.notes[i].dur /= num;
          } else {
            num = -num;
            n = num * 2 - 1;
            s.dur /= num;
            s.dur_orig /= num;
            for (i = 0; i <= s.nhd; i++) s.notes[i].dur /= num;
            s2.dur = (s2.dur * n) / num;
            s2.dur_orig = (s2.dur_orig * n) / num;
            for (i = 0; i <= s2.nhd; i++)
              s2.notes[i].dur = (s2.notes[i].dur * n) / num;
          }
          curvoice.time = s2.time + s2.dur;

          // adjust the time of the grace notes, bars...
          for (s2 = s2.next; s2; s2 = s2.next) s2.time = curvoice.time;
        }
      } else {
        /* grace note - adjust its duration */
        var div = curvoice.ckey.k_bagpipe ? 8 : 4;

        for (i = 0; i <= s.nhd; i++) s.notes[i].dur /= div;
        s.dur /= div;
        s.dur_orig /= div;
        if (grace.stem) s.stem = grace.stem;
      }

      curvoice.last_note = s;

      // get the possible ties and end of slurs
      c = line.char();
      while (1) {
        switch (c) {
          case "-":
            var ty = parse_vpos();
            for (i = 0; i <= s.nhd; i++) {
              s.notes[i].tie_ty = ty;
              s.notes[i].s = s;
            }
            if (grace) grace.tie_s = curvoice.tie_s = grace;
            else curvoice.tie_s = s;
            for (i = 0; i <= s.nhd; i++) {
              note = s.notes[i];
              apit = note.pit + 19; // pitch from C-1
              if (curvoice.acc[apit] || (acc_tie && acc_tie[apit])) {
                if (!curvoice.acc_tie) curvoice.acc_tie = [];
                curvoice.acc_tie[apit] = curvoice.acc[apit] || acc_tie[apit];
              }
            }
            c = line.char();
            continue;
          case ")":
            s.notes[0].s = s;
            slur_add(s.notes[0]);
            c = line.next_char();
            continue;
          case ".":
            if (line.buffer[line.index + 1] != "-") break;
            c = line.next_char();
            continue;
        }
        break;
      }
      //YYMComment:  处理 end tie 在这个 chord / note上
      //YYMComment: 如果是 tie 是来自 之前的note, 或者 grace note上
      // handle the ties ending on this chord/note
      if (tie_s)
        // if tie from previous note / grace note
        do_ties(s, tie_s);
    }

    sym_link(s);

    if (cfmt.shiftunison) s.shiftunison = cfmt.shiftunison;
    if (!grace) {
      if (!curvoice.lyric_restart) curvoice.lyric_restart = s;
      if (!curvoice.sym_restart) curvoice.sym_restart = s;
    }

    if (a_dcn_sav) deco_cnv(a_dcn_sav, s, s.prev);
    // YYMComment: 如果有高八度音符, 如果是倚音高八度, 那么就把这个高八度 复制到倚音高八度上否则就是正常的高八度上
    if (parse.ottava.length) {
      if (grace) grace.ottava = parse.ottava;
      else s.ottava = parse.ottava;
      parse.ottava = [];
    }
    if (parse.stemless) s.stemless = true;
    s.iend = parse.bol + line.index;
    return s;
  };

  // adjust the duration of the elements in a tuplet
  function tp_adj(s, fact) {
    var tim = s.time;

    curvoice.time = tim + (curvoice.time - tim) * fact;
    while (1) {
      //fixme: tuplets in grace notes?
      s.in_tuplet = true;
      if (!s.grace) {
        s.time = tim;
        if (s.dur) {
          s.dur *= fact;
          tim += s.dur;
        }
      }
      if (!s.next) {
        if (s.tpe) s.tpe++;
        else s.tpe = 1;
        break;
      }
      s = s.next;
    }
  } // tp_adj()

  // characters in the music line (ASCII only)
  var nil = "0",
    char_tb = [
      nil,
      nil,
      nil,
      nil /* 00 - .. */,
      nil,
      nil,
      nil,
      nil,
      nil,
      " ",
      "\n",
      nil /* . \t \n . */,
      nil,
      nil,
      nil,
      nil,
      nil,
      nil,
      nil,
      nil,
      nil,
      nil,
      nil,
      nil,
      nil,
      nil,
      nil,
      nil,
      nil,
      nil,
      nil,
      nil /* .. - 1f */,
      " ",
      "!",
      '"',
      "i" /* (sp) ! " # */,
      "\n",
      nil,
      "&",
      nil /* $ % & ' */,
      "(",
      ")",
      "i",
      nil /* ( ) * + */,
      nil,
      "-",
      "!dot!",
      nil /* , - . / */,
      nil,
      nil,
      nil,
      nil /* 0 1 2 3 */,
      nil,
      nil,
      nil,
      nil /* 4 5 6 7 */,
      nil,
      nil,
      "|",
      "i" /* 8 9 : ; */,
      "<",
      "n",
      "<",
      "i" /* < = > ? */,
      "i",
      "n",
      "n",
      "n" /* @ A B C */,
      "n",
      "n",
      "n",
      "n" /* D E F G */,
      "!fermata!",
      "d",
      "d",
      "d" /* H I J K */,
      "!emphasis!",
      "!lowermordent!",
      "d",
      "!coda!" /* L M N O */,
      "!uppermordent!",
      "d",
      "d",
      "!segno!" /* P Q R S */,
      "!trill!",
      "d",
      "d",
      "d" /* T U V W */,
      "n",
      "d",
      "n",
      "[" /* X Y Z [ */,
      "\\",
      "|",
      "n",
      "n" /* \ ] ^ _ */,
      "i",
      "n",
      "n",
      "n" /* ` a b c */,
      "n",
      "n",
      "n",
      "n" /* d e f g */,
      "d",
      "d",
      "d",
      "d" /* h i j k */,
      "d",
      "d",
      "d",
      "d" /* l m n o */,
      "d",
      "d",
      "d",
      "d" /* p q r s */,
      "d",
      "!upbow!",
      "!downbow!",
      "d" /* t u v w */,
      "n",
      "n",
      "n",
      "{" /* x y z { */,
      "|",
      "}",
      "!gmark!",
      nil /* | } ~ (del) */,
    ],
    ottava = {
      "8va(": 1,
      "8va)": 0,
      "15ma(": 2,
      "15ma)": 0,
      "8vb(": -1,
      "8vb)": 0,
      "15mb(": -2,
      "15mb)": 0,
    };

  function parse_music_line() {
    var grace,
      last_note_sav,
      a_dcn_sav,
      no_eol,
      s,
      tps,
      tp = [],
      tpn = -1,
      sls = [],
      line = parse.line;

    // check if a transposing macro matches a source sequence
    // if yes return the base note
    function check_mac(m) {
      var i, j, b;

      for (i = 1, j = line.index + 1; i < m.length; i++, j++) {
        if (m[i] == line.buffer[j]) continue;
        if (m[i] != "n")
          // search the base note
          return; //null
        b = ntb.indexOf(line.buffer[j]);
        if (b < 0) return; //null
        while (line.buffer[j + 1] == "'") {
          b += 7;
          j++;
        }
        while (line.buffer[j + 1] == ",") {
          b -= 7;
          j++;
        }
      }
      line.index = j;
      return b;
    } // check_mac()

    // convert a note as a number into a note as a ABC string
    function n2n(n) {
      var c = ntb[n];

      while (n < 0) {
        n += 7;
        c += ",";
      }
      while (n > 14) {
        n -= 7;
        c += "'";
      }
      return c;
    } // n2n()

    // expand a transposing macro
    function expand(m, b) {
      var c,
        i,
        r = "", // result
        n = m.length;

      for (i = 0; i < n; i++) {
        c = m[i];
        if (c >= "h" && c <= "z") {
          r += n2n(b + c.charCodeAt(0) - "n".charCodeAt(0));
        } else {
          r += c;
        }
      }
      return r;
    } // expand()

    // parse a macro
    function parse_mac(k, m, b) {
      var te,
        ti,
        curv,
        s,
        line_sav = line,
        istart_sav = parse.istart;

      parse.line = line = new scanBuf();
      parse.istart += line_sav.index;

      // if the macro is not displayed
      if (cfmt.writefields.indexOf("m") < 0) {
        // build the display sequence from the original sequence
        line.buffer = k.replace("n", n2n(b));
        s = curvoice.last_sym;
        ti = curvoice.time; // start time
        parse_seq(true);
        if (!s) s = curvoice.sym;
        for (s = s.next; s; s = s.next) s.noplay = true;
        te = curvoice.time; // end time
        curv = curvoice;

        // and put the macro sequence in a play specific voice
        curvoice = clone_voice(curv.id + "-p");
        if (!par_sy.voices[curvoice.v]) {
          curvoice.second = true;
          par_sy.voices[curvoice.v] = {
            st: curv.st,
            second: true,
            range: curvoice.v,
          };
        }
        curvoice.time = ti;
        s = curvoice.last_sym;
        parse.line = line = new scanBuf();
        parse.istart += line_sav.index;
        line.buffer = b ? expand(m, b) : m;
        parse_seq(true);
        if (curvoice.time != te) syntax(1, "Bad length of the macro sequence");
        if (!s) s = curvoice.sym;
        for (; s; s = s.next) s.invis = s.play = true;
        curvoice = curv;
      } else {
        line.buffer = b ? expand(m, b) : m;
        parse_seq(true);
      }

      parse.line = line = line_sav;
      parse.istart = istart_sav;
    } // parse_mac()

    // parse a music sequence
    function parse_seq(in_mac) {
      var c, idx, type, k, s, dcn, i, n, text, note;

      while (1) {
        c = line.char();
        if (!c) break;

        // skip definitions if the current voice is ignored
        if (curvoice.ignore) {
          while (1) {
            while (c && c != "[") c = line.next_char();
            if (!c) break;
            if (c == "V" && line.buffer[line.index + 1] == ":") break; // [V:nn] found
            c = line.next_char();
          }
          if (!c) break;
        }

        // special case for '.' (dot)
        if (c == ".") {
          switch (line.buffer[line.index + 1]) {
            case "(":
            case "-":
            case "|":
              c = line.next_char();
              break;
          }
        }

        // check if start of a macro
        if (!in_mac && maci[c]) {
          n = 0;
          for (k in mac) {
            if (!mac.hasOwnProperty(k) || k[0] != c) continue;
            if (k.indexOf("n") < 0) {
              if (line.buffer.indexOf(k, line.index) != line.index) continue;
              line.index += k.length;
            } else {
              n = check_mac(k);
              if (!n) continue;
            }
            parse_mac(k, mac[k], n);
            n = 1;
            break;
          }
          if (n) continue;
        }

        idx = c.charCodeAt(0);
        if (idx >= 128) {
          syntax(1, errs.not_ascii);
          line.index++;
          break;
        }

        type = char_tb[idx];
        switch (type[0]) {
          case " ": // beam break
            s = curvoice.last_note;
            if (s) {
              s.beam_end = true;
              if (grace) grace.gr_shift = true;
            }
            break;
          case "\n": // line break
            if (cfmt.barsperstaff) break;
            if (
              par_sy.voices[curvoice.v] &&
              par_sy.voices[curvoice.v].range == 0
            )
              curvoice.eoln = true;
            break;
          case "&": // voice overlay
            if (grace) {
              syntax(1, errs.bad_grace);
              break;
            }
            c = line.next_char();
            if (c == ")") {
              get_vover(")");
              break;
            }
            get_vover("&");
            continue;
          case "(": // slur start - tuplet - vover
            c = line.next_char();
            if (c > "0" && c <= "9") {
              // tuplet
              if (grace) {
                syntax(1, errs.bad_grace);
                break;
              }
              var pplet = line.get_int(),
                qplet = qplet_tb[pplet],
                rplet = pplet,
                c = line.char();

              if (c == ":") {
                c = line.next_char();
                if (c > "0" && c <= "9") {
                  qplet = line.get_int();
                  c = line.char();
                }
                if (c == ":") {
                  c = line.next_char();
                  if (c > "0" && c <= "9") {
                    rplet = line.get_int();
                    c = line.char();
                  } else {
                    syntax(1, "Invalid 'r' in tuplet");
                    continue;
                  }
                }
              }
              if (qplet == 0 || qplet == undefined)
                qplet = curvoice.wmeasure % 9 == 0 ? 3 : 2;
              if (tpn < 0) tpn = tp.length; // new tuplet
              tp.push({
                p: pplet,
                q: qplet,
                r: rplet,
                ro: rplet,
                f: cfmt.tuplets,
              });
              continue;
            }
            if (c == "&") {
              // voice overlay start
              if (grace) {
                syntax(1, errs.bad_grace);
                break;
              }
              get_vover("(");
              break;
            }
            line.index--;
            sls.push(parse_vpos());
            continue;
          case ")": // slur end
            s = curvoice.last_sym;
            if (s) {
              switch (s.type) {
                case C.SPACE:
                  if (!s.notes) {
                    s.notes = [];
                    s.notes[0] = {};
                  }
                case C.NOTE:
                case C.REST:
                  break;
                case C.GRACE:
                  // stop the slur on the last grace note
                  for (s = s.extra; s.next; s = s.next);
                  break;
                default:
                  s = null;
                  break;
              }
            }
            if (!s) {
              syntax(1, errs.bad_char, c);
              break;
            }
            s.notes[0].s = s;
            slur_add(s.notes[0]);
            break;
          case "!": // start of decoration
            if (!a_dcn) a_dcn = [];
            if (type.length > 1) {
              // decoration letter
              dcn = type.slice(1, -1);
            } else {
              dcn = "";
              i = line.index; // in case no deco end
              while (1) {
                c = line.next_char();
                if (!c) break;
                if (c == "!") break;
                dcn += c;
              }
              if (!c) {
                line.index = i;
                syntax(1, "No end of decoration");
                break;
              }
            }
            if (ottava[dcn] != undefined) {
              glovar.ottava = true;
              parse.ottava.push(ottava[dcn]);
            } else {
              a_dcn.push(dcn);
            }
            break;
          case '"':
            if (grace) {
              syntax(1, errs.bad_grace);
              break;
            }
            parse_gchord(type);
            break;
          case "[":
            if (type.length > 1) {
              // U: [I:xxx]
              self.do_pscom(type.slice(3, -1));
              break;
            }
            var c_next = line.buffer[line.index + 1];

            if (
              '|[]: "'.indexOf(c_next) >= 0 ||
              (c_next >= "1" && c_next <= "9")
            ) {
              if (grace) {
                syntax(1, errs.bar_grace);
                break;
              }
              new_bar();
              continue;
            }
            if (line.buffer[line.index + 2] == ":") {
              if (grace) {
                syntax(1, errs.bad_grace);
                break;
              }
              i = line.buffer.indexOf("]", line.index + 1);
              if (i < 0) {
                syntax(1, "Lack of ']'");
                break;
              }
              text = line.buffer.slice(line.index + 3, i).trim();

              parse.istart = parse.bol + line.index;
              parse.iend = parse.bol + ++i;
              line.index = 0;
              do_info(c_next, text);
              line.index = i;
              continue;
            }
          // fall thru ('[' is start of chord)
          case "n": // note/rest
            s = self.new_note(grace, sls);
            if (!s) continue;

            // handle the tuplets
            if (grace || !s.notes) continue;

            if (tpn >= 0) {
              // new tuplet
              s.tp = tp.slice(tpn);
              tpn = -1;
              if (tps) s.tp[0].s = tps; // if nested
              tps = s;
            } else if (!tps) {
              continue; // no tuplet active
            }

            k = tp[tp.length - 1];
            if (--k.r > 0) continue; // not end of tuplet yet

            while (1) {
              tp_adj(tps, k.q / k.p);
              i = k.ro; // number of notes of this tuplet
              if (k.s) tps = k.s; // start of upper tuplet

              tp.pop(); // previous level
              if (!tp.length) {
                tps = null; // done
                break;
              }
              k = tp[tp.length - 1];
              k.r -= i;
              if (k.r > 0) break;
            }
            continue;
          case "<" /* '<' and '>' */:
            if (!curvoice.last_note) {
              syntax(1, "No note before '<'");
              break;
            }
            if (grace) {
              syntax(1, "Cannot have a broken rhythm in grace notes");
              break;
            }
            n = c == "<" ? 1 : -1;
            while (c == "<" || c == ">") {
              n *= 2;
              c = line.next_char();
            }
            curvoice.brk_rhythm = n;
            continue;
          case "i": // ignore
            break;
          case "{":
            if (grace) {
              syntax(1, "'{' in grace note");
              break;
            }
            last_note_sav = curvoice.last_note;
            curvoice.last_note = null;
            a_dcn_sav = a_dcn;
            a_dcn = undefined;
            grace = {
              type: C.GRACE,
              fname: parse.fname,
              istart: parse.bol + line.index,
              dur: 0,
              multi: 0,
            };
            switch (curvoice.pos.gst) {
              case C.SL_ABOVE:
                grace.stem = 1;
                break;
              case C.SL_BELOW:
                grace.stem = -1;
                break;
              case C.SL_HIDDEN:
                grace.stem = 2;
                break; /* opposite */
            }
            sym_link(grace);
            c = line.next_char();
            if (c == "/") {
              grace.sappo = true; // acciaccatura
              break;
            }
            continue;
          case "|":
            if (grace) {
              syntax(1, errs.bar_grace);
              break;
            }
            new_bar(line.buffer[line.index - 1] == ".");
            continue;
          case "}":
            s = curvoice.last_note;
            if (!grace || !s) {
              syntax(1, errs.bad_char, c);
              break;
            }
            if (a_dcn) syntax(1, "Decoration ignored");
            grace.extra = grace.next;
            grace.extra.prev = null;
            grace.next = null;
            curvoice.last_sym = grace;
            grace = null;
            if (
              !s.prev && // if one grace note
              !curvoice.ckey.k_bagpipe
            ) {
              for (i = 0; i <= s.nhd; i++) s.notes[i].dur *= 2;
              s.dur *= 2;
              s.dur_orig *= 2;
            }
            curvoice.last_note = last_note_sav;
            a_dcn = a_dcn_sav;
            break;
          case "\\":
            if (!line.buffer[line.index + 1]) {
              no_eol = true;
              break;
            }
          // fall thru
          default:
            syntax(1, errs.bad_char, c);
            break;
        }
        line.index++;
      }
    } // parse_seq()

    if (parse.state != 3) {
      // if not in tune body
      if (parse.state != 2) return;
      goto_tune();
    }

    if (parse.tp) {
      tp = parse.tp;
      tpn = parse.tpn;
      tps = parse.tps;
      parse.tp = null;
    }

    parse_seq();

    if (tp.length) {
      parse.tp = tp;
      parse.tps = tps;
      parse.tpn = tpn;
    }
    if (grace) {
      syntax(1, "No end of grace note sequence");
      curvoice.last_sym = grace.prev;
      curvoice.last_note = last_note_sav;
      if (grace.prev) grace.prev.next = null;
    }
    if (cfmt.breakoneoln && curvoice.last_note)
      curvoice.last_note.beam_end = true;
    if (no_eol || cfmt.barsperstaff) return;
    if (
      char_tb["\n".charCodeAt(0)] == "\n" &&
      par_sy.voices[curvoice.v] &&
      par_sy.voices[curvoice.v].range == 0
    )
      curvoice.eoln = true;
  }
  // abc2svg - subs.js - text output
  //
  // Copyright (C) 2014-2020 Jean-Francois Moine
  //
  // This file is part of abc2svg-core.
  //
  // abc2svg-core is free software: you can redistribute it and/or modify
  // it under the terms of the GNU Lesser General Public License as published by
  // the Free Software Foundation, either version 3 of the License, or
  // (at your option) any later version.
  //
  // abc2svg-core is distributed in the hope that it will be useful,
  // but WITHOUT ANY WARRANTY; without even the implied warranty of
  // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  // GNU Lesser General Public License for more details.
  //
  // You should have received a copy of the GNU Lesser General Public License
  // along with abc2svg-core.  If not, see <http://www.gnu.org/licenses/>.

  // width of characters according to the font type
  // these tables were created from the font 'Liberation'

  // serif
  var sw_tb = new Float32Array([
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0, // 00
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0, // 10
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.25,
      0.333,
      0.408,
      0.5,
      0.5,
      0.833,
      0.778,
      0.333, // 20
      0.333,
      0.333,
      0.5,
      0.564,
      0.25,
      0.564,
      0.25,
      0.278,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      0.5, // 30
      0.5,
      0.5,
      0.278,
      0.278,
      0.564,
      0.564,
      0.564,
      0.444,
      0.921,
      0.722,
      0.667,
      0.667,
      0.722,
      0.611,
      0.556,
      0.722, // 40
      0.722,
      0.333,
      0.389,
      0.722,
      0.611,
      0.889,
      0.722,
      0.722,
      0.556,
      0.722,
      0.667,
      0.556,
      0.611,
      0.722,
      0.722,
      0.944, // 50
      0.722,
      0.722,
      0.611,
      0.333,
      0.278,
      0.333,
      0.469,
      0.5,
      0.333,
      0.444,
      0.5,
      0.444,
      0.5,
      0.444,
      0.333,
      0.5, // 60
      0.5,
      0.278,
      0.278,
      0.5,
      0.278,
      0.778,
      0.5,
      0.5,
      0.5,
      0.5,
      0.333,
      0.389,
      0.278,
      0.5,
      0.5,
      0.722, // 70
      0.5,
      0.5,
      0.444,
      0.48,
      0.2,
      0.48,
      0.541,
      0.5,
    ]),
    // sans-serif
    ssw_tb = new Float32Array([
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0, // 00
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0, // 10
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.278,
      0.278,
      0.355,
      0.556,
      0.556,
      0.889,
      0.667,
      0.191, // 20
      0.333,
      0.333,
      0.389,
      0.584,
      0.278,
      0.333,
      0.278,
      0.278,
      0.556,
      0.556,
      0.556,
      0.556,
      0.556,
      0.556,
      0.556,
      0.556, // 30
      0.556,
      0.556,
      0.278,
      0.278,
      0.584,
      0.584,
      0.584,
      0.556,
      1.015,
      0.667,
      0.667,
      0.722,
      0.722,
      0.667,
      0.611,
      0.778, // 40
      0.722,
      0.278,
      0.5,
      0.667,
      0.556,
      0.833,
      0.722,
      0.778,
      0.667,
      0.778,
      0.722,
      0.667,
      0.611,
      0.722,
      0.667,
      0.944, // 50
      0.667,
      0.667,
      0.611,
      0.278,
      0.278,
      0.278,
      0.469,
      0.556,
      0.333,
      0.556,
      0.556,
      0.5,
      0.556,
      0.556,
      0.278,
      0.556, // 60
      0.556,
      0.222,
      0.222,
      0.5,
      0.222,
      0.833,
      0.556,
      0.556,
      0.556,
      0.556,
      0.333,
      0.5,
      0.278,
      0.556,
      0.5,
      0.722, // 70
      0.5,
      0.5,
      0.5,
      0.334,
      0.26,
      0.334,
      0.584,
      0.512,
    ]),
    cw_tb = sw_tb; // current width table

  /* -- return the character width -- */
  function cwid(c) {
    var i = c.charCodeAt(0); // utf-16

    if (i >= 0x80) {
      // if not ASCII
      if (i >= 0x300 && i < 0x370) return 0; // combining diacritical mark
      i = 0x61; // 'a'
    }
    return cw_tb[i];
  }
  // return the character width with the current font
  function cwidf(c) {
    return cwid(c) * gene.curfont.swfac;
  }

  // estimate the width and height of a string ..
  var strwh =
    typeof document != "undefined"
      ? // .. by the browser
        (function (el) {
          el.style.position = "absolute";
          el.style.top = "-1000px";
          el.style.padding = "0";
          document.body.appendChild(el);

          return function (str) {
            var c,
              font = gene.curfont,
              h = font.size,
              w = 0,
              n = str.length,
              i0 = 0,
              i = 0;

            el.style.font = style_font(font).slice(5);

            str = str.replace(/<|>|&[^&]*?;|&|  /g, function (c) {
              switch (c) {
                case "<":
                  return "&lt;";
                case ">":
                  return "&gt;";
                case "&":
                  return "&amp;";
                case "  ":
                  return "  "; // space + nbspace
              }
              return c; // &xxx;
            });

            while (1) {
              i = str.indexOf("$", i);
              if (i < 0) break;
              c = str[i + 1];
              if (c == "0") {
                font = gene.deffont;
              } else if (c >= "1" && c <= "9") {
                font = get_font("u" + c);
              } else {
                i++;
                continue;
              }
              el.innerHTML = str.slice(i0, i);
              w += el.clientWidth;
              //fixme: bad result if space(s) at end of string
              if (font.size > h) h = font.size;

              el.style.font = style_font(font).slice(5);
              i += 2;
              i0 = i;
            }
            el.innerHTML = str.slice(i0);
            w += el.clientWidth;

            gene.curfont = font;
            return [w, h];
          };
        })(document.createElement("div"))
      : // .. by internal tables
        function (str) {
          var font = gene.curfont,
            swfac = font.swfac,
            h = font.size,
            w = 0,
            i,
            j,
            c,
            n = str.length;

          for (i = 0; i < n; i++) {
            c = str[i];
            switch (c) {
              case "$":
                c = str[i + 1];
                if (c == "0") {
                  font = gene.deffont;
                } else if (c >= "1" && c <= "9") {
                  font = get_font("u" + c);
                } else {
                  c = "$";
                  break;
                }
                i++;
                swfac = font.swfac;
                if (font.size > h) h = font.size;
                continue;
              case "&":
                j = str.indexOf(";", i);
                if (j > 0 && j - i < 10) {
                  i = j;
                  c = "a"; // XML character reference
                }
                break;
            }
            w += cwid(c) * swfac;
          }
          gene.curfont = font;
          return [w, h];
        };

  // set the default and current font
  function set_font(xxx) {
    if (typeof xxx == "string") xxx = get_font(xxx);
    cw_tb = xxx.name.slice(0, 4) == "sans" ? ssw_tb : sw_tb;
    gene.curfont = gene.deffont = xxx;
  }

  // output a string handling the font changes
  function out_str(str) {
    var n_font,
      o_font = gene.curfont,
      c_font = o_font;

    // build the '<tspan>' element
    function tspan(nf, of) {
      var cl;

      if (
        nf.class &&
        nf.name == of.name &&
        nf.size == of.size &&
        nf.weight == of.weight &&
        nf.style == of.style
      )
        cl = nf.class;
      // change only the class
      else cl = font_class(nf);

      return '<tspan\n\tclass="' + cl + '">';
    }

    output += str.replace(/<|>|&[^&]*?;|&|  |\$./g, function (c) {
      switch (c) {
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case "&":
          return "&amp;";
        case "  ":
          return "  "; // space + nbspace
        default:
          if (c[0] != "$") break;
          if (c[1] == "0") n_font = gene.deffont;
          else if (c[1] >= "1" && c[1] <= "9") n_font = get_font("u" + c[1]);
          else break;
          c = "";
          if (n_font == c_font) return c;
          if (c_font != o_font) c = "</tspan>";
          c_font = n_font;
          if (c_font == o_font) return c;
          return c + tspan(c_font, o_font);
      }
      return c; // &xxx;
    });
    if (c_font != o_font) {
      output += "</tspan>";
      gene.curfont = c_font; // keep current font for next paragraph
    }
  }

  // output a string, handling the font changes
  // the action is:
  //	'c' align center
  //	'r' align right
  //	'j' justify - w is the line width
  //	otherwise align left
  function xy_str(
    x,
    y,
    str,
    action, // default: align left
    w, // needed for justify
    wh
  ) {
    // optional [width, height]
    if (!wh) wh = strwh(str);

    output += '<text class="' + font_class(gene.curfont);
    if (action != "j" && str.length > 5 && gene.curfont.wadj)
      output +=
        '" lengthAdjust="' +
        gene.curfont.wadj +
        '" textLength="' +
        wh[0].toFixed(1);
    output += '" x="';
    out_sxsy(x, '" y="', y + wh[1] * 0.2); // a bit upper for the descent
    switch (action) {
      case "c":
        x -= wh[0] / 2;
        output += '" text-anchor="middle">';
        break;
      case "j":
        output += '" textLength="' + w.toFixed(1) + '">';
        break;
      case "r":
        x -= wh[0];
        output += '" text-anchor="end">';
        break;
      default:
        output += '">';
        break;
    }
    out_str(str);
    output += "</text>\n";

    if (!w && gene.curfont.box) {
      // not in the SVG documentation,
      // but this works for almost all browsers but firefox
      //		output += '<g style="outline: solid black;\
      //			outline-width: 1px">\n';
      //	//	xy_str(x, y, str, action, w);
      //		output += '</g>\n'
      output += '<rect class="stroke" x="';
      out_sxsy(x - 2, '" y="', y + wh[1] + 1);
      output +=
        '" width="' +
        (wh[0] + 4).toFixed(1) +
        '" height="' +
        (wh[1] + 2).toFixed(1) +
        '"/>\n';
    }
  }

  /* -- move trailing "The" to front, set to uppercase letters or add xref -- */
  function trim_title(title, is_subtitle) {
    var i;

    if (cfmt.titletrim) {
      i = title.lastIndexOf(", ");
      if (i < 0 || title[i + 2] < "A" || title[i + 2] > "Z") {
        i = 0;
      } else if (cfmt.titletrim == true) {
        // compatibility
        if (i < title.length - 7 || title.indexOf(" ", i + 3) >= 0) i = 0;
      } else {
        if (i < title.length - cfmt.titletrim - 2) i = 0;
      }
      if (i) title = title.slice(i + 2).trim() + " " + title.slice(0, i);
    }
    if (!is_subtitle && cfmt.writefields.indexOf("X") >= 0)
      title = info.X + ".  " + title;
    if (cfmt.titlecaps) return title.toUpperCase();
    return title;
  }

  // return the width of the music line
  function get_lwidth() {
    return (
      (img.width - img.lm - img.rm - 2) / // for bar thickness at eol
      cfmt.scale
    );
  }

  // header generation functions
  function write_title(title, is_subtitle) {
    var h, wh;

    if (!title) return;
    set_page();
    title = trim_title(title, is_subtitle);
    if (is_subtitle) {
      set_font("subtitle");
      h = cfmt.subtitlespace;
    } else {
      set_font("title");
      h = cfmt.titlespace;
    }
    wh = strwh(title);
    vskip(wh[1] + h);
    if (cfmt.titleleft) xy_str(0, 0, title, null, null, wh);
    else xy_str(get_lwidth() / 2, 0, title, "c", null, wh);
  }

  /* -- output a header format '111 (222)' -- */
  function put_inf2r(x, y, str1, str2, action) {
    if (!str1) {
      if (!str2) return;
      str1 = str2;
      str2 = null;
    }
    if (!str2) xy_str(x, y, str1, action);
    else xy_str(x, y, str1 + " (" + str2 + ")", action);
  }

  /* -- write a text block (%%begintext / %%text / %%center) -- */
  function write_text(text, action) {
    if (action == "s") return; // skip
    set_font("text");
    set_page();
    var wh,
      font,
      strlw = get_lwidth(),
      sz = gene.curfont.size,
      lineskip = sz * cfmt.lineskipfac,
      parskip = sz * cfmt.parskipfac,
      i,
      j,
      x,
      words,
      w,
      k,
      ww,
      str;

    switch (action) {
      default:
        //	case 'c':
        //	case 'r':
        switch (action) {
          case "c":
            x = strlw / 2;
            break;
          case "r":
            x = strlw;
            break;
          default:
            x = 0;
            break;
        }
        j = 0;
        font = gene.curfont;
        while (1) {
          i = text.indexOf("\n", j);
          if (i < 0) {
            str = text.slice(j);
            wh = strwh(str);
            gene.curfont = font;
            vskip(wh[1] * cfmt.lineskipfac);
            xy_str(x, 0, str, action, null, wh);
            font = gene.curfont;
            break;
          }
          if (i == j) {
            // new paragraph
            vskip(parskip);
            blk_flush();
            use_font(gene.curfont);
            while (text[i + 1] == "\n") {
              vskip(lineskip);
              i++;
            }
            if (i == text.length) break;
          } else {
            str = text.slice(j, i);
            wh = strwh(str);
            gene.curfont = font;
            vskip(wh[1] * cfmt.lineskipfac);
            xy_str(x, 0, str, action, null, wh);
            font = gene.curfont;
          }
          j = i + 1;
        }
        vskip(parskip);
        blk_flush();
        break;
      case "f":
      case "j":
        j = 0;
        while (1) {
          i = text.indexOf("\n\n", j);
          if (i < 0) words = text.slice(j);
          else words = text.slice(j, i);
          words = words.split(/\s+/);
          w = k = 0;
          font = gene.curfont;
          for (j = 0; j < words.length; j++) {
            ww = strwh(words[j])[0];
            w += ww;
            if (w >= strlw) {
              str = words.slice(k, j).join(" ");
              gene.curfont = font;
              wh = strwh(str);
              gene.curfont = font;
              vskip(wh[1] * cfmt.lineskipfac);
              xy_str(0, 0, str, action, strlw, wh);
              font = gene.curfont;
              k = j;
              w = ww;
            }
            w += cwidf(" ");
          }
          if (w != 0) {
            // last line
            str = words.slice(k).join(" ");
            gene.curfont = font;
            wh = strwh(str);
            gene.curfont = font;
            vskip(wh[1] * cfmt.lineskipfac);
            xy_str(0, 0, str, null, null, wh);
          }
          vskip(parskip);
          blk_flush();
          if (i < 0) break;
          while (text[i + 2] == "\n") {
            vskip(lineskip);
            i++;
          }
          if (i == text.length) break;
          use_font(gene.curfont);
          j = i + 2;
        }
        break;
    }
  }

  /* -- output the words after tune -- */
  function put_words(words) {
    var p,
      i,
      j,
      nw,
      w,
      lw,
      x1,
      x2,
      i1,
      i2,
      do_flush,
      maxn = 0, // max number of characters per line
      n = 1; // number of verses

    // output a line of words after tune
    function put_wline(p, x) {
      var i = 0,
        j,
        k;

      if (p[i] == "$" && p[i + 1] >= "0" && p[i + 1] <= "9") i += 2;
      k = 0;
      j = i;
      if ((p[i] >= "0" && p[i] <= "9") || p[i + 1] == ".") {
        while (i < p.length) {
          i++;
          if (p[i] == " " || p[i - 1] == ":" || p[i - 1] == ".") break;
        }
        k = i;
        while (p[i] == " ") i++;
      }

      if (k != 0) xy_str(x, 0, p.slice(j, k), "r");
      if (i < p.length) xy_str(x + 5, 0, p.slice(i), "l");
    } // put_wline()

    set_font("words");
    vskip(cfmt.wordsspace);
    svg_flush();

    // estimate the width of the lines
    words = words.split("\n");
    nw = words.length;
    for (i = 0; i < nw; i++) {
      p = words[i];
      if (!p) {
        while (i + 1 < nw && !words[i + 1]) i++;
        n++;
      } else if (p.length > maxn) {
        maxn = p.length;
      }
    }

    w = get_lwidth() / 2; // half line width
    lw = maxn * cwidf("a"); // max line width
    i1 = i2 = 0;
    if (lw < w) {
      // if 2 columns
      j = n >> 1;
      for (i = 0; i < nw; i++) {
        p = words[i];
        if (!p) {
          if (--j <= 0) i1 = i;
          while (i + 1 < nw && !words[i + 1]) i++;
          if (j <= 0) {
            i2 = i + 1;
            break;
          }
        }
      }
      n >>= 1;
    }
    if (i2) {
      x1 = (w - lw) / 2 + 10;
      x2 = x1 + w;
    } else {
      // one column
      x2 = w - lw / 2 + 10;
    }

    do_flush = true;
    for (i = 0; i < i1 || i2 < nw; i++, i2++) {
      vskip(cfmt.lineskipfac * gene.curfont.size);
      if (i < i1) {
        p = words[i];
        if (p) put_wline(p, x1);
        else use_font(gene.curfont);
      }
      if (i2 < nw) {
        p = words[i2];
        if (p) {
          put_wline(p, x2);
        } else {
          if (--n == 0) {
            if (i < i1) {
              n++;
            } else if (i2 < nw - 1) {
              // center the last verse
              x2 = w - lw / 2 + 10;
              svg_flush();
            }
          }
        }
      }

      if (!words[i + 1] && !words[i2 + 1]) {
        if (do_flush) {
          svg_flush();
          do_flush = false;
        }
      } else {
        do_flush = true;
      }
    }
  }

  /* -- output history -- */
  function put_history() {
    var i,
      j,
      c,
      str,
      font,
      h,
      w,
      wh,
      head,
      names = cfmt.infoname.split("\n"),
      n = names.length;

    for (i = 0; i < n; i++) {
      c = names[i][0];
      if (cfmt.writefields.indexOf(c) < 0) continue;
      str = info[c];
      if (!str) continue;
      if (!font) {
        font = true;
        set_font("history");
        vskip(cfmt.textspace);
        h = gene.curfont.size * cfmt.lineskipfac;
      }
      head = names[i].slice(2);
      if (head[0] == '"') head = head.slice(1, -1);
      vskip(h);
      wh = strwh(head);
      xy_str(0, 0, head, null, null, wh);
      w = wh[0];
      str = str.split("\n");
      xy_str(w, 0, str[0]);
      for (j = 1; j < str.length; j++) {
        vskip(h);
        xy_str(w, 0, str[j]);
      }
      vskip(h * 0.3);
      use_font(gene.curfont);
    }
  }

  /* -- write heading with format -- */
  var info_font_init = {
    A: "info",
    C: "composer",
    O: "composer",
    P: "parts",
    Q: "tempo",
    R: "info",
    T: "title",
    X: "title",
  };
  function write_headform(lwidth) {
    var c,
      font,
      font_name,
      align,
      x,
      y,
      sz,
      info_val = {},
      info_font = clone(info_font_init),
      info_sz = {
        A: cfmt.infospace,
        C: cfmt.composerspace,
        O: cfmt.composerspace,
        R: cfmt.infospace,
      },
      info_nb = {};

    // compress the format
    var fmt = "",
      p = cfmt.titleformat,
      j = 0,
      i = 0;

    while (1) {
      while (p[i] == " ") i++;
      if (i >= p.length) break;
      c = p[i++];
      if (c < "A" || c > "Z") {
        if (c == "+") {
          if (fmt.length == 0 || fmt.slice(-1) == "+") continue;
          fmt = fmt.slice(0, -1) + "+";
        } else if (c == ",") {
          if (fmt.slice(-1) == "+") fmt = fmt.slice(0, -1) + "l";
          fmt += "\n";
        }
        continue;
      }
      if (!info_val[c]) {
        if (!info[c]) continue;
        info_val[c] = info[c].split("\n");
        info_nb[c] = 1;
      } else {
        info_nb[c]++;
      }
      fmt += c;
      switch (p[i]) {
        case "-":
          fmt += "l";
          i++;
          break;
        case "0":
          fmt += "c";
          i++;
          break;
        case "1":
          fmt += "r";
          i++;
          break;
        default:
          fmt += "c";
          break;
      }
    }
    if (fmt.slice(-1) == "+") fmt = fmt.slice(0, -1) + "l";
    fmt += "\n";

    // loop on the blocks
    var ya = {
        l: cfmt.titlespace,
        c: cfmt.titlespace,
        r: cfmt.titlespace,
      },
      xa = {
        l: 0,
        c: lwidth * 0.5,
        r: lwidth,
      },
      yb = {},
      str;
    p = fmt;
    i = 0;
    while (1) {
      // get the y offset of the top text
      yb.l = yb.c = yb.r = y = 0;
      j = i;
      while (1) {
        c = p[j++];
        if (c == "\n") break;
        align = p[j++];
        if (align == "+") align = p[j + 1];
        else if (yb[align] != 0) continue;
        str = info_val[c];
        if (!str) continue;
        font_name = info_font[c];
        if (!font_name) font_name = "history";
        font = get_font(font_name);
        sz = font.size * 1.1;
        if (info_sz[c]) sz += info_sz[c];
        if (y < sz) y = sz;
        yb[align] = sz;
      }
      ya.l += y - yb.l;
      ya.c += y - yb.c;
      ya.r += y - yb.r;
      while (1) {
        c = p[i++];
        if (c == "\n") break;
        align = p[i++];
        if (info_val[c].length == 0) continue;
        str = info_val[c].shift();
        if (align == "+") {
          info_nb[c]--;
          c = p[i++];
          align = p[i++];
          if (info_val[c].length > 0) {
            if (str) str += " " + info_val[c].shift();
            else str = " " + info_val[c].shift();
          }
        }
        font_name = info_font[c];
        if (!font_name) font_name = "history";
        font = get_font(font_name);
        sz = font.size * 1.1;
        if (info_sz[c]) sz += info_sz[c];
        set_font(font);
        x = xa[align];
        y = ya[align] + sz;

        if (c == "Q") {
          /* special case for tempo */
          self.set_width(glovar.tempo);
          if (!glovar.tempo.invis) {
            if (align != "l") {
              tempo_build(glovar.tempo);
              w = glovar.tempo.tempo_wh[0];

              if (align == "c") w *= 0.5;
              x -= w;
            }
            writempo(glovar.tempo, x, -y);
          }
        } else if (str) {
          if (c == "T") str = trim_title(str, info_font.T[0] == "s");
          xy_str(x, -y, str, align);
        }

        if (c == "T") {
          font_name = info_font.T = "subtitle";
          info_sz.T = cfmt.subtitlespace;
        }
        if (info_nb[c] <= 1) {
          if (c == "T") {
            font = get_font(font_name);
            sz = font.size * 1.1;
            if (info_sz[c]) sz += info_sz[c];
            set_font(font);
          }
          while (info_val[c].length > 0) {
            y += sz;
            str = info_val[c].shift();
            xy_str(x, -y, str, align);
          }
        }
        info_nb[c]--;
        ya[align] = y;
      }
      if (ya.c > ya.l) ya.l = ya.c;
      if (ya.r > ya.l) ya.l = ya.r;
      if (i >= fmt.length) break;
      ya.c = ya.r = ya.l;
    }
    vskip(ya.l);
  }

  /* -- output the tune heading -- */
  function write_heading() {
    var i,
      j,
      area,
      composer,
      origin,
      rhythm,
      down1,
      down2,
      lwidth = get_lwidth();

    vskip(cfmt.topspace);

    if (cfmt.titleformat) {
      write_headform(lwidth);
      vskip(cfmt.musicspace);
      return;
    }

    /* titles */
    if (info.T && cfmt.writefields.indexOf("T") >= 0) {
      i = 0;
      while (1) {
        j = info.T.indexOf("\n", i);
        if (j < 0) {
          write_title(info.T.substring(i), i != 0);
          break;
        }
        write_title(info.T.slice(i, j), i != 0);
        i = j + 1;
      }
    }

    /* rhythm, composer, origin */
    //	down1 = cfmt.composerspace + gene.curfont.size
    down1 = down2 = 0;
    if (
      parse.ckey.k_bagpipe &&
      !cfmt.infoline &&
      cfmt.writefields.indexOf("R") >= 0
    )
      rhythm = info.R;
    if (rhythm) {
      set_font("composer");
      xy_str(0, -cfmt.composerspace, rhythm);
      down1 = cfmt.composerspace;
    }
    area = info.A;
    if (cfmt.writefields.indexOf("C") >= 0) composer = info.C;
    if (cfmt.writefields.indexOf("O") >= 0) origin = info.O;
    if (composer || origin || cfmt.infoline) {
      var xcomp, align;

      set_font("composer");
      vskip(cfmt.composerspace);
      if (cfmt.aligncomposer < 0) {
        xcomp = 0;
        align = " ";
      } else if (cfmt.aligncomposer == 0) {
        xcomp = lwidth * 0.5;
        align = "c";
      } else {
        xcomp = lwidth;
        align = "r";
      }
      down2 = down1;
      if (composer || origin) {
        if (cfmt.aligncomposer >= 0 && down1 != down2) vskip(down1 - down2);
        i = 0;
        while (1) {
          vskip(gene.curfont.size);
          if (composer) j = composer.indexOf("\n", i);
          else j = -1;
          if (j < 0) {
            put_inf2r(
              xcomp,
              0,
              composer ? composer.substring(i) : null,
              origin,
              align
            );
            break;
          }
          xy_str(xcomp, 0, composer.slice(i, j), align);
          down1 += gene.curfont.size;
          i = j + 1;
        }
        if (down2 > down1) vskip(down2 - down1);
      }

      rhythm = rhythm ? null : info.R;
      if ((rhythm || area) && cfmt.infoline) {
        /* if only one of rhythm or area then do not use ()'s
         * otherwise output 'rhythm (area)' */
        set_font("info");
        vskip(gene.curfont.size + cfmt.infospace);
        put_inf2r(lwidth, 0, rhythm, area, "r");
        down1 += gene.curfont.size + cfmt.infospace;
      }
      //		down2 = 0
    } else {
      down2 = cfmt.composerspace;
    }

    /* parts */
    if (info.P && cfmt.writefields.indexOf("P") >= 0) {
      set_font("parts");
      down1 = cfmt.partsspace + gene.curfont.size - down1;
      if (down1 > 0) down2 += down1;
      if (down2 > 0.01) vskip(down2);
      xy_str(0, 0, info.P);
      down2 = 0;
    }
    vskip(down2 + cfmt.musicspace);
  }
  // abc2svg - svg.js - svg functions
  //
  // Copyright (C) 2014-2020 Jean-Francois Moine
  //
  // This file is part of abc2svg-core.
  //
  // abc2svg-core is free software: you can redistribute it and/or modify
  // it under the terms of the GNU Lesser General Public License as published by
  // the Free Software Foundation, either version 3 of the License, or
  // (at your option) any later version.
  //
  // abc2svg-core is distributed in the hope that it will be useful,
  // but WITHOUT ANY WARRANTY; without even the implied warranty of
  // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  // GNU Lesser General Public License for more details.
  //
  // You should have received a copy of the GNU Lesser General Public License
  // along with abc2svg-core.  If not, see <http://www.gnu.org/licenses/>.

  var output = "", // output buffer
    style =
      "\
\n.stroke{stroke:currentColor;fill:none}\
\n.bW{stroke:currentColor;fill:none;stroke-width:1}\
\n.bthW{stroke:currentColor;fill:none;stroke-width:3}\
\n.slW{stroke:currentColor;fill:none;stroke-width:.7}\
\n.slthW{stroke:currentColor;fill:none;stroke-width:1.5}\
\n.sW{stroke:currentColor;fill:none;stroke-width:.7}",
    font_style = "",
    posx = cfmt.leftmargin / cfmt.scale, // default x offset of the images
    posy = 0, // y offset in the block
    img = {
      // image
      width: cfmt.pagewidth, // width
      lm: cfmt.leftmargin, // left and right margins
      rm: cfmt.rightmargin,
      //		chg: false
    },
    defined_glyph = {},
    defs = "",
    fulldefs = "", // unreferenced defs as <filter>
    stv_g = {
      /* staff/voice graphic parameters */ scale: 1,
      dy: 0,
      st: -1,
      v: -1,
      g: 0,
      //		color: undefined
    },
    blkdiv = 1; // block of contiguous SVGs
  // -1: block started
  //  0: no block
  //  1: start a block
  //  2: start a new page

  // glyphs in music font
  var tgls = {
    "mtr ": { x: 0, y: 0, c: "\u0020" }, // space
    brace: { x: 0, y: 0, c: "\ue000" },
    lphr: { x: 0, y: 24, c: "\ue030" },
    mphr: { x: 0, y: 24, c: "\ue038" },
    sphr: { x: 0, y: 27, c: "\ue039" },
    rdots: { x: -1, y: 0, c: "\ue043" }, // repeat dots
    dsgn: { x: -4, y: -4, c: "\ue045" }, // D.S.
    dcap: { x: -4, y: -4, c: "\ue046" }, // D.C.
    sgno: { x: -6, y: 0, c: "\ue047" }, // segno
    coda: { x: -12, y: -6, c: "\ue048" },
    tclef: { x: -8, y: 0, c: "\ue050" },
    cclef: { x: -8, y: 0, c: "\ue05c" },
    bclef: { x: -8, y: 0, c: "\ue062" },
    pclef: { x: -6, y: 0, c: "\ue069" },
    spclef: { x: -6, y: 0, c: "\ue069" },
    stclef: { x: -8, y: 0, c: "\ue07a" },
    scclef: { x: -8, y: 0, c: "\ue07b" },
    sbclef: { x: -7, y: 0, c: "\ue07c" },
    oct: { x: 0, y: 2, c: "\ue07d" }, // 8 for clefs
    mtr0: { x: 0, y: 0, c: "\ue080" }, // meters
    mtr1: { x: 0, y: 0, c: "\ue081" },
    mtr2: { x: 0, y: 0, c: "\ue082" },
    mtr3: { x: 0, y: 0, c: "\ue083" },
    mtr4: { x: 0, y: 0, c: "\ue084" },
    mtr5: { x: 0, y: 0, c: "\ue085" },
    mtr6: { x: 0, y: 0, c: "\ue086" },
    mtr7: { x: 0, y: 0, c: "\ue087" },
    mtr8: { x: 0, y: 0, c: "\ue088" },
    mtr9: { x: 0, y: 0, c: "\ue089" },
    mtrC: { x: 0, y: 0, c: "\ue08a" }, // common time (4/4)
    //  "mtrC|": {x:0, y:0, c:"\ue08b"},	// cut time (2/2) (unused)
    "mtr+": { x: 0, y: 0, c: "\ue08c" },
    "mtr(": { x: 0, y: 0, c: "\ue094" },
    "mtr)": { x: 0, y: 0, c: "\ue095" },
    HDD: { x: -7, y: 0, c: "\ue0a0" },
    breve: { x: -7, y: 0, c: "\ue0a1" },
    HD: { x: -5.2, y: 0, c: "\ue0a2" },
    Hd: { x: -3.8, y: 0, c: "\ue0a3" },
    hd: { x: -3.7, y: 0, c: "\ue0a4" },
    ghd: { x: 2, y: 0, c: "\ue0a4", sc: 0.66 }, // grace note head
    pshhd: { x: -3.7, y: 0, c: "\ue0a9" },
    pfthd: { x: -3.7, y: 0, c: "\ue0b3" },
    x: { x: -3.7, y: 0, c: "\ue0a9" }, // 'x' note head
    "circle-x": { x: -3.7, y: 0, c: "\ue0b3" }, // 'circle-x' note head
    srep: { x: -5, y: 0, c: "\ue101" },
    "dot+": { x: -5, y: 0, sc: 0.7, c: "\ue101" },
    diamond: { x: -4, y: 0, c: "\ue1b9" },
    triangle: { x: -4, y: 0, c: "\ue1bb" },
    dot: { x: -2, y: 0, c: "\ue1e7" },
    flu1: { x: -0.3, y: 0, c: "\ue240" }, // flags
    fld1: { x: -0.3, y: 0, c: "\ue241" },
    flu2: { x: -0.3, y: 0, c: "\ue242" },
    fld2: { x: -0.3, y: 0, c: "\ue243" },
    flu3: { x: -0.3, y: 3.5, c: "\ue244" },
    fld3: { x: -0.3, y: -4, c: "\ue245" },
    flu4: { x: -0.3, y: 8, c: "\ue246" },
    fld4: { x: -0.3, y: -9, c: "\ue247" },
    flu5: { x: -0.3, y: 12.5, c: "\ue248" },
    fld5: { x: -0.3, y: -14, c: "\ue249" },
    "acc-1": { x: -1, y: 0, c: "\ue260" }, // flat
    "cacc-1": { x: -18, y: 0, c: "\ue26a\ue260\ue26b" }, // courtesy flat (note deco)
    "sacc-1": { x: -1, y: 0, sc: 0.7, c: "\ue260" }, // small flat (editorial)
    acc3: { x: -1, y: 0, c: "\ue261" }, // natural
    cacc3: { x: -18, y: 0, c: "\ue26a\ue261\ue26b" }, // courtesy natural (note deco)
    sacc3: { x: -1, y: 0, sc: 0.7, c: "\ue261" }, // small natural (editorial)
    acc1: { x: -2, y: 0, c: "\ue262" }, // sharp
    cacc1: { x: -18, y: 0, c: "\ue26a\ue262\ue26b" }, // courtesy sharp (note deco)
    sacc1: { x: -2, y: 0, sc: 0.7, c: "\ue262" }, // small sharp (editorial)
    acc2: { x: -3, y: 0, c: "\ue263" }, // double sharp
    "acc-2": { x: -3, y: 0, c: "\ue264" }, // double flat
    "acc-1_2": { x: -2, y: 0, c: "\ue280" }, // quarter-tone flat
    "acc-3_2": { x: -3, y: 0, c: "\ue281" }, // three-quarter-tones flat
    acc1_2: { x: -1, y: 0, c: "\ue282" }, // quarter-tone sharp
    acc3_2: { x: -3, y: 0, c: "\ue283" }, // three-quarter-tones sharp
    accent: { x: -3, y: 0, c: "\ue4a0" },
    stc: { x: -1, y: -2, c: "\ue4a2" }, // staccato
    emb: { x: -4, y: -2, c: "\ue4a4" },
    wedge: { x: -1, y: 0, c: "\ue4a8" },
    marcato: { x: -3, y: 0, c: "\ue4ac" },
    hld: { x: -7, y: 0, c: "\ue4c0" }, // fermata
    brth: { x: 0, y: 0, c: "\ue4ce" },
    r00: { x: -1.5, y: 0, c: "\ue4e1" },
    r0: { x: -1.5, y: 0, c: "\ue4e2" },
    r1: { x: -3.5, y: -6, c: "\ue4e3" },
    r2: { x: -3.2, y: 0, c: "\ue4e4" },
    r4: { x: -3, y: 0, c: "\ue4e5" },
    r8: { x: -3, y: 0, c: "\ue4e6" },
    r16: { x: -4, y: 0, c: "\ue4e7" },
    r32: { x: -4, y: 0, c: "\ue4e8" },
    r64: { x: -4, y: 0, c: "\ue4e9" },
    r128: { x: -4, y: 0, c: "\ue4ea" },
    mrest: { x: -10, y: 0, c: "\ue4ee" },
    mrep: { x: -6, y: 0, c: "\ue500" },
    mrep2: { x: -9, y: 0, c: "\ue501" },
    p: { x: -4, y: -6, c: "\ue520" },
    f: { x: -4, y: -6, c: "\ue522" },
    pppp: { x: -4, y: -6, c: "\ue529" },
    ppp: { x: -4, y: -6, c: "\ue52a" },
    pp: { x: -4, y: -6, c: "\ue52b" },
    mp: { x: -4, y: -6, c: "\ue52c" },
    mf: { x: -4, y: -6, c: "\ue52d" },
    ff: { x: -4, y: -6, c: "\ue52f" },
    fff: { x: -4, y: -6, c: "\ue530" },
    ffff: { x: -4, y: -6, c: "\ue531" },
    sfz: { x: -4, y: -6, c: "\ue539" },
    trl: { x: -4, y: -4, c: "\ue566" }, // trill
    turn: { x: -5, y: -4, c: "\ue567" },
    turnx: { x: -5, y: -4, c: "\ue569" },
    umrd: { x: -7, y: -2, c: "\ue56c" },
    lmrd: { x: -7, y: -2, c: "\ue56d" },
    dplus: { x: -4, y: 10, c: "\ue582" }, // plus
    sld: { x: -8, y: 12, c: "\ue5d0" }, // slide
    grm: { x: -2, y: 0, c: "\ue5e2" }, // grace mark
    dnb: { x: -4, y: 0, c: "\ue610" }, // down bow
    upb: { x: -3, y: 0, c: "\ue612" }, // up bow
    opend: { x: -2, y: 0, c: "\ue614" }, // harmonic
    roll: { x: 0, y: 0, c: "\ue618" },
    thumb: { x: 0, y: 0, c: "\ue624" },
    snap: { x: -2, y: 0, c: "\ue630" },
    ped: { x: -10, y: 0, c: "\ue650" },
    pedoff: { x: -5, y: 0, c: "\ue655" },
    // "mtro.": {x:0, y:0, c:"\ue910"},	// (unused)
    mtro: { x: 0, y: 0, c: "\ue911" }, // tempus perfectum
    // "mtro|": {x:0, y:0, c:"\ue912"},	// (unused)
    // "mtrc.": {x:0, y:0, c:"\ue914"},	// (unused)
    mtrc: { x: 0, y: 0, c: "\ue915" }, // tempus imperfectum
    // "mtrc|": {x:0, y:0, c:"\ue918"},	// (unused)
    "mtr.": { x: 0, y: 0, c: "\ue920" }, // prolatione perfecta
    "mtr|": { x: 0, y: 0, c: "\ue925" }, // (twice as fast)
    longa: { x: -4.7, y: 0, c: "\ue95d" },
    custos: { x: -4, y: 3, c: "\uea02" },
    ltr: { x: 2, y: 6, c: "\ueaa4" }, // long trill element
  };

  // glyphs to put in <defs>
  var glyphs = {};

  // convert a meter string to a SmuFL encoded string
  function m_gl(s) {
    return s.replace(/[Cco]\||[co]\.|./g, function (e) {
      var m = tgls["mtr" + e];
      //fixme: !! no m.x nor m.y yet !!
      //			if (!m.x && !m.y)
      return m.c;
      //			return '<tspan dx="'+ m.x.toFixed(1) +
      //				'" dy="' + m.y.toFixed(1) +
      //				'">' +
      //				m.c + '</tspan>'
    });
  }

  // mark a glyph as used and add it in <defs>
  function def_use(gl) {
    var i, j, g;

    if (defined_glyph[gl]) return;
    defined_glyph[gl] = true;
    g = glyphs[gl];
    if (!g) {
      //throw new Error("unknown glyph: " + gl)
      error(1, null, "Unknown glyph: '$1'", gl);
      return; // fixme: the xlink is set
    }
    j = 0;
    while (1) {
      i = g.indexOf('xlink:href="#', j);
      if (i < 0) break;
      i += 13;
      j = g.indexOf('"', i);
      def_use(g.slice(i, j));
    }
    defs += "\n" + g;
  }

  // add user defs from %%beginsvg
  function defs_add(text) {
    var i,
      j,
      gl,
      tag,
      is,
      ie = 0;

    // remove XML comments
    text = text.replace(/<!--.*?-->/g, "");

    while (1) {
      is = text.indexOf("<", ie);
      if (is < 0) break;
      i = text.indexOf('id="', is);
      if (i < 0) break;
      i += 4;
      j = text.indexOf('"', i);
      if (j < 0) break;
      gl = text.slice(i, j);
      ie = text.indexOf(">", j);
      if (ie < 0) break;
      if (text[ie - 1] == "/") {
        ie++;
      } else {
        i = text.indexOf(" ", is);
        if (i < 0) break;
        tag = text.slice(is + 1, i);
        ie = text.indexOf("</" + tag + ">", ie);
        if (ie < 0) break;
        ie += 3 + tag.length;
      }
      if (text.substr(is, 7) == "<filter")
        fulldefs += "\n" + text.slice(is, ie);
      else glyphs[gl] = text.slice(is, ie);
    }
  }

  // output the stop/start of a graphic sequence
  function set_g() {
    // close the previous sequence
    if (stv_g.started) {
      stv_g.started = false;
      output += "</g>\n";
    }

    // check if new sequence needed
    if (stv_g.scale == 1 && !stv_g.color) return;

    // open the new sequence
    output += "<g ";
    if (stv_g.scale != 1) {
      if (stv_g.st < 0) output += voice_tb[stv_g.v].scale_str;
      else if (stv_g.v < 0) output += staff_tb[stv_g.st].scale_str;
      else
        output +=
          'transform="translate(0,' +
          (posy - stv_g.dy).toFixed(1) +
          ") scale(" +
          stv_g.scale.toFixed(2) +
          ')"';
    }
    if (stv_g.color) {
      if (stv_g.scale != 1) output += " ";
      output += 'color="' + stv_g.color + '" fill="' + stv_g.color + '"';
    }
    output += ">\n";
    stv_g.started = true;
  }

  /* set the color */
  function set_color(color) {
    if (color == stv_g.color) return undefined; // same color
    var old_color = stv_g.color;
    stv_g.color = color;
    set_g();
    return old_color;
  }

  /* -- set the staff scale (only) -- */
  function set_sscale(st) {
    var new_scale, dy;

    if (st != stv_g.st && stv_g.scale != 1) stv_g.scale = 0;
    new_scale = st >= 0 ? staff_tb[st].staffscale : 1;
    if (st >= 0 && new_scale != 1) dy = staff_tb[st].y;
    else dy = posy;
    if (new_scale == stv_g.scale && dy == stv_g.dy) return;
    stv_g.scale = new_scale;
    stv_g.dy = dy;
    stv_g.st = st;
    stv_g.v = -1;
    set_g();
  }

  /* -- set the voice or staff scale -- */
  function set_scale(s) {
    var new_dy,
      new_scale = s.p_v.scale;

    if (new_scale == 1) {
      set_sscale(s.st);
      return;
    }
    new_dy = posy;
    if (staff_tb[s.st].staffscale != 1) {
      new_scale *= staff_tb[s.st].staffscale;
      new_dy = staff_tb[s.st].y;
    }
    if (new_scale == stv_g.scale && stv_g.dy == posy) return;
    stv_g.scale = new_scale;
    stv_g.dy = new_dy;
    stv_g.st = staff_tb[s.st].staffscale == 1 ? -1 : s.st;
    stv_g.v = s.v;
    set_g();
  }

  // -- set the staff output buffer and scale when delayed output
  function set_dscale(st, no_scale) {
    if (output) {
      if (stv_g.st < 0) {
        staff_tb[0].output += output;
      } else if (stv_g.scale == 1) {
        staff_tb[stv_g.st].output += output;
      } else {
        staff_tb[stv_g.st].sc_out += output;
      }
      output = "";
    }
    if (st < 0) stv_g.scale = 1;
    else stv_g.scale = no_scale ? 1 : staff_tb[st].staffscale;
    stv_g.st = st;
    stv_g.dy = 0;
  }

  // update the y offsets of delayed output
  function delayed_update() {
    var st, new_out, text;

    for (st = 0; st <= nstaff; st++) {
      if (staff_tb[st].sc_out) {
        output +=
          "<g " +
          staff_tb[st].scale_str +
          ">\n" +
          staff_tb[st].sc_out +
          "</g>\n";
        staff_tb[st].sc_out = "";
      }
      if (!staff_tb[st].output) continue;
      output +=
        '<g transform="translate(0,' +
        (-staff_tb[st].y).toFixed(1) +
        ')">\n' +
        staff_tb[st].output +
        "</g>\n";
      staff_tb[st].output = "";
    }
  }

  // output the annotations
  function anno_out(s, t, f) {
    if (s.istart == undefined) return;
    var type = s.type,
      h = s.ymx - s.ymn + 4,
      wl = s.wl || 2,
      wr = s.wr || 2;

    if (s.grace) type = C.GRACE;

    f(
      t || abc2svg.sym_name[type],
      s.istart,
      s.iend,
      s.x - wl - 2,
      staff_tb[s.st].y + s.ymn + h - 2,
      wl + wr + 4,
      h,
      s
    );
  }

  function a_start(s, t) {
    anno_out(s, t, user.anno_start);
  }
  function a_stop(s, t) {
    anno_out(s, t, user.anno_stop);
  }
  function empty_function() {}
  var anno_start = user.anno_start ? a_start : empty_function,
    // YYMCode: 传入方法
    anno_stop = user.anno_stop ? a_stop : empty_function,
    measure_draw = user.measure_draw ? user.measure_draw : empty_function;
  // ******************/
  // output a string with x, y, a and b
  // In the string,
  //	X and Y are replaced by scaled x and y
  //	A and B are replaced by a and b as string
  //	F and G are replaced by a and b as float
  function out_XYAB(str, x, y, a, b) {
    x = sx(x);
    y = sy(y);
    output += str.replace(/X|Y|A|B|F|G/g, function (c) {
      switch (c) {
        case "X":
          return x.toFixed(1);
        case "Y":
          return y.toFixed(1);
        case "A":
          return a;
        case "B":
          return b;
        case "F":
          return a.toFixed(1);
        //		case 'G':
        default:
          return b.toFixed(1);
      }
    });
  }

  // open / close containers
  function g_open(x, y, rot, sx, sy) {
    out_XYAB('<g transform="translate(X,Y', x, y);
    if (rot) output += ") rotate(" + rot.toFixed(2);
    if (sx) {
      if (sy) output += ") scale(" + sx.toFixed(2) + ", " + sy.toFixed(2);
      else output += ") scale(" + sx.toFixed(2);
    }
    output += ')">\n';
    stv_g.g++;
  }
  function g_close() {
    stv_g.g--;
    output += "</g>\n";
  }

  // external SVG string
  Abc.prototype.out_svg = function (str) {
    output += str;
  };

  // exported functions for the annotation
  function sx(x) {
    if (stv_g.g) return x;
    return (x + posx) / stv_g.scale;
  }
  Abc.prototype.sx = sx;
  function sy(y) {
    if (stv_g.g) return -y;
    if (stv_g.scale == 1) return posy - y;
    if (stv_g.v >= 0) return (stv_g.dy - y) / voice_tb[stv_g.v].scale;
    return stv_g.dy - y; // staff scale only
  }
  Abc.prototype.sy = sy;
  Abc.prototype.sh = function (h) {
    if (stv_g.st < 0) return h / stv_g.scale;
    return h;
  };
  // for absolute X,Y coordinates
  Abc.prototype.ax = function (x) {
    return x + posx;
  };
  Abc.prototype.ay = function (y) {
    if (stv_g.st < 0) return posy - y;
    return posy + (stv_g.dy - y) * stv_g.scale - stv_g.dy;
  };
  Abc.prototype.ah = function (h) {
    if (stv_g.st < 0) return h;
    return h * stv_g.scale;
  };
  // output scaled (x + <sep> + y)
  function out_sxsy(x, sep, y) {
    x = sx(x);
    y = sy(y);
    output += x.toFixed(1) + sep + y.toFixed(1);
  }
  Abc.prototype.out_sxsy = out_sxsy;

  // define the start of a path
  function xypath(x, y, fill) {
    if (fill) out_XYAB('<path d="mX Y', x, y);
    else out_XYAB('<path class="stroke" d="mX Y', x, y);
  }
  Abc.prototype.xypath = xypath;
  // YYMCode: 更新 xygl 用来标记 note id 值
  // output a glyph
  function xygl(x, y, gl, note_id) {
    // (avoid ps<->js loop)
    //	if (psxygl(x, y, gl))
    //		return
    if (glyphs[gl]) {
      def_use(gl);
      out_XYAB('<use x="X" y="Y" xlink:href="#A"/>\n', x, y, gl);
    } else {
      var tgl = tgls[gl];
      if (tgl) {
        x += tgl.x * stv_g.scale;
        y -= tgl.y;
        if (tgl.sc) {
          if (note_id > -1) {
            out_XYAB(
              `<text class="note_id_${note_id} note" transform="translate(X,Y) scale(A)">B</text>\n`,
              x,
              y,
              tgl.sc,
              tgl.c
            );
            out_XYAB(
              `<ellipse class="note_id_${note_id}_cursor note_cursor" fill-opacity="0" cx="X" cy="Y" rx="3" ry="4" transform="translate(X,Y) scale(A) ">B</ellipse>\n`,
              x + 3,
              y,
              tgl.sc,
              tgl.c
            );
          } else {
            out_XYAB(
              '<text transform="translate(X,Y) scale(A)">B</text>\n',
              x,
              y,
              tgl.sc,
              tgl.c
            );
          }
        } else {
          if (note_id > -1) {
            out_XYAB(
              `<text class="note_id_${note_id} note" x="X" y="Y">A</text>\n`,
              x,
              y,
              tgl.c
            );
            out_XYAB(
              `<ellipse class="note_id_${note_id}_cursor note_cursor" fill-opacity="0" cx="X" cy="Y" rx="3" ry="4" transform="rotate(60, X Y)"></ellipse>\n`,
              x + 3,
              y,
              tgl.sc,
              tgl.c
            );
          } else {
            out_XYAB('<text x="X" y="Y">A</text>\n', x, y, tgl.c);
          }
        }
      } else {
        error(1, null, "no definition of $1", gl);
      }
    }
  }
  // ******************/
  // - specific functions -
  // gua gda (acciaccatura)
  function out_acciac(x, y, dx, dy, up) {
    if (up) {
      x -= 1;
      y += 4;
    } else {
      x -= 5;
      y -= 4;
    }
    out_XYAB('<path class="stroke" d="mX YlF G"/>\n', x, y, dx, -dy);
  }
  // tuplet value - the staves are not defined
  function out_bnum(x, y, str) {
    out_XYAB(
      '<text style="font:italic 12px serif"\n\
	x="X" y="Y" text-anchor="middle">A</text>\n',
      x,
      y,
      str.toString()
    );
  }
  // staff system brace
  function out_brace(x, y, h) {
    //fixme: '-6' depends on the scale
    x += posx - 6;
    y = posy - y;
    h /= 24;
    output +=
      '<text transform="translate(' +
      x.toFixed(1) +
      "," +
      y.toFixed(1) +
      ") scale(2.5," +
      h.toFixed(2) +
      ')">' +
      tgls.brace.c +
      "</text>\n";
  }

  // staff system bracket
  function out_bracket(x, y, h) {
    x += posx - 5;
    y = posy - y - 3;
    h += 2;
    output +=
      '<path d="m' +
      x.toFixed(1) +
      " " +
      y.toFixed(1) +
      "\n\
	c10.5 1 12 -4.5 12 -3.5c0 1 -3.5 5.5 -8.5 5.5\n\
	v" +
      h.toFixed(1) +
      '\n\
	c5 0 8.5 4.5 8.5 5.5c0 1 -1.5 -4.5 -12 -3.5"/>\n';
  }
  // hyphen
  function out_hyph(x, y, w) {
    var n,
      a_y,
      d = 25 + ((w / 20) | 0) * 3;

    if (w > 15) n = ((w - 15) / d) | 0;
    else n = 0;
    x += (w - d * n - 5) / 2;
    out_XYAB(
      '<path class="stroke" stroke-width="1.2"\n\
	stroke-dasharray="5,A"\n\
	d="mX YhB"/>\n',
      x,
      y + 6, // set the line a bit upper
      Math.round((d - 5) / stv_g.scale),
      d * n + 5
    );
  }
  // stem [and flags]
  function out_stem(x, y, h, grace, nflags, straight) {
    // optional
    //fixme: dx KO with half note or longa
    var dx = grace ? GSTEM_XOFF : 3.5,
      slen = -h;

    if (h < 0) dx = -dx; // down
    x += dx * stv_g.scale;
    if (stv_g.v >= 0) slen /= voice_tb[stv_g.v].scale;
    out_XYAB(
      '<path class="sW" d="mX YvF"/>\n', // stem
      x,
      y,
      slen
    );
    if (!nflags) return;

    y += h;
    if (h > 0) {
      // up
      if (!straight) {
        if (!grace) {
          xygl(x, y, "flu" + nflags);
          return;
        } else {
          // grace
          output += '<path d="';
          if (nflags == 1) {
            out_XYAB(
              "MX Yc0.6 3.4 5.6 3.8 3 10\n\
	1.2 -4.4 -1.4 -7 -3 -7\n",
              x,
              y
            );
          } else {
            while (--nflags >= 0) {
              out_XYAB(
                "MX Yc1 3.2 5.6 2.8 3.2 8\n\
	1.4 -4.8 -2.4 -5.4 -3.2 -5.2\n",
                x,
                y
              );
              y -= 3.5;
            }
          }
        }
      } else {
        // straight
        output += '<path d="';
        if (!grace) {
          while (--nflags >= 0) {
            out_XYAB("MX Yl7 3.2 0 3.2 -7 -3.2z\n", x, y);
            y -= 5.4;
          }
        } else {
          // grace
          while (--nflags >= 0) {
            out_XYAB("MX Yl3 1.5 0 2 -3 -1.5z\n", x, y);
            y -= 3;
          }
        }
      }
    } else {
      // down
      if (!straight) {
        if (!grace) {
          xygl(x, y, "fld" + nflags);
          return;
        } else {
          // grace
          output += '<path d="';
          if (nflags == 1) {
            out_XYAB(
              "MX Yc0.6 -3.4 5.6 -3.8 3 -10\n\
	1.2 4.4 -1.4 7 -3 7\n",
              x,
              y
            );
          } else {
            while (--nflags >= 0) {
              out_XYAB(
                "MX Yc1 -3.2 5.6 -2.8 3.2 -8\n\
	1.4 4.8 -2.4 5.4 -3.2 5.2\n",
                x,
                y
              );
              y += 3.5;
            }
          }
        }
      } else {
        // straight
        output += '<path d="';
        if (!grace) {
          while (--nflags >= 0) {
            out_XYAB("MX Yl7 -3.2 0 -3.2 -7 3.2z\n", x, y);
            y += 5.4;
          }
          //			} else {		// grace
          //--fixme: error?
        }
      }
    }
    output += '"/>\n';
  }
  // tremolo
  function out_trem(x, y, ntrem) {
    out_XYAB('<path d="mX Y\n\t', x - 4.5, y);
    while (1) {
      output += "l9 -3v3l-9 3z";
      if (--ntrem <= 0) break;
      output += "m0 5.4";
    }
    output += '"/>\n';
  }
  // tuplet bracket - the staves are not defined
  function out_tubr(x, y, dx, dy, up) {
    var h = up ? -3 : 3;

    y += h;
    dx /= stv_g.scale;
    output += '<path class="stroke" d="m';
    out_sxsy(x, " ", y);
    output +=
      "v" +
      h.toFixed(1) +
      "l" +
      dx.toFixed(1) +
      " " +
      (-dy).toFixed(1) +
      "v" +
      (-h).toFixed() +
      '"/>\n';
  }
  // tuplet bracket with number - the staves are not defined
  function out_tubrn(x, y, dx, dy, up, str) {
    var sw = str.length * 10,
      h = up ? -3 : 3;

    out_XYAB(
      '<text style="font:italic 12px serif"\n\
	x="X" y="Y" text-anchor="middle">A</text>\n',
      x + dx / 2,
      y + dy / 2,
      str
    );
    dx /= stv_g.scale;
    if (!up) y += 6;
    output += '<path class="stroke" d="m';
    out_sxsy(x, " ", y);
    output +=
      "v" +
      h.toFixed(1) +
      "m" +
      dx.toFixed(1) +
      " " +
      (-dy).toFixed(1) +
      "v" +
      (-h).toFixed(1) +
      '"/>\n' +
      '<path class="stroke" stroke-dasharray="' +
      ((dx - sw) / 2).toFixed(1) +
      " " +
      sw.toFixed(1) +
      '" d="m';
    out_sxsy(x, " ", y - h);
    output += "l" + dx.toFixed(1) + " " + (-dy).toFixed(1) + '"/>\n';
  }
  // underscore line
  function out_wln(x, y, w) {
    out_XYAB(
      '<path class="stroke" stroke-width="0.8" d="mX YhF"/>\n',
      x,
      y + 3,
      w
    );
  }

  // decorations with string
  var deco_str_style = {
    crdc: {
      dx: 0,
      dy: 5,
      style: "font:italic 14px serif",
    },
    dacs: {
      dx: 0,
      dy: 3,
      style: "font:16px serif",
      anchor: ' text-anchor="middle"',
    },
    fng: {
      dx: 0,
      dy: 1,
      style: "font-family:Bookman; font-size:8px",
      anchor: ' text-anchor="middle"',
    },
    pf: {
      dx: 0,
      dy: 5,
      style: "font:italic bold 16px serif",
    },
    "@": {
      dx: 0,
      dy: 5,
      style: "font: 12px sans-serif",
    },
  };

  function out_deco_str(x, y, name, str) {
    var a,
      f,
      a_deco = deco_str_style[name];

    if (!a_deco) {
      xygl(x, y, name);
      return;
    }
    x += a_deco.dx;
    y += a_deco.dy;
    if (!a_deco.def) {
      style += "\n." + name + " {" + a_deco.style + "}";
      a_deco.def = true;
    }
    out_XYAB('<text x="X" y="Y" class="A"B>', x, y, name, a_deco.anchor || "");
    set_font("annotation");
    out_str(str);
    output += "</text>\n";
  }

  function out_arp(x, y, val) {
    g_open(x, y, 270);
    x = 0;
    val = Math.ceil(val / 6);
    while (--val >= 0) {
      xygl(x, 6, "ltr");
      x += 6;
    }
    g_close();
  }
  function out_cresc(x, y, val, defl) {
    x += val;
    val = -val;
    out_XYAB('<path class="stroke"\n\
	d="mX YlA ', x, y + 5, val);
    if (defl.nost) output += "-2.2m0 -3.6l" + (-val).toFixed(1) + ' -2.2"/>\n';
    else output += "-4l" + (-val).toFixed(1) + ' -4"/>\n';
  }
  function out_dim(x, y, val, defl) {
    out_XYAB('<path class="stroke"\n\
	d="mX YlA ', x, y + 5, val);
    if (defl.noen) output += "-2.2m0 -3.6l" + (-val).toFixed(1) + ' -2.2"/>\n';
    else output += "-4l" + (-val).toFixed(1) + ' -4"/>\n';
  }
  function out_ltr(x, y, val) {
    y += 4;
    val = Math.ceil(val / 6);
    while (--val >= 0) {
      xygl(x, y, "ltr");
      x += 6;
    }
  }
  function out_lped(x, y, val, defl) {
    y += 4;
    if (!defl.nost) xygl(x, y, "ped");
    if (!defl.noen) xygl(x + val + 6, y, "pedoff");
  }
  function out_8va(x, y, val, defl) {
    if (!defl.nost) {
      out_XYAB(
        '<text x="X" y="Y" \
style="font:italic bold 12px serif">8\
<tspan dy="-4" style="font-size:10px">va</tspan></text>\n',
        x - 8,
        y
      );
      x += 12;
      val -= 12;
    } else {
      val -= 5;
    }
    y += 6;
    out_XYAB(
      '<path class="stroke" stroke-dasharray="6,6" d="mX YhF"/>\n',
      x,
      y,
      val
    );
    if (!defl.noen) out_XYAB('<path class="stroke" d="mX Yv6"/>\n', x + val, y);
  }
  function out_8vb(x, y, val, defl) {
    if (!defl.nost) {
      out_XYAB(
        '<text x="X" y="Y" \
style="font:italic bold 12px serif">8\
<tspan dy="-4" style="font-size:10px">vb</tspan></text>\n',
        x - 8,
        y
      );
      x += 4;
      val -= 4;
    } else {
      val -= 5;
    }
    //	y -= 2;
    out_XYAB(
      '<path class="stroke" stroke-dasharray="6,6" d="mX YhF"/>\n',
      x,
      y,
      val
    );
    if (!defl.noen)
      out_XYAB('<path class="stroke" d="mX Yv-6"/>\n', x + val, y);
  }
  function out_15ma(x, y, val, defl) {
    if (!defl.nost) {
      out_XYAB(
        '<text x="X" y="Y" \
style="font:italic bold 12px serif">15\
<tspan dy="-4" style="font-size:10px">ma</tspan></text>\n',
        x - 10,
        y
      );
      x += 20;
      val -= 20;
    } else {
      val -= 5;
    }
    y += 6;
    out_XYAB(
      '<path class="stroke" stroke-dasharray="6,6" d="mX YhF"/>\n',
      x,
      y,
      val
    );
    if (!defl.noen) out_XYAB('<path class="stroke" d="mX Yv6"/>\n', x + val, y);
  }
  function out_15mb(x, y, val, defl) {
    if (!defl.nost) {
      out_XYAB(
        '<text x="X" y="Y" \
style="font:italic bold 12px serif">15\
<tspan dy="-4" style="font-size:10px">mb</tspan></text>\n',
        x - 10,
        y
      );
      x += 7;
      val -= 7;
    } else {
      val -= 5;
    }
    //	y -= 2;
    out_XYAB(
      '<path class="stroke" stroke-dasharray="6,6" d="mX YhF"/>\n',
      x,
      y,
      val
    );
    if (!defl.noen)
      out_XYAB('<path class="stroke" d="mX Yv-6"/>\n', x + val, y);
  }
  var deco_val_tb = {
    arp: out_arp,
    cresc: out_cresc,
    dim: out_dim,
    ltr: out_ltr,
    lped: out_lped,
    "8va": out_8va,
    "8vb": out_8vb,
    "15ma": out_15ma,
    "15mb": out_15mb,
  };

  function out_deco_val(x, y, name, val, defl) {
    if (deco_val_tb[name]) deco_val_tb[name](x, y, val, defl);
    else error(1, null, "No function for decoration '$1'", name);
  }

  function out_glisq(x2, y2, de) {
    var de1 = de.start,
      x1 = de1.x,
      y1 = de1.y + staff_tb[de1.st].y,
      ar = Math.atan2(y1 - y2, x2 - x1),
      a = (ar / Math.PI) * 180,
      len = (x2 - x1) / Math.cos(ar);

    g_open(x1, y1, a);
    x1 = de1.s.dots ? 13 + de1.s.xmx : 8;
    len = ((len - x1 - 6) / 6) | 0;
    if (len < 1) len = 1;
    while (--len >= 0) {
      xygl(x1, 0, "ltr");
      x1 += 6;
    }
    g_close();
  }

  function out_gliss(x2, y2, de) {
    var de1 = de.start,
      x1 = de1.x,
      y1 = de1.y + staff_tb[de1.st].y,
      ar = -Math.atan2(y2 - y1, x2 - x1),
      a = (ar / Math.PI) * 180,
      len = (x2 - x1) / Math.cos(ar);

    g_open(x1, y1, a);
    x1 = de1.s.dots ? 13 + de1.s.xmx : 8;
    len -= x1 + 8;
    xypath(x1, 0);
    output += "h" + len.toFixed(1) + '" stroke-width="1"/>\n';
    g_close();
  }

  var deco_l_tb = {
    glisq: out_glisq,
    gliss: out_gliss,
  };

  function out_deco_long(x, y, de) {
    var name = de.dd.glyph;

    if (deco_l_tb[name]) deco_l_tb[name](x, y, de);
    else error(1, null, "No function for decoration '$1'", name);
  }

  // return a tempo note
  function tempo_note(s, dur) {
    var p,
      elts = identify_note(s, dur);

    switch (
      elts[0] // head
    ) {
      case C.OVAL:
        p = "\ueca2";
        break;
      case C.EMPTY:
        p = "\ueca3";
        break;
      default:
        switch (
          elts[2] // flags
        ) {
          case 2:
            p = "\ueca9";
            break;
          case 1:
            p = "\ueca7";
            break;
          default:
            p = "\ueca5";
            break;
        }
        break;
    }
    if (elts[1])
      // dot
      p += '<tspan dx=".1em">\uecb7</tspan>';
    return p;
  } // tempo_note()

  // build the tempo string
  function tempo_build(s) {
    var i,
      j,
      bx,
      p,
      wh,
      dy,
      w = 0,
      str = [];

    if (s.tempo_str)
      // already done
      return;

    // the music font must be defined
    if (!cfmt.musicfont.used) get_font("music");

    set_font("tempo");
    if (s.tempo_str1) {
      str.push(s.tempo_str1);
      w += strwh(s.tempo_str1)[0];
    }
    if (s.tempo_notes) {
      dy = ' dy="-.05em"'; // notes a bit higher
      for (i = 0; i < s.tempo_notes.length; i++) {
        p = tempo_note(s, s.tempo_notes[i]);
        str.push(
          '<tspan\nclass="' +
            font_class(cfmt.musicfont) +
            '" style="font-size:' +
            (gene.curfont.size * 1.3).toFixed(1) +
            'px"' +
            dy +
            ">" +
            p +
            "</tspan>"
        );
        j = p.length > 1 ? 2 : 1; // (note and optional dot)
        w += j * gene.curfont.swfac;
        dy = "";
      }
      str.push('<tspan dy=".065em">=</tspan>');
      w += cwidf("=");
      if (s.tempo_ca) {
        str.push(s.tempo_ca);
        w += strwh(s.tempo_ca)[0];
        j = s.tempo_ca.length + 1;
      }
      if (s.tempo) {
        // with a number of beats per minute
        str.push(s.tempo);
        w += strwh(s.tempo.toString())[0];
      } else {
        // with a beat as a note
        p = tempo_note(s, s.new_beat);
        str.push(
          '<tspan\nclass="' +
            font_class(cfmt.musicfont) +
            '" style="font-size:' +
            (gene.curfont.size * 1.3).toFixed(1) +
            'px" dy="-.05em">' +
            p +
            "</tspan>"
        );
        j = p.length > 1 ? 2 : 1;
        w += j * gene.curfont.swfac;
        dy = "y";
      }
    }
    if (s.tempo_str2) {
      if (dy) str.push('<tspan\n\tdy=".065em">' + s.tempo_str2 + "</tspan>");
      else str.push(s.tempo_str2);
      w += strwh(s.tempo_str2)[0];
    }

    // build the string
    s.tempo_str = str.join(" ");
    w += cwidf(" ") * (str.length - 1);
    s.tempo_wh = [w, 13.0]; // (the height is not used)
    if (dy) s.tempo_dy = dy;
  } // tempo_build()

  // output a tempo
  function writempo(s, x, y) {
    var bx;

    set_font("tempo");
    if (gene.curfont.box) {
      gene.curfont.box = false;
      bx = x;
    }

    //fixme: xy_str() cannot be used because <tspan> in s.tempo_str
    //fixme: then there cannot be font changes by "$n" in the Q: texts
    output += '<text class="' + font_class(gene.curfont) + '" x="';
    out_sxsy(x, '" y="', y + gene.curfont.size * 0.2);
    output += '">' + s.tempo_str + "</text>\n";

    if (bx) {
      gene.curfont.box = true;
      bh = gene.curfont.size + 4;
      output += '<rect class="stroke" x="';
      out_sxsy(bx - 2, '" y="', y + bh - 1);
      output +=
        '" width="' +
        (s.tempo_wh[0] + 2).toFixed(1) +
        '" height="' +
        bh.toFixed(1) +
        '"/>\n';
    }

    // don't display anymore
    s.invis = true;
  } // writempo()

  // update the vertical offset
  function vskip(h) {
    posy += h;
  }
  // YYMCode: 在每个SVG前面加一个DIV 标签
  let systemCounter = 0;

  // create the SVG image of the block
  function svg_flush() {
    if (multicol || !output || !user.img_out || posy == 0) return;
    // YYMCode:每个 system 都有标记
    var i,
      font,
      head = `<div class="system system-${systemCounter}"><svg xmlns="http://www.w3.org/2000/svg" version="1.1"\n\
 xmlns:xlink="http://www.w3.org/1999/xlink"\n\
 color="`,
      g = "";
    systemCounter++;
    // ******************/

    if (cfmt.fgcolor) head += cfmt.fgcolor + '" fill="' + cfmt.fgcolor + '"';
    else head += 'black"';
    head += ' stroke-width=".7"';

    if (cfmt.bgcolor) head += ' style="background-color: ' + cfmt.bgcolor + '"';

    font = get_font("music");
    head += ' class="' + font_class(font) + " tune" + tunes.length + '"\n'; // tune index for play

    posy *= cfmt.scale;
    if (user.imagesize) {
      head +=
        user.imagesize +
        ' viewBox="0 0 ' +
        img.width.toFixed(0) +
        " " +
        posy.toFixed(0) +
        '">\n';
    } else {
      head +=
        ' width="' +
        img.width.toFixed(0) +
        'px" height="' +
        posy.toFixed(0) +
        'px">\n';
    }
    Abc.prototype.systemHeightArray.push(posy.toFixed(0));

    if (style || font_style)
      head +=
        "<style>\n." +
        font_class(font) + // for fill color
        " text,tspan{fill:currentColor}" +
        font_style +
        style +
        "\n</style>\n";

    defs += fulldefs;
    if (defs) head += "<defs>" + defs + "\n</defs>\n";

    // if %%pagescale != 1, do a global scale
    // (with a container: transform scale in <svg> does not work
    //	the same in all browsers)
    // the class is used to know that the container is global
    if (cfmt.scale != 1) {
      head +=
        '<g class="g" transform="scale(' + cfmt.scale.toFixed(2) + ')">\n';
      g = "</g>\n";
    }

    if (psvg)
      // if PostScript support
      psvg.ps_flush(true); // + setg(0)

    // start a block if needed
    if (blkdiv > 0) {
      user.img_out(
        blkdiv == 1 ? '<div class="nobrk">' : '<div class="nobrk newpage">'
      );
      // block started
      blkdiv = -1;
    }
    // YYMCode: 添加div标签
    user.img_out(head + output + g + "</svg></div>");
    // ******************/
    output = "";

    font_style = "";
    if (cfmt.fullsvg) {
      defined_glyph = {};
      for (i = 0; i < font_tb.length; i++) font_tb[i].used = false;
    } else {
      style = "";
      fulldefs = "";
    }
    defs = "";
    posy = 0;
  }

  // mark the end of a <div> block
  function blk_flush() {
    svg_flush();
    if (blkdiv < 0 && (!parse.state || cfmt.splittune)) {
      user.img_out("</div>");
      blkdiv = 0;
    }
  }
  Abc.prototype.blk_flush = blk_flush;
  // abc2svg - tune.js - tune generation
  //
  // Copyright (C) 2014-2020 Jean-Francois Moine
  //
  // This file is part of abc2svg-core.
  //
  // abc2svg-core is free software: you can redistribute it and/or modify
  // it under the terms of the GNU Lesser General Public License as published by
  // the Free Software Foundation, either version 3 of the License, or
  // (at your option) any later version.
  //
  // abc2svg-core is distributed in the hope that it will be useful,
  // but WITHOUT ANY WARRANTY; without even the implied warranty of
  // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  // GNU Lesser General Public License for more details.
  //
  // You should have received a copy of the GNU Lesser General Public License
  // along with abc2svg-core.  If not, see <http://www.gnu.org/licenses/>.

  var par_sy, // current staff system for parse
    cur_sy, // current staff system for generation
    voice_tb,
    curvoice,
    staves_found,
    vover, // voice overlay
    tsfirst;

  /* apply the %%voice options of the current voice */
  function voice_filter() {
    var opt;

    function vfilt(opts, opt) {
      var i,
        sel = new RegExp(opt);

      if (sel.test(curvoice.id) || sel.test(curvoice.nm)) {
        for (i = 0; i < opts.length; i++) self.do_pscom(opts[i]);
      }
    }

    // global
    if (parse.voice_opts)
      for (opt in parse.voice_opts) {
        if (parse.voice_opts.hasOwnProperty(opt))
          vfilt(parse.voice_opts[opt], opt);
      }

    // tune
    if (parse.tune_v_opts)
      for (opt in parse.tune_v_opts) {
        if (parse.tune_v_opts.hasOwnProperty(opt))
          vfilt(parse.tune_v_opts[opt], opt);
      }
  }

  /* -- link a ABC symbol into the current voice -- */
  function sym_link(s) {
    if (!s.fname) set_ref(s);
    parse.last_sym = s;
    s.prev = curvoice.last_sym;
    if (curvoice.last_sym) curvoice.last_sym.next = s;
    else curvoice.sym = s;
    curvoice.last_sym = s;
    s.v = curvoice.v;
    s.p_v = curvoice;
    s.st = curvoice.cst;
    s.time = curvoice.time;
    if (s.dur && !s.grace) curvoice.time += s.dur;
    s.pos = curvoice.pos;
    if (curvoice.second) s.second = true;
    if (curvoice.floating) s.floating = true;
    if (curvoice.eoln) {
      s.soln = true;
      curvoice.eoln = false;
    }
  }

  /* -- add a new symbol in a voice -- */
  function sym_add(p_voice, type) {
    var s = {
        type: type,
        dur: 0,
      },
      s2,
      p_voice2 = curvoice;

    curvoice = p_voice;
    sym_link(s);
    curvoice = p_voice2;
    s2 = s.prev;
    if (!s2) s2 = s.next;
    if (s2) {
      s.fname = s2.fname;
      s.istart = s2.istart;
      s.iend = s2.iend;
    }
    return s;
  }

  /* -- sort all symbols by time and vertical sequence -- */
  // weight of the symbols !! depends on the symbol type !!
  var w_tb = new Uint8Array([
    4, // bar
    1, // clef
    8, // custos
    0, // (free)
    3, // grace
    5, // key
    6, // meter
    9, // mrest
    9, // note
    0, // part
    9, // rest
    3, // space
    0, // staves
    7, // stbrk
    0, // tempo
    0, // (free)
    0, // block
    0, // remark
  ]);

  function sort_all() {
    var s,
      s2,
      p_voice,
      v,
      time,
      w,
      wmin,
      ir,
      multi,
      prev,
      nb,
      ir2,
      v2,
      fl,
      new_sy,
      nv = voice_tb.length,
      vtb = [],
      vn = [], // voice indexed by range
      sy = cur_sy;

    for (v = 0; v < nv; v++) vtb.push(voice_tb[v].sym);

    // set the first symbol
    ir2 = nv;
    multi = -1;
    for (v = 0; v < nv; v++) {
      if (!sy.voices[v]) continue;
      ir = sy.voices[v].range;
      if (ir < ir2) ir2 = ir;
      vn[ir] = v;
      multi++;
    }
    v = vn[ir2];
    tsfirst = prev = vtb[v];
    if (!tsfirst) return; // no music
    vtb[v] = tsfirst.next;
    prev.seqst = true;
    fl = !w_tb[prev.type] || tsfirst.type == tsfirst.next;

    // loop on the symbols of all voices
    while (1) {
      if (new_sy && fl) {
        sy = new_sy;
        new_sy = null;
        multi = -1;
        vn = [];
        for (v = 0; v < nv; v++) {
          if (!sy.voices[v]) continue;
          ir = sy.voices[v].range;
          vn[ir] = v;
          multi++;
        }
      }

      /* search the min time and symbol weight */
      wmin = time = 1000000; /* big int */
      for (ir = 0; ir < nv; ir++) {
        v = vn[ir];
        if (v == undefined) break;
        s = vtb[v];
        if (!s || s.time > time) continue;
        w = w_tb[s.type];
        if (s.time < time) {
          time = s.time;
          wmin = w;
        } else if (w < wmin) {
          wmin = w;
        }
      }

      if (wmin > 127) break; // done

      /* link the vertical sequence */
      for (ir = 0; ir < nv; ir++) {
        v = vn[ir];
        if (v == undefined) break;
        s = vtb[v];
        if (!s || s.time != time || w_tb[s.type] != wmin) continue;
        if (s.type == C.STAVES) {
          new_sy = s.sy;

          // set all voices of previous and next staff systems
          // as reachable
          for (ir2 = 0; ir2 < nv; ir2++) {
            if (vn[ir2] == undefined) break;
          }
          for (v2 = 0; v2 < nv; v2++) {
            if (!new_sy.voices[v2] || sy.voices[v2]) continue;
            vn[ir2++] = v2;
          }
        }
        if (fl) {
          fl = 0;
          s.seqst = true;
        }
        s.ts_prev = prev;
        prev.ts_next = s;
        prev = s;

        vtb[v] = s.next;
      }
      fl = wmin; /* start a new sequence if some width */
    }
  }

  // adjust some voice elements
  function voice_adj(sys_chg) {
    var p_voice, s, s2, v;

    // set the duration of the notes under a feathered beam
    function set_feathered_beam(s1) {
      var s,
        s2,
        t,
        d,
        b,
        i,
        a,
        d = s1.dur,
        n = 1;

      /* search the end of the beam */
      for (s = s1; s; s = s.next) {
        if (s.beam_end || !s.next) break;
        n++;
      }
      if (n <= 1) {
        delete s1.feathered_beam;
        return;
      }
      s2 = s;
      b = d / 2; /* smallest note duration */
      a = d / (n - 1); /* delta duration */
      t = s1.time;
      if (s1.feathered_beam > 0) {
        /* !beam-accel! */
        for (s = s1, i = n - 1; s != s2; s = s.next, i--) {
          d = ((a * i) | 0) + b;
          s.dur = d;
          s.time = t;
          t += d;
        }
      } else {
        /* !beam-rall! */
        for (s = s1, i = 0; s != s2; s = s.next, i++) {
          d = ((a * i) | 0) + b;
          s.dur = d;
          s.time = t;
          t += d;
        }
      }
      s.dur = s.time + s.dur - t;
      s.time = t;
    } // end set_feathered_beam()

    // terminate voice cloning
    if (curvoice && curvoice.clone) {
      parse.istart = parse.eol;
      do_cloning();
    }

    // if Q: from tune header, put it at start of the music
    // (after the staff system)
    s = glovar.tempo;
    if (s && staves_found <= 0) {
      // && !s.invis) {	- play problem
      //fixme: which play problem?
      v = par_sy.top_voice;
      p_voice = voice_tb[v];
      if (
        p_voice.sym &&
        p_voice.sym.type != C.TEMPO &&
        (!p_voice.sym.next || p_voice.sym.next.type != C.TEMPO)
      ) {
        s = clone(s);
        s.v = v;
        s.p_v = p_voice;
        s.st = p_voice.st;
        s.time = 0;
        s.prev = p_voice.sym;
        s.next = p_voice.sym.next;
        if (s.next) s.next.prev = s;
        p_voice.sym.next = s;
      }
    }

    for (v = 0; v < voice_tb.length; v++) {
      p_voice = voice_tb[v];
      if (!sys_chg) {
        // if not %%score
        delete p_voice.eoln;
        while (1) {
          // set the end of slurs
          var sl = p_voice.sls.shift();

          if (!sl) break;
          s = sl.note.s;
          for (s2 = s.next; s2; s2 = s2.next) {
            if (s2.bar_type && s2.bar_type[0] == ":") break;
          }
          if (s2) {
            if (!s.sls) s.sls = [];
            s.sls.push({
              ty: sl.ty,
              note: { s: s2 },
            });
          } else {
            syntax(1, "Lack of ending slur(s)");
          }
        }
      } // not %%score
      for (s = p_voice.sym; s; s = s.next) {
        if (s.time >= staves_found) break;
      }
      for (; s; s = s.next) {
        switch (s.type) {
          case C.GRACE:
            // with w_tb[C.BAR] = 2,
            // the grace notes go after the bar;
            // if before a bar, change the grace time
            if (s.next && s.next.type == C.BAR) s.time--;

            if (!cfmt.graceword) continue;
            for (s2 = s.next; s2; s2 = s2.next) {
              switch (s2.type) {
                case C.SPACE:
                  continue;
                case C.NOTE:
                  if (!s2.a_ly) break;
                  s.a_ly = s2.a_ly;
                  s2.a_ly = null;
                  break;
              }
              break;
            }
            continue;
        }

        if (s.feathered_beam) set_feathered_beam(s);
      }
    }
  }

  /* -- create a new staff system -- */
  function new_syst(init) {
    var st,
      v,
      sy_new = {
        voices: [],
        staves: [],
        top_voice: 0,
      };

    if (init) {
      /* first staff system */
      cur_sy = par_sy = sy_new;
      return;
    }

    // update the previous system
    for (v = 0; v < voice_tb.length; v++) {
      if (par_sy.voices[v]) {
        st = par_sy.voices[v].st;
        var sy_staff = par_sy.staves[st],
          p_voice = voice_tb[v];

        if (p_voice.staffnonote != undefined)
          sy_staff.staffnonote = p_voice.staffnonote;
        if (p_voice.staffscale) sy_staff.staffscale = p_voice.staffscale;
      }
    }
    for (st = 0; st < par_sy.staves.length; st++) {
      sy_new.staves[st] = clone(par_sy.staves[st]);
      sy_new.staves[st].flags = 0;
    }
    par_sy.next = sy_new;
    par_sy = sy_new;
  }

  /* -- set the bar numbers -- */
  // (possible hook)
  Abc.prototype.set_bar_num = function () {
    var s,
      s2,
      tim,
      bar_time,
      bar_num,
      rep_dtime,
      v = cur_sy.top_voice,
      wmeasure = voice_tb[v].meter.wmeasure,
      bar_rep = gene.nbar;

    /* don't count a bar at start of line */
    for (s = tsfirst; ; s = s.ts_next) {
      if (!s) return;
      switch (s.type) {
        case C.METER:
          wmeasure = s.wmeasure;
        case C.CLEF:
        case C.KEY:
        case C.STBRK:
          continue;
        case C.BAR:
          if (s.bar_num) {
            gene.nbar = s.bar_num; /* (%%setbarnb) */
            break;
          }
          if (
            s.text && // if repeat bar
            !cfmt.contbarnb
          ) {
            if (s.text[0] == "1") {
              bar_rep = gene.nbar;
            } else {
              gene.nbar = bar_rep; /* restart bar numbering */
              s.bar_num = gene.nbar;
            }
          }
          break;
      }
      break;
    }

    // at start of tune, check for an anacrusis
    bar_time = s.time + wmeasure;
    if (s.time == 0) {
      for (s2 = s.ts_next; s2; s2 = s2.ts_next) {
        if (s2.type == C.BAR && s2.time) {
          if (s2.time < bar_time) {
            // if anacrusis
            s = s2;
            bar_time = s.time + wmeasure;
          }
          break;
        }
      }
    }

    // set the measure number on the top bars
    bar_num = gene.nbar;

    for (; s; s = s.ts_next) {
      switch (s.type) {
        case C.METER:
          wmeasure = s.wmeasure;
          if (s.time < bar_time) bar_time = s.time + wmeasure;
          break;
        case C.MREST:
          bar_num += s.nmes - 1;
          while (s.ts_next && s.ts_next.type != C.BAR) s = s.ts_next;
          break;
        case C.BAR:
          if (s.time < bar_time) {
            // incomplete measure
            if (s.text && s.text[0] == "1") {
              bar_rep = bar_num;
              rep_dtime = bar_time - s.time;
            }
            break;
          }

          /* check if any repeat bar at this time */
          tim = s.time;
          s2 = s;
          do {
            if (s2.dur) break;
            if (s2.type == C.BAR && s2.text)
              // if repeat bar
              break;
            s2 = s2.next;
          } while (s2 && s2.time == tim);

          if (s.bar_num) bar_num = s.bar_num;
          // (%%setbarnb)
          else bar_num++;

          if (s2 && s2.type == C.BAR && s2.text) {
            if (s2.text[0] == "1") {
              rep_dtime = 0;
              bar_rep = bar_num;
            } else {
              // restart bar numbering
              if (!cfmt.contbarnb) bar_num = bar_rep;
              if (rep_dtime) {
                // [1 inside measure
                if (cfmt.contbarnb) bar_num--;
                bar_time = tim + rep_dtime;
                break;
              }
            }
          }
          s.bar_num = bar_num;
          bar_time = tim + wmeasure;

          // skip the bars of the other voices
          while (s.ts_next && !s.ts_next.seqst) s = s.ts_next;
          break;
      }
    }
    if (cfmt.measurenb < 0)
      /* if no display of measure bar */
      gene.nbar = bar_num; /* update in case of more music to come */
  };

  // note mapping
  // %%map map_name note [print [note_head]] [param]*
  function get_map(text) {
    if (!text) return;

    var i,
      note,
      notes,
      map,
      tmp,
      ns,
      ty,
      a = text.split(/\s+/);

    if (a.length < 3) {
      syntax(1, not_enough_p);
      return;
    }
    ns = a[1];
    if (ns[0] == "*" || ns.indexOf("all") == 0) {
      ns = "all";
    } else {
      if (
        ns.indexOf("octave,") == 0 || // remove the octave part
        ns.indexOf("key,") == 0
      ) {
        ty = ns[0];
        ns = ns.split(",")[1];
        ns = ns.replace(/[,']*/, "").toUpperCase(); //'
        //		} else {
        //			ty = ''
      }
      if (ty == "k") {
        ns = ty + ntb.indexOf(ns);
      } else {
        tmp = new scanBuf();
        tmp.buffer = ns;
        note = parse_acc_pit(tmp);
        if (!note) {
          syntax(1, "Bad note in %%map");
          return;
        }
        if (ty == "o")
          ns = ty + (abc2svg.pab40(note.pit, note.acc) % 40).toString();
        else ns = abc2svg.pab40(note.pit, note.acc).toString();
      }
    }

    notes = maps[a[0]];
    if (!notes) maps[a[0]] = notes = {};
    map = notes[ns];
    if (!map) notes[ns] = map = [];

    // try the optional 'print' and 'heads' parameters
    a.shift();
    a.shift();
    if (!a.length) return;
    a = info_split(a.join(" "));
    i = 0;
    if (a[0].indexOf("=") < 0) {
      if (a[0][0] != "*") {
        tmp = new scanBuf(); // print
        tmp.buffer = a[0];
        map[1] = parse_acc_pit(tmp);
      }
      if (!a[1]) return;
      i++;
      if (a[1].indexOf("=") < 0) {
        map[0] = a[1].split(","); // heads
        i++;
      }
    }

    for (; i < a.length; i++) {
      switch (a[i]) {
        case "heads=":
          if (!a[++i]) {
            syntax(1, not_enough_p);
            break;
          }
          map[0] = a[i].split(",");
          break;
        case "print=":
        case "play=":
          if (!a[++i]) {
            syntax(1, not_enough_p);
            break;
          }
          tmp = new scanBuf();
          tmp.buffer = a[i];
          note = parse_acc_pit(tmp);
          if (a[i - 1][1] == "r") map[1] = note;
          else map[3] = note;
          break;
        case "color=":
          if (!a[++i]) {
            syntax(1, not_enough_p);
            break;
          }
          map[2] = a[i];
          break;
      }
    }
  }

  // set the transposition in the previous or first key signature
  function set_transp() {
    var s, transp, sndtran;

    if (curvoice.ckey.k_bagpipe || curvoice.ckey.k_drum) return;

    if (cfmt.transp && curvoice.shift)
      // if %%transpose and shift=
      syntax(0, "Mix of old and new transposition syntaxes");

    if (
      cfmt.transp != undefined ||
      curvoice.transp != undefined ||
      curvoice.shift != undefined
    )
      transp =
        (cfmt.transp || 0) + // %%transpose
        (curvoice.transp || 0) + // score= / sound= / instrument=
        (curvoice.shift || 0); // shift=
    if (curvoice.sndtran != undefined || curvoice.sndsh != undefined)
      sndtran = (curvoice.sndtran || 0) + (curvoice.sndsh || 0);
    if (transp == undefined) {
      if (sndtran == undefined) return;
    } else {
      curvoice.vtransp = transp;
    }

    if (is_voice_sig()) {
      // if no symbol yet
      curvoice.key = s = clone(curvoice.okey);
    } else {
      s = curvoice.last_sym;
      while (1) {
        // set the transposition in the previous K:
        if (s.type == C.KEY) break;
        s = s.prev;
        if (!s) {
          s = curvoice.ckey;
          break;
        }
      }
    }
    if (transp != undefined) s.k_transp = transp;
    if (sndtran != undefined) s.k_sndtran = sndtran;
    curvoice.ckey = clone(s);
    if (curvoice.key.k_none) s.k_sf = 0;
  }

  /* transpose a note / chord */
  function note_transp(s, sk, note) {
    var ak,
      an,
      d,
      b40,
      n = note.pit,
      a = note.acc;

    if (!a && sk.k_a_acc)
      // if accidental list
      a = sk.k_map[(n + 19) % 7]; // invisible accidental

    b40 = abc2svg.pab40(n, a) + sk.k_transp; // base-40 transposition

    note.pit = abc2svg.b40p(b40); // new pitch

    if (!a) {
      // if no old accidental
      if (
        !sk.k_a_acc && // if no accidental list
        !sk.k_none
      )
        // and normal key
        return; // same accidental (in the key)
    }

    an = abc2svg.b40a(b40); // new accidental
    if (a) {
      if (sk.k_a_acc) {
        // if accidental list
        ak = sk.k_map[(note.pit + 19) % 7];
        if (ak == an) an = 0; // accidental in the key
      }
      if (!an) an = 3;
    } else if (sk.k_none) {
      // if no key
      if (acc_same_pitch(s, note.pit))
        // and accidental from previous notes
        return; // no change
    } else if (sk.k_a_acc) {
      // if accidental list
      if (acc_same_pitch(s, note.pit))
        // and accidental from previous notes
        return; // no change
      ak = sk.k_map[(note.pit + 19) % 7];
      if (ak) an = 3; // natural
    } else {
      return; // same accidental (in the key)
    }
    note.acc = an;
  }

  // adjust the pitches according to the transposition(s)
  function pit_adj() {
    var i,
      p_v,
      s,
      sk,
      g,
      nv = voice_tb.length;

    // map a note
    // The 'map' in the note is an array of
    //	[0] array of heads (glyph names)
    //	[1] print (note)
    //	[2] color
    //	[3] play (note)
    function note_map(note) {
      var nn,
        map = note.map;

      if (!map) return;
      if (map[1]) {
        // if print map
        note.pit = map[1].pit;
        note.acc = map[1].acc;
      }
      if (map[2])
        // if color
        note.color = map[2];
      nn = map[3];
      if (nn)
        // if play map
        note.midi = pit2mid(nn.pit + 19, nn.acc);
    } // note_map()

    while (--nv >= 0) {
      p_v = voice_tb[nv];
      if (p_v.vtransp == undefined) continue; // no transposition in this voice
      if (p_v.key.k_transp) {
        sk = p_v.key;
        key_transp(sk);
      } else {
        sk = null;
      }
      s = p_v.sym;
      while (s) {
        // search a transposing key signature
        if (!sk) {
          for (; s; s = s.next) {
            if (s.type == C.KEY && s.k_transp) break;
          }
        }

        // transpose
        for (; s; s = s.next) {
          switch (s.type) {
            case C.GRACE:
              for (g = s.extra; g; g = g.next) {
                for (i = 0; i <= g.nhd; i++) note_transp(g, sk, g.notes[i]);
              }
              continue;
            case C.NOTE:
              for (i = 0; i <= s.nhd; i++) note_transp(s, sk, s.notes[i]);
              continue;
            case C.KEY:
              if (sk) s.k_sf = sk.k_sf;
              key_transp(s);
              if (!s.k_transp)
                // end of transposition
                break;
              sk = s;
            default:
              continue;
          }
          break;
        }
        sk = null;
      }
    }

    nv = voice_tb.length;
    while (--nv >= 0) {
      p_v = voice_tb[nv];
      if (p_v.map == undefined) continue; // no map in this voice
      for (s = p_v.sym; s; s = s.next) {
        switch (s.type) {
          case C.GRACE:
            for (g = s.extra; g; g = g.next) {
              for (i = 0; i <= g.nhd; i++) note_map(g.notes[i]);
            }
            break;
          case C.NOTE:
            for (i = 0; i <= s.nhd; i++) note_map(s.notes[i]);
            break;
        }
      }
    }
  } // pit_adj()

  // get a abcm2ps/abcMIDI compatible transposition value as a base-40 interval
  // The value may be
  // - [+|-]<number of semitones>[s|f]
  // - <note1>[<note2>]  % <note2> default is 'c'
  function get_transp(param) {
    if (param[0] == "0") return 0;
    if ("123456789-+".indexOf(param[0]) >= 0) {
      // by semi-tone
      var val = parseInt(param);
      if (isNaN(val) || val < -36 || val > 36) {
        //fixme: no source reference...
        syntax(1, errs.bad_transp);
        return;
      }
      val += 36;
      return (
        (((val / 12) | 0) - 3) * 40 +
        (param.slice(-1) == "b" ? abc2svg.ifb40 : abc2svg.isb40)[val % 12]
      );
    }
    // return undefined
  } // get_transp()

  /* -- process a pseudo-comment (%% or I:) -- */
  // (possible hook)
  Abc.prototype.do_pscom = function (text) {
    var h1, val, s, cmd, param, n, k, b;

    cmd = text.match(/(\w|-)+/);
    if (!cmd) return;
    cmd = cmd[0];

    // ignore the command if the voice is ignored,
    // but not if %%score/%%staves!
    if (curvoice && curvoice.ignore) {
      switch (cmd) {
        case "staves":
        case "score":
          break;
        default:
          return;
      }
    }

    param = text.replace(cmd, "").trim();

    if (param.slice(-5) == " lock") {
      fmt_lock[cmd] = true;
      param = param.slice(0, -5).trim();
    } else if (fmt_lock[cmd]) {
      return;
    }

    switch (cmd) {
      case "center":
        if (parse.state >= 2) {
          s = new_block("text");
          s.text = param;
          s.opt = "c";
          return;
        }
        write_text(param, "c");
        return;
      case "clef":
        if (parse.state >= 2) {
          if (parse.state == 2) goto_tune();
          s = new_clef(param);
          if (s) get_clef(s);
        }
        return;
      case "deco":
        deco_add(param);
        return;
      case "linebreak":
        set_linebreak(param);
        return;
      case "map":
        get_map(param);
        return;
      case "maxsysstaffsep":
        if (parse.state == 3) {
          val = get_unit(param);
          if (isNaN(val)) {
            syntax(1, errs.bad_val, "%%maxsysstaffsep");
            return;
          }
          par_sy.voices[curvoice.v].maxsep = val;
          return;
        }
        break;
      case "multicol":
        if (parse.state >= 2) {
          if (parse.state == 2) goto_tune();
          curvoice = voice_tb[0];
          s = new_block("mc_" + param);
          break;
        }
        switch (param) {
          case "start":
            multicol = {
              maxy: 0,
              lmarg: cfmt.leftmargin,
              rmarg: cfmt.rightmargin,
            };
            break;
          case "new":
            if (!multicol) {
              syntax(1, "%%multicol new without start");
              break;
            }
            if (posy > multicol.maxy) multicol.maxy = posy;
            cfmt.leftmargin = multicol.lmarg;
            cfmt.rightmargin = multicol.rmarg;
            img.chg = true;
            set_page();
            posy = 0;
            break;
          case "end":
            if (!multicol) {
              syntax(1, "%%multicol end without start");
              break;
            }
            if (posy < multicol.maxy) posy = multicol.maxy;
            cfmt.leftmargin = multicol.lmarg;
            cfmt.rightmargin = multicol.rmarg;
            multicol = undefined;
            blk_flush();
            img.chg = true;
            set_page();
            break;
          default:
            syntax(1, "Unknown keyword '$1' in %%multicol", param);
            break;
        }
        return;
      case "ottava":
        if (parse.state != 3) {
          if (parse.state != 2) return;
          goto_tune();
        }
        n = parseInt(param);
        if (isNaN(n) || n < -2 || n > 2) {
          syntax(1, errs.bad_val, "%%ottava");
          return;
        }
        glovar.ottava = true;
        parse.ottava.push(n);
        return;
      case "repbra":
        if (parse.state >= 2) {
          if (parse.state == 2) goto_tune();
          curvoice.norepbra = !get_bool(param);
        }
        return;
      case "repeat":
        if (parse.state != 3) return;
        if (!curvoice.last_sym) {
          syntax(1, "%%repeat cannot start a tune");
          return;
        }
        if (!param.length) {
          n = 1;
          k = 1;
        } else {
          b = param.split(/\s+/);
          n = parseInt(b[0]);
          k = parseInt(b[1]);
          if (isNaN(n) || n < 1 || (curvoice.last_sym.type == C.BAR && n > 2)) {
            syntax(1, "Incorrect 1st value in %%repeat");
            return;
          }
          if (isNaN(k)) {
            k = 1;
          } else {
            if (k < 1) {
              syntax(1, "Incorrect 2nd value in %%repeat");
              return;
            }
          }
        }
        parse.repeat_n = curvoice.last_sym.type == C.BAR ? n : -n;
        parse.repeat_k = k;
        return;
      case "sep":
        var h2, len, values, lwidth;

        set_page();
        lwidth = img.width - img.lm - img.rm;
        h1 = h2 = len = 0;
        if (param) {
          values = param.split(/\s+/);
          h1 = get_unit(values[0]);
          if (values[1]) {
            h2 = get_unit(values[1]);
            if (values[2]) len = get_unit(values[2]);
          }
          if (isNaN(h1) || isNaN(h2) || isNaN(len)) {
            syntax(1, errs.bad_val, "%%sep");
            return;
          }
        }
        if (h1 < 1) h1 = 14;
        if (h2 < 1) h2 = h1;
        if (len < 1) len = 90;
        if (parse.state >= 2) {
          s = new_block(cmd);
          s.x = (lwidth - len) / 2 / cfmt.scale;
          s.l = len / cfmt.scale;
          s.sk1 = h1;
          s.sk2 = h2;
          return;
        }
        vskip(h1);
        output += '<path class="stroke"\n\td="M';
        out_sxsy((lwidth - len) / 2 / cfmt.scale, " ", 0);
        output += "h" + (len / cfmt.scale).toFixed(1) + '"/>\n';
        vskip(h2);
        blk_flush();
        return;
      case "setbarnb":
        val = parseInt(param);
        if (isNaN(val) || val < 1) {
          syntax(1, "Bad %%setbarnb value");
          break;
        }
        if (parse.state == 2) goto_tune();
        glovar.new_nbar = val;
        return;
      case "staff":
        if (parse.state != 3) {
          if (parse.state != 2) return;
          goto_tune();
        }
        val = parseInt(param);
        if (isNaN(val)) {
          syntax(1, "Bad %%staff value '$1'", param);
          return;
        }
        var st;
        if (param[0] == "+" || param[0] == "-") st = curvoice.cst + val;
        else st = val - 1;
        if (st < 0 || st > nstaff) {
          syntax(
            1,
            "Bad %%staff number $1 (cur $2, max $3)",
            st,
            curvoice.cst,
            nstaff
          );
          return;
        }
        delete curvoice.floating;
        curvoice.cst = st;
        return;
      case "staffbreak":
        if (parse.state != 3) {
          if (parse.state != 2) return;
          goto_tune();
        }
        s = {
          type: C.STBRK,
          dur: 0,
        };
        if (param.slice(-1) == "f") {
          s.stbrk_forced = true;
          param = param.replace(/\sf$/, "");
        }
        if (param) {
          val = get_unit(param);
          if (isNaN(val)) {
            syntax(1, errs.bad_val, "%%staffbreak");
            return;
          }
          s.xmx = val;
        } else {
          s.xmx = 14;
        }
        sym_link(s);
        return;
      case "stafflines":
      case "staffscale":
      case "staffnonote":
        set_v_param(cmd, param);
        return;
      case "staves":
      case "score":
        if (parse.state == 0) return;
        if (parse.scores && parse.scores.length > 0) {
          text = parse.scores.shift();
          cmd = text.match(/([^\s]+)\s*(.*)/);
          get_staves(cmd[1], cmd[2]);
        } else {
          get_staves(cmd, param);
        }
        return;
      case "sysstaffsep":
        //--fixme: may be global
        if (parse.state == 3) {
          val = get_unit(param);
          if (isNaN(val)) {
            syntax(1, errs.bad_val, "%%sysstaffsep");
            return;
          }
          par_sy.voices[curvoice.v].sep = val;
          return;
        }
        break;
      case "text":
        if (parse.state >= 2) {
          s = new_block(cmd);
          s.text = param;
          s.opt = cfmt.textoption;
          return;
        }
        write_text(param, cfmt.textoption);
        return;
      case "transpose": // (abcm2ps compatibility)
        if (cfmt.sound) return;
        val = get_transp(param);
        if (val == undefined) {
          // accept note interval
          val = get_interval(param);
          if (val == undefined) {
            syntax(1, errs.bad_transp);
            return;
          }
        }
        switch (parse.state) {
          case 0:
            cfmt.transp = 0;
          // fall thru
          case 1:
          case 2:
            cfmt.transp = (cfmt.transp || 0) + val;
            return;
        }
        for (s = curvoice.last_sym; s; s = s.prev) {
          switch (s.type) {
            case C.NOTE: // insert a key
              s = clone(curvoice.okey);
              s.k_old_sf = curvoice.ckey.k_sf;
              sym_link(s);
              break;
            case C.KEY:
              break;
            default:
              continue;
          }
          break;
        }
        curvoice.transp = val;
        set_transp();
        return;
      case "tune":
        //fixme: to do
        return;
      case "user":
        set_user(param);
        return;
      case "voicecolor":
        if (parse.state != 3) {
          if (parse.state != 2) return;
          goto_tune();
        }
        curvoice.color = param;
        return;
      case "vskip":
        val = get_unit(param);
        if (isNaN(val)) {
          syntax(1, errs.bad_val, "%%vskip");
          return;
        }
        if (val < 0) {
          syntax(1, "%%vskip cannot be negative");
          return;
        }
        if (parse.state >= 2) {
          s = new_block(cmd);
          s.sk = val;
          return;
        }
        vskip(val);
        return;
      case "newpage":
      case "leftmargin":
      case "rightmargin":
      case "pagescale":
      case "pagewidth":
      case "printmargin":
      case "scale":
      case "staffwidth":
        if (parse.state >= 2) {
          s = new_block(cmd);
          s.param = param;
          return;
        }
        if (cmd == "newpage") {
          blk_flush();
          blkdiv = 2; // start the next SVG in a new page
          return;
        }
        break;
    }
    self.set_format(cmd, param);
  };

  // treat the %%beginxxx / %%endxxx sequences
  // (possible hook)
  Abc.prototype.do_begin_end = function (type, opt, text) {
    var i, j, action, s;

    switch (type) {
      case "js":
        js_inject(text);
        break;
      case "ml":
        if (parse.state >= 2) {
          s = new_block(type);
          s.text = text;
        } else {
          blk_flush();
          if (user.img_out) user.img_out(text);
        }
        break;
      case "svg":
        j = 0;
        while (1) {
          i = text.indexOf("<style", j);
          if (i < 0) break;
          i = text.indexOf(">", i);
          j = text.indexOf("</style>", i);
          if (j < 0) {
            syntax(1, "No </style> in %%beginsvg sequence");
            break;
          }
          style += text.slice(i + 1, j).replace(/\s+$/, "");
        }
        j = 0;
        while (1) {
          i = text.indexOf("<defs>\n", j);
          if (i < 0) break;
          j = text.indexOf("</defs>", i);
          if (j < 0) {
            syntax(1, "No </defs> in %%beginsvg sequence");
            break;
          }
          defs_add(text.slice(i + 6, j));
        }
        break;
      case "text":
        action = get_textopt(opt);
        if (!action) action = cfmt.textoption;
        if (parse.state >= 2) {
          s = new_block(type);
          s.text = text;
          s.opt = action;
          break;
        }
        write_text(text, action);
        break;
    }
  };

  /* -- generate a piece of tune -- */
  function generate(in_mc) {
    var s, v, p_voice;

    if (parse.tp) {
      syntax(1, "No end of tuplet");
      s = parse.tps;
      if (s) delete s.tp;
      delete parse.tp;
    }

    if (vover) {
      syntax(1, "No end of voice overlay");
      get_vover(vover.bar ? "|" : ")");
    }

    if (!voice_tb.length) return;
    voice_adj();
    sort_all(); /* define the time / vertical sequences */
    if (!tsfirst) return;
    self.set_bar_num();
    pit_adj();

    if (info.P) tsfirst.parts = info.P; // for play

    // give the parser result to the application
    if (user.get_abcmodel)
      user.get_abcmodel(tsfirst, voice_tb, abc2svg.sym_name, info);

    if (user.img_out)
      // if SVG generation
      self.output_music();

    if (tsfirst)
      // if non void, keep tune data for upper layers
      tunes.push([tsfirst, voice_tb, info]);

    // if inside multicol, reset the parser
    if (!in_mc) return;
    voice_tb = Object.create(voice_tb);
    for (v = 0; v < voice_tb.length; v++) {
      p_voice = voice_tb[v];
      p_voice.time = 0;
      p_voice.sym = p_voice.last_sym = null;
      //		p_voice.st = cur_sy.voices[v].st;
      //		p_voice.second = cur_sy.voices[v].second;
      //		p_voice.clef.time = 0;
      delete p_voice.have_ly;
      p_voice.sls = [];
      p_voice.hy_st = 0;
      delete p_voice.bar_start;
    }
    staves_found = 0; // (for compress/dup the voices)
  }

  // transpose a key
  //fixme: transpose of the accidental list is not done
  function key_transp(sk) {
    if (sk.k_a_acc || sk.k_none)
      // same displayed key
      return;
    var d,
      k_b40 = sk.k_b40,
      n_b40 = (k_b40 + 200 + sk.k_transp) % 40;

    d = abc2svg.b40k[n_b40] - n_b40;
    if (d) {
      if (sk.k_transp > 0) sk.k_transp += d;
      else sk.k_transp -= d;
      n_b40 += d;
    }
    sk.k_b40 = n_b40;

    var sf = abc2svg.b40sf[n_b40];
    sk.k_old_sf = sk.k_sf;
    sk.k_sf = sf;
    sk.k_map = abc2svg.keys[sf + 7]; // map of the notes with accidentals
  }

  /*
   * for transpose purpose, check if a pitch is already in the measure or
   * if it is tied from a previous note, and return the associated accidental
   */
  function acc_same_pitch(s, pit) {
    var i,
      time = s.time;

    for (s = s.prev; s; s = s.prev) {
      switch (s.type) {
        case C.BAR:
          if (s.time < time) return; //undefined // no same pitch
          while (1) {
            s = s.prev;
            if (!s) return; //undefined
            if (s.type == C.NOTE) {
              if (s.time + s.dur == time) break;
              return; //undefined
            }
            if (s.time < time) return; //undefined
          }
          for (i = 0; i <= s.nhd; i++) {
            if (s.notes[i].pit == pit && s.notes[i].tie_ty)
              return s.notes[i].acc;
          }
          return; //undefined
        case C.NOTE:
          for (i = 0; i <= s.nhd; i++) {
            if (s.notes[i].pit == pit) return s.notes[i].acc;
          }
          break;
      }
    }
    return; //undefined
  }

  /* -- get staves definition (%%staves / %%score) -- */
  function get_staves(cmd, parm) {
    var s,
      p_voice,
      p_voice2,
      i,
      flags,
      v,
      vid,
      st,
      range,
      a_vf = parse_staves(parm); // array of [vid, flags]

    if (!a_vf) return;

    if (voice_tb.length) voice_adj(true);

    /* create a new staff system */
    var maxtime = 0,
      no_sym = true;

    for (v = 0; v < voice_tb.length; v++) {
      p_voice = voice_tb[v];
      if (p_voice.time > maxtime) maxtime = p_voice.time;
      if (p_voice.sym) no_sym = false;
    }
    if (no_sym /* if first %%staves */ || (maxtime == 0 && staves_found < 0)) {
      par_sy.staves = [];
      par_sy.voices = [];
    } else {
      /*
       * create a new staff system and
       * link the 'staves' symbol in a voice which is seen from
       * the previous system - see sort_all
       */
      for (v = 0; v < par_sy.voices.length; v++) {
        if (par_sy.voices[v]) {
          curvoice = voice_tb[v];
          break;
        }
      }
      curvoice.time = maxtime;
      s = {
        type: C.STAVES,
        dur: 0,
      };

      sym_link(s); // link the staves in this voice
      par_sy.nstaff = nstaff;
      new_syst();
      s.sy = par_sy;
    }

    staves_found = maxtime;

    /* initialize the (old) voices */
    for (v = 0; v < voice_tb.length; v++) {
      p_voice = voice_tb[v];
      delete p_voice.second;
      delete p_voice.ignore;
      delete p_voice.floating;
    }
    range = 0;
    for (i = 0; i < a_vf.length; i++) {
      vid = a_vf[i][0];
      p_voice = new_voice(vid);
      p_voice.time = maxtime;
      v = p_voice.v;

      a_vf[i][0] = p_voice;

      // set the range and add the overlay voices
      while (1) {
        par_sy.voices[v] = {};
        par_sy.voices[v].range = range++;
        p_voice = p_voice.voice_down;
        if (!p_voice) break;
        v = p_voice.v;
      }
    }
    par_sy.top_voice = a_vf[0][0].v;

    /* change the behavior from %%staves to %%score */
    if (cmd[1] == "t") {
      /* if %%staves */
      for (i = 0; i < a_vf.length; i++) {
        flags = a_vf[i][1];
        if (!(flags & (OPEN_BRACE | OPEN_BRACE2))) continue;
        if (
          (flags & (OPEN_BRACE | CLOSE_BRACE)) == (OPEN_BRACE | CLOSE_BRACE) ||
          (flags & (OPEN_BRACE2 | CLOSE_BRACE2)) == (OPEN_BRACE2 | CLOSE_BRACE2)
        )
          continue;
        if (a_vf[i + 1][1] != 0) continue;
        if (flags & OPEN_PARENTH || a_vf[i + 2][1] & OPEN_PARENTH) continue;

        /* {a b c} -> {a *b c} */
        if (a_vf[i + 2][1] & (CLOSE_BRACE | CLOSE_BRACE2)) {
          a_vf[i + 1][1] |= FL_VOICE;

          /* {a b c d} -> {(a b) (c d)} */
        } else if (
          a_vf[i + 2][1] == 0 &&
          a_vf[i + 3][1] & (CLOSE_BRACE | CLOSE_BRACE2)
        ) {
          a_vf[i][1] |= OPEN_PARENTH;
          a_vf[i + 1][1] |= CLOSE_PARENTH;
          a_vf[i + 2][1] |= OPEN_PARENTH;
          a_vf[i + 3][1] |= CLOSE_PARENTH;
        }
      }
    }

    /* set the staff system */
    st = -1;
    for (i = 0; i < a_vf.length; i++) {
      flags = a_vf[i][1];
      if (
        (flags & (OPEN_PARENTH | CLOSE_PARENTH)) ==
        (OPEN_PARENTH | CLOSE_PARENTH)
      ) {
        flags &= ~(OPEN_PARENTH | CLOSE_PARENTH);
        a_vf[i][1] = flags;
      }
      p_voice = a_vf[i][0];
      if (flags & FL_VOICE) {
        p_voice.floating = true;
        p_voice.second = true;
      } else {
        st++;
        if (!par_sy.staves[st]) {
          par_sy.staves[st] = {
            stafflines: "|||||",
            staffscale: 1,
          };
        }
        par_sy.staves[st].flags = 0;
      }
      v = p_voice.v;
      p_voice.st = p_voice.cst = par_sy.voices[v].st = st;
      par_sy.staves[st].flags |= flags;
      if (flags & OPEN_PARENTH) {
        p_voice2 = p_voice;
        while (i < a_vf.length - 1) {
          p_voice = a_vf[++i][0];
          v = p_voice.v;
          if (a_vf[i][1] & MASTER_VOICE) {
            p_voice2.second = true;
            p_voice2 = p_voice;
          } else {
            p_voice.second = true;
          }
          p_voice.st = p_voice.cst = par_sy.voices[v].st = st;
          if (a_vf[i][1] & CLOSE_PARENTH) break;
        }
        par_sy.staves[st].flags |= a_vf[i][1];
      }
    }
    if (st < 0) st = 0;
    par_sy.nstaff = nstaff = st;

    /* change the behaviour of '|' in %%score */
    if (cmd[1] == "c") {
      /* if %%score */
      for (st = 0; st < nstaff; st++) par_sy.staves[st].flags ^= STOP_BAR;
    }

    for (v = 0; v < voice_tb.length; v++) {
      p_voice = voice_tb[v];
      if (!par_sy.voices[v]) continue;

      // set the staff of the overlay voices
      p_voice2 = p_voice.voice_down;
      while (p_voice2) {
        i = p_voice2.v;
        p_voice2.st = p_voice2.cst = par_sy.voices[i].st = st;
        p_voice2 = p_voice2.voice_down;
      }

      par_sy.voices[v].second = p_voice.second;
      st = p_voice.st;
      if (
        st > 0 &&
        !p_voice.norepbra &&
        !(par_sy.staves[st - 1].flags & STOP_BAR)
      )
        p_voice.norepbra = true;
    }

    curvoice = parse.state >= 2 ? voice_tb[par_sy.top_voice] : null;
  }

  // get a voice or create a clone of the current voice
  function clone_voice(id) {
    var v, p_voice;

    for (v = 0; v < voice_tb.length; v++) {
      p_voice = voice_tb[v];
      if (p_voice.id == id) return p_voice; // found
    }
    p_voice = clone(curvoice);
    p_voice.v = voice_tb.length;
    p_voice.id = id;
    p_voice.sym = p_voice.last_sym = null;

    p_voice.key = clone(curvoice.key);
    p_voice.sls = [];

    delete p_voice.nm;
    delete p_voice.snm;
    delete p_voice.new_name;
    delete p_voice.lyric_restart;
    delete p_voice.lyric_cont;
    delete p_voice.ly_a_h;
    delete p_voice.sym_restart;
    delete p_voice.sym_cont;
    delete p_voice.have_ly;
    delete p_voice.tie_s;

    voice_tb.push(p_voice);
    return p_voice;
  } // clone_voice()

  /* -- get a voice overlay -- */
  function get_vover(type) {
    var p_voice2,
      p_voice3,
      range,
      s,
      time,
      v,
      v2,
      v3,
      line = parse.line;

    /* treat the end of overlay */
    if (type == "|" || type == ")") {
      if (!curvoice.last_note) {
        syntax(1, errs.nonote_vo);
        return;
      }
      curvoice.last_note.beam_end = true;
      if (!vover) {
        syntax(1, "Erroneous end of voice overlay");
        return;
      }
      if (curvoice.time != vover.p_voice.time) {
        syntax(1, "Wrong duration in voice overlay");
        if (curvoice.time > vover.p_voice.time)
          vover.p_voice.time = curvoice.time;
      }
      curvoice.acc = []; // no accidental anymore
      curvoice = vover.p_voice;
      vover = null;
      return;
    }

    /* treat the full overlay start */
    if (type == "(") {
      if (vover) {
        syntax(1, "Voice overlay already started");
        return;
      }
      vover = {
        p_voice: curvoice,
        time: curvoice.time,
      };
      return;
    }

    /* (here is treated a new overlay - '&') */
    /* create the extra voice if not done yet */
    if (!curvoice.last_note) {
      syntax(1, errs.nonote_vo);
      return;
    }
    curvoice.last_note.beam_end = true;
    p_voice2 = curvoice.voice_down;
    if (!p_voice2) {
      p_voice2 = clone_voice(curvoice.id + "o");
      curvoice.voice_down = p_voice2;
      p_voice2.time = 0;
      p_voice2.second = true;
      v2 = p_voice2.v;
      par_sy.voices[v2] = {
        st: curvoice.st,
        second: true,
      };
      range = par_sy.voices[curvoice.v].range;
      for (v = 0; v < par_sy.voices.length; v++) {
        if (par_sy.voices[v] && par_sy.voices[v].range > range)
          par_sy.voices[v].range++;
      }
      par_sy.voices[v2].range = range + 1;
    }
    p_voice2.ulen = curvoice.ulen;
    p_voice2.dur_fact = curvoice.dur_fact;
    p_voice2.acc = []; // no accidental

    if (!vover) {
      /* first '&' in a measure */
      vover = {
        bar: true,
        p_voice: curvoice,
      };
      time = p_voice2.time;
      for (s = curvoice.last_sym /*s*/; ; s = s.prev) {
        if (s.type == C.BAR || s.time <= time) /* (if start of tune) */ break;
      }
      vover.time = s.time;
    } else {
      if (curvoice != vover.p_voice && curvoice.time != vover.p_voice.time) {
        syntax(1, "Wrong duration in voice overlay");
        if (curvoice.time > vover.p_voice.time)
          vover.p_voice.time = curvoice.time;
      }
    }
    p_voice2.time = vover.time;
    curvoice = p_voice2;

    // add a bar at start of the measure overlay
    // (needed for sort_all() in case of spaces - 'y')
    if (vover.bar) {
      sym_link({
        type: C.BAR,
        bar_type: type,
        dur: 0,
        multi: 0,
      });
    }
  }

  // check if a clef, key or time signature may go at start of the current voice
  function is_voice_sig() {
    var s;

    //	if (!curvoice.sym)
    //		return true	// new voice (may appear in the middle of a tune)
    if (curvoice.time != 0) return false;
    for (s = curvoice.last_sym; s; s = s.prev)
      if (w_tb[s.type] != 0) return false;
    return true;
  }

  // treat a clef found in the tune body
  function get_clef(s) {
    if (is_voice_sig()) {
      curvoice.clef = s;
      return;
    }

    // clef change
    sym_link(s);
    s.clef_small = true;

    // move the clef before a (not right repeat) bar
    var s2 = s.prev;
    if (s2 && s2.type == C.BAR && s2.bar_type[0] != ":") {
      s.next = s2;
      s.prev = s2.prev;
      if (s.prev) s.prev.next = s;
      s2.prev = s;
      s2.next = null;
      curvoice.last_sym = s2;
      if (s.soln) {
        delete s.soln;
        curvoice.eoln = true;
      }
    }
  }

  // treat K: (kp = key signature + parameters)
  function get_key(parm) {
    var v,
      p_voice,
      s,
      transp,
      sndtran,
      //		[s_key, a] = new_key(parm)	// KO with nodejs
      a = new_key(parm),
      s_key = a[0];

    a = a[1];

    switch (parse.state) {
      case 1: // in tune header (first K:)
        if (s_key.k_sf == undefined && !s_key.k_a_acc) {
          // empty K:
          s_key.k_sf = 0;
          s_key.k_none = true;
          s_key.k_map = abc2svg.keys[7];
        }
        for (v = 0; v < voice_tb.length; v++) {
          p_voice = voice_tb[v];
          p_voice.key = clone(s_key);
          p_voice.okey = clone(s_key);
          p_voice.ckey = clone(s_key);
        }
        parse.ckey = s_key;
        if (a.length) memo_kv_parm("*", a);
        if (!glovar.ulen) glovar.ulen = C.BLEN / 8;
        parse.state = 2; // in tune header after K:
        return;
      case 2: // K: at start of tune body
        goto_tune(true);
        break;
    }
    if (a.length) set_kv_parm(a);

    if (
      !curvoice.ckey.k_bagpipe &&
      !curvoice.ckey.k_drum &&
      (cfmt.transp != undefined ||
        curvoice.transp != undefined ||
        curvoice.shift != undefined)
    )
      transp =
        (cfmt.transp || 0) + (curvoice.transp || 0) + (curvoice.shift || 0);
    if (curvoice.sndtran != undefined || curvoice.sndsh != undefined)
      sndtran = (curvoice.sndtran || 0) + (curvoice.sndsh || 0);

    if (s_key.k_sf == undefined) {
      if (!s_key.k_a_acc && transp == undefined) {
        if (sndtran == undefined) return; // not a key signature
        s_key.k_play = true; // play only
      }
      s_key.k_sf = curvoice.okey.k_sf;
    }

    curvoice.okey = clone(s_key);
    if (transp != undefined) {
      curvoice.vtransp = transp;
      s_key.k_transp = transp;
    }
    if (sndtran != undefined) s_key.k_sndtran = sndtran;

    s_key.k_old_sf = curvoice.ckey.k_sf; // memorize the key changes
    if (!s_key.k_b40) s_key.k_b40 = curvoice.ckey.k_b40;

    curvoice.ckey = s_key;

    if (is_voice_sig()) {
      curvoice.key = clone(s_key);
      if (s_key.k_none) curvoice.key.k_sf = 0;
    } else {
      sym_link(s_key); // (don't move the key)
    }
  }

  // get / create a new voice
  function new_voice(id) {
    var p_voice,
      v,
      p_v_sav,
      n = voice_tb.length;

    // if first explicit voice and no music, replace the default V:1
    if (n == 1 && voice_tb[0].default) {
      delete voice_tb[0].default;
      if (voice_tb[0].time == 0) {
        p_voice = voice_tb[0];
        p_voice.id = id;
        if (
          cfmt.transp && // != undefined
          parse.state >= 2
        ) {
          p_v_sav = curvoice;
          curvoice = p_voice;
          set_transp();
          curvoice = p_v_sav;
        }
        return p_voice; // default voice
      }
    }
    for (v = 0; v < n; v++) {
      p_voice = voice_tb[v];
      if (p_voice.id == id) return p_voice; // old voice
    }

    p_voice = {
      v: v,
      id: id,
      time: 0,
      new: true,
      pos: {
        dyn: 0,
        gch: 0,
        gst: 0,
        orn: 0,
        stm: 0,
        voc: 0,
        vol: 0,
      },
      scale: 1,
      //		st: 0,
      //		cst: 0,
      ulen: glovar.ulen,
      dur_fact: 1,
      key: clone(parse.ckey), // key at start of tune (parse / gene)
      ckey: clone(parse.ckey), // current key (parse / gene)
      okey: clone(parse.ckey), // key without transposition (parse)
      meter: clone(glovar.meter),
      wmeasure: glovar.meter.wmeasure,
      clef: {
        type: C.CLEF,
        clef_auto: true,
        clef_type: "a", // auto
        time: 0,
      },
      acc: [], // accidentals of the measure (parse)
      sls: [], // slurs - used in parsing and in generation
      hy_st: 0,
    };

    voice_tb.push(p_voice);

    //	par_sy.voices[v] = {
    //		range: -1
    //	}

    return p_voice;
  }

  // this function is called at program start and on end of tune
  function init_tune() {
    nstaff = -1;
    voice_tb = [];
    curvoice = null;
    new_syst(true);
    staves_found = -1;
    gene = {};
    a_de = []; // remove old decorations
  }

  // treat V: with many voices
  function do_cloning() {
    var i,
      eol,
      clone = curvoice.clone,
      vs = clone.vs,
      a = clone.a,
      bol = clone.bol,
      eol = parse.istart,
      parse_sav = parse,
      file = parse.file;

    delete curvoice.clone;

    if (file[eol - 1] == "[")
      // if stop on [V:xx]
      eol--;

    // insert the music sequence in each voice
    include++;
    for (i = 0; i < vs.length; i++) {
      get_voice(vs[i], a);
      tosvg(parse.fname, file, bol, eol);
      parse = Object.create(parse_sav); // restore the parse context
    }
    include--;
  }

  // treat a 'V:' info
  function get_voice(parm) {
    var v,
      vs,
      a = info_split(parm),
      vid = a.shift();

    if (!vid) return; // empty V:

    // if end of sequence with many voices, load the other voices
    if (curvoice && curvoice.clone) do_cloning();

    if (vid.indexOf(",") > 0)
      // if many voices
      vs = vid.split(",");
    else vs = [vid];

    if (parse.state < 2) {
      // memorize the voice parameters
      while (1) {
        vid = vs.shift();
        if (!vid) break;
        if (a.length) memo_kv_parm(vid, a);
        if (vid != "*" && parse.state == 1) curvoice = new_voice(vid);
      }
      return;
    }

    if (vid == "*") {
      syntax(1, "Cannot have V:* in tune body");
      return;
    }

    curvoice = new_voice(vs[0]);

    // if many voice, memorize the start of sequence
    if (vs.length > 1) {
      vs.shift();
      curvoice.clone = {
        vs: vs,
        a: a,
        bol: parse.iend,
      };
      if (parse.file[curvoice.clone.bol - 1] != "]") curvoice.clone.bol++; // start of new line
    }

    set_kv_parm(a);
    if (parse.state == 2)
      // if first voice
      goto_tune();
    set_transp();

    v = curvoice.v;
    if (curvoice.new) {
      // if new voice
      delete curvoice.new;
      if (staves_found < 0) {
        // if no %%score/%%staves
        curvoice.st = curvoice.cst = ++nstaff;
        par_sy.nstaff = nstaff;
        par_sy.voices[v] = {
          st: nstaff,
          range: v,
        };
        par_sy.staves[nstaff] = {
          stafflines: curvoice.stafflines || "|||||",
          staffscale: 1,
        };
      }
    }

    if (
      !curvoice.filtered &&
      par_sy.voices[v] &&
      (parse.voice_opts || parse.tune_v_opts)
    ) {
      curvoice.filtered = true;
      voice_filter();
    }
  }

  // change state from 'tune header after K:' to 'in tune body'
  // curvoice is defined when called from get_voice()
  function goto_tune(is_K) {
    var v,
      p_voice,
      s = {
        type: C.STAVES,
        dur: 0,
        sy: par_sy,
      };

    set_page();
    write_heading();
    reset_gen();
    if (glovar.new_nbar) {
      gene.nbar = glovar.new_nbar; // measure numbering
      glovar.new_nbar = 0;
    } else {
      gene.nbar = 1;
    }

    parse.state = 3; // in tune body

    // if no voice yet, create the default voice
    if (!voice_tb.length) {
      get_voice("1");
      curvoice.clef.istart = curvoice.key.istart;
      curvoice.clef.iend = curvoice.key.iend;
      //		nstaff = 0;
      curvoice.default = true;
    } else if (!curvoice) {
      curvoice = voice_tb[staves_found < 0 ? 0 : par_sy.top_voice];
    }

    if (!curvoice.init && !is_K) {
      set_kv_parm([]);
      set_transp();
    }

    // update some voice parameters
    for (v = 0; v < voice_tb.length; v++) {
      p_voice = voice_tb[v];
      p_voice.ulen = glovar.ulen;
      if (p_voice.ckey.k_bagpipe && !p_voice.pos.stm) {
        p_voice.pos = clone(p_voice.pos);
        p_voice.pos.stm = C.SL_BELOW;
      }
    }

    // initialize the voices when no %%staves/score
    if (staves_found < 0) {
      nstaff = voice_tb.length - 1;
      for (v = 0; v <= nstaff; v++) {
        p_voice = voice_tb[v];
        delete p_voice.new; // old voice
        p_voice.st = p_voice.cst = v;
        par_sy.voices[v] = {
          st: v,
          range: v,
        };
        par_sy.staves[v] = {
          stafflines: p_voice.stafflines || "|||||",
          staffscale: 1,
        };
      }
      par_sy.nstaff = nstaff;
    }

    // link the first %%score in the top voice
    p_voice = curvoice;
    curvoice = voice_tb[par_sy.top_voice];
    sym_link(s);
    curvoice = p_voice;
  }
  // abc2svg - lyrics.js - lyrics
  //
  // Copyright (C) 2014-2019 Jean-Francois Moine
  //
  // This file is part of abc2svg-core.
  //
  // abc2svg-core is free software: you can redistribute it and/or modify
  // it under the terms of the GNU Lesser General Public License as published by
  // the Free Software Foundation, either version 3 of the License, or
  // (at your option) any later version.
  //
  // abc2svg-core is distributed in the hope that it will be useful,
  // but WITHOUT ANY WARRANTY; without even the implied warranty of
  // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  // GNU Lesser General Public License for more details.
  //
  // You should have received a copy of the GNU Lesser General Public License
  // along with abc2svg-core.  If not, see <http://www.gnu.org/licenses/>.

  // parse a symbol line (s:)
  function get_sym(p, cont) {
    var s, c, i, j, d;

    if (curvoice.ignore) return;

    // get the starting symbol of the lyrics
    if (cont) {
      // +:
      s = curvoice.sym_cont;
      if (!s) {
        syntax(1, "+: symbol line without music");
        return;
      }
    } else {
      if (curvoice.sym_restart) {
        // new music
        curvoice.sym_start = s = curvoice.sym_restart;
        curvoice.sym_restart = null;
      } else {
        s = curvoice.sym_start;
      }
      if (!s) s = curvoice.sym;
      if (!s) {
        syntax(1, "s: without music");
        return;
      }
    }

    /* scan the symbol line */
    i = 0;
    while (1) {
      while (p[i] == " " || p[i] == "\t") i++;
      c = p[i];
      if (!c) break;
      switch (c) {
        case "|":
          while (s && s.type != C.BAR) s = s.next;
          if (!s) {
            syntax(1, "Not enough measure bars for symbol line");
            return;
          }
          s = s.next;
          i++;
          continue;
        case "!":
        case '"':
          j = ++i;
          i = p.indexOf(c, j);
          if (i < 0) {
            syntax(
              1,
              c == "!" ? "No end of decoration" : "No end of guitar chord"
            );
            i = p.length;
            continue;
          }
          d = p.slice(j - 1, i + 1);
          break;
        case "*":
          break;
        default:
          d = c.charCodeAt(0);
          if (d < 128) {
            d = char_tb[d];
            if (d.length > 1 && (d[0] == "!" || d[0] == '"')) {
              c = d[0];
              break;
            }
          }
          syntax(1, errs.bad_char, c);
          break;
      }

      /* store the element in the next note */
      while (s && (s.type != C.NOTE || s.grace)) s = s.next;
      if (!s) {
        syntax(1, "Too many elements in symbol line");
        return;
      }
      switch (c) {
        default:
          //		case '*':
          break;
        case "!":
          deco_cnv([d.slice(1, -1)], s, s.prev);
          break;
        case '"':
          a_gch = s.a_gch;
          parse_gchord(d);
          if (a_gch) self.gch_build(s);
          break;
      }
      s = s.next;
      i++;
    }
    curvoice.lyric_cont = s;
  }

  /* -- parse a lyric (vocal) line (w:) -- */
  function get_lyrics(text, cont) {
    var s, word, p, i, j, ly, dfnt;

    if (curvoice.ignore) return;
    if (curvoice.pos.voc != C.SL_HIDDEN) curvoice.have_ly = true;

    // get the starting symbol of the lyrics
    if (cont) {
      // +:
      s = curvoice.lyric_cont;
      if (!s) {
        syntax(1, "+: lyric without music");
        return;
      }
    } else {
      set_font("vocal");
      if (curvoice.lyric_restart) {
        // new music
        curvoice.lyric_start = s = curvoice.lyric_restart;
        curvoice.lyric_restart = null;
        curvoice.lyric_line = 0;
      } else {
        curvoice.lyric_line++;
        s = curvoice.lyric_start;
      }
      if (!s) s = curvoice.sym;
      if (!s) {
        syntax(1, "w: without music");
        return;
      }
    }

    /* scan the lyric line */
    dfnt = gene.curfont; // font at start of line
    p = text;
    i = 0;
    while (1) {
      while (p[i] == " " || p[i] == "\t") i++;
      if (!p[i]) break;
      j = parse.istart + i + 2; // start index
      switch (p[i]) {
        case "|":
          while (s && s.type != C.BAR) s = s.next;
          if (!s) {
            syntax(1, "Not enough measure bars for lyric line");
            return;
          }
          s = s.next;
          i++;
          continue;
        case "-":
          word = "-\n";
          break;
        case "_":
          word = "_\n";
          break;
        case "*":
          word = "";
          break;
        default:
          if (p[i] == "\\" && i == p.length - 1) {
            curvoice.lyric_cont = s;
            return;
          }
          word = "";
          while (1) {
            if (!p[i]) break;
            switch (p[i]) {
              case "_":
              case "*":
              case "|":
                i--;
              case " ":
              case "\t":
                break;
              case "~":
                word += " "; // (&nbsp;)
                i++;
                continue;
              case "-":
                word += "\n";
                break;
              case "\\":
                word += p[++i];
                i++;
                continue;
              default:
                word += p[i++];
                continue;
            }
            break;
          }
          break;
      }

      /* store the word in the next note */
      while (s && (s.type != C.NOTE || s.grace)) s = s.next;
      if (!s) {
        syntax(1, "Too many words in lyric line");
        return;
      }
      if (word && s.pos.voc != C.SL_HIDDEN) {
        if (word.match(/^\$\d/)) {
          gene.curfont = word[1] == "0" ? dfnt : get_font("u" + word[1]);
          word = word.slice(2);
        }
        ly = {
          t: word,
          font: gene.curfont,
          wh: strwh(word),
          istart: j,
          iend: j + word.length,
        };
        if (!s.a_ly) s.a_ly = [];
        s.a_ly[curvoice.lyric_line] = ly;
      }
      s = s.next;
      i++;
    }
    curvoice.lyric_cont = s;
  }

  // -- set the width needed by the lyrics --
  // (called once per tune)
  function ly_width(s, wlw) {
    var ly,
      sz,
      swfac,
      align,
      xx,
      w,
      i,
      j,
      k,
      shift,
      p,
      a_ly = s.a_ly;

    align = 0;
    for (i = 0; i < a_ly.length; i++) {
      ly = a_ly[i];
      if (!ly) continue;
      p = ly.t;
      if (p == "-\n" || p == "_\n") {
        ly.shift = 0;
        continue;
      }
      w = ly.wh[0];
      swfac = ly.font.swfac;
      xx = w + 2 * cwid(" ") * swfac;
      if (s.type == C.GRACE) {
        // %%graceword
        shift = s.wl;
      } else if (
        (p[0] >= "0" && p[0] <= "9" && p.length > 2) ||
        p[1] == ":" ||
        p[0] == "(" ||
        p[0] == ")"
      ) {
        if (p[0] == "(") {
          sz = cwid("(") * swfac;
        } else {
          j = p.indexOf(" "); // (&nbsp;)
          set_font(ly.font);
          if (j > 0) sz = strwh(p.slice(0, j))[0];
          else sz = w * 0.2;
        }
        shift = (w - sz + 2 * cwid(" ") * swfac) * 0.4;
        if (shift > 20) shift = 20;
        shift += sz;
        if (ly.t[0] >= "0" && ly.t[0] <= "9") {
          if (shift > align) align = shift;
        }
      } else {
        shift = xx * 0.4;
        if (shift > 20) shift = 20;
      }
      ly.shift = shift;
      if (wlw < shift) wlw = shift;
      //		if (p[p.length - 1] == "\n")		// if "xx-"
      //			xx -= cwid(' ') * swfac
      xx -= shift;
      shift = 2 * cwid(" ") * swfac;
      for (k = s.next; k; k = k.next) {
        switch (k.type) {
          case C.NOTE:
          case C.REST:
            if (!k.a_ly || !k.a_ly[i]) xx -= 9;
            else if (k.a_ly[i].t == "-\n" || k.a_ly[i].t == "_\n") xx -= shift;
            else break;
            if (xx <= 0) break;
            continue;
          case C.CLEF:
          case C.METER:
          case C.KEY:
            xx -= 10;
            continue;
          default:
            xx -= 5;
            break;
        }
        break;
      }
      if (xx > s.wr) s.wr = xx;
    }
    if (align > 0) {
      for (i = 0; i < a_ly.length; i++) {
        ly = a_ly[i];
        if (ly && ly.t[0] >= "0" && ly.t[0] <= "9") ly.shift = align;
      }
    }
    return wlw;
  }

  /* -- draw the lyrics under (or above) notes -- */
  /* (the staves are not yet defined) */
  /* !! this routine is tied to ly_width() !! */
  function draw_lyric_line(p_voice, j, y) {
    var p, lastx, w, s, s2, ly, lyl, hyflag, lflag, x0, font, shift;

    if (p_voice.hy_st & (1 << j)) {
      hyflag = true;
      p_voice.hy_st &= ~(1 << j);
    }
    for (s = p_voice.sym /*s*/; ; s = s.next)
      if (s.type != C.CLEF && s.type != C.KEY && s.type != C.METER) break;
    lastx = s.prev ? s.prev.x : tsfirst.x;
    x0 = 0;
    for (; s; s = s.next) {
      if (s.a_ly) ly = s.a_ly[j];
      else ly = null;
      if (!ly) {
        switch (s.type) {
          case C.REST:
          case C.MREST:
            if (lflag) {
              out_wln(lastx + 3, y, x0 - lastx);
              lflag = false;
              lastx = s.x + s.wr;
            }
        }
        continue;
      }
      if (ly.font != gene.curfont)
        /* font change */
        gene.curfont = font = ly.font;
      p = ly.t;
      w = ly.wh[0];
      shift = ly.shift;
      if (hyflag) {
        if (p == "_\n") {
          /* '_' */
          p = "-\n";
        } else if (p != "-\n") {
          /* not '-' */
          out_hyph(lastx, y, s.x - shift - lastx);
          hyflag = false;
          lastx = s.x + s.wr;
        }
      }
      if (lflag && p != "_\n") {
        /* not '_' */
        out_wln(lastx + 3, y, x0 - lastx + 3);
        lflag = false;
        lastx = s.x + s.wr;
      }
      if (p == "-\n" /* '-' */ || p == "_\n") {
        /* '_' */
        if (x0 == 0 && lastx > s.x - 18) lastx = s.x - 18;
        if (p[0] == "-") hyflag = true;
        else lflag = true;
        x0 = s.x - shift;
        continue;
      }
      x0 = s.x - shift;
      if (p.slice(-1) == "\n") {
        p = p.slice(0, -1); /* '-' at end */
        hyflag = true;
      }
      if (user.anno_start || user.anno_stop) {
        s2 = {
          st: s.st,
          istart: ly.istart,
          iend: ly.iend,
          x: x0,
          y: y,
          ymn: y,
          ymx: y + gene.curfont.size,
          wl: 0,
          wr: w,
        };
        anno_start(s2, "lyrics");
      }
      xy_str(x0, y, p, null, null, ly.wh);
      anno_stop(s2, "lyrics");
      lastx = x0 + w;
    }
    if (hyflag) {
      hyflag = false;
      x0 = realwidth - 10;
      if (x0 < lastx + 10) x0 = lastx + 10;
      out_hyph(lastx, y, x0 - lastx);
      if (cfmt.hyphencont) p_voice.hy_st |= 1 << j;
    }

    /* see if any underscore in the next line */
    for (p_voice.s_next; s; s = s.next) {
      if (s.type == C.NOTE) {
        if (!s.a_ly) break;
        ly = s.a_ly[j];
        if (ly && ly.t == "_\n") {
          lflag = true;
          x0 = realwidth - 15;
          if (x0 < lastx + 12) x0 = lastx + 12;
        }
        break;
      }
    }
    if (lflag) {
      out_wln(lastx + 3, y, x0 - lastx + 3);
      lflag = false;
    }
  }

  function draw_lyrics(p_voice, nly, a_h, y, incr) {
    /* 1: below, -1: above */
    var j,
      top,
      sc = staff_tb[p_voice.st].staffscale;

    set_font("vocal");
    if (incr > 0) {
      /* under the staff */
      if (y > -cfmt.vocalspace) y = -cfmt.vocalspace;
      y *= sc;
      for (j = 0; j < nly; j++) {
        y -= a_h[j] * 1.1;
        draw_lyric_line(p_voice, j, y);
      }
      return (y - a_h[j - 1] / 6) / sc;
    }

    /* above the staff */
    top = staff_tb[p_voice.st].topbar + cfmt.vocalspace;
    if (y < top) y = top;
    y *= sc;
    for (j = nly; --j >= 0; ) {
      draw_lyric_line(p_voice, j, y);
      y += a_h[j] * 1.1;
    }
    return y / sc;
  }

  // -- draw all the lyrics --
  /* (the staves are not yet defined) */
  function draw_all_lyrics() {
    var p_voice,
      s,
      v,
      nly,
      i,
      x,
      y,
      w,
      a_ly,
      ly,
      lyst_tb = new Array(nstaff + 1),
      nv = voice_tb.length,
      h_tb = new Array(nv),
      nly_tb = new Array(nv),
      above_tb = new Array(nv),
      rv_tb = new Array(nv),
      top = 0,
      bot = 0,
      st = -1;

    /* compute the number of lyrics per voice - staff
     * and their y offset on the staff */
    for (v = 0; v < nv; v++) {
      p_voice = voice_tb[v];
      if (!p_voice.sym) continue;
      if (p_voice.st != st) {
        top = 0;
        bot = 0;
        st = p_voice.st;
      }
      nly = 0;
      if (p_voice.have_ly) {
        if (!h_tb[v]) h_tb[v] = [];
        for (s = p_voice.sym; s; s = s.next) {
          a_ly = s.a_ly;
          if (!a_ly) continue;
          /*fixme:should get the real width*/
          x = s.x;
          w = 10;
          for (i = 0; i < a_ly.length; i++) {
            ly = a_ly[i];
            if (ly) {
              x -= ly.shift;
              w = ly.wh[0];
              break;
            }
          }
          y = y_get(p_voice.st, 1, x, w);
          if (top < y) top = y;
          y = y_get(p_voice.st, 0, x, w);
          if (bot > y) bot = y;
          while (nly < a_ly.length) h_tb[v][nly++] = 0;
          for (i = 0; i < a_ly.length; i++) {
            ly = a_ly[i];
            if (!ly) continue;
            if (!h_tb[v][i] || ly.font.size > h_tb[v][i])
              h_tb[v][i] = ly.font.size;
          }
        }
      } else {
        y = y_get(p_voice.st, 1, 0, realwidth);
        if (top < y) top = y;
        y = y_get(p_voice.st, 0, 0, realwidth);
        if (bot > y) bot = y;
      }
      if (!lyst_tb[st]) lyst_tb[st] = {};
      lyst_tb[st].top = top;
      lyst_tb[st].bot = bot;
      nly_tb[v] = nly;
      if (nly == 0) continue;
      if (p_voice.pos.voc) above_tb[v] = p_voice.pos.voc == C.SL_ABOVE;
      else if (
        voice_tb[v + 1] &&
        /*fixme:%%staves:KO - find an other way..*/
        voice_tb[v + 1].st == st &&
        voice_tb[v + 1].have_ly
      )
        above_tb[v] = true;
      else above_tb[v] = false;
      if (above_tb[v]) lyst_tb[st].a = true;
      else lyst_tb[st].b = true;
    }

    /* draw the lyrics under the staves */
    i = 0;
    for (v = 0; v < nv; v++) {
      p_voice = voice_tb[v];
      if (!p_voice.sym) continue;
      if (!p_voice.have_ly) continue;
      if (above_tb[v]) {
        rv_tb[i++] = v;
        continue;
      }
      st = p_voice.st;
      // don't scale the lyrics
      set_dscale(st, true);
      if (nly_tb[v] > 0)
        lyst_tb[st].bot = draw_lyrics(
          p_voice,
          nly_tb[v],
          h_tb[v],
          lyst_tb[st].bot,
          1
        );
    }

    /* draw the lyrics above the staff */
    while (--i >= 0) {
      v = rv_tb[i];
      p_voice = voice_tb[v];
      st = p_voice.st;
      set_dscale(st, true);
      lyst_tb[st].top = draw_lyrics(
        p_voice,
        nly_tb[v],
        h_tb[v],
        lyst_tb[st].top,
        -1
      );
    }

    /* set the max y offsets of all symbols */
    for (v = 0; v < nv; v++) {
      p_voice = voice_tb[v];
      if (!p_voice.sym) continue;
      st = p_voice.st;
      if (lyst_tb[st].a) {
        top = lyst_tb[st].top + 2;
        for (s = p_voice.sym.next; s; s = s.next) {
          /*fixme: may have lyrics crossing a next symbol*/
          if (s.a_ly) {
            /*fixme:should set the real width*/
            y_set(st, 1, s.x - 2, 10, top);
          }
        }
      }
      if (lyst_tb[st].b) {
        bot = lyst_tb[st].bot - 2;
        if (nly_tb[p_voice.v] > 0) {
          for (s = p_voice.sym.next; s; s = s.next) {
            if (s.a_ly) {
              /*fixme:should set the real width*/
              y_set(st, 0, s.x - 2, 10, bot);
            }
          }
        } else {
          y_set(st, 0, 0, realwidth, bot);
        }
      }
    }
  }
  // abc2svg - gchord.js - chord symbols
  //
  // Copyright (C) 2014-2020 Jean-Francois Moine
  //
  // This file is part of abc2svg-core.
  //
  // abc2svg-core is free software: you can redistribute it and/or modify
  // it under the terms of the GNU Lesser General Public License as published by
  // the Free Software Foundation, either version 3 of the License, or
  // (at your option) any later version.
  //
  // abc2svg-core is distributed in the hope that it will be useful,
  // but WITHOUT ANY WARRANTY; without even the implied warranty of
  // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  // GNU Lesser General Public License for more details.
  //
  // You should have received a copy of the GNU Lesser General Public License
  // along with abc2svg-core.  If not, see <http://www.gnu.org/licenses/>.

  // -- parse a chord symbol / annotation --
  // the result is added in the global variable a_gch
  // 'type' may be a single '"' or a string '"xxx"' created by U:
  function parse_gchord(type) {
    var c,
      text,
      gch,
      x_abs,
      y_abs,
      type,
      i,
      j,
      istart,
      iend,
      ann_font = get_font("annotation"),
      h_ann = ann_font.size,
      line = parse.line;

    function get_float() {
      var txt = "";

      while (1) {
        c = text[i++];
        if ("1234567890.-".indexOf(c) < 0) return parseFloat(txt);
        txt += c;
      }
    } // get_float()

    istart = parse.bol + line.index;
    if (type.length > 1) {
      // U:
      text = type.slice(1, -1);
      iend = istart + 1;
    } else {
      i = ++line.index; // search the ending double quote
      while (1) {
        j = line.buffer.indexOf('"', i);
        if (j < 0) {
          syntax(1, "No end of guitar chord");
          return;
        }
        if (line.buffer[j - 1] != "\\") break;
        i = j + 1;
      }
      text = cnv_escape(line.buffer.slice(line.index, j));
      line.index = j;
      iend = parse.bol + line.index + 1;
    }

    if (curvoice.pos.gch == C.SL_HIDDEN) return;

    if (ann_font.box) h_ann += 3;
    i = 0;
    type = "g";
    while (1) {
      c = text[i];
      if (!c) break;
      gch = {
        text: "",
        istart: istart,
        iend: iend,
        font: ann_font,
      };
      switch (c) {
        case "@":
          type = c;
          i++;
          x_abs = get_float();
          if (c != ",") {
            syntax(1, "',' lacking in annotation '@x,y'");
            y_abs = 0;
          } else {
            y_abs = get_float();
            if (c != " ") i--;
          }
          gch.x = x_abs;
          gch.y = y_abs - h_ann / 2;
          break;
        case "^":
        case "_":
        case "<":
        case ">":
          i++;
          type = c;
          break;
        default:
          switch (type) {
            case "g":
              gch.font = get_font("gchord");
              break;
            case "@":
              gch.x = x_abs;
              y_abs -= h_ann;
              gch.y = y_abs - h_ann / 2;
              break;
          }
          break;
      }
      gch.type = type;
      while (1) {
        c = text[i];
        if (!c) break;
        switch (c) {
          case "\\":
            c = text[++i];
            if (!c || c == "n") break;
            gch.text += "\\";
          default:
            gch.text += c;
            i++;
            continue;
          case "&" /* skip "&xxx;" */:
            while (1) {
              gch.text += c;
              c = text[++i];
              switch (c) {
                default:
                  continue;
                case ";":
                case undefined:
                case "\\":
                  break;
              }
              break;
            }
            if (c == ";") {
              i++;
              gch.text += c;
              continue;
            }
            break;
          case ";":
            break;
        }
        i++;
        break;
      }
      if (!a_gch) a_gch = [];
      a_gch.push(gch);
    }
  }

  // transpose a chord symbol
  var note_names = "CDEFGAB",
    acc_name = ["bb", "b", "", "#", "##"];

  function gch_tr1(p, transp) {
    var i,
      o,
      n,
      a,
      ip,
      b40,
      csa = p.split("/");

    for (i = 0; i < csa.length; i++) {
      // main and optional bass
      p = csa[i];
      o = p.search(/[ABCDEFG]/);
      if (o < 0) continue; // strange chord symbol!
      ip = o + 1;
      a = 0;
      while (p[ip] == "#") {
        a++;
        ip++;
      }
      while (p[ip] == "b") {
        a--;
        ip++;
      }
      n = note_names.indexOf(p[o]) + 16;
      b40 = (abc2svg.pab40(n, a) + transp + 200) % 40;
      b40 = abc2svg.b40k[b40];
      csa[i] =
        p.slice(0, o) +
        note_names[abc2svg.b40_p[b40]] +
        acc_name[abc2svg.b40_a[b40] + 2] +
        p.slice(ip);
    }
    return csa.join("/");
  } // gch_tr1

  function gch_transp(s) {
    var gch,
      i = s.a_gch.length;

    while (--i >= 0) {
      gch = s.a_gch[i];
      if (gch.type == "g") gch.text = gch_tr1(gch.text, curvoice.vtransp);
    }
  }

  // -- build the chord indications / annotations --
  // (possible hook)
  Abc.prototype.gch_build = function (s) {
    /* split the chord indications / annotations
     * and initialize their vertical offsets */
    var gch,
      wh,
      xspc,
      ix,
      pos = curvoice.pos.gch == C.SL_BELOW ? -1 : 1,
      y_above = 0,
      y_below = 0,
      y_left = 0,
      y_right = 0,
      GCHPRE = 0.4; // portion of chord before note

    s.a_gch = a_gch;
    a_gch = null;

    if (curvoice.vtransp) gch_transp(s);

    // change the accidentals in the chord symbols,
    // convert the escape sequences in annotations, and
    // set the offsets
    for (ix = 0; ix < s.a_gch.length; ix++) {
      gch = s.a_gch[ix];
      if (gch.type == "g") {
        if (cfmt.chordnames) {
          gch.otext = gch.text; // save for %%diagram
          gch.text = gch.text.replace(/A|B|C|D|E|F|G/g, function (c) {
            return cfmt.chordnames[c];
          });
          if (cfmt.chordnames.B == "H")
            gch.text = gch.text.replace(/Hb/g, "Bb");
        }
        gch.text = gch.text.replace(/##|#|=|bb|b|  /g, function (x) {
          switch (x) {
            case "##":
              return "&#x1d12a;";
            case "#":
              return "\u266f";
            case "=":
              return "\u266e";
            case "b":
              return "\u266d";
            case "  ":
              return "  ";
          }
          return "&#x1d12b;";
        });
      } else {
        if (gch.type == "@" && !user.anno_start && !user.anno_stop) {
          gch.wh = [0, 0];
          continue; /* no width */
        }
      }

      /* set the offsets and widths */
      set_font(gch.font);
      wh = strwh(gch.text);
      gch.wh = wh;
      if (gch.font.box) wh[1] += 4;
      switch (gch.type) {
        case "@":
          break;
        case "^" /* above */:
          xspc = wh[0] * GCHPRE;
          if (xspc > 8) xspc = 8;
          gch.x = -xspc;
          y_above -= wh[1];
          gch.y = y_above;
          break;
        case "_" /* below */:
          xspc = wh[0] * GCHPRE;
          if (xspc > 8) xspc = 8;
          gch.x = -xspc;
          y_below -= wh[1];
          gch.y = y_below;
          break;
        case "<" /* left */:
          gch.x = -(wh[0] + 6);
          y_left -= wh[1];
          gch.y = y_left + wh[1] / 2;
          break;
        case ">" /* right */:
          gch.x = 6;
          y_right -= wh[1];
          gch.y = y_right + wh[1] / 2;
          break;
        default:
          // chord symbol
          xspc = wh[0] * GCHPRE;
          if (xspc > 8) xspc = 8;
          gch.x = -xspc;
          if (pos < 0) {
            /* below */
            y_below -= wh[1];
            gch.y = y_below;
          } else {
            y_above -= wh[1];
            gch.y = y_above;
          }
          break;
      }
    }

    /* move upwards the top and middle texts */
    y_left /= 2;
    y_right /= 2;
    for (ix = 0; ix < s.a_gch.length; ix++) {
      gch = s.a_gch[ix];
      switch (gch.type) {
        case "^" /* above */:
          gch.y -= y_above;
          break;
        case "<" /* left */:
          gch.y -= y_left;
          break;
        case ">" /* right */:
          gch.y -= y_right;
          break;
        case "g": // chord symbol
          if (pos > 0) gch.y -= y_above;
          break;
      }
    }
  };

  // -- draw the chord symbols and annotations
  // (the staves are not yet defined)
  // (unscaled delayed output)
  // (possible hook)
  Abc.prototype.draw_gchord = function (s, gchy_min, gchy_max) {
    var gch,
      text,
      ix,
      x,
      y,
      y2,
      hbox,
      h,
      y_above,
      y_below,
      // adjust the vertical offset according to the chord symbols
      w = 0,
      yav = s.dur
        ? (((s.notes[s.nhd].pit + s.notes[0].pit) >> 1) - 18) * 3
        : 12; // fixed offset on measure bars

    for (ix = 0; ix < s.a_gch.length; ix++) {
      gch = s.a_gch[ix];
      if (gch.wh[0] > w) w = gch.wh[0];
    }
    y_above = y_get(s.st, 1, s.x - 3, w);
    y_below = y_get(s.st, 0, s.x - 3, w);
    if (y_above < gchy_max) y_above = gchy_max;
    if (y_below > gchy_min) y_below = gchy_min;

    set_dscale(s.st);
    for (ix = 0; ix < s.a_gch.length; ix++) {
      gch = s.a_gch[ix];
      use_font(gch.font);
      set_font(gch.font);
      h = gch.font.size;
      hbox = gch.font.box ? 2 : 0;
      w = gch.wh[0];
      x = s.x + gch.x;
      text = gch.text;
      switch (gch.type) {
        case "_" /* below */:
          y = gch.y + y_below;
          y_set(s.st, 0, x, w, y - hbox);
          break;
        case "^" /* above */:
          y = gch.y + y_above + hbox;
          y_set(s.st, 1, x, w, y + h + hbox);
          break;
        case "<" /* left */:
          /*fixme: what symbol space?*/
          if (s.notes[0].acc) x -= s.notes[0].shac;
          y = gch.y + yav - h / 2;
          break;
        case ">" /* right */:
          if (s.xmx) x += s.xmx;
          if (s.dots) x += 1.5 + 3.5 * s.dots;
          y = gch.y + yav - h / 2;
          break;
        default:
          // chord symbol
          if (gch.y >= 0) {
            y = gch.y + y_above + hbox;
            y_set(s.st, true, x, w, y + h + hbox);
          } else {
            y = gch.y + y_below;
            y_set(s.st, false, x, w, y - hbox);
          }
          break;
        case "@" /* absolute */:
          y = gch.y + yav;
          if (y > 0) {
            y2 = y + h;
            if (y2 > staff_tb[s.st].ann_top) staff_tb[s.st].ann_top = y2;
          } else {
            if (y < staff_tb[s.st].ann_bot) staff_tb[s.st].ann_bot = y;
          }
          break;
      }
      if (user.anno_start)
        user.anno_start(
          "annot",
          gch.istart,
          gch.iend,
          x - 2,
          y + h + 2,
          w + 4,
          h + 4,
          s
        );
      xy_str(x, y, text, null, null, gch.wh);
      if (user.anno_stop)
        user.anno_stop(
          "annot",
          gch.istart,
          gch.iend,
          x - 2,
          y + h + 2,
          w + 4,
          h + 4,
          s
        );
    }
  };
  // YYMComment: 声明程序之后的新入口

  // abc2svg - tail.js
  //
  // Copyright (C) 2014-2020 Jean-Francois Moine
  //
  // This file is part of abc2svg-core.
  //
  // abc2svg-core is free software: you can redistribute it and/or modify
  // it under the terms of the GNU Lesser General Public License as published by
  // the Free Software Foundation, either version 3 of the License, or
  // (at your option) any later version.
  //
  // abc2svg-core is distributed in the hope that it will be useful,
  // but WITHOUT ANY WARRANTY; without even the implied warranty of
  // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  // GNU Lesser General Public License for more details.
  //
  // You should have received a copy of the GNU Lesser General Public License
  // along with abc2svg-core.  If not, see <http://www.gnu.org/licenses/>.

  // initialize
  init_tune();

  // Abc functions used by the modules
  Abc.prototype.add_style = function (s) {
    style += s;
  };
  Abc.prototype.cfmt = function () {
    return cfmt;
  };
  Abc.prototype.systemHeightArray = [];

  Abc.prototype.clone = clone;
  Abc.prototype.deco_cnv = deco_cnv;
  Abc.prototype.draw_meter = draw_meter;
  Abc.prototype.draw_note = draw_note;
  Abc.prototype.errs = errs;
  Abc.prototype.font_class = font_class;
  Abc.prototype.gch_tr1 = gch_tr1;
  Abc.prototype.get_a_gch = function () {
    return a_gch;
  };
  Abc.prototype.get_bool = get_bool;
  Abc.prototype.get_cur_sy = function () {
    return cur_sy;
  };
  Abc.prototype.get_curvoice = function () {
    return curvoice;
  };
  Abc.prototype.get_delta_tb = function () {
    return delta_tb;
  };
  Abc.prototype.get_decos = function () {
    return decos;
  };
  Abc.prototype.get_font = get_font;
  Abc.prototype.get_font_style = function () {
    return font_style;
  };
  Abc.prototype.get_glyphs = function () {
    return glyphs;
  };
  Abc.prototype.get_img = function () {
    return img;
  };
  Abc.prototype.get_maps = function () {
    return maps;
  };
  Abc.prototype.get_multi = function () {
    return multicol;
  };
  Abc.prototype.get_newpage = function () {
    if (block.newpage) {
      block.newpage = false;
      return true;
    }
  };
  Abc.prototype.get_posy = function () {
    var t = posy;
    posy = 0;
    return t;
  };
  Abc.prototype.get_staff_tb = function () {
    return staff_tb;
  };
  Abc.prototype.get_top_v = function () {
    return par_sy.top_voice;
  };
  Abc.prototype.get_tsfirst = function () {
    return tsfirst;
  };
  Abc.prototype.get_unit = get_unit;
  Abc.prototype.get_voice_tb = function () {
    return voice_tb;
  };
  Abc.prototype.goto_tune = goto_tune;
  Abc.prototype.info = function () {
    return info;
  };
  Abc.prototype.new_block = new_block;
  Abc.prototype.out_arp = out_arp;
  Abc.prototype.out_deco_str = out_deco_str;
  Abc.prototype.out_deco_val = out_deco_val;
  Abc.prototype.out_ltr = out_ltr;
  Abc.prototype.param_set_font = param_set_font;
  Abc.prototype.parse = parse;
  Abc.prototype.psdeco = empty_function;
  Abc.prototype.psxygl = empty_function;
  Abc.prototype.set_cur_sy = function (sy) {
    cur_sy = sy;
  };
  Abc.prototype.set_dscale = set_dscale;
  Abc.prototype.set_font = set_font;
  Abc.prototype.set_hl = set_hl;
  Abc.prototype.set_scale = set_scale;
  Abc.prototype.set_tsfirst = function (s) {
    tsfirst = s;
  };
  Abc.prototype.set_v_param = set_v_param;
  Abc.prototype.strwh = strwh;
  Abc.prototype.stv_g = function () {
    return stv_g;
  };
  Abc.prototype.svg_flush = svg_flush;
  Abc.prototype.syntax = syntax;
  Abc.prototype.tunes = tunes;
  Abc.prototype.unlksym = unlksym;
  Abc.prototype.use_font = use_font;
  Abc.prototype.vskip = vskip;
  Abc.prototype.xy_str = xy_str;
  Abc.prototype.xygl = xygl;

  var hook_init; // set after setting the first module hooks

  // export functions and/or set module hooks
  function set_hooks() {
    var h = abc2svg.modules.hooks,
      gh = abc2svg.modules.g_hooks;

    function set_hs(hs) {
      for (var k = 0; k < hs.length; k++) hs[k](self);
    } // set_hs()

    if (hook_init) {
      // if new modules
      if (h.length) {
        set_hs(h);
        gh.push.apply(gh, h);
        abc2svg.modules.hooks = [];
      }
    } else {
      // all modules
      if (h.length) {
        gh.push.apply(gh, h);
        abc2svg.modules.hooks = [];
      }
      set_hs(gh);
      hook_init = true;
    }
  } // set_hooks()
}; // end of Abc()

// compatibility
var Abc = abc2svg.Abc;

// nodejs
if (typeof module == "object" && typeof exports == "object") {
  exports.abc2svg = abc2svg;
  exports.Abc = Abc;
}
// abc2svg - modules.js - module handling
//
// Copyright (C) 2018-2020 Jean-Francois Moine
//
// This file is part of abc2svg-core.
//
// abc2svg-core is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// abc2svg-core is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with abc2svg-core.  If not, see <http://www.gnu.org/licenses/>.

// empty function
if (!abc2svg.loadjs) {
  abc2svg.loadjs = function (fn, onsuccess, onerror) {
    if (onerror) onerror();
  };
}

abc2svg.modules = {
  ambitus: { fn: "ambitus-1.js" },
  begingrid: { fn: "grid3-1.js" },
  beginps: { fn: "psvg-1.js" },
  break: { fn: "break-1.js" },
  capo: { fn: "capo-1.js" },
  clip: { fn: "clip-1.js" },
  clairnote: { fn: "clair-1.js" },
  voicecombine: { fn: "combine-1.js" },
  diagram: { fn: "diag-1.js" },
  equalbars: { fn: "equalbars-1.js" },
  gamelan: { fn: "gamelan-1.js" },
  grid: { fn: "grid-1.js" },
  grid2: { fn: "grid2-1.js" },
  jianpu: { fn: "jianpu-1.js" },
  mdnn: { fn: "mdnn-1.js" },
  MIDI: { fn: "MIDI-1.js" },
  pageheight: { fn: "page-1.js" },
  percmap: { fn: "perc-1.js" },
  soloffs: { fn: "soloffs-1.js" },
  sth: { fn: "sth-1.js" },
  temperament: { fn: "temper-1.js" },

  nreq: 0,
  hooks: [],
  g_hooks: [],

  // scan the file and find the required modules
  // @file: ABC file
  // @relay: (optional) callback function for continuing the treatment
  // @errmsg: (optional) function to display an error message if any
  //	This function gets one argument: the message
  // return true when all modules are loaded
  load: function (file, relay, errmsg) {
    function get_errmsg() {
      if (typeof user == "object" && user.errmsg) return user.errmsg;
      if (typeof abc2svg.printErr == "function") return abc2svg.printErr;
      if (typeof alert == "function")
        return function (m) {
          alert(m);
        };
      if (typeof console == "object") return console.log;
      return function () {};
    } // get_errmsg()

    // call back functions for loadjs()
    function load_end() {
      if (--abc2svg.modules.nreq == 0) abc2svg.modules.cbf();
    }
    function load_ko(fn) {
      abc2svg.modules.errmsg("Error loading the module " + fn);
      load_end();
    }

    // test if some keyword in the file
    var m,
      r,
      i,
      nreq_i = this.nreq,
      ls = file.match(/(^|\n)(%%|I:).+?\b/g);

    if (!ls) return true;
    this.cbf = relay || function () {}; // (only one callback function)
    this.errmsg = errmsg || get_errmsg();

    for (i = 0; i < ls.length; i++) {
      m = abc2svg.modules[ls[i].replace(/\n?(%%|I:)/, "")];
      if (!m || m.loaded) continue;

      m.loaded = true;

      // load the module
      this.nreq++;
      abc2svg.loadjs(m.fn, load_end, function () {
        load_ko(m.fn);
      });
    }
    return this.nreq == nreq_i;
  },
}; // modules
abc2svg.version = "1.20.12";
abc2svg.vdate = "2020-08-19";
