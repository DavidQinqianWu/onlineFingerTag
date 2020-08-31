import Scale from "../util/scale";

export default class Container {
  public static buildEachClickButton(contentDiv: Element): string {
    const contentDivWidth = contentDiv.clientWidth!;
    const contentDivHeight = contentDiv.clientHeight!;

    let notes = document.getElementsByClassName("note");
    let noteBtnDivStr = "";

    Array.prototype.forEach.call(notes, (note: HTMLElement) => {
      const firstClassName = note.classList[0];
      // 得到class = “note_id_1” 这样的xml id值
      const noteXmlId: string = firstClassName.substring(8);
      let systemTop =
        note.parentElement?.parentElement?.parentElement?.offsetTop;
      let noteX = Scale.scale(parseFloat(note.getAttribute("x")!) - 1);
      let noteY =
        Scale.scale(parseFloat(note.getAttribute("y")!) - 4) + systemTop!;
      let xPercentage = (noteX / contentDivWidth) * 100;
      let yPercentage = (noteY / contentDivHeight) * 100;
      let widthPercentage = 13 / 1200;
      let widthPx = contentDivWidth * widthPercentage;
      let heightPercentage = (widthPx / contentDivHeight) * 100;
      let temp = `<div class="noteClickBtn_none" id="${noteXmlId}" style="left:${xPercentage.toFixed(
        2
      )}%; top:${yPercentage.toFixed(2)}%; width:${((17 / 1200) * 100).toFixed(
        2
      )}%; height: ${heightPercentage.toFixed(
        2
      )}%; position:absolute; z-index:3" onclick="clickBtn(this)"></div>`;
      noteBtnDivStr += temp;
    });
    return noteBtnDivStr;
  }
}
