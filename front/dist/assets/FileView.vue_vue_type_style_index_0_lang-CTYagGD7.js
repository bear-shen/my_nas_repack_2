import{d as U,a as x,r as S,s as j,t as q,g as A,q as D,u as G,b as P,e as K,f as z,o as r,h as i,i as s,k as o,F as y,j as p,x as O,m as v,w as m,v as J,l as h,C as b,A as W,n as T,c as Y,G as R,p as X}from"./index-Btw2Pqv2.js";import{F as Z}from"./FileItem-Btsi148i.js";const Q={class:"content_meta"},ee={key:0,class:"crumb"},te=["onClick","title"],le={class:"search"},oe=s("span",null,"Title : ",-1),ne=s("span",null,"Type : ",-1),se=s("span",null,"Rate : ",-1),ae=["value","innerHTML"],re=["value","innerHTML"],ie=s("span",null,"Cascade : ",-1),ue=s("label",{class:"buttonStyle",for:"FV_S_CB"},null,-1),de={class:"display"},ce=s("a",{class:"sysIcon sysIcon_fengefu"},null,-1),fe=s("a",{class:"buttonStyle sysIcon sysIcon_fengefu"},null,-1),ye={key:2},_e=s("span",null,"Sort : ",-1),pe=["value"],ve=s("a",{class:"sysIcon sysIcon_fengefu"},null,-1),me=["onClick"],he=U({__name:"FileView",setup(ke){const V=x(),$=S(null),N=j(),_=q(),B=window.navigator.userAgent.toLowerCase().indexOf("mobile")!==-1;let d={mode:"directory",id_dir:"0",id_tag:""},u={keyword:"",node_type:"",rate:"",cascade_dir:"1"};function M(l){if(l){for(let e in d)if(Object.prototype.hasOwnProperty.call(d,e))switch(e){default:d[e]=l[e]??"";break;case"mode":d[e]=l[e]??"directory";break;case"id_dir":d[e]=l[e]??"0";break}for(let e in u)if(Object.prototype.hasOwnProperty.call(u,e))switch(e){default:u[e]=l[e]??"";break;case"cascade_dir":u[e]=l[e]??"1";break}}}A(async l=>{console.warn("onBeforeRouteUpdate",l,JSON.stringify(l.query)),l.query&&M(l.query),await k()});let c=S([]),f=S([]),n;async function k(l){if(console.info("getList",_.name),f.value=[],l)f.value=l;else{switch(c.value=[],_.name){default:break;case"Recycle":d.status="deleted";break;case"Favourite":break}let e={};switch(d.mode){case"directory":e=Object.assign(e,d);break;case"search":e=Object.assign(e,d,u);break}const t=await D("file/get",e);if(!t)return;c.value=t.path,f.value=n.sortList(t.list,n.sortVal.value)}return n&&n.setList(f.value),{crumb:c.value,node:f.value}}function F(){let l=0,e="root";if(c.value.length){let t=c.value[c.value.length-1];t&&(l=t.id??0,e=t.title??"root")}V.set({title:`mkdir | ${e}`,alpha:!1,key:"",single:!1,w:400,h:100,minW:400,minH:100,allow_resize:!1,allow_move:!0,allow_fullscreen:!1,auto_focus:!0,form:[{label:"title",type:"text"}],callback:{submit:async t=>{const g=t.content.form[0].value;if(!g)return!0;const H=await D("file/mkdir",{title:g,pid:`${l}`});k()}}})}function w(){let l=0,e="root";if(c.value.length){let t=c.value[c.value.length-1];t&&(l=t.id??0,e=t.title??"root")}V.set({title:`upload | ${e}`,alpha:!1,key:`FileView_addFile_${l}`,single:!0,w:400,h:200,minW:400,minH:200,allow_resize:!0,allow_move:!0,allow_fullscreen:!0,auto_focus:!0,component:[{componentName:"uploader",data:{pid:l,emitGo:C}}]})}G();function L(){const l=R.copyObject(u);d.id_tag&&(l.id_tag=d.id_tag),d.id_dir&&(l.id_dir=d.id_dir);let e=!1;u.rate&&(e=!0),u.keyword.trim()&&(e=!0),u.node_type&&u.node_type!="any"&&(e=!0),e?l.mode="search":l.mode="directory",n.go(l)}function C(l,e){switch(console.info("emitGo",l,e),l){case"reload":k();break;case"tag":n.go({mode:"directory",id_tag:`${e}`});break;case"node":let t;for(let a=0;a<f.value.length;a++)if(f.value[a].id===e){t=f.value[a];break}if(!t)break;switch(t.type){case"directory":n.go({mode:"directory",id_dir:`${t.id}`});break;default:X(R.copyObject(d),t.id??0);break}break}}P(async()=>{console.info("onMounted"),_.query&&M(_.query),n=new K({route:_,router:N,getList:k,contentDOM:$.value,emitGo:C}),await k()&&(n.reloadScroll(),document.addEventListener("keydown",I))}),z(()=>{n.destructor(),document.removeEventListener("keydown",I)});function I(l){const e=[];switch(l.ctrlKey&&e.push("ctrl"),l.shiftKey&&e.push("shift"),e.push(l.code),e.join("_")){default:return;case"ctrl_KeyU":if(!(c.value.length||d.id_dir))return;n&&n.showSelectionOp&&(l.preventDefault(),w());break;case"ctrl_KeyM":if(!(c.value.length||d.id_dir))return;n&&n.showSelectionOp&&(l.preventDefault(),F());break;case"Enter":case"NumpadEnter":if(!l.target||l.target.id!=="searchBarInput")return;L();break}}function E(l){(c.value.length||d.id_dir)&&(l.stopPropagation(),l.preventDefault(),w())}return(l,e)=>(r(),i("div",{class:"fr_content view_file",onDragover:E},[s("div",Q,[o(c).length?(r(),i("div",ee,[(r(!0),i(y,null,p(o(c),(t,a)=>(r(),i("a",{dir:"ltr",class:"item",key:a,onClick:g=>o(n).go({id_dir:`${t==null?void 0:t.id}`,mode:"directory"}),title:t.title},O(t.title),9,te))),128))])):v("",!0),s("div",le,[s("label",null,[oe,m(s("input",{id:"searchBarInput",type:"text","onUpdate:modelValue":e[0]||(e[0]=t=>o(u).keyword=t)},null,512),[[J,o(u).keyword]])]),s("label",null,[ne,m(s("select",{"onUpdate:modelValue":e[1]||(e[1]=t=>o(u).node_type=t)},[(r(!0),i(y,null,p(o(b).fileType,(t,a)=>(r(),i("option",{key:`FV_SCH_NODE_TYPE_${a}`},O(t),1))),128))],512),[[h,o(u).node_type]])]),s("label",null,[se,B?m((r(),i("select",{key:0,class:"sysIcon","onUpdate:modelValue":e[2]||(e[2]=t=>o(u).rate=t)},[(r(!0),i(y,null,p(o(b).rateMobile,(t,a)=>(r(),i("option",{value:a,innerHTML:t,key:`FV_SCH_CON_RATE_${a}`},null,8,ae))),128))],512)),[[h,o(u).rate]]):m((r(),i("select",{key:1,class:"sysIcon","onUpdate:modelValue":e[3]||(e[3]=t=>o(u).rate=t)},[(r(!0),i(y,null,p(o(b).rate,(t,a)=>(r(),i("option",{value:a,innerHTML:t,key:`FV_SCH_CON_RATE_${a}`},null,8,re))),128))],512)),[[h,o(u).rate]])]),s("label",null,[ie,m(s("input",{type:"checkbox","onUpdate:modelValue":e[4]||(e[4]=t=>o(u).cascade_dir=t),id:"FV_S_CB","true-value":1,"false-value":""},null,512),[[W,o(u).cascade_dir]]),ue]),s("label",null,[s("button",{class:"buttonStyle sysIcon sysIcon_search",onClick:L})])]),s("div",de,[o(n)&&o(n).showSelectionOp?(r(),i(y,{key:0},[s("a",{class:"buttonStyle",onClick:e[5]||(e[5]=t=>o(n).bathOp("browser"))},"OP"),s("a",{class:"buttonStyle",onClick:e[6]||(e[6]=t=>o(n).bathOp("favourite"))},"FAV"),s("a",{class:"buttonStyle",onClick:e[7]||(e[7]=t=>o(n).bathOp("rename"))},"RN"),s("a",{class:"buttonStyle",onClick:e[8]||(e[8]=t=>o(n).bathOp("move"))},"MV"),o(_).name!=="Recycle"?(r(),i("a",{key:0,class:"buttonStyle",onClick:e[9]||(e[9]=t=>o(n).bathOp("delete"))},"DEL")):v("",!0),o(_).name==="Recycle"?(r(),i("a",{key:1,class:"buttonStyle",onClick:e[10]||(e[10]=t=>o(n).bathOp("delete_forever"))},"rDEL")):v("",!0),ce],64)):v("",!0),o(c).length||o(d).id_dir=="0"?(r(),i(y,{key:1},[s("a",{class:"buttonStyle sysIcon sysIcon_addfolder",onClick:F}),s("a",{class:"buttonStyle sysIcon sysIcon_addfile",onClick:w}),fe],64)):v("",!0),o(n)&&o(n).sortVal?(r(),i("label",ye,[_e,m(s("select",{"onUpdate:modelValue":e[11]||(e[11]=t=>o(n).sortVal.value=t),onChange:e[12]||(e[12]=t=>o(n).setSort(l.sortVal))},[(r(!0),i(y,null,p(o(b).sort,(t,a)=>(r(),i("option",{value:a,key:`FV_SCH_CON_SORT_${a}`},O(t),9,pe))),128))],544),[[h,o(n).sortVal.value]])])):v("",!0),ve,o(n)?(r(!0),i(y,{key:3},p(o(b).listType,(t,a)=>(r(),i("a",{class:T(["buttonStyle","sysIcon",`sysIcon_listType_${t}`,{active:o(n).mode.value===t}]),onClick:g=>o(n).setMode(t),key:`FAV_SCH_BTN_${a}`},null,10,me))),128)):v("",!0)])]),s("div",{class:T(["content_detail",`mode_${o(n)?o(n).mode.value:""}`]),ref_key:"contentDOM",ref:$},[(r(!0),i(y,null,p(o(f),(t,a)=>(r(),Y(Z,{key:a,node:t,index:a,selected:!1,onGo:C},null,8,["node","index"]))),128))],2)],32))}});export{he as _};