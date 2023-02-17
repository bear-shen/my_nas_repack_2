<script setup lang="ts">
import {useLocalConfigureStore} from "@/stores/localConfigure";
import {onMounted, type Ref, ref} from "vue";
import type {api_node_col, api_file_list_req, api_file_rename_resp, api_file_rename_req} from "../../../share/Api";
import {useModalStore} from "@/stores/modalStore";
import {query} from "@/Helper";

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
let renaming = false;
let tagging = false;

function go(type: string, id?: number) {
  // console.info("go", type, id);
  if (!id) return;
  emits("go", type, id);
}

function op_download() {
}

function op_rename() {
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
            const res = await query<api_file_rename_resp>('file/mov', formData);
          }
        },
      },
    ],
  });
  //
}

function op_tag() {
}

function op_imp_tag_eh() {
}

function op_set_cover() {
}

function op_set_favourite() {
}

function op_delete_forever() {
}

function op_delete() {
}
</script>

<template>
  <div :class="['node_node', `mode_${mode}`]" :data-index="index">
    <template v-if="mode == 'detail'">
      <div class="content">
        <div v-if="node.file?.cover" class="thumb" @click="go('node', node.id)">
          <img :src="node.file?.cover.path"/>
        </div>
        <div
          v-else
          @click="go('node', node.id)"
          :class="['thumb', 'listIcon', `listIcon_file_${node.type}`]"
        ></div>
        <div class="meta">
          <p class="title" @click="go('node', node.id)">{{ node.title }}</p>
          <p>{{ node.time_update }}</p>
          <p v-if="node.description">{{ node.description }}</p>
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
        </div>
      </div>
      <div v-if="node.tag" class="tag_list">
        <dl v-for="group in node.tag">
          <dt>{{ group.title }}</dt>
          <dd v-for="tag in group.sub" @click="go('tag', tag.id)">
            {{ tag.title }}
          </dd>
        </dl>
      </div>
    </template>
    <template v-else-if="mode == 'img'">
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
    <template v-else-if="mode == 'text'">
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
  </div>
</template>

<style scoped lang="scss">
.node_node.mode_detail {
  //  -webkit-column-break-after: avoid;
  //-webkit-column-break-before: avoid;
  -webkit-column-break-inside: avoid;
  //padding: 0 0 $fontSize * 0.5 0;
  padding: 0 $fontSize * 0.5 $fontSize;
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
      .title {
        font-size: $fontSize;
        line-height: $fontSize;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: map-get($colors, "font");
      }
      .title {
        margin: 0 0 $fontSize * 0.5 0;
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
      white-space: nowrap;
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
  margin: 0 0 $fontSize * 0.5 0;
  -webkit-column-break-inside: avoid;
}
</style>
