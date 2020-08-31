/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable no-undef */
// eslint-disable-next-line spaced-comment
/**
 * 根据xml字符串转码为abc字符串
 * @param {String} xmlStr xml字符串
 * @param {Object} abcOpn 生成abc字符串参数
 */
export class CreateABCStr {
  private xmlDom: Document;
  public abcStr: string;
  private _list: string[];
  public constructor(xmlDom: Document, options: any) {
    options.abcOpn = options.abcOpn || { p: "" };
    options.noTitle = options.noTitle || false;
    options.noPiano = options.noPiano || false;
    this.xmlDom = xmlDom;
    const svgObj = vertaal(this.xmlDom, options.abcOpn);
    this.abcStr = svgObj[0];
    this._list = this.abcTList(this.abcStr);
    if (options.noTitle) {
      this.abcStr = this.noTitleFn();
    }
    if (options.noPiano) {
      this.abcStr = this.noPianoFn();
    }
  }

  private abcTList(abc: string) {
    const neu = encodeURI(abc);
    const abcArr: string[] = neu.split("%0A");
    const list: string[] = [];
    for (let i = 0; i < abcArr.length; i++) {
      let char: string = decodeURI(abcArr[i]);
      list.push(char);
    }
    return list;
  }

  private noTitleFn() {
    this._list = this._list.filter((item) => {
      const curCodeList = item.split("");
      return !(
        (curCodeList[0] === "T" ||
          curCodeList[0] === "C" ||
          curCodeList[0] === "Q" ||
          curCodeList[0] === "Z") &&
        curCodeList[1] === ":"
      );
    });
    return this._list.join("\n");
  }

  private noPianoFn() {
    this._list = this._list.map((item) => {
      const curCodeList = item.split("");
      if (curCodeList[0] === "V" && curCodeList[1] === ":") {
        if (curCodeList.indexOf("=") >= 0) {
          const indices: number[] = [];
          curCodeList.forEach((el, i) => el === " " && indices.push(i));
          curCodeList.splice(indices[1], curCodeList.length);
          return curCodeList.join("");
        }
      }
      return item;
    });
    return this._list.join("\n");
  }
}

/**
 * 根据abc生成svg字符串
 * @param {String} abcStr abc字符串
 * @param {String} imagesize 设置svg大小
 */
export class CreateSvgStr {
  public svgStr: string;
  private svgLineList: string[];
  private measuresObj: {};
  private abcStr: string;
  private abc2svg: any;
  public abcSystemHeightArray: string[];

  public constructor(options) {
    if (options.abcStr) {
      this.svgStr = "";
      this.svgLineList = [];
      this.measuresObj = {};
      options.imagesize = options.imagesize || 'width="100%"';
      options.pagescale = options.pagescale || 1;
      const that = this;
      let errorFunction = function (msg, l, c, y) {
        console.error(msg, l, c, y);
      };

      const user = {
        imagesize: options.imagesize,
        img_out: this.svgOut.bind(that),
        // To SVG 渲染曲谱报错信息查询
        errbld: errorFunction,
        read_file: function (x) {
          return "";
        },
        measure_draw: this.measureDraw.bind(that),
        anno_start: options.annoStart,
        anno_stop: options.annoStop,
        page_format: true,
        no_margin_yym: true,
        page_width_yym: false,
      };

      this.abcStr = `%%topspace 0cm\n%%pagescale ${options.pagescale}\n%%measurenb 0\n${options.abcStr}`;

      this.abc2svg = new Abc(user);
      this.abc2svg.tosvg("", this.abcStr);
      this.abcSystemHeightArray = this.abc2svg.systemHeightArray;
    }
  }

  private svgOut(str: string) {
    this.svgLineList.push(str);
    this.svgStr += str;
  }

  private measureDraw(measure) {
    this.measuresObj[measure.cls_name] = measure;
  }
}
