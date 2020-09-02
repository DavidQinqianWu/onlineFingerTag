/// <reference path="../declare/declare.d.ts" />;
import YYM_Request, { Variable } from "./util/request";
import Render from "./render/render";
import Scale from "./util/scale";
import Container from "./ui/container";
import Prase from "./parse/parse";

class Index {
  constructor() {}
  public url(): Promise<object | string> {
    return new Promise((resolve, reject) => {
      let variables: Variable = YYM_Request.getQueryVariable(["url", "songId"]);
      if (variables.url) {
        (window as any).variables = variables;
        $.get(variables.url, async function (data: Document, status: string) {
          if (status === "success") {
            let xmlId2StaffMap = new Prase(data).getNoteXmlObj();
            let renderInstance = Render.generateRenderInstance(data);
            renderInstance.renderScore();
            Scale.setScale(1.5);
            // 渲染成功之后
            const contentDiv = document.getElementsByClassName("nobrk")[0];
            if (contentDiv?.innerHTML) {
              // 给音符画div
              let noteBtnDivStr = Container.buildEachClickButton(contentDiv);
              contentDiv.innerHTML += noteBtnDivStr;
              resolve(xmlId2StaffMap);
            } else {
              reject("曲谱加载失败");
            }
          }
        });
      } else {
        reject("没有获得url地址");
      }
    });
  }
}

(window as any).xmlId2StaffMap = {};
(window as any).submitResult = {};
(window as any).variables = {};

window.onload = () => {
  new Index().url().then(
    (value) => {
      (window as any).xmlId2StaffMap = value;
    },
    (reason) => {
      console.error(reason);
    }
  );
};

(window as any).clickBtn = (e: HTMLElement) => {
  if (e.className === "noteClickBtn_none") {
    e.classList.replace("noteClickBtn_none", "noteClickBtn_click");
  } else {
    e.classList.replace("noteClickBtn_click", "noteClickBtn_none");
  }
};

(window as any).resetBtn = () => {
  let clickBtns = document.getElementsByClassName("noteClickBtn_click");
  while (clickBtns.length) {
    clickBtns[0].classList.replace("noteClickBtn_click", "noteClickBtn_none");
  }
};

(window as any).submitBtn = () => {
  let clickBtns = document.getElementsByClassName("noteClickBtn_click");
  for (let i = 0; i < clickBtns.length; i++) {
    let clickBtn = clickBtns[i];
    let id = clickBtn.getAttribute("id");
    if (id) {
      (window as any).xmlId2StaffMap[id] === "1"
        ? ((window as any).submitResult[id] = "2")
        : ((window as any).submitResult[id] = "1");
    }
  }
  console.log((window as any).submitResult);
  // 上传后台, 等待后台接口
};
