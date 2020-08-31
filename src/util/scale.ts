export default class Scale {
  public static _pageScale: number;
  private static _innerScale: number;
  public static abcSystemScale(param_: number) {
    return (
      (document.getElementsByClassName("nobrk")[0].clientWidth / 794) * param_
    );
  }

  public static setScale(scale_: number) {
    this._pageScale = scale_;
    this._innerScale =
      document.getElementsByClassName("nobrk")[0].clientWidth / 794;
  }

  public static scale(number: number): number {
    return this._pageScale * number * this._innerScale;
  }
}
