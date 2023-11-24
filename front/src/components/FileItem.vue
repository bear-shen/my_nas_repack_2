<script setup lang="ts">
import {useLocalConfigureStore} from "@/stores/localConfigure";
import {onMounted, onUnmounted, type Ref, ref} from "vue";
import type {api_favourite_attach_resp, api_favourite_group_list_resp, api_file_checksum_resp, api_file_cover_resp, api_file_delete_resp, api_file_list_req, api_file_mov_req, api_file_mov_resp, api_file_rebuild_resp, api_node_col, api_tag_col, api_tag_list_resp} from "../../../share/Api";
import {useModalStore} from "@/stores/modalStore";
import {query} from "@/Helper";
import ContentEditable from "@/components/ContentEditable.vue";
import Hinter from "@/components/Hinter.vue";
import type {col_tag, col_tag_group} from "../../../share/Database";
// import type {col_tag} from "../../../share/Database";
// import {api_tag_col} from "../../../share/Api";

const modalStore = useModalStore();
const props = defineProps<{
  node: api_node_col;
  //想了一下, 感觉没有用
  index: number;
}>();
const emits = defineEmits(["go", "onSelect"]);

//
const localConfigure = useLocalConfigureStore();
let mode: Ref<string> = ref(localConfigure.get("file_view_mode") ?? "detail");
const modeKey = localConfigure.listen(
  "file_view_mode",
  (v) => {
    mode.value = v;
    buildBtnDef(mode.value + '_' + (props.node.status ? 'enabled' : 'disabled'));
    // reloadOffset();
  }
);

// console.info(modeKey);
function setMode(mode: string) {
  localConfigure.set("file_view_mode", mode);
}

type BtnDef = {
  cls: string[],
  title: string,
  click?: (btn: BtnDef) => any,
  show?: true | ((btn: BtnDef) => boolean),
  active: boolean,
  sub?: BtnDef[],
};
const btnDef: Ref<BtnDef[]> = ref([]);
buildBtnDef(mode.value + '_' + (props.node.status ? 'enabled' : 'disabled'));

