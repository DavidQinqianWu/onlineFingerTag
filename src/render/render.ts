import YYM_Request from "../util/request";
import { CreateABCStr, CreateSvgStr } from "./xml2svg";
export default class Render {
  private static _instance: Render;
  private _dom: Document;

  constructor(dom_: Document) {
    this._dom = dom_;
  }

  // 单例模式
  public static generateRenderInstance(dom_: Document) {
    if (!this._instance) {
      this._instance = new Render(dom_);
    }
    return this._instance;
  }
  public renderScore() {
    const abcModalOption = { noTitle: true, noPiano: true };
    // 此时拿到   xml=>abc
    const abcModal = new CreateABCStr(this._dom, abcModalOption);
    const svgModalOptions = this.getSVGModalOptions(abcModal.abcStr);
    const svgModal = new CreateSvgStr(svgModalOptions);
    document.getElementById("content")!.innerHTML = svgModal.svgStr;
  }

  private getSVGModalOptions(abcStr_: string) {
    let result: svgModalOptionsParam = {} as svgModalOptionsParam;
    result.pagescale = 1.5;
    result.abcStr = abcStr_;
    return result;
  }
}

interface svgModalOptionsParam {
  abcStr: string;
  pagescale: number;
}
