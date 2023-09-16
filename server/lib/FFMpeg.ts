import Config from "../ServerConfig";

const util = require('util');
const exec = util.promisify(require('child_process').exec);

const conf = Config.parser;

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
        pix_fmt: string;
        width: number;
        height: number;
        level: number;
        tags: {
            language: string;
            title: string;
        };
    }[];
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

// Array.isArray([])

/**
 * subTitle=>subParseStr
 * */
async function subtitleStr(meta: ffMeta): Promise<boolean | Map<string, string>> {
    const subConf = conf["subtitle"];
    //字幕仅支持vtt容器其他都要转，所以判断container就行
    let tranContainer = true;
    for (let i1 = 0; i1 < subConf.allow_container.length; i1++) {
        const kw = subConf.allow_container[i1];
        if (meta.format.format_name.toLowerCase().indexOf(kw) === -1) continue;
        tranContainer = false;
        break;
    }
    if (!tranContainer) return true;
    //
    const resMap = new Map<string, string>();
    let multiCount = meta.streams.length > 1;
    // const langSet = new Set<string>();
    for (let i1 = 0; i1 < meta.streams.length; i1++) {
        if (meta.streams[i1].codec_type != 'subtitle') continue;
        let validCode = false;
        subConf.allow_codec.forEach(name => {
            if (name == meta.streams[i1].codec_name) validCode = true;
        });
        if (!validCode) continue;
        //
        let lang = 'default';
        if (meta.streams.length > 1) {
            if (meta.streams[i1].tags && meta.streams[i1].tags.language) {
                lang = meta.streams[i1].tags.language;
            } else {
                lang = `${i1}`;
            }
        }
        let str = `[execMask.program]
-i [execMask.resource]
${multiCount ? `-map 0:${i1}` : ''}
[execMask.target]`.replaceAll(/[\r\n]+/gm, " \\\n");
        resMap.set(lang, str);
    }
    return resMap;
}

/**
 * 音轨map转成单音轨
 * subtitle需要提取并转换成vtt
 * */
