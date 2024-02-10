import os from 'os';
import {type_file} from '../share/Database';
import fs from "fs";
import {conn} from "./lib/SQL";
import tls, {ConnectionOptions} from "tls";
// import SettingModel from "./model/SettingModel";

const BaseConfig = {
    // pathPrefix: '/api',
    port: {
        api: 8090,
        webdav: 8095,
    },
    auth: {
        api: {
            '^/api/[^/]+?/[^/]+?$': [1],
            '^/api/user/login$': [0],
            '^/api/dev/[^/]+?$': [0],
        } as { [key: string]: Array<any> },
        local: {
            name: 'root',
            password: 'root',
        },
    },
    db: {
        host: '127.0.0.1',
        port: 3306,
        database: 'toshokan',
        account: 'root',
        password: 'root',
    },
    suffix: {
        video: ['mp4', 'avi', 'mkv', 'm4a', '3gp', 'flv', 'hlv', 'rm', 'rmvb',],
        audio: ['wav', 'flac', 'mp3', 'aac',],
        image: ['jpg', 'png', 'jpeg', 'tif', 'tiff', 'bmp', 'gif', 'webp',],
        text: ['txt', 'html', 'json',],
        subtitle: ['vtt', 'ass', 'ssa', 'sub', 'srt', 'pjs',],
        pdf: ['pdf',],
    } as { [key: type_file | string]: Array<any> },
    //
    path: {
        temp: `${os.tmpdir()}/tosho_tmp_${process.pid}`,
        local: process.cwd() + '/../../file',
        api: '/file',
        webdav: '/webdav',
        root_local: '',
        // root_local: '/',
    },
    //hashFunction: process.cwd() + '/binary/b3sum_linux_x64_bin --no-names {fileName}',
    checksum: [
        // 'xxhsum.exe',
        // 'b3sum.exe',
        'xxh128sum',
        'b3sum',
        // 'openssl md5 -r',
    ],
    ftp: {
        port: 2121,
        host: '0.0.0.0',
        pasv: [12000, 15000],
        tls: true,
        tlsConfig: {
            key: fs.readFileSync(`${__dirname}/../../cert/cirno_ftp.key`),
            cert: fs.readFileSync(`${__dirname}/../../cert/cirno_ftp.crt`),
            ca: [fs.readFileSync(`${__dirname}/../../cert/rootCA.crt`),],
            isServer: true,
            // requestCert: true,
            // requestOCSP: true,
            // rejectUnauthorized: false,
            checkServerIdentity: (): null => {
                return null;
            },
        } as tls.TlsOptions & ConnectionOptions,
    },
    /*parser: {
        //@see https://slhck.info/video/2017/02/24/vbr-settings.html
        i_cover: {
            length: 640,
            quality: 70,
            format: 'webp',
            codec_lib: 'libwebp',
            allow_size: 1024 * 512,
            allow_container: ['jpg', 'jpeg', 'image2', 'png', 'gif', 'webp',],
        },
        i_preview: {
            length: 1280,
            quality: 75,
            format: 'webp',
            codec_lib: 'webp',
            allow_size: 1024 * 1024,
            allow_container: ['jpg', 'jpeg', 'image2', 'png', 'gif', 'webp',],
        },
        i_normal: {
            length: 2560,
            quality: 80,
            format: 'webp',
            codec_lib: 'webp',
            allow_size: 1024 * 1024 * 4,
            allow_container: ['jpg', 'jpeg', 'image2', 'png', 'gif', 'webp',],
        },
        v_normal: {
            length: 1920,
            length_small: 1440,
            format: 'mp4',
            allow_codec: ['vp8', 'vp9', 'h264', 'hevc', 'av1', 'vp10',],
            // allow_rate: 4000 * 1000,
            allow_rate: 1024 * 1024 * 20,
            allow_container: ['mp4', 'ogg', 'webm', 'm4a',],
            // @todo 这个处理起来太麻烦了。。。反正webdav做好了，手动处理吧
            priority_audio: [
                'cht', 'chs', 'chin', 'zh-', '中',
                'jpn', 'jps', 'japan', 'jp', '日',
                'us', 'en', '英',
            ],
            priority_subtitle: [
                'cht', 'chs', 'chin', 'zh-', '中',
                'jpn', 'jps', 'japan', 'jp', '日',
                'us', 'en', '英',
            ],
            //
            // cur_lib: 'libx264',
            cur_lib: 'hevc_nvenc',
            libx264: {
                codec_lib: 'libx264',
                pixFmt: 'yuv422p10',
                quality: 15,  //+- 3500
                quality_small: 15,  //
            },
            h264_nvenc: {
                codec_lib: 'h264_nvenc',
                pixFmt: 'yuv420p',
                target_rate: 6000,  //bufsize *= 5
                target_rate_small: 3000,
                lookahead: 40,
                preset: 'slow',
            },
            hevc_nvenc: {
                codec_lib: 'hevc_nvenc',
                pixFmt: 'p010le',
                //bufsize *= 10
                //maxrate *= 8
                //minrate /= 4
                target_rate: 4000,
                target_rate_small: 2500,
                lookahead: 80,
                bf: 4,
                preset: 'slow',
            },
        },
        a_normal: {
            quality: 1.5,  //+- 110
            format: 'aac',
            codec_lib: 'aac',
            allow_codec: ['flac', 'mp3', 'aac', 'wav',],
            allow_container: ['flac', 'mp3', 'aac', 'wav',],
            // allow_rate: 120 * 1000,
            allow_rate: 1024 * 1024,
        },
        stt_normal: {
            format: 'vtt',
        },
    },*/
    parser: {
        ffProgram: 'ffmpeg -v quiet -hide_banner',
        cover: {
            format: 'webp',
            max_length: 320,
            allow_size: 1024 * 128,
            allow_container: ['jpg', 'jpeg', 'image2', 'png', 'gif', 'webp',],
            ff_encoder: '-c:v webp -quality 65',
        },
        preview: {
            format: 'webp',
            max_length: 1280,
            allow_size: 1024 * 512,
            allow_container: ['jpg', 'jpeg', 'image2', 'png', 'gif', 'webp',],
            ff_encoder: '-c:v webp -quality 75',
        },
        image: {
            format: 'webp',
            max_length: 2560,
            allow_size: 1024 * 1024 * 2,
            allow_container: ['jpg', 'jpeg', 'image2', 'png', 'gif', 'webp',],
            ff_encoder: '-c:v webp -quality 80',
        },
        video: {
            length: 1920,
            length_small: 1280,
            format: 'mp4',
            allow_codec: ['vp8', 'vp9', 'h264', 'hevc', 'av1', 'vp10',],
            // allow_rate: 4000 * 1000,
            //注意是 B/s
            allow_rate: 1024 * 1024 * 7 / 8,
            allow_container: ['mp4', 'ogg', 'webm', 'm4a',],
            //pix_fmt必须指定不然浏览器不认
            // ff_encoder: '-c:v hevc_nvenc -profile:v main10 -preset slow -tune hq ' +
            //     '-qp 16 ' +
            //     '-rc-lookahead 80 -bf 4 -pix_fmt p010le ',
            //av1开qp40在5Mb/s左右
            ff_encoder: '-c:v av1_nvenc -profile:v main10 -preset slow -tune hq -qp 40 -bf 3 -pix_fmt p010le -multipass qres -rc-lookahead 32',
        },
        audio: {
            quality: 1.5,  //+- 110
            format: 'aac',
            codec_lib: 'aac',
            allow_codec: ['flac', 'mp3', 'aac', 'wav', 'vorbis', 'ogg', 'pcm', 'opus',],
            allow_container: ['flac', 'mp3', 'aac', 'wav', 'vorbis', 'ogg',],
            // allow_rate: 120 * 1000,
            allow_rate: 1024 * 1024 * 1 / 8,
            priority_kw: [
                'jpn', 'jps', 'japan', 'jp', '日',
                'cht', 'chs', 'chin', 'zh-', '中',
                'us', 'en', '英',
            ],
            ff_encoder: '-c:a aac -q:a 1.3',
        },
        subtitle: {
            format: 'vtt',
            allow_container: ['webvtt',],
            allow_codec: ['ass', 'ssa', 'vtt', 'srt', 'subrip', 'mov_text', 'webvtt',],
            priority_kw: [
                'cht', 'chs', 'chin', 'zh-', '中',
                'jpn', 'jps', 'japan', 'jp', '日',
                'us', 'en', '英',
            ],
        },
    },
    import_ignore: [
        'thumbs.db',
        'desktop.ini',
        '_MACOSX',
    ],
};

fs.mkdirSync(
    BaseConfig.path.temp,
    {recursive: true, mode: 0o777}
);

export let loaded = false;
export let serverConfig = {};

export async function loadConfig() {
    console.info('loadConfig');
    loaded = false;
    serverConfig = BaseConfig;
    //这边如果用SettingModel的话在worker中会提示  Class extends value undefined is not a constructor or null
    //但是主进程里面不会，原因不明
    //stackoverflow讲可能是循环引用，那为何主进程就行
    const [settingArr, fields] = await conn().execute('select * from settings');
    // console.info(settingArr);
    for (let i1 = 0; i1 < (settingArr as { [key: string]: any }[]).length; i1++) {
        const row = (settingArr as { [key: string]: any }[]) [i1];
        const keyArr = row.name.split('.');
        const lastKey = keyArr.pop();
        let target: any = serverConfig;
        for (let i1 = 0; i1 < keyArr.length; i1++) {
            if (!target[keyArr[i1]]) target[keyArr[i1]] = {};
            target = target[keyArr[i1]];
        }
        target[lastKey] = JSON.parse(row.value);
    }
    // console.info('==========');
    // console.info(serverConfig);
    //setting里update，加载不update
    // const curTimeStamp = Math.round((new Date().valueOf()) / 60 * 1000).toString();
    const curTimeStamp = new Date().valueOf().toString();
    await conn().execute(`insert ignore into \`cache\`(code, val)
                              value ('config_stamp', '${curTimeStamp}');`);
    loaded = true;
    // serverConfig;
}

export function get(key: string = '') {
    // if (!loaded) loadConfig();
    if (!key.length) return serverConfig;
    const keyArr = key.split('.');
    let target: any = serverConfig;
    for (let i1 = 0; i1 < keyArr.length; i1++) {
        target = target[keyArr[i1]];
    }
    return target;
}

//这么搞肯定有问题...但是没想到什么好办法
/*export function get(key: string = '') {
    // if (!loaded) loadConfig();
    if (!key.length) return serverConfig;
    const keyArr = key.split('.');
    let target: any = serverConfig;
    for (let i1 = 0; i1 < keyArr.length; i1++) {
        target = target[keyArr[i1]];
    }
    return target;
}*/