function buildBtnDef(key: string) {
  // console.info(key);
  switch (key) {
    case 'detail_enabled':
      btnDef.value = [
        {
          cls: ['sysIcon', 'sysIcon_download'],
          click: op_download,
          title: 'DL',
          show: (btn: BtnDef) => {
            return !!props.node.is_file
          },
          active: false,
        },
        {
          cls: ['sysIcon', 'sysIcon_edit'],
          click: op_rename,
          title: 'RN',
          show: true,
          active: false,
        },
        {
          cls: ['sysIcon', 'sysIcon_folderopen'],
          click: op_move,
          title: 'MV',
          show: true,
          active: false,
        },
        {
          cls: ['sysIcon', 'sysIcon_delete'],
          click: op_delete,
          title: 'DEL',
          show: true,
          active: false,
        },
        {
          cls: ['sysIcon', 'sysIcon_tag-o'],
          click: op_tag,
          title: 'TAG',
          show: true,
          active: false,
        },
        {
          cls: ['sysIcon', 'sysIcon_star-o'],
          click: op_toggle_favourite,
          title: 'FAV',
          show: true,
          active: (props.node.list_fav?.length ?? 0) > 0,
        },
        {
          cls: ['sysIcon', 'sysIcon_setting'],
          title: 'OP',
          show: true,
          active: false,
          sub: [
            {
              cls: ['sysIcon', 'sysIcon_tag-o'],
              click: op_imp_tag_eh,
              title: 'IMP EH TAG',
              show: true,
              active: false,
            },
            {
              cls: ['sysIcon', 'sysIcon_scan'],
              click: op_set_cover,
              title: 'COV',
              show: () => !!props.node.file?.cover?.path,
              active: false,
            },
            {
              cls: ['sysIcon', 'sysIcon_reload'],
              click: op_rebuild,
              title: 'RB',
              show: (btn: BtnDef) => {
                // console.info(props.node.is_file)
                return !!props.node.is_file
              },
              active: false,
            },
            {
              cls: ['sysIcon', 'sysIcon_reload'],
              click: op_recheck,
              title: 'CHK',
              show: (btn: BtnDef) => {
                // console.info(props.node.is_file)
                return !!props.node.is_file
              },
              active: false,
            },
          ],
        },
      ];
      break;
    case 'text_enabled':
      btnDef.value = [
        {
          cls: ['sysIcon', 'sysIcon_download'],
          click: op_download,
          title: 'DL',
          show: (btn: BtnDef) => {
            return !!props.node.is_file
          },
          active: false,
        },
        {
          cls: ['sysIcon', 'sysIcon_folderopen'],
          click: op_move,
          title: 'MV',
          show: true,
          active: false,
        },
        {
          cls: ['sysIcon', 'sysIcon_star-o'],
          click: op_toggle_favourite,
          title: 'FAV',
          show: true,
          active: (props.node.list_fav?.length ?? 0) > 0,
        },
        {
          cls: ['sysIcon', 'sysIcon_delete'],
          click: op_delete,
          title: 'DEL',
          show: true,
          active: false,
        },
        {
          cls: ['sysIcon', 'sysIcon_reload'],
          click: op_rebuild,
          title: 'RB',
          show: (btn: BtnDef) => {
            return !!props.node.is_file
          },
          active: false,
        },
        {
          cls: ['sysIcon', 'sysIcon_reload'],
          click: op_recheck,
          title: 'CHK',
          show: (btn: BtnDef) => {
            // console.info(props.node.is_file)
            return !!props.node.is_file
          },
          active: false,
        },
      ];
      break;
    case 'text_disabled':
    case 'detail_disabled':
      btnDef.value = [
        {
          cls: ['sysIcon', 'sysIcon_delete'],
          click: op_delete_forever,
          title: 'rDEL',
          show: true,
          active: false,
        },
        {
          cls: ['sysIcon', 'sysIcon_delete'],
          click: op_delete,
          title: 'REC',
          show: true,
          active: false,
        },
      ];
      break;
  }
}


const curDOM: Ref<HTMLElement | null> = ref(null);
onMounted(() => {
  if (curDOM.value)
    props.node._dom = curDOM.value;
  // reloadOffset();
  // window.addEventListener("resize", reloadOffset);
});
onUnmounted(() => {
  // window.removeEventListener("resize", reloadOffset);
});
//
// let renaming = ref(false);
// let tagging = ref(false);

function go(type: string, id?: number) {
  console.info("go", type, id);
  if (!id) return;
  emits("go", type, id);
}

function op_download() {
  let filePath = props.node.file?.raw?.path;
  if (!filePath) return;
  window.open(`${filePath}?filename=${props.node.title}`);
}

function op_move() {
  modalStore.set({
    title: `locator | move ${props.node.title} to:`,
    alpha: false,
    key: "",
    single: false,
    w: 400,
    h: 60,
    minW: 400,
    minH: 60,
    // h: 160,
    allow_resize: true,
    allow_move: true,
    allow_fullscreen: false,
    auto_focus: true,
    // text: "this is text",
    component: [
      {
        componentName: "locator",
        data: {
          query: {
            type: 'directory',
          } as api_file_list_req,
          call: async (node: api_node_col) => {
            console.info(node);
            const formData = new FormData();
            formData.set('node_id', `${props.node.id}`);
            formData.set('target_id', `${node.id}`);
            const res = await query<api_file_mov_req>('file/mov', formData);
            emits("go", 'reload');
          }
        },
      },
    ],
  });
  //
}

async function op_rename(btn: BtnDef) {
  if (btn.active) {
    console.info(props.node.title, props.node.description, props.node);
    // console.info(props.node);
    const formData = new FormData();
    formData.set('id', `${props.node.id}`);
    formData.set('title', props.node.title ?? '');
    formData.set('description', props.node.description ?? '');
    const res = await query<api_file_mov_resp>('file/mod', formData);
    emits("go", 'reload');
  }
  btn.active = !btn.active;
  props.node._renaming = btn.active;
  setTimeout(() => {
    let tDOM = curDOM.value?.querySelector('[contenteditable="true"]') as HTMLElement;
    tDOM.focus();
  }, 50)
}

