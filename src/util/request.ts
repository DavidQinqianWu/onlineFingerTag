export default class YYM_Request {
  public static getQueryVariable(variables_: string[]): Variable {
    let result: Variable = {
      url: "",
      songId: "",
    };
    let query = window.location.search.substring(1);
    let vars = query.split("&");
    for (let i = 0; i < vars.length; i++) {
      let pair = vars[i].split("=");
      if (variables_.indexOf(pair[0]) >= 0) {
        result[`${pair[0]}`] = pair[1];
      }
    }
    return result;
  }

  public static convertStringToXmlDom(xmlString_: string) {
    return new DOMParser().parseFromString(xmlString_, "text/xml");
  }
}

export interface Variable {
  url: string;
  songId: string;
}
