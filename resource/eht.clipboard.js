/* jshint esversion: 9 */
// ==UserScript==
// @name         eht tag copyer
// @namespace    https://exhentai.org/
// @version      0.0.0
// @description
// @author       neko
// @include        *://exhentai.org/*
// @include        *://e-hentai.org/*
// ==/UserScript==
//
window.onload=function(){
  console.info('cpd');
  document.querySelectorAll('.gl2e>div>a').forEach(a => {
    a.parentNode.innerHTML += a.innerHTML;
  });
  document.querySelectorAll('.gl2e>div>a').forEach(a => {
    a.parentNode.removeChild(a);
  });

  document.querySelectorAll('.gt,.gtl').forEach(tag => {
    tag.addEventListener('click', (e) => {
      console.info(e.target);
      const text = new Blob([e.target.innerHTML], {type: 'text/plain'});
      const item = new ClipboardItem({
                                       'text/plain': text,
                                     });
      navigator.clipboard.write([item]);
    });
  })
}