async function op_tag(btn: BtnDef) {
  if (btn.active) {
    const tagSet = new Set<number>();
    if (props.node.tag)
      for (let i1 = 0; i1 < props.node.tag.length; i1++) {
        for (let i2 = 0; i2 < props.node.tag[i1].sub.length; i2++) {
          const id = props.node.tag[i1].sub[i2].id;
          if (id)
            tagSet.add(id);
        }
      }
    const formData = new FormData();
    formData.set('id_node', `${props.node.id}`);
    formData.set('tag_list', Array.from(tagSet).join(','));
    const res = await query<api_tag_list_resp>('tag/attach', formData);
  }
  //
  btn.active = !btn.active;
  props.node._tagging = btn.active;
}

function tag_del(tagId?: number) {
  if (!tagId) return;
  if (!props.node.tag) return;
  for (let i1 = 0; i1 < props.node.tag.length; i1++) {
    for (let i2 = 0; i2 < props.node.tag[i1].sub.length; i2++) {
      if (props.node.tag[i1].sub[i2].id !== tagId) continue;
      props.node.tag[i1].sub.splice(i2, 1);
      return;
    }
  }
}

async function tag_hint(text: string): Promise<api_tag_list_resp | false> {
  const formData = new FormData();
  formData.set('keyword', text);
  formData.set('size', '20');
  const res = await query<api_tag_list_resp>('tag/get', formData);
  return res;
}

function tag_add(item: api_tag_col) {
  // console.info(item);
  const curNode = props.node;
  if (!curNode.tag) curNode.tag = [];
  let curGroup = null;
  for (let i1 = 0; i1 < curNode.tag.length; i1++) {
    if (curNode.tag[i1].id !== item.id_group) continue;
    curGroup = curNode.tag[i1];
    break;
  }
  if (!curGroup) {
    curGroup = item.group as (col_tag_group & { sub: col_tag[]; });
    curGroup.sub = [];
    curNode.tag.push(curGroup);
  }
  curGroup.sub.push(item);
}

function tag_parse(item: api_tag_col) {
  if (!item) return '';
  // console.info(item);
  return `${item.group.title} : ${item.title}`;
}

function op_imp_tag_eh() {
}

async function op_set_cover(btn: BtnDef) {
  const formData = new FormData();
  formData.set('id', `${props.node.id}`);
  const res = await query<api_file_cover_resp>('file/cover', formData);
  return res;
}

async function op_toggle_favourite(btn: BtnDef) {
  const favGroupLs = await query<api_favourite_group_list_resp>("favourite_group/get", {});

  const favGroupOpts: { [key: string]: string } = {};
  if (favGroupLs) {
    favGroupLs.forEach((row) => {
      favGroupOpts[row.id ?? 0] = row.title ?? '';
    })
  }
  modalStore.set({
    title: `select fav group:`,
    alpha: false,
    key: "",
    single: false,
    w: 400,
    h: 150,
    minW: 400,
    minH: 150,
    // h: 160,
    allow_resize: true,
    allow_move: true,
    allow_fullscreen: false,
    auto_focus: true,
    // text: "this is text",
    form: [
      {
        type: "checkbox",
        label: "attach to:",
        key: "target_group",
        value: props.node.list_fav,
        options: favGroupOpts,
      },
    ],
    callback: {
      submit: async function (modal) {
        console.info(modal)
        const groupIdLs = modal.content.form[0].value.join(',');
        await query<api_favourite_attach_resp>("favourite/attach", {
          id_node: props.node.id,
          list_group: groupIdLs,
        });

      },
    },
  });
}

async function op_delete_forever() {
  const formData = new FormData();
  formData.set('id', `${props.node.id}`);
  const res = await query<api_file_delete_resp>('file/delete_forever', formData);
  emits('go', 'reload');
  return res;
}

