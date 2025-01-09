<script setup lang="ts">
import {useLocalConfigureStore} from "@/stores/localConfigure";
import {onMounted, onUnmounted, type Ref, ref} from "vue";
import type {api_node_col, api_tag_col, api_tag_list_resp} from "../../../share/Api";
import {useModalStore} from "@/stores/modalStore";
import {query} from "@/Helper";
import ContentEditable from "@/components/ContentEditable.vue";
import Hinter from "@/components/Hinter.vue";
import type {col_tag, col_tag_group} from "../../../share/Database";
import {opFunctionModule} from "@/FileViewHelper";
import Rater from "@/components/Rater.vue";
import GenFunc from "../GenFunc";
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
    // buildBtnDef(mode.value + '_' + (props.node.status ? 'enabled' : 'disabled'));
    // reloadOffset();
  }
);

// console.info(modeKey);
function setMode(mode: string) {
  localConfigure.set("file_view_mode", mode);
}


const curDOM: Ref<HTMLElement | null> = ref(null);
onMounted(() => {
  // console.info(curDOM.value);
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


async function op_dblclick(evt: MouseEvent) {
  console.info('op_dblclick', props.node.id, evt);
  // props.node.id
  go('node', props.node.id);
}

//双击会触发两次单击，按照m￥的理论只能自己做
//dblclick不能覆盖pointer的情况，所以还是要单独实现
//https://learn.microsoft.com/en-us/dotnet/desktop/winforms/input-mouse/how-to-distinguish-between-clicks-and-double-clicks?view=netdesktop-7.0

let lastClick = (new Date()).valueOf();

async function op_click(evt: PointerEvent) {
  // console.info('op_click', evt);
  const now = (new Date()).valueOf();
  const delta = now - lastClick;
  lastClick = now;
  // return;
  // console.info(evt);
  switch (evt?.pointerType) {
    default:
    case 'mouse':
    case 'pen':
      break;
    case 'touch':
      if (delta < 300)
        await op_dblclick(evt);
      break;
  }
  // click事件放到fileView做，这边不处理了
  // console.info('op_click', props.node.id, evt);
  // console.info(((new Date()).valueOf() - lastClick) / 1000);
  // lastClick = (new Date()).valueOf();
  // emits("onSelect", evt, props.node);
}

function emp(e: Event) {
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
          <div v-if="node.file_index?.cover && node._in_screen" class="thumb"
               @dblclick="op_dblclick"
               @click="op_click"
          >
            <img :src="node.file_index?.cover.path"/>
          </div>
          <div v-else
               @dblclick="op_dblclick"
               @click="op_click"
               :class="['thumb', 'listIcon', `listIcon_file_${node.type}`]"
          ></div>
        </template>
        <template v-else>
          <div v-if="node.file_index?.cover && node._in_screen" class="thumb">
            <img :src="node.file_index?.cover.path"/>
          </div>
          <div v-else
               :class="['thumb', 'listIcon', `listIcon_file_${node.type}`]"
          ></div>
        </template>
        <div class="meta">
          <template v-if="node.status">
            <template v-if="node._renaming">
              <content-editable
                v-model="node.title"
                class="title editing"
                :auto-focus="true"
                @mousedown.stop="emp"
                @pointerdown.stop="emp"
              ></content-editable>
              <content-editable
                v-model="node.description"
                class="editing"
                @mousedown.stop="emp"
                @pointerdown.stop="emp"
              ></content-editable>
              <button :class="['active','sysIcon', 'sysIcon_save']" @click="opFunctionModule.op_rename(node)">SAVE</button>
            </template>
            <template v-else>
              <template v-if="node.type==='directory'">
                <p :class="['title','listIcon', `listIcon_file_${node.type}`,]" :title="node.title">{{ node.title }}</p>
              </template>
              <template v-else>
                <p :class="['title',]" :title="node.title">{{ node.title }}</p>
              </template>
              <!--            <p class="title" @click="op_dblclick">{{ node.title }}</p>-->
              <p class="time">
                <rater :node="node" v-model="node.rate"></rater>
                <span :title="`C:${node.time_create}\r\nU:${node.time_update}`">{{ (node.time_create ?? '').substring(0, 10) }}</span>
              </p>
              <p v-if="node.is_file">{{ GenFunc.kmgt(node?.file_index?.raw?.size ?? 0, 2) }}B {{ node.description }}</p>
              <p v-else>{{ node.description }}</p>
            </template>
          </template>
          <template v-else>
            <template v-if="node.type==='directory'">
              <p :class="['title','listIcon', `listIcon_file_directory`,]" :title="node.title">{{ node.title }}</p>
            </template>
            <template v-else>
              <p :class="['title',]" :title="node.title">{{ node.title }}</p>
            </template>
            <p><span v-for="(crumb,index) in node.crumb_node" :key="'FI_CR_'+node.id+'_'+index"> / {{ crumb.title }}</span></p>
            <p>{{ node.time_create }}</p>
            <p v-if="node.is_file">{{ GenFunc.kmgt(node?.file_index?.raw?.size ?? 0, 2) }}B {{ node.description }}</p>
            <p v-else>{{ node.description }}</p>
          </template>
        </div>
      </div>
      <div v-if="!node._tagging && node.tag" class="tag_list">
        <dl v-for="group in node.tag" :key="'FI_TG_'+node.id+'_'+group.id">
          <dt>{{ group.title }}</dt>
          <dd v-for="tag in group.sub" :key="'FI_TG_'+node.id+'_'+group.id+'_'+tag.id" @click="go('tag', tag?.id??0)">
            {{ tag.title }}
          </dd>
        </dl>
      </div>
      <div v-if="node._tagging" class="tag_list editing">
        <dl v-for="group in node.tag" :key="'FI_TG_'+node.id+'_'+group.id">
          <dt>{{ group.title }}</dt>
          <dd v-for="tag in group.sub" :key="'FI_TG_'+node.id+'_'+group.id+'_'+tag.id" @click="tag_del(tag?.id??0)">
            <span>{{ tag.title }}</span>
            <span class="sysIcon sysIcon_delete"></span>
          </dd>
        </dl>
        <div class="tag_hinter_bar">
          <hinter
            :get-list="tag_hint"
            :submit="tag_add"
            :parse-text="tag_parse"
            @mousedown.stop="emp"
            @pointerdown.stop="emp"
          ></hinter>
          <button :class="['active','sysIcon', 'sysIcon_save']" @click="opFunctionModule.op_tag(node)">SAVE</button>
        </div>
      </div>
    </template>
    <template v-else-if="mode === 'img'">
      <template v-if="node.status">
        <div v-if="node.file_index?.cover && node._in_screen" class="thumb"
             @dblclick="op_dblclick"
             @click="op_click"
        >
          <img :src="node.file_index?.cover.path"/>
        </div>
        <div
          v-else
          :class="['thumb', 'listIcon', `listIcon_file_${node.type}`]"
          @dblclick="op_dblclick"
          @click="op_click"
        ></div>
        <!--        <p class="title" @click="op_dblclick">{{ node.title }}</p>-->
        <template v-if="node.type==='directory'">
          <p :class="['title','listIcon', `listIcon_file_${node.type}`,]" :title="node.title">{{ node.title }}</p>
        </template>
        <template v-else>
          <p :class="['title',]" :title="node.title">{{ node.title }}</p>
        </template>
        <!--        <p class="title" :title="node.title">{{ node.title }}</p>-->
        <!--        <p>{{ node.time_create }}</p>-->
      </template>
      <template v-else>
        <div v-if="node.file_index?.cover && node._in_screen" class="thumb">
          <img :src="node.file_index?.cover.path"/>
        </div>
        <div
          v-else
          :class="['thumb', 'listIcon', `listIcon_file_${node.type}`]"
        ></div>
        <template v-if="node.type==='directory'">
          <p :class="['title','listIcon', `listIcon_file_${node.type}`,]" :title="node.title">{{ node.title }}</p>
        </template>
        <template v-else>
          <p :class="['title',]" :title="node.title">{{ node.title }}</p>
        </template>
        <!--        <p class="title" :title="node.title">{{ node.title }}</p>-->
        <!--        <p>{{ node.time_create }}</p>-->
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
      <p class="time">{{ node.time_create }}</p>
    </template>
  </div>
</template>

<style scoped lang="scss">
.node_node {
  //touch-action: none;
  &:hover, &.select {
    background-color:  map.get($colors, bk_active);
  }
}
.node_node.mode_detail {
  //  -webkit-column-break-after: avoid;
  //-webkit-column-break-before: avoid;
  -webkit-column-break-inside: avoid;
  //padding: 0 0 $fontSize * 0.5 0;
  //padding: 0 $fontSize * 0.5 $fontSize;
  width: $fontSize*20;
  padding: $fontSize * 0.5;
  display: block;
  $contentHeight: $fontSize * 5;
  .content {
    position: relative;
    display: flex;
    min-height: $contentHeight;
    .thumb {
      width: calc(25% - $fontSize * 0.5);
      padding: 0 $fontSize * 0.5 0 $fontSize * 0.25;
      text-align: center;
      img {
        width: 100%;
        height: 100%;
        max-height: $contentHeight;
        object-fit: cover;
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
        margin: 0 0 $fontSize * 0.5 0;
      }
      p {
        @include multiLineWrap(4);
      }
      .title {
        //&.listIcon {
        //background-color:  map.get($colors, bar_meta);
        //}
        &.listIcon::before {
          padding-right: $fontSize*0.5;
        }
        font-size: $fontSize;
        //line-height: $fontSize;
        white-space: normal;
        overflow: hidden;
        text-overflow: ellipsis;
        color:  map.get($colors, font);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
      .editing {
        font-size: $fontSize;
        background-color:  map.get($colors, bk_active);
        white-space: normal;
      }
      .bar {
        margin: $fontSize * 0.5 0 0 0;
      }
      .time {
        width: 100%;
        > * {
          width: 50%;
        }
        > :first-child {
          margin-right: $fontSize*0.5;
        }
      }
      color:  map.get($colors, font_sub);
      .sysIcon::before {
        margin-right: $fontSize*0.25;
      }
    }
    .bar {
      font-size: $fontSize * 0.75;
      line-height: $fontSize * 0.75;
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
  button {
    padding: $fontSize * 0.25;
    font-size: $fontSize * 0.75;
    line-height: $fontSize * 0.75;
    //        margin: 0 $fontSize * 0.1 0;
  }
  button.sysIcon::before {
    margin-right: $fontSize*0.25;
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
      color:  map.get($colors, font_sub);
      word-break: break-all;
      max-width: 90%;
      //overflow: hidden;
      //text-overflow: ellipsis;
      &:hover {
        color:  map.get($colors, font);
      }
    }
    dt::after {
      content: " :";
    }
    .tag_hinter_bar {
      //vertical-align: top;
      .hinter, > button {
        vertical-align: top;
      }
      .hinter {
        width: calc(100% - 3.5 * $fontSize);
        display: inline-block;
      }
      > button {
        display: inline-block;
        width: $fontSize*3.5;
      }
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
    padding: 0 $fontSize * 0.25;
    height: $fontSize * 8;
    line-height: $fontSize * 8;
    font-size: $fontSize * 5;
    width: calc(100% - $fontSize * 0.5);
    aspect-ratio: 1;
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
  p {
    margin-top: $fontSize * 0.2;
    font-size: $fontSize * 0.75;
    line-height: $fontSize;
    color:  map.get($colors, font_sub);
    //word-break: break-all;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .title {
    font-size: $fontSize*0.9;
    &.listIcon::before {
      padding-right: $fontSize*0.5;
    }
  }
  &:hover .title, &.select .title {
    color:  map.get($colors, font);
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
  dt, dd, .tag_hinter_bar {
    margin-top: $fontSize*0.25;
  }
}
</style>
