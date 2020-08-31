export default class YYM_Request {
  public static getQueryVariable(variable: string): string | undefined {
    let query = window.location.search.substring(1);
    let vars = query.split("&");
    for (let i = 0; i < vars.length; i++) {
      let pair = vars[i].split("=");
      if (pair[0] == variable) {
        return pair[1];
      }
    }
    return undefined;
  }

  public static convertStringToXmlDom(xmlString_: string) {
    return new DOMParser().parseFromString(xmlString_, "text/xml");
  }
}
