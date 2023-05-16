<script setup lang="ts">
import {useLocalConfigureStore} from "@/stores/localConfigure";
import {onMounted, type Ref, ref} from "vue";
import type {
  api_tag_col, api_node_col, api_file_list_req, api_file_mov_req,
  api_tag_list_resp, api_tag_list_req, api_file_mov_resp, api_file_cover_req,
  api_file_delete_req, api_file_delete_resp
} from "../../../share/Api";
import {useModalStore} from "@/stores/modalStore";
import {query} from "@/Helper";
import ContentEditable from "@/components/ContentEditable.vue";
import Hinter from "@/components/Hinter.vue";
import GenFunc from "../../../share/GenFunc";
import type {col_tag, col_tag_group} from "../../../share/Database";
// import type {col_tag} from "../../../share/Database";
// import {api_tag_col} from "../../../share/Api";

const modalStore = useModalStore();
const props = defineProps<{
  node: api_node_col;
  //想了一下, 感觉没有用
  index: number;
}>();
const emits = defineEmits(["go"]);
//
const localConfigure = useLocalConfigureStore();
let mode: Ref<string> = ref(localConfigure.get("file_view_mode") ?? "detail");
const modeKey = localConfigure.listen(
  "file_view_mode",
  (v) => (mode.value = v)
);

// console.info(modeKey);
function setMode(mode: string) {
  localConfigure.set("file_view_mode", mode);
}

//
let renaming = ref(false);
let tagging = ref(false);