async function videoStr(meta: ffMeta): Promise<string | boolean> {
    const videoConf = conf["video"];
    const audioConf = conf["audio"];
    // const subConf = conf["subtitle"];
    //
    let tranContainer = true;
    let tranACodec = true;
    let tranVCodec = true;
    //
    let tranRate = false;
    let tranLength = false;
    let w = 0;
    let h = 0;
    //
    let multiAudio = false;
    // let hasSub = false;
    let videoIndex = -1;
    let audioIndex = -1;
    //
    let videoCount = 0;
    let audioCount = 0;
    // let subCount = 0;
    for (let i1 = 0; i1 < meta.streams.length; i1++) {
        if (meta.streams[i1].codec_type == 'video') {
            videoCount += 1;
        }
        if (meta.streams[i1].codec_type == 'audio') {
            audioCount += 1;
        }
        // if (meta.streams[i1].codec_type == 'subtitle') {
        //     subCount += 1;
        // }
    }
    multiAudio = audioCount > 1;
    // hasSub = subCount > 0;
    //这里计算的索引和ff自动区分的索引不同
    //应当如 -map 0:3 而不是 -map 0:a:3
    for (let i1 = 0; i1 < meta.streams.length; i1++) {
        if (meta.streams[i1].codec_type != 'video') continue;
        videoIndex = i1;
        break;
    }
    //
    if (multiAudio) {
        const langLs = new Map<number, string>;
        for (let i1 = 0; i1 < meta.streams.length; i1++) {
            if (meta.streams[i1].codec_type != 'audio') continue;
            //音轨的话没有标签就不管
            if (!(meta.streams[i1].tags.language && meta.streams[i1].tags.language.length)) continue;
            langLs.set(i1, meta.streams[i1].tags.language);
        }
        // let validCount = 0;
        // langLs.forEach((lang) => {
        //     validCount += lang.length ? 1 : 0;
        // });
        if (langLs.size) {
            for (let i1 = 0; i1 < audioConf.priority_kw.length; i1++) {
                const kw = audioConf.priority_kw[i1];
                let ifMatch = -1;
                langLs.forEach((lang, ind) => {
                    if (ifMatch !== -1) return;
                    if (lang.toLowerCase().indexOf(kw) !== -1) ifMatch = ind;
                });
                if (ifMatch !== -1) {
                    audioIndex = ifMatch;
                    break;
                }
            }
        }
    }
    //单音轨或者没有选择到有效音轨的时候，选第一个
    if (audioIndex === -1) {
        for (let i1 = 0; i1 < meta.streams.length; i1++) {
            if (meta.streams[i1].codec_type != 'audio') continue;
            audioIndex = i1;
            break;
        }
    }
    //
    // let subMap = new Map<string, string>();
    // if (hasSub) {
    //     subMap = await subtitleStr(meta);
    // }
    //容器
    for (let i1 = 0; i1 < videoConf.allow_container.length; i1++) {
        const kw = videoConf.allow_container[i1];
        if (meta.format.format_name.toLowerCase().indexOf(kw) === -1) continue;
        tranContainer = false;
        break;
    }
    //编码
    for (let i1 = 0; i1 < videoConf.allow_codec.length; i1++) {
        const kw = videoConf.allow_codec[i1];
        const track = meta.streams[videoIndex];
        if (track.codec_name.toLowerCase().indexOf(kw) === -1) continue;
        //hevc部分格式不能播放，这块需要单独判断
        if (kw !== 'hevc') {
            tranVCodec = false;
            break;
        }
        switch (track.profile) {
            case 'Main':
                if (['yuv420p', 'yuvj420p',].indexOf(track.pix_fmt) !== -1)
                    tranVCodec = false;
                break;
            case 'Main 10':
                if (['yuv420p10le',].indexOf(track.pix_fmt) !== -1)
                    tranVCodec = false;
                break;
        }
        break;
    }
    if (audioIndex !== -1) {
        for (let i1 = 0; i1 < audioConf.allow_codec.length; i1++) {
            const kw = audioConf.allow_codec[i1];
            const track = meta.streams[audioIndex];
            if (track.codec_name.toLowerCase().indexOf(kw) === -1) continue;
            tranACodec = false;
            break;
        }
    }
    //基础
    let rate = parseInt(meta.format.size) / parseInt(meta.format.duration);
    // console.info(meta.format.size, meta.format.duration, rate);
    if (rate > videoConf.allow_rate) {
        // console.info(meta.format.size, imgConf.allow_size);
        tranRate = true;
    }
    //
    const videoStream = meta.streams[videoIndex];
    w = videoStream.width;
    h = videoStream.height;
    const maxLen = Math.max(videoStream.width, videoStream.height);
    if (maxLen > videoConf.length) {
        tranLength = true;
    }
    //
    console.info(
        'tranContainer', tranContainer,
        'tranACodec', tranACodec,
        'tranVCodec', tranVCodec,
        'tranRate', tranRate,
        'tranLength', tranLength,
        'w', w,
        'h', h,
        'multiAudio', multiAudio,
        // 'hasSub', hasSub,
        'videoIndex', videoIndex,
        'audioIndex', audioIndex,
        'videoCount', videoCount,
        'audioCount', audioCount,
        // 'subCount', subCount,
    );
    if (!(tranRate || tranContainer || tranACodec || tranVCodec)) {
        return true;
        // return {video: true, subtitle: subMap};
    }
    let str = `[execMask.program]
-hide_banner -hwaccel auto -y
-i [execMask.resource]
${(tranRate || tranVCodec || tranLength) ? videoConf.ff_encoder : '-c:v copy'}
${tranLength ? `-s ${Math.round(tranLength ? w * videoConf.length / maxLen : w)}x${Math.round(tranLength ? h * videoConf.length / maxLen : h)}` : ''}
${(audioIndex !== -1) && (tranRate || tranACodec) ? audioConf.ff_encoder : '-c:a copy'}
-map 0:${videoIndex} ${audioIndex !== -1 ? `-map 0:${audioIndex}` : ''}
[execMask.target]`.replaceAll(/[\r\n]+/gm, " \\\n");
    return str;
    // return {video: str, subtitle: subMap};
}

async function videoExtractSub(meta: ffMeta): Promise<Map<string, string>> {
    const subConf = conf["subtitle"];
    // let subMap = new Map<string, string>();
    let hasSub = false;
    let subCount = 0;
    for (let i1 = 0; i1 < meta.streams.length; i1++) {
        if (meta.streams[i1].codec_type == 'subtitle') {
            subCount += 1;
        }
    }
    hasSub = subCount > 0;
    let subMap = new Map<string, string>();

    if (hasSub) {
        const subStrMap = await subtitleStr(meta);
        if (typeof subStrMap === 'boolean') return subMap;
        subMap = subStrMap;
    }
    return subMap;
}

