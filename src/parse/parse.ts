import { iNote } from "../interface/interface";
export default class Prase {
  private _dom: Document;
  constructor(dom_: Document) {
    this._dom = dom_;
  }
  public getNoteXmlObj() {
    let xmlIdStaffMap = {};
    let notes = this._dom.getElementsByTagName("note");
    for (let i = 0; i < notes.length; i++) {
      let note = notes[i];
      let staff = note.getElementsByTagName("staff")[0].innerHTML;
      let temp: iNote = {} as iNote;
      temp.xmlId = i;
      staff
        ? ((temp.staff = staff), (xmlIdStaffMap[temp.xmlId] = staff))
        : ((temp.staff = "0"),
          console.error(
            `第${note.parentElement?.getAttribute(
              "number"
            )}小节出现音符没有staff`
          ));
    }
    return xmlIdStaffMap;
  }
}