async function op_delete() {
  const formData = new FormData();
  formData.set('id', `${props.node.id}`);
  const res = await query<api_file_delete_resp>('file/delete', formData);
  emits('go', 'reload');
  return res;
}

async function op_rebuild() {
  const formData = new FormData();
  formData.set('id', `${props.node.id}`);
  const res = await query<api_file_rebuild_resp>('file/rebuild', formData);
  // emits('go', 'reload');
  return res;
}


async function op_recheck() {
  const formData = new FormData();
  const idList = new Set<number>();
  for (const key in props.node.index_file_id) {
    idList.add(props.node.index_file_id[key] ?? 0);
  }
  if (!idList.size) return;
  formData.set('id_list', Array.from(idList).join(','));
  const res = await query<api_file_checksum_resp>('file/rehash', formData);
  // emits('go', 'reload');
  return res;
}

//双击会触发两次单击，按照m￥的理论只能自己做
//https://learn.microsoft.com/en-us/dotnet/desktop/winforms/input-mouse/how-to-distinguish-between-clicks-and-double-clicks?view=netdesktop-7.0
//但是好像。。。也没啥影响
let lastClick = (new Date()).valueOf();

async function op_dblclick(evt: MouseEvent) {
  console.info('op_dblclick', props.node.id, evt);
  // props.node.id
  go('node', props.node.id);
}

async function op_click(evt: MouseEvent) {
  // click事件放到fileView做，这边不处理了
  // console.info('op_click', props.node.id, evt);
  // console.info(((new Date()).valueOf() - lastClick) / 1000);
  // lastClick = (new Date()).valueOf();
  // emits("onSelect", evt, props.node);
}

</script>