async function audioStr(meta: ffMeta): Promise<string | boolean> {
    const audioConf = conf["audio"];
    //
    let tranContainer = true;
    let tranACodec = true;
    let tranRate = false;
    //
    let audioIndex = 0;
    for (let i1 = 0; i1 < meta.streams.length; i1++) {
        if (meta.streams[i1].codec_type == 'audio') {
            audioIndex = i1;
            break;
        }
    }
    //容器
    for (let i1 = 0; i1 < audioConf.allow_container.length; i1++) {
        const kw = audioConf.allow_container[i1];
        if (meta.format.format_name.toLowerCase().indexOf(kw) === -1) continue;
        tranContainer = false;
        break;
    }
    //编码
    for (let i1 = 0; i1 < audioConf.allow_codec.length; i1++) {
        const kw = audioConf.allow_codec[i1];
        const track = meta.streams[audioIndex];
        if (track.codec_name.toLowerCase().indexOf(kw) === -1) continue;
        tranACodec = false;
        break;
    }
    //基础
    let rate = parseInt(meta.format.size) / parseInt(meta.format.duration);
    if (rate > audioConf.allow_rate) {
        tranRate = true;
    }
    console.info(
        'tranContainer', tranContainer,
        'tranACodec', tranACodec,
        'tranRate', tranRate,
        'audioIndex', audioIndex,
    );
    if (!(tranRate || tranACodec || tranContainer)) {
        return true;
    }
    let str = `[execMask.program]
-hide_banner -hwaccel auto -y
-i [execMask.resource]
${(tranContainer || tranRate || tranACodec) ? audioConf.ff_encoder : '-c:a copy'}
-map 0:${audioIndex} 
[execMask.target]`.replaceAll(/[\r\n]+/gm, " \\\n");
    return str;
}

/**
 * string str
 * false invalid
 * true no need
 * */
async function imageStr(meta: ffMeta, level: 'cover' | 'preview' | 'image'): Promise<string | boolean> {
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
     * 图像基本都是-99
     * 视频一般会填充一个大于0的值（hevc，avc，av1，mpeg）
     *
     * 因此以此判定是视频还是内嵌图像
     * 反正也是截图，冷门点直接用0
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
    const imgConf = conf[level];
    let tranType = false;
    let tranSize = false;
    let tranLength = false;
    let tranStreams = false;
    // let hasAudio = false;
    let hasImage = false;
    //
    let w = 0;
    let h = 0;
    let maxLen = 0;
    let duration = 0;
    // let ss = 0;
    //
    if (parseInt(meta.format.size) > imgConf.allow_size) {
        // console.info(meta.format.size, imgConf.allow_size);
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
    // for (let i1 = 0; i1 < meta.streams.length; i1++) {
    //     if (meta.streams[i1].codec_type != 'audio') {
    //         hasAudio = true;
    //     }
    // }
    let noVideo = true;
    for (let i1 = 0; i1 < meta.streams.length; i1++) {
        if (meta.streams[i1].codec_type != 'video') {
            continue;
        }
        noVideo = false;
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
    if (noVideo) return false;
    //
    console.info(
        'tranType', tranType,
        'tranSize', tranSize,
        'tranLength', tranLength,
        'tranStreams', tranStreams,
        // 'hasAudio', hasAudio,
        'hasImage', hasImage,
        'w', w,
        'h', h,
        'size', meta.format.size,
    );
    if (!(tranSize || tranType || tranStreams)) {
        return true;
    }
    let str = `[execMask.program]
-i [execMask.resource]
-ss ${hasImage ? 0 : Math.round(Math.min(duration * 0.2, 20))}
-vframes 1
${(tranSize || tranLength || tranType || tranStreams) ? imgConf.ff_encoder : '-c:v copy'}
${tranLength ? `-s ${Math.round(tranLength ? w * imgConf.max_length / maxLen : w)}x${Math.round(tranLength ? h * imgConf.max_length / maxLen : h)}` : ''}
[execMask.target]`.replaceAll(/[\r\n]+/gm, " \\\n");
    return str;
}

export {
    loadMeta,
    subtitleStr,
    videoStr,
    videoExtractSub,
    audioStr,
    imageStr,
};
