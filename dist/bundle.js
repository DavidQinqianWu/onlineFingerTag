!function(t,e){if("object"==typeof exports&&"object"==typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var n=e();for(var r in n)("object"==typeof exports?exports:t)[r]=n[r]}}(window,(function(){return function(t){var e={};function n(r){if(e[r])return e[r].exports;var i=e[r]={i:r,l:!1,exports:{}};return t[r].call(i.exports,i,i.exports,n),i.l=!0,i.exports}return n.m=t,n.c=e,n.d=function(t,e,r){n.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:r})},n.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},n.t=function(t,e){if(1&e&&(t=n(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var i in t)n.d(r,i,function(e){return t[e]}.bind(null,i));return r},n.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return n.d(e,"a",e),e},n.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},n.p="",n(n.s=1)}([function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=function(){function t(){}return t.abcSystemScale=function(t){return document.getElementsByClassName("nobrk")[0].clientWidth/794*t},t.setScale=function(t){this._pageScale=t,this._innerScale=document.getElementsByClassName("nobrk")[0].clientWidth/794},t.scale=function(t){return this._pageScale*t*this._innerScale},t}();e.default=r},function(t,e,n){"use strict";var r=this&&this.__awaiter||function(t,e,n,r){return new(n||(n=Promise))((function(i,o){function a(t){try{s(r.next(t))}catch(t){o(t)}}function u(t){try{s(r.throw(t))}catch(t){o(t)}}function s(t){var e;t.done?i(t.value):(e=t.value,e instanceof n?e:new n((function(t){t(e)}))).then(a,u)}s((r=r.apply(t,e||[])).next())}))},i=this&&this.__generator||function(t,e){var n,r,i,o,a={label:0,sent:function(){if(1&i[0])throw i[1];return i[1]},trys:[],ops:[]};return o={next:u(0),throw:u(1),return:u(2)},"function"==typeof Symbol&&(o[Symbol.iterator]=function(){return this}),o;function u(o){return function(u){return function(o){if(n)throw new TypeError("Generator is already executing.");for(;a;)try{if(n=1,r&&(i=2&o[0]?r.return:o[0]?r.throw||((i=r.return)&&i.call(r),0):r.next)&&!(i=i.call(r,o[1])).done)return i;switch(r=0,i&&(o=[2&o[0],i.value]),o[0]){case 0:case 1:i=o;break;case 4:return a.label++,{value:o[1],done:!1};case 5:a.label++,r=o[1],o=[0];continue;case 7:o=a.ops.pop(),a.trys.pop();continue;default:if(!(i=a.trys,(i=i.length>0&&i[i.length-1])||6!==o[0]&&2!==o[0])){a=0;continue}if(3===o[0]&&(!i||o[1]>i[0]&&o[1]<i[3])){a.label=o[1];break}if(6===o[0]&&a.label<i[1]){a.label=i[1],i=o;break}if(i&&a.label<i[2]){a.label=i[2],a.ops.push(o);break}i[2]&&a.ops.pop(),a.trys.pop();continue}o=e.call(t,a)}catch(t){o=[6,t],r=0}finally{n=i=0}if(5&o[0])throw o[1];return{value:o[0]?o[1]:void 0,done:!0}}([o,u])}}},o=this&&this.__importDefault||function(t){return t&&t.__esModule?t:{default:t}};Object.defineProperty(e,"__esModule",{value:!0});var a=o(n(2)),u=o(n(3)),s=o(n(0)),c=o(n(5)),l=o(n(6)),f=function(){function t(){}return t.prototype.url=function(){return new Promise((function(t,e){var n=a.default.getQueryVariable("url");n?$.get(n,(function(n,o){return r(this,void 0,void 0,(function(){var r,a,f;return i(this,(function(i){return"success"===o&&(r=new l.default(n).getNoteXmlObj(),u.default.generateRenderInstance(n).renderScore(),s.default.setScale(1.5),(null==(a=document.getElementsByClassName("nobrk")[0])?void 0:a.innerHTML)?(f=c.default.buildEachClickButton(a),a.innerHTML+=f,t(r)):e("曲谱加载失败")),[2]}))}))})):e("没有获得url地址")}))},t}();window.xmlId2StaffMap={},window.submitResult={},window.onload=function(){(new f).url().then((function(t){window.xmlId2StaffMap=t}),(function(t){console.error(t)}))},window.clickBtn=function(t){"noteClickBtn_none"===t.className?t.classList.replace("noteClickBtn_none","noteClickBtn_click"):t.classList.replace("noteClickBtn_click","noteClickBtn_none")},window.resetBtn=function(){for(var t=document.getElementsByClassName("noteClickBtn_click");t.length;)t[0].classList.replace("noteClickBtn_click","noteClickBtn_none")},window.submitBtn=function(){for(var t=document.getElementsByClassName("noteClickBtn_click"),e=0;e<t.length;e++){var n=t[e].getAttribute("id");n&&("1"===window.xmlId2StaffMap[n]?window.submitResult[n]="2":window.submitResult[n]="1")}console.log(window.submitResult)}},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=function(){function t(){}return t.getQueryVariable=function(t){for(var e=window.location.search.substring(1).split("&"),n=0;n<e.length;n++){var r=e[n].split("=");if(r[0]==t)return r[1]}},t.convertStringToXmlDom=function(t){return(new DOMParser).parseFromString(t,"text/xml")},t}();e.default=r},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=n(4),i=function(){function t(t){this._dom=t}return t.generateRenderInstance=function(e){return this._instance||(this._instance=new t(e)),this._instance},t.prototype.renderScore=function(){var t=new r.CreateABCStr(this._dom,{noTitle:!0,noPiano:!0}),e=this.getSVGModalOptions(t.abcStr),n=new r.CreateSvgStr(e);document.getElementById("content").innerHTML=n.svgStr},t.prototype.getSVGModalOptions=function(t){var e={pagescale:1.5};return e.abcStr=t,e},t}();e.default=i},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.CreateSvgStr=e.CreateABCStr=void 0;var r=function(){function t(t,e){e.abcOpn=e.abcOpn||{p:""},e.noTitle=e.noTitle||!1,e.noPiano=e.noPiano||!1,this.xmlDom=t;var n=vertaal(this.xmlDom,e.abcOpn);this.abcStr=n[0],this._list=this.abcTList(this.abcStr),e.noTitle&&(this.abcStr=this.noTitleFn()),e.noPiano&&(this.abcStr=this.noPianoFn())}return t.prototype.abcTList=function(t){for(var e=encodeURI(t).split("%0A"),n=[],r=0;r<e.length;r++){var i=decodeURI(e[r]);n.push(i)}return n},t.prototype.noTitleFn=function(){return this._list=this._list.filter((function(t){var e=t.split("");return!(("T"===e[0]||"C"===e[0]||"Q"===e[0]||"Z"===e[0])&&":"===e[1])})),this._list.join("\n")},t.prototype.noPianoFn=function(){return this._list=this._list.map((function(t){var e=t.split("");if("V"===e[0]&&":"===e[1]&&e.indexOf("=")>=0){var n=[];return e.forEach((function(t,e){return" "===t&&n.push(e)})),e.splice(n[1],e.length),e.join("")}return t})),this._list.join("\n")},t}();e.CreateABCStr=r;var i=function(){function t(t){if(t.abcStr){this.svgStr="",this.svgLineList=[],this.measuresObj={},t.imagesize=t.imagesize||'width="100%"',t.pagescale=t.pagescale||1;var e={imagesize:t.imagesize,img_out:this.svgOut.bind(this),errbld:function(t,e,n,r){console.error(t,e,n,r)},read_file:function(t){return""},measure_draw:this.measureDraw.bind(this),anno_start:t.annoStart,anno_stop:t.annoStop,page_format:!0,no_margin_yym:!0,page_width_yym:!1};this.abcStr="%%topspace 0cm\n%%pagescale "+t.pagescale+"\n%%measurenb 0\n"+t.abcStr,this.abc2svg=new Abc(e),this.abc2svg.tosvg("",this.abcStr),this.abcSystemHeightArray=this.abc2svg.systemHeightArray}}return t.prototype.svgOut=function(t){this.svgLineList.push(t),this.svgStr+=t},t.prototype.measureDraw=function(t){this.measuresObj[t.cls_name]=t},t}();e.CreateSvgStr=i},function(t,e,n){"use strict";var r=this&&this.__importDefault||function(t){return t&&t.__esModule?t:{default:t}};Object.defineProperty(e,"__esModule",{value:!0});var i=r(n(0)),o=function(){function t(){}return t.buildEachClickButton=function(t){var e=t.clientWidth,n=t.clientHeight,r=document.getElementsByClassName("note"),o="";return Array.prototype.forEach.call(r,(function(t){var r,a,u,s=t.classList[0].substring(8),c=null===(u=null===(a=null===(r=t.parentElement)||void 0===r?void 0:r.parentElement)||void 0===a?void 0:a.parentElement)||void 0===u?void 0:u.offsetTop,l=i.default.scale(parseFloat(t.getAttribute("x"))-1),f=(i.default.scale(parseFloat(t.getAttribute("y"))-4)+c)/n*100,d=e*(13/1200)/n*100,p='<div class="noteClickBtn_none" id="'+s+'" style="left:'+(l/e*100).toFixed(2)+"%; top:"+f.toFixed(2)+"%; width:"+(17/1200*100).toFixed(2)+"%; height: "+d.toFixed(2)+'%; position:absolute; z-index:3" onclick="clickBtn(this)"></div>';o+=p})),o},t}();e.default=o},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=function(){function t(t){this._dom=t}return t.prototype.getNoteXmlObj=function(){for(var t,e={},n=this._dom.getElementsByTagName("note"),r=0;r<n.length;r++){var i=n[r],o=i.getElementsByTagName("staff")[0].innerHTML,a={};a.xmlId=r,o?(a.staff=o,e[a.xmlId]=o):(a.staff="0",console.error("第"+(null===(t=i.parentElement)||void 0===t?void 0:t.getAttribute("number"))+"小节出现音符没有staff"))}return e},t}();e.default=r}])}));
//# sourceMappingURL=bundle.js.map