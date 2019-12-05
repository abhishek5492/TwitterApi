/* Copyright 2012 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use strict";"undefined"==typeof PDFJS&&(("undefined"!=typeof window?window:this).PDFJS={}),function(){function t(t,e){return new i(this.slice(t,e))}function e(t,e){arguments.length<2&&(e=0);for(var i=0,r=t.length;r>i;++i,++e)this[e]=255&t[i]}function i(i){var r,n,o;if("number"==typeof i)for(r=[],n=0;i>n;++n)r[n]=0;else if("slice"in i)r=i.slice(0);else for(r=[],n=0,o=i.length;o>n;++n)r[n]=i[n];return r.subarray=t,r.buffer=r,r.byteLength=r.length,r.set=e,"object"==typeof i&&i.buffer&&(r.buffer=i.buffer),r}return"undefined"!=typeof Uint8Array?("undefined"==typeof Uint8Array.prototype.subarray&&(Uint8Array.prototype.subarray=function(t,e){return new Uint8Array(this.slice(t,e))},Float32Array.prototype.subarray=function(t,e){return new Float32Array(this.slice(t,e))}),void("undefined"==typeof Float64Array&&(window.Float64Array=Float32Array))):(window.Uint8Array=i,window.Int8Array=i,window.Uint32Array=i,window.Int32Array=i,window.Uint16Array=i,window.Float32Array=i,void(window.Float64Array=i))}(),function(){window.URL||(window.URL=window.webkitURL)}(),function(){function t(t){var t=t||navigator.userAgent,e=t.match(/Android\s([0-9\.]*)/);return e?e[1]:!1}var e=t();"4.0.4"==e&&(PDFJS.disableFontFace=!0,console.log("disable font face"))}(),function(){if("undefined"!=typeof Object.defineProperty){var t=!0;try{Object.defineProperty(new Image,"id",{value:"test"});var e=function(){};e.prototype={get id(){}},Object.defineProperty(new e,"id",{value:"",configurable:!0,enumerable:!0,writable:!1})}catch(i){t=!1}if(t)return}Object.defineProperty=function(t,e,i){delete t[e],"get"in i&&t.__defineGetter__(e,i.get),"set"in i&&t.__defineSetter__(e,i.set),"value"in i&&(t.__defineSetter__(e,function(t){return this.__defineGetter__(e,function(){return t}),t}),t[e]=i.value)}}(),function(){function t(){this.overrideMimeType("text/plain; charset=x-user-defined")}function e(){var t,e=this.responseText,i=e.length,r=new Uint8Array(i);for(t=0;i>t;++t)r[t]=255&e.charCodeAt(t);return r.buffer}var i=XMLHttpRequest.prototype,r=new XMLHttpRequest;if("overrideMimeType"in r||Object.defineProperty(i,"overrideMimeType",{value:function(){}}),!("responseType"in r)){if(PDFJS.disableWorker=!0,"undefined"!=typeof VBArray)return void Object.defineProperty(i,"response",{get:function(){return"arraybuffer"===this.responseType?new Uint8Array(new VBArray(this.responseBody).toArray()):this.responseText}});"function"==typeof r.overrideMimeType&&Object.defineProperty(i,"responseType",{set:t}),Object.defineProperty(i,"response",{get:e})}}(),function(){if(!("btoa"in window)){var t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";window.btoa=function(e){var i,r,n="";for(i=0,r=e.length;r>i;i+=3){var o=255&e.charCodeAt(i),s=255&e.charCodeAt(i+1),a=255&e.charCodeAt(i+2),h=o>>2,l=(3&o)<<4|s>>4,u=r>i+1?(15&s)<<2|a>>6:64,c=r>i+2?63&a:64;n+=t.charAt(h)+t.charAt(l)+t.charAt(u)+t.charAt(c)}return n}}}(),function(){if(!("atob"in window)){var t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";window.atob=function(e){if(e=e.replace(/=+$/,""),e.length%4===1)throw new Error("bad atob input");for(var i,r,n=0,o=0,s="";r=e.charAt(o++);~r&&(i=n%4?64*i+r:r,n++%4)?s+=String.fromCharCode(255&i>>(-2*n&6)):0)r=t.indexOf(r);return s}}}(),function(){"undefined"==typeof Function.prototype.bind&&(Function.prototype.bind=function(t){var e=this,i=Array.prototype.slice.call(arguments,1),r=function(){var r=i.concat(Array.prototype.slice.call(arguments));return e.apply(t,r)};return r})}(),function(){var t=document.createElement("div");"dataset"in t||Object.defineProperty(HTMLElement.prototype,"dataset",{get:function(){if(this._dataset)return this._dataset;for(var t={},e=0,i=this.attributes.length;i>e;e++){var r=this.attributes[e];if("data-"===r.name.substring(0,5)){var n=r.name.substring(5).replace(/\-([a-z])/g,function(t,e){return e.toUpperCase()});t[n]=r.value}}return Object.defineProperty(this,"_dataset",{value:t,writable:!1,enumerable:!1}),t},enumerable:!0})}(),function(){function t(t,e,i,r){var n=t.className||"",o=n.split(/\s+/g);""===o[0]&&o.shift();var s=o.indexOf(e);return 0>s&&i&&o.push(e),s>=0&&r&&o.splice(s,1),t.className=o.join(" "),s>=0}var e=document.createElement("div");if(!("classList"in e)){var i={add:function(e){t(this.element,e,!0,!1)},contains:function(e){return t(this.element,e,!1,!1)},remove:function(e){t(this.element,e,!1,!0)},toggle:function(e){t(this.element,e,!0,!0)}};Object.defineProperty(HTMLElement.prototype,"classList",{get:function(){if(this._classList)return this._classList;var t=Object.create(i,{element:{value:this,writable:!1,enumerable:!0}});return Object.defineProperty(this,"_classList",{value:t,writable:!1,enumerable:!1}),t},enumerable:!0})}}(),function(){"console"in window?"bind"in console.log||(console.log=function(t){return function(e){return t(e)}}(console.log),console.error=function(t){return function(e){return t(e)}}(console.error),console.warn=function(t){return function(e){return t(e)}}(console.warn)):window.console={log:function(){},error:function(){},warn:function(){}}}(),function(){function t(t){e(t.target)&&t.stopPropagation()}function e(t){return t.disabled||t.parentNode&&e(t.parentNode)}-1!==navigator.userAgent.indexOf("Opera")&&document.addEventListener("click",t,!0)}(),function(){navigator.userAgent.indexOf("Trident")>=0&&(PDFJS.disableCreateObjectURL=!0)}(),function(){function t(t){var e=t.split(/[-_]/);return e[0]=e[0].toLowerCase(),e.length>1&&(e[1]=e[1].toUpperCase()),e.join("-")}if(!("language"in navigator&&/^[a-z]+(-[A-Z]+)?$/.test(navigator.language))){var e=navigator.language||navigator.userLanguage||"en-US";PDFJS.locale=t(e)}}(),function(){var t=Object.prototype.toString.call(window.HTMLElement).indexOf("Constructor")>0,e=/Android\s[0-2][^\d]/,i=e.test(navigator.userAgent);(t||i)&&(PDFJS.disableRange=!0)}(),function(){(!history.pushState||navigator.userAgent.indexOf("Android 2.")>=0)&&(PDFJS.disableHistory=!0)}(),function(){if(window.CanvasPixelArray)"function"!=typeof window.CanvasPixelArray.prototype.set&&(window.CanvasPixelArray.prototype.set=function(t){for(var e=0,i=this.length;i>e;e++)this[e]=t[e]});else{var t,e=!1;if(navigator.userAgent.indexOf("Chrom")>=0?(t=navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./),e=t&&parseInt(t[2])<21):navigator.userAgent.indexOf("Android")>=0?e=/Android\s[0-4][^\d]/g.test(navigator.userAgent):navigator.userAgent.indexOf("Safari")>=0&&(t=navigator.userAgent.match(/Version\/([0-9]+)\.([0-9]+)\.([0-9]+) Safari\//),e=t&&parseInt(t[1])<6),e){var i=window.CanvasRenderingContext2D.prototype;i._createImageData=i.createImageData,i.createImageData=function(t,e){var i=this._createImageData(t,e);return i.data.set=function(t){for(var e=0,i=this.length;i>e;e++)this[e]=t[e]},i}}}}(),function(){function t(t){window.setTimeout(t,20)}var e=/(iPad|iPhone|iPod)/g.test(navigator.userAgent);return e?void(window.requestAnimationFrame=t):void("requestAnimationFrame"in window||(window.requestAnimationFrame=window.mozRequestAnimationFrame||window.webkitRequestAnimationFrame||t))}(),function(){var t=/(iPad|iPhone|iPod)/g.test(navigator.userAgent),e=/Android/g.test(navigator.userAgent);(t||e)&&(PDFJS.maxCanvasPixels=5242880)}();