<template>
  <div :class="['node_node', `mode_${mode}`,{select:node._selected}]"
       :data-index="index"
       :data-id="node.id"
       ref="curDOM"
  >
    <template v-if="mode === 'detail'">
      <div class="content">
        <template v-if="node.status">
          <div v-if="node.file?.cover" class="thumb"
               @dblclick="op_dblclick"
               @click="op_click"
          >
            <img :src="node.file?.cover.path"/>
          </div>
          <div v-else
               @dblclick="op_dblclick"
               @click="op_click"
               :class="['thumb', 'listIcon', `listIcon_file_${node.type}`]"
          ></div>
        </template>
        <template v-else>
          <div v-if="node.file?.cover" class="thumb">
            <img :src="node.file?.cover.path"/>
          </div>
          <div v-else
               :class="['thumb', 'listIcon', `listIcon_file_${node.type}`]"
          ></div>
        </template>
        <div class="meta">
          <template v-if="node.status">
            <p v-if="!node._renaming" class="title">{{ node.title }}</p>
            <!--            <p v-if="!renaming" class="title" @click="op_dblclick">{{ node.title }}</p>-->
            <content-editable
              v-else v-model="node.title"
              class="title editing"
              :auto-focus="true"
              @mousedown.stop
            ></content-editable>
            <p v-if="!node._renaming">{{ node.time_update }}</p>
            <p v-if="!node._renaming && node.description">{{ node.description }}</p>
            <content-editable
              v-if="node._renaming" v-model="node.description"
              class="editing"
              @mousedown.stop
            ></content-editable>
          </template>
          <template v-else>
            <p class="title">{{ node.title }}</p>
            <p><span v-for="crumb in node.crumb_node"> / {{ crumb.title }}</span></p>
            <p>{{ node.time_update }}</p>
            <p v-if="node.description">{{ node.description }}</p>
          </template>
          <section class="bar">
            <template v-for="btn in btnDef">
              <template v-if="btn.show && (btn.show===true ||btn.show(btn))">
                <template v-if="btn.sub">
                  <dl>
                    <dt :class="btn.active?btn.cls.concat(['active','btn']):btn.cls.concat(['btn'])">{{ btn.title }}</dt>
                    <dd>
                      <template v-for="btn in btn.sub">
                        <template v-if="btn.show && (btn.show===true ||btn.show(btn))">
                          <button :class="btn.active?btn.cls.concat(['active']):btn.cls" @click="btn.click?btn.click(btn):null">{{ btn.title }}</button>
                        </template>
                      </template>
                    </dd>
                  </dl>
                </template>
                <template v-else>
                  <button :class="btn.active?btn.cls.concat(['active']):btn.cls" @click="btn.click?btn.click(btn):null">{{ btn.title }}</button>
                </template>
              </template>
            </template>
          </section>
        </div>
      </div>
      <div v-if="!node._tagging && node.tag" class="tag_list">
        <dl v-for="group in node.tag">
          <dt>{{ group.title }}</dt>
          <dd v-for="tag in group.sub" @click="go('tag', tag?.id??0)">
            {{ tag.title }}
          </dd>
        </dl>
      </div>
      <div v-if="node._tagging" class="tag_list editing">
        <dl v-for="group in node.tag">
          <dt>{{ group.title }}</dt>
          <dd v-for="tag in group.sub" @click="tag_del(tag?.id??0)">
            <span>{{ tag.title }}</span>
            <span class="sysIcon sysIcon_delete"></span>
          </dd>
        </dl>
        <hinter
          :get-list="tag_hint"
          :submit="tag_add"
          :parse-text="tag_parse"
          @mousedown.stop
        ></hinter>
      </div>
    </template>
    <template v-else-if="mode === 'img'">
      <template v-if="node.status">
        <div v-if="node.file?.cover" class="thumb"
             @dblclick="op_dblclick"
             @click="op_click"
        >
          <img :src="node.file?.cover.path"/>
        </div>
        <div
          v-else
          :class="['thumb', 'listIcon', `listIcon_file_${node.type}`]"
          @dblclick="op_dblclick"
          @click="op_click"
        ></div>
        <!--        <p class="title" @click="op_dblclick">{{ node.title }}</p>-->
        <p class="title" :title="node.title">{{ node.title }}</p>
        <p>{{ node.time_update }}</p>
      </template>
      <template v-else>
        <div v-if="node.file?.cover" class="thumb">
          <img :src="node.file?.cover.path"/>
        </div>
        <div
          v-else
          :class="['thumb', 'listIcon', `listIcon_file_${node.type}`]"
        ></div>
        <p class="title" :title="node.title">{{ node.title }}</p>
        <p>{{ node.time_update }}</p>
      </template>
    </template>
    <template v-else-if="mode === 'text'">
      <p class="type"
         @dblclick="op_dblclick"
         @click="op_click"
      >
        <span
          :class="['thumb', 'listIcon', `listIcon_file_${node.type}`]"
        ></span>
        <span>{{ node.type }}</span>
      </p>
      <p class="title"
         @dblclick="op_dblclick"
         @click="op_click"
         :title="node.title"
      >{{ node.title }}</p>
      <!--        <p class="title" @click="op_dblclick">{{ node.title }}</p>-->
      <p class="time">{{ node.time_update }}</p>
      <section class="bar">
        <template v-for="btn in btnDef">
          <template v-if="btn.show && (btn.show===true ||btn.show(btn))">
            <template v-if="btn.sub">
              <template v-for="btn in btn.sub">
                <template v-if="btn.show && (btn.show===true ||btn.show(btn))">
                  <button :class="btn.active?btn.cls.concat(['active']):btn.cls" @click="btn.click?btn.click(btn):null">{{ btn.title }}</button>
                </template>
              </template>
            </template>
            <template v-else>
              <button :class="btn.active?btn.cls.concat(['active']):btn.cls" @click="btn.click?btn.click(btn):null">{{ btn.title }}</button>
            </template>
          </template>
        </template>
      </section>
    </template>
  </div>
</template>

