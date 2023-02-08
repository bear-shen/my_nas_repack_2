/* jshint esversion: 9 */
// ==UserScript==
// @name         eht tag getter
// @namespace    https://exhentai.org/
// @version      0.0.0
// @description
// @author       neko
// @include        *://exhentai.org/g/*
// @include        *://e-hentai.org/g/*
// ==/UserScript==

const content     = {
  title    : '',
  sub_title: '',
  tags     : {},
  type     : '',
  link     : location.href,
};
//
const tt1         = document.querySelector('#gj');
const tt2         = document.querySelector('#gn');
content.title     = tt1 ? tt1.innerText : tt2.innerText;
content.sub_title = tt2 ? tt2.innerText : '';
//
content.type      = document.querySelector('#gdc').innerText;
//
document.querySelector('#taglist').querySelectorAll('tr').forEach(groupItem => {
  console.info(groupItem, groupItem);
  const group = groupItem.querySelector('.tc');
  const tags  = [];
  groupItem.querySelectorAll('a').forEach(tagItem => {
    tags.push(tagItem.innerText);
  })
  const groupName         = group.innerText.replace(':', '').trim();
  content.tags[groupName] = tags;
  // console.info(group.innerText.replace(':', '').trim(), tags);
});
console.info(content);

const btn = document.createElement('button');
btn.addEventListener('click', () => {
  console.info(content);
  navigator.clipboard.writeText(JSON.stringify(content));
});
btn.innerHTML = 'copy meta';
document.querySelector('#gd2').append(btn);