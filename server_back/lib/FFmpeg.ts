import Config from "../Config";
import * as fs from "fs/promises";

const util = require('util');
const exec = util.promisify(require('child_process').exec);

const convertConfig = Config.fileParseConfig;

async function loadMeta(path: string) {
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

async function subtitleStr(meta: any): Promise<string | boolean | null> {
    const procStr = `ffmpeg -hide_banner -hwaccel auto -y -i '{resource}' '{target}'`;
    return procStr;
}

async function videoStr(meta: any)
    : Promise<string | boolean | null> {
    const aLs = [];
    const vLs = [];
    for (const stream of meta.streams) {
        if (stream.codec_type == 'audio') aLs.push(stream);
        if (stream.codec_type == 'video') vLs.push(stream);
    }
    let tranA = false;
    for (const aStream of aLs) {
        if (convertConfig.a_normal.allow_codec.indexOf(aStream.codec_name.toLowerCase()) !== -1)
            continue;
        tranA = true;
    }
    let tranV = false;
    for (const vStream of vLs) {
        if (convertConfig.v_normal.allow_codec.indexOf(vStream.codec_name.toLowerCase()) !== -1)
            continue;
        tranV = true;
    }
    // console.info(meta.format.format_name, convertConfig.v_normal.allow_container);
    let tranC = true;
    for (const container of convertConfig.v_normal.allow_container) {
        if (meta.format.format_name.toLowerCase().indexOf(container) === -1) continue;
        tranC = false;
        break;
    }
    let tranR = false;
    if (Number.parseInt(meta.format.bit_rate) > convertConfig.v_normal.allow_rate) {
        tranR = true;
    }
    let procStr;
    if (!tranC && !tranA && !tranV && !tranR) {
        procStr = null;
    } else {
        const aStr = (tranA || tranR)
            ? `-c:a ${convertConfig.a_normal.codec_lib} -q:a ${convertConfig.a_normal.quality}`
            : '-c:a copy'
        ;
        let tranSize = '';
        let maxLen = 0;
        let isSmall = false;
        for (const vStream of vLs) {
            maxLen = Math.max(vStream.width, vStream.height);
            if (maxLen <= convertConfig.v_normal.length_small) {
                isSmall = true;
            }
            if (!tranR) break;
            if (maxLen > convertConfig.v_normal.length) {
                const targetW = vStream.width * convertConfig.v_normal.length / maxLen;
                const targetH = vStream.height * convertConfig.v_normal.length / maxLen;
                tranSize = `-s ${Math.round(targetW)}x${Math.round(targetH)}`;
            }
            break;
        }

        // console.info(tranC ? 'tranC' : '', tranA ? 'tranA' : '', tranV ? 'tranV' : '');
        let vStr = '';
        if (tranV || tranR) {
            const vConf = convertConfig.v_normal;
            let rate = 0;
            switch (vConf.cur_lib) {
                default:
                case 'libx264':
                    vStr = `-c:v ${vConf.libx264.codec_lib} -crf ${isSmall ? vConf.libx264.quality_small : vConf.libx264.quality} -pix_fmt ${vConf.libx264.pixFmt} ${tranSize}`;
                    break;
                case 'h264_nvenc':
                    rate = isSmall ? vConf.h264_nvenc.target_rate_small : vConf.h264_nvenc.target_rate;
                    vStr = `-c:v ${
                        vConf.h264_nvenc.codec_lib
                    } -preset ${vConf.h264_nvenc.preset} -pix_fmt ${vConf.h264_nvenc.pixFmt} -b:v ${
                        rate
                    }k -maxrate:v ${
                        rate * 4
                    }k -minrate:v ${
                        Math.round(rate / 4)
                    }k -bufsize:v ${
                        rate * 5
                    }k -rc-lookahead ${vConf.h264_nvenc.lookahead} ${tranSize}`;
                    break;
                case 'hevc_nvenc':
                    rate = isSmall ? vConf.hevc_nvenc.target_rate_small : vConf.hevc_nvenc.target_rate;
                    vStr = `-c:v ${
                        vConf.hevc_nvenc.codec_lib
                    } -preset ${vConf.hevc_nvenc.preset} -pix_fmt ${vConf.hevc_nvenc.pixFmt} -b:v ${
                        rate
                    }k -maxrate:v ${
                        rate * 8
                    }k -minrate:v ${
                        Math.round(rate / 4)
                    }k -bufsize:v ${
                        rate * 10
                    }k -rc-lookahead ${
                        vConf.hevc_nvenc.lookahead
                    } -bf ${
                        vConf.hevc_nvenc.bf
                    } ${tranSize}`;
                    break;
            }

        } else {
            vStr = '-c:v copy';
        }
        procStr = `ffmpeg -hide_banner -hwaccel auto -y -i '{resource}' ${aStr} ${vStr} '{target}'`;
    }
    // console.info(procStr);
    return procStr;
}

async function audioStr(meta: any)
    : Promise<string | boolean | null> {
    const aLs = [];
    for (const stream of meta.streams) {
        if (stream.codec_type == 'audio') aLs.push(stream);
    }
    let tranA = false;
    for (const aStream of aLs) {
        if (convertConfig.a_normal.allow_codec.indexOf(aStream.codec_name) !== -1)
            // if (convertConfig.a_normal.allow_rate > Number.parseInt(aStream.bit_rate))
            continue;
        tranA = true;
    }
    // console.info(meta.format.format_name, convertConfig.a_normal.allow_codec);
    let tranC = true;
    for (const container of convertConfig.a_normal.allow_container) {
        if (meta.format.format_name.indexOf(container) === -1) continue;
        tranC = false;
        break;
    }
    let tranR = false;
    if (Number.parseInt(meta.format.bit_rate) > convertConfig.a_normal.allow_rate) {
        tranR = true;
    }
    let procStr;
    if (!tranC && !tranA && !tranR) {
        procStr = null;
    } else {
        // console.info(tranA ? 'tranA' : '', tranC ? 'tranC' : '');
        const aStr = (tranA || tranR)
            ? `-c:a ${convertConfig.a_normal.codec_lib} -q:a ${convertConfig.a_normal.quality}`
            : '-c:a copy'
        ;
        procStr = `ffmpeg -hide_banner -hwaccel auto -y -i '{resource}' ${aStr} '{target}'`;
    }
    // console.info(procStr);
    return procStr;
}

async function imageStr(level: 'preview' | 'normal' | 'cover', meta: any)
    : Promise<string | boolean | null> {
    // console.info('processImage');
    // console.info(meta, meta.streams, meta['streams'],);
    /*for (const metaKey in meta) {
        console.info(metaKey, meta[metaKey]);
    }*/
    const vLs = [];
    for (const stream of meta.streams) {
        if (stream.codec_type == 'video') vLs.push(stream);
    }
    if (!vLs.length) return false;
    // console.info(vLs);
    // console.info(`i_${level}`);
    const iConfig = (convertConfig as { [key: string]: any })[`i_${level}`] as { [key: string]: any };
    // console.info(iConfig);
    //这边其实没有必要遍历了，但是总之和视频和图片统一流程
    // console.info(meta.format.format_name, iConfig.allow_container);
    let tranS = false;
    for (const vStream of vLs) {
        if (iConfig.allow_size > Number.parseInt(meta.format.size))
            continue;
        tranS = true;
    }
    let tranF = true;
    for (const container of iConfig.allow_container) {
        if (meta.format.format_name.indexOf(container) === -1) continue;
        tranF = false;
    }
    let procStr;
    if (!tranF && !tranS) {
        procStr = null;
    } else {
        // console.info(tranV ? 'tranV' : '', tranC ? 'tranC' : '');
        let tranSize = '';
        if (tranS) {
            for (const vStream of vLs) {
                const maxLen = Math.max(vStream.width, vStream.height);
                if (maxLen > iConfig.length) {
                    const targetW = vStream.width * iConfig.length / maxLen;
                    const targetH = vStream.height * iConfig.length / maxLen;
                    tranSize = `-s ${Math.round(targetW)}x${Math.round(targetH)}`;
                }
                break;
            }
        }
        // let vStr = tranS
        //     ? `-c:v ${iConfig.codec_lib} -quality ${iConfig.quality} ${tranSize}`
        //     : '-c:v copy'
        // ;
        let vStr = `-c:v ${iConfig.codec_lib} -quality ${iConfig.quality} ${tranSize}`;
        //图片没有帧数
        if (vLs[0].avg_frame_rate !== '0/0') {
            let tt = Number.parseFloat(meta.format.duration);
            if (tt && tt > 60) {
                const ss = Math.min(tt / 2, 180);
                if (ss) vStr += ` -ss ${Math.round(ss)}`;
            }
        }
        let vFrame = '';
        if (level !== 'normal') {
            vFrame = '-vframes 1';
        }
        procStr = `ffmpeg -hide_banner -hwaccel auto -y -i '{resource}' ${vStr} ${vFrame} '{target}'`;
    }
    // console.info(procStr);
    return procStr;
}

export {
    loadMeta,
    subtitleStr,
    videoStr,
    audioStr,
    imageStr,
};