<style scoped lang="scss">
.node_node {
  &:hover, &.select {
    background-color: map-get($colors, bk_active);
  }
}
.node_node.mode_detail {
  //  -webkit-column-break-after: avoid;
  //-webkit-column-break-before: avoid;
  -webkit-column-break-inside: avoid;
  //padding: 0 0 $fontSize * 0.5 0;
  //padding: 0 $fontSize * 0.5 $fontSize;
  width: $fontSize*25;
  padding: $fontSize * 0.5;
  display: block;
  $contentHeight: $fontSize * 5;
  .content {
    position: relative;
    display: flex;
    min-height: $contentHeight;
    .thumb {
      width: calc(25% - $fontSize * 0.5);
      padding: 0 $fontSize * 0.25;
      text-align: center;
      img {
        width: 100%;
        height: 100%;
        max-height: $contentHeight;
        object-fit: contain;
      }
    }
    .listIcon {
      line-height: $contentHeight;
      font-size: $contentHeight * 0.6;
    }
    .meta {
      width: 75%;
      p, div {
        word-break: break-all;
        white-space: pre-wrap;
        line-height: $fontSize*1.25;
      }
      .title {
        font-size: $fontSize;
        //line-height: $fontSize;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: map-get($colors, font);
        margin: 0 0 $fontSize * 0.5 0;
      }
      .editing {
        font-size: $fontSize;
        background-color: map-get($colors, bk_active);
        white-space: normal;
      }
      .bar {
        margin: $fontSize * 0.5 0 0 0;
      }
      color: map-get($colors, font_sub);
    }
    .bar {
      font-size: $fontSize * 0.75;
      line-height: $fontSize * 0.75;
      .sysIcon::before {
        margin-right: $fontSize*0.25;
      }
      button, dt {
        padding: $fontSize * 0.25;
        font-size: $fontSize * 0.75;
        line-height: $fontSize * 0.75;
        //        margin: 0 $fontSize * 0.1 0;
      }
      dl {
        display: inline-block;
        //position: relative;
        //z-index: 1;
        &:hover {
          dd {
            display: block;
          }
        }
        dt {
          display: inline-block;
        }
        dd {
          //display: block;
          display: none;
          position: absolute;
          z-index: 10;
          button {
            display: block;
            text-align: left;
            width: max-content;
          }
        }
      }
    }
  }
  .tag_list {
    width: 100%;
    font-size: $fontSize;
    line-height: $fontSize * 1.25;
    dl {
      margin-top: $fontSize * 0.25;
    }
    dt,
    dd {
      display: inline-block;
    }
    dd {
      margin-left: $fontSize * 0.5;
      color: map-get($colors, font_sub);
      word-break: break-word;
      max-width: 90%;
      overflow: hidden;
      text-overflow: ellipsis;
      &:hover {
        color: map-get($colors, font);
      }
    }
    dt::after {
      content: " :";
    }
  }
  p {
    font-size: $fontSize;
  }
}
.node_node.mode_text {
  display: table-row;
  width: 100%;
  font-size: $fontSize;
  p {
    display: table-cell;
    line-height: $fontSize*1.25;
    vertical-align: middle;
  }
  .type {
    //span:first-child {
    //  font-size: $fontSize * 2;
    //}
    span {
      margin-right: $fontSize * 0.5;
    }
    //  width: 10%;
  }
  .title {
    //    width: 30%;
  }
  .bar {
    text-align: right;
    white-space: nowrap;
  }
}
.node_node.mode_img {
  text-align: center;
  width: $fontSize*8;
  .thumb {
    padding: 0 $fontSize * 0.5;
    height: $fontSize * 10;
    line-height: $fontSize * 10;
    font-size: $fontSize * 6;
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
  p {
    margin-top: $fontSize * 0.25;
    font-size: $fontSize * 0.8;
    color: map-get($colors, font_sub);
    //word-break: break-all;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .title {
    font-size: $fontSize;
  }
  &:hover .title, &.select .title {
    color: map-get($colors, font);
  }
  //margin: 0 0 $fontSize * 0.5 0;
  padding: $fontSize * 0.5;
  //margin: $fontSize * 0.5;
  -webkit-column-break-inside: avoid;
}
.tag_list.editing {
  .sysIcon {
    padding-left: $fontSize*0.25;
  }
  dt, dd, .hinter {
    margin-top: $fontSize*0.25;
  }
}
</style>