function go(type: string, id?: number) {
  // console.info("go", type, id);
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
    resizable: true,
    movable: false,
    fullscreen: false,
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

async function op_rename() {
  if (renaming) {
    console.info(props.node.title, props.node.description, props.node);
    // console.info(props.node);
    const formData = new FormData();
    formData.set('id', `${props.node.id}`);
    formData.set('title', props.node.title ?? '');
    formData.set('description', props.node.description ?? '');
    const res = await query<api_file_mov_resp>('file/mod', formData);
    emits("go", 'reload');
  }
  renaming.value = !renaming.value;
}

async function op_tag() {
  if (tagging.value) {
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
  tagging.value = !tagging.value;
}

function tag_del(tagId: number) {
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

async function op_set_cover() {
  const formData = new FormData();
  formData.set('id', `${props.node.id}`);
  const res = await query<api_file_cover_req>('file/cover', formData);
  return res;
}

function op_set_favourite() {
}

function op_delete_forever() {
}

async function op_delete() {
  const formData = new FormData();
  formData.set('id', `${props.node.id}`);
  const res = await query<api_file_delete_req>('file/delete', formData);
  emits('go', 'reload');
  return res;
}

</script>

<template>
  <div :class="['node_node', `mode_${mode}`]" :data-index="index">
    <template v-if="mode === 'detail'">
      <div class="content">

        <template v-if="node.status">
          <div v-if="node.file?.cover" class="thumb" @click="go('node', node.id)">
            <img :src="node.file?.cover.path"/>
          </div>
          <div v-else
               @click="go('node', node.id)"
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
            <p v-if="!renaming" class="title" @click="go('node', node.id)">{{ node.title }}</p>
            <content-editable
              v-else v-model="node.title"
              class="title editing"
            ></content-editable>
            <p v-if="!renaming">{{ node.time_update }}</p>
            <p v-if="!renaming && node.description">{{ node.description }}</p>
            <content-editable
              v-if="renaming" v-model="node.description"
              class="editing"
            ></content-editable>
          </template>
          <template v-else>
            <p class="title">{{ node.title }}</p>
            <p><span v-for="crumb in node.crumb_node"> / {{ crumb.title }}</span></p>
            <p>{{ node.time_update }}</p>
            <p v-if="node.description">{{ node.description }}</p>
          </template>
          <p class="bar">
            <!---->
            <template v-if="node.status">
              <button
                v-if="node.is_file"
                :class="['sysIcon', 'sysIcon_download']"
                @click="op_download"
              >
                DL
              </button>
              <!-- <button
              v-if="!node.is_file"
              :class="['sysIcon', 'sysIcon_stack']"
              @click="go"
            >
              IN
            </button> -->
              <button
                :class="['sysIcon', 'sysIcon_edit', { active: renaming }]"
                @click="op_rename"
              >
                RN
              </button>
              <button :class="['sysIcon', 'sysIcon_folderopen']" @click="op_move">
                MV
              </button>
              <button
                :class="['sysIcon', 'sysIcon_tag-o', { active: tagging }]"
                @click="op_tag"
              >
                TAG
              </button>
              <button
                :class="['sysIcon', 'sysIcon_tag-o']"
                @click="op_imp_tag_eh"
              >
                IMP EH TAG
              </button>
              <button
                v-if="node.file?.cover?.path"
                :class="['sysIcon', 'sysIcon_scan']"
                @click="op_set_cover"
              >
                COV
              </button>
              <button
                :class="['sysIcon', 'sysIcon_star-o', { active: node.is_fav }]"
                @click="op_set_favourite"
              >
                FAV
              </button>
              <!--        <button :class="['sysIcon','sysIcon_link',]" @click="op_share">SHR</button>-->

              <button :class="['sysIcon', 'sysIcon_delete']" @click="op_delete">
                DEL
              </button>
            </template>
            <template v-else>
              <button
                :class="['sysIcon', 'sysIcon_delete']"
                @click="op_delete_forever"
              >
                rDEL
              </button>
              <button :class="['sysIcon', 'sysIcon_delete']" @click="op_delete">
                REC
              </button>
            </template>
          </p>
        </div>
      </div>
      <div v-if="!tagging && node.tag" class="tag_list">
        <dl v-for="group in node.tag">
          <dt>{{ group.title }}</dt>
          <dd v-for="tag in group.sub" @click="go('tag', tag.id)">
            {{ tag.title }}
          </dd>
        </dl>
      </div>
      <div v-if="tagging" class="tag_list editing">
        <dl v-for="group in node.tag">
          <dt>{{ group.title }}</dt>
          <dd v-for="tag in group.sub" @click="tag_del(tag.id)">
            <span>{{ tag.title }}</span>
            <span class="sysIcon sysIcon_delete"></span>
          </dd>
        </dl>
        <hinter
          :get-list="tag_hint"
          :submit="tag_add"
          :parse-text="tag_parse"
        ></hinter>
      </div>
    </template>
    <template v-else-if="mode === 'img'">
      <template v-if="node.status">
        <div v-if="node.file?.cover" class="thumb" @click="go('node', node.id)">
          <img :src="node.file?.cover.path"/>
        </div>
        <div
          v-else
          :class="['thumb', 'listIcon', `listIcon_file_${node.type}`]"
          @click="go('node', node.id)"
        ></div>
        <p class="title" @click="go('node', node.id)">{{ node.title }}</p>
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
        <p class="title">{{ node.title }}</p>
        <p>{{ node.time_update }}</p>
      </template>
    </template>
    <template v-else-if="mode === 'text'">
      <template v-if="node.status">
        <p class="type" @click="go('node', node.id)">
        <span
          :class="['thumb', 'listIcon', `listIcon_file_${node.type}`]"
        ></span>
          <span>{{ node.type }}</span>
        </p>
        <p class="title" @click="go('node', node.id)">{{ node.title }}</p>
        <p class="time">{{ node.time_update }}</p>
        <p class="bar">
          <!---->
          <button
            v-if="node.is_file"
            :class="['sysIcon', 'sysIcon_download']"
            @click="op_download"
          >
            DL
          </button>
          <!-- <button
              v-if="!node.is_file"
              :class="['sysIcon', 'sysIcon_stack']"
              @click="go"
            >
              IN
            </button> -->
          <button
            :class="['sysIcon', 'sysIcon_edit', { active: renaming }]"
            @click="op_rename"
          >
            RN
          </button>
          <button :class="['sysIcon', 'sysIcon_folderopen']" @click="op_move">
            MV
          </button>
          <button
            :class="['sysIcon', 'sysIcon_tag-o', { active: tagging }]"
            @click="op_tag"
          >
            TAG
          </button>
          <button :class="['sysIcon', 'sysIcon_tag-o']" @click="op_imp_tag_eh">
            IMP EH TAG
          </button>
          <button
            v-if="node.file?.cover?.path"
            :class="['sysIcon', 'sysIcon_scan']"
            @click="op_set_cover"
          >
            COV
          </button>
          <button
            :class="['sysIcon', 'sysIcon_star-o', { active: node.is_fav }]"
            @click="op_set_favourite"
          >
            FAV
          </button>
          <!--        <button :class="['sysIcon','sysIcon_link',]" @click="op_share">SHR</button>-->
          <template v-if="node.status">
            <button :class="['sysIcon', 'sysIcon_delete']" @click="op_delete">
              DEL
            </button>
          </template>
          <template v-else>
            <button
              :class="['sysIcon', 'sysIcon_delete']"
              @click="op_delete_forever"
            >
              rDEL
            </button>
            <button :class="['sysIcon', 'sysIcon_delete']" @click="op_delete">
              REC
            </button>
          </template>
        </p>
      </template>
      <template v-else>
        <p class="type">
        <span
          :class="['thumb', 'listIcon', `listIcon_file_${node.type}`]"
        ></span>
          <span>{{ node.type }}</span>
        </p>
        <p><span v-for="crumb in node.crumb_node"> / {{ crumb.title }}</span></p>
        <p class="title">{{ node.title }}</p>
        <p class="time">{{ node.time_update }}</p>
        <p class="bar">
          <!---->
          <template v-if="node.status">
            <button
              v-if="node.is_file"
              :class="['sysIcon', 'sysIcon_download']"
              @click="op_download"
            >
              DL
            </button>
            <!-- <button
                v-if="!node.is_file"
                :class="['sysIcon', 'sysIcon_stack']"
                @click="go"
              >
                IN
              </button> -->
            <button
              :class="['sysIcon', 'sysIcon_edit', { active: renaming }]"
              @click="op_rename"
            >
              RN
            </button>
            <button :class="['sysIcon', 'sysIcon_folderopen']" @click="op_move">
              MV
            </button>
            <button
              :class="['sysIcon', 'sysIcon_tag-o', { active: tagging }]"
              @click="op_tag"
            >
              TAG
            </button>
            <button :class="['sysIcon', 'sysIcon_tag-o']" @click="op_imp_tag_eh">
              IMP EH TAG
            </button>
            <button
              v-if="node.file?.cover?.path"
              :class="['sysIcon', 'sysIcon_scan']"
              @click="op_set_cover"
            >
              COV
            </button>
            <button
              :class="['sysIcon', 'sysIcon_star-o', { active: node.is_fav }]"
              @click="op_set_favourite"
            >
              FAV
            </button>
            <!--        <button :class="['sysIcon','sysIcon_link',]" @click="op_share">SHR</button>-->

            <button :class="['sysIcon', 'sysIcon_delete']" @click="op_delete">
              DEL
            </button>
          </template>
          <template v-else>
            <button
              :class="['sysIcon', 'sysIcon_delete']"
              @click="op_delete_forever"
            >
              rDEL
            </button>
            <button :class="['sysIcon', 'sysIcon_delete']" @click="op_delete">
              REC
            </button>
          </template>
        </p>
      </template>
    </template>
  </div>
</template>

<style scoped lang="scss">
.node_node {
  &:hover, .select {
    background-color: mkColor(map-get($colors, bk), 4);
  }
}
.node_node.mode_detail {
  //  -webkit-column-break-after: avoid;
  //-webkit-column-break-before: avoid;
  -webkit-column-break-inside: avoid;
  //padding: 0 0 $fontSize * 0.5 0;
  //padding: 0 $fontSize * 0.5 $fontSize;
  padding: $fontSize * 0.5;
  display: block;
  $contentHeight: $fontSize * 5;
  .content {
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
        color: map-get($colors, "font");
        margin: 0 0 $fontSize * 0.5 0;
      }
      .editing {
        font-size: $fontSize;
        background-color: mkColor(map-get($colors, bk), 4);
      }
      .bar {
        margin: $fontSize * 0.5 0 0 0;
      }
      color: map-get($colors, "font_sub");
    }
    .bar {
      font-size: $fontSize * 0.8;
      line-height: $fontSize * 0.8;
      button {
        padding: $fontSize * 0.2;
        font-size: $fontSize * 0.8;
        line-height: $fontSize * 0.8;
        //        margin: 0 $fontSize * 0.1 0;
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
      color: map-get($colors, "font_sub");
      word-break: break-word;
      max-width: 90%;
      overflow: hidden;
      text-overflow: ellipsis;
      &:hover {
        color: map-get($colors, "font");
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
  }
}
.node_node.mode_img {
  text-align: center;
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
    color: map-get($colors, "font_sub");
    //word-break: break-all;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .title {
    font-size: $fontSize;
  }
  &:hover .title {
    color: map-get($colors, "font");
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
