import Config from "../ServerConfig";
import * as fs from "fs/promises";

const util = require('util');
const exec = util.promisify(require('child_process').exec);

type ffMeta = {
    format: {
        filename: string;
        format_name: string;
        format_long_name: string;
        size: string;
        duration: string;//a/v
        bit_rate: string;//a/v
    };
    streams: {
        index: number;
        codec_name: string;
        codec_long_name: string;
        profile: string;
        codec_type: string;
        width: number;
        height: number;
        level: number;
        tags: {
            language: string;
            title: string;
        };
    }[];
};

const execMask = {
    resource: 'resource',
    target: 'target',
    program: '.\\ffmpeg.exe',
};

const limitation = {
    cover: {
        max_length: 640,
        allow_size: 1024 * 512,
        allow_container: ['jpg', 'jpeg', 'image2', 'png', 'gif', 'webp',],
        ff_encoder: '-c:v webp -quality 65',
    },
    preview: {
        max_length: 1280,
        allow_size: 1024 * 1024,
        allow_container: ['jpg', 'jpeg', 'image2', 'png', 'gif', 'webp',],
        ff_encoder: '-c:v webp -quality 75',
    },
    image: {
        max_length: 2560,
        allow_size: 1024 * 1024 * 4,
        allow_container: ['jpg', 'jpeg', 'image2', 'png', 'gif', 'webp',],
        ff_encoder: '-c:v webp -quality 80',
    },
    video: {
        length: 1920,
        length_small: 1440,
        format: 'mp4',
        allow_codec: ['vp8', 'vp9', 'h264', 'hevc', 'av1', 'vp10',],
        // allow_rate: 4000 * 1000,
        allow_rate: 1024 * 1024 * 20,
        allow_container: ['mp4', 'ogg', 'webm', 'm4a',],
        // @todo 这个处理起来太麻烦了。。。反正webdav做好了，手动处理吧
        priority_kw_audio: [
            'cht', 'chs', 'chin', 'zh-', '中',
            'jpn', 'jps', 'japan', 'jp', '日',
            'us', 'en', '英',
        ],
        priority_kw_subtitle: [
            'cht', 'chs', 'chin', 'zh-', '中',
            'jpn', 'jps', 'japan', 'jp', '日',
            'us', 'en', '英',
        ],
    },
    audio: {
        quality: 1.5,  //+- 110
        format: 'aac',
        codec_lib: 'aac',
        allow_codec: ['flac', 'mp3', 'aac', 'wav',],
        allow_container: ['flac', 'mp3', 'aac', 'wav',],
        // allow_rate: 120 * 1000,
        allow_rate: 1024 * 1024,
    },
    subtitle: {
        format: 'vtt',
    },
};

async function loadMeta(path: string): Promise<ffMeta> {
    let meta;
    try {
        // await fs.stat(path);
        const vidProbe = `ffprobe -v quiet -hide_banner -print_format json -show_format -show_streams -i '${path}'`;// > '${root}/dev/${path}.json'
        const {stdout, stderr} = await exec(vidProbe);
        // console.info(stdout, stderr);
        meta = JSON.parse(stdout);
    } catch (e: any) {
        console.info((e as Error).name, (e as Error).message,);
    }
    return meta;
}

async function subtitleStr(meta: ffMeta): Promise<string | boolean | null> {
    const procStr = `{program} -hide_banner -hwaccel auto -y -i '{resource}' '{target}'`;
    return procStr;
}

async function videoStr(meta: ffMeta): Promise<string | boolean | null> {

    return;
}

async function audioStr(meta: ffMeta): Promise<string | boolean | null> {
    return;
}

async function imageStr(meta: ffMeta, level: 'cover' | 'preview' | 'image'): Promise<string | boolean | null> {
    /**
     * @see FFmpeg-master\doc\codecs.texi
     * Set encoder codec profile. Default value is @samp{unknown}. Encoder specific
     * profiles are documented in the relevant encoder documentation.
     *
     * @item level @var{integer} (@emph{encoding,audio,video})
     *
     * @see FFmpeg-master\libavcodec\avcodec.h
     *  level
     *  - encoding: Set by user.
     *  - decoding: Set by libavcodec.
     * int
     * level;
     * #define
     * FF_LEVEL_UNKNOWN - 99
     *
     * 基本图像都是-99
     *
     * stream=1
     *      codec_type!=audio
     *          image
     * else
     *      level=-99
     *          audio
     *      else
     *          video
     * */
    const imgConf = limitation[level];
    let tranType = false;
    let tranSize = false;
    let tranLength = false;
    let tranStreams = false;
    let hasAudio = false;//作为视频截图的判定（默片取0帧）
    let hasImage = false;
    //
    let w = 0;
    let h = 0;
    let maxLen = 0;
    let duration = 0;
    let ss = 0;
    //
    if (parseInt(meta.format.size) > imgConf.allow_size) {
        console.info(meta.format.size, imgConf.allow_size);
        tranSize = true;
    }
    //
    let noTranType = false;
    imgConf.allow_container.forEach((type) => {
        if (meta.format.format_name.indexOf(type) !== -1) {
            noTranType = true;
        }
    })
    tranType = !noTranType;
    //
    if (meta.streams.length > 1) {
        tranStreams = true;
    }
    for (let i1 = 0; i1 < meta.streams.length; i1++) {
        if (meta.streams[i1].codec_type != 'audio') {
            hasAudio = true;
        }
    }
    for (let i1 = 0; i1 < meta.streams.length; i1++) {
        if (meta.streams[i1].codec_type != 'video') {
            continue;
        }
        if (meta.streams[i1].level == -99) {
            hasImage = true;
        }
        if (meta.format.duration) {
            duration = parseFloat(meta.format.duration);
        }
        maxLen = Math.max(meta.streams[i1].width, meta.streams[i1].height);
        if (maxLen > imgConf.max_length) {
            tranLength = true;
        }
        w = meta.streams[i1].width;
        h = meta.streams[i1].height;
        break;
    }
    //
    if (!(tranSize || tranType || tranStreams)) {
        return '';
    }
    let str = `${execMask.program} \\
-i ${execMask.resource} \\
-ss ${hasImage ? 0 : Math.round(Math.min(duration * 0.2, 20))} \\
'-vframes 1 \\
${(tranSize || tranLength || tranType || tranStreams) ? imgConf.ff_encoder : '-c:v copy'} \\
${tranLength ? `-s ${Math.round(tranLength ? w * imgConf.max_length / maxLen : w)}x${Math.round(tranLength ? h * imgConf.max_length / maxLen : h)}` : ''} \\
${execMask.target}`;
    console.info(
        'tranType', tranType,
        'tranSize', tranSize,
        'tranLength', tranLength,
        'tranStreams', tranStreams,
        'hasAudio', hasAudio,
        'hasImage', hasImage,
    );
    return str;
}

export {
    loadMeta,
    subtitleStr,
    videoStr,
    audioStr,
    imageStr,
};
