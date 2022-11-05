import { Stream } from "stream";
import crypto from 'node:crypto';
import Config from "../ServerConfig";
import * as fs from 'fs/promises';
import { ReadStream } from 'fs';

//util
function getUUID(): string {
    return crypto.randomBytes(24).toString("base64url");
}
function getSuffix(fileName: string): string {
    const ifSlash = fileName.lastIndexOf('/');
    const suffixOffset = fileName.lastIndexOf('.');
    if (ifSlash >= suffixOffset) return '';
    //
    let suffix = '';
    if (suffixOffset > 0) {
        suffix = fileName.slice(suffixOffset + 1);
        if (suffix.length > 6) suffix = '';
        else suffix = suffix.toLowerCase();
    }
    return suffix;
}
function getType(suffix: string): string {
    let ifHit = -1;
    for (const key in Config.suffix) {
        ifHit = Config.suffix[key].indexOf(suffix);
        if (ifHit === -1) continue;
        return key;
    }
    return '';
}
//dir
async function ls(path: string): Promise<string[]> {
    const fullPath = Config.path.local + path;
    const nPath = path.replace(/\/$/, '');
    const fList = await fs.readdir(fullPath);
    const target = [] as string[];
    fList.forEach(i => {
        target.push(nPath + '/' + i);
    });
    return target;
}

async function mkdir(dirPath: string, name: string): Promise<boolean> {
    const fullPath = Config.path.local + dirPath;
    const nPath = dirPath.replace(/\/$/, '');
    await fs.mkdir(fullPath + '/' + name, {
        mode: 0o777,
        recursive: true,
    });
    return;
}
//file
async function get(path: string): Promise<ReadStream> {
    const fullPath = Config.path.local + path;
    return (await fs.open(fullPath)).createReadStream({
        autoClose: true,
    });
}

async function touch(path: string): Promise<boolean> {
    const fullPath = Config.path.local + path;
    await fs.writeFile(fullPath, '');
    return;
}

async function put(path: string, stream: Stream): Promise<boolean> {
    return;
}

async function mv(fromPath: string, toPath: string): Promise<boolean> {
    await fs.rename(Config.path.local + fromPath, Config.path.local + toPath);
    return;
}

async function rm(path: string): Promise<boolean> {
    await fs.rm(Config.path.local + path, { recursive: true });
    return;
}

async function cp(fromPath: string, toPath: string): Promise<boolean> {
    await fs.copyFile(Config.path.local + fromPath, Config.path.local + toPath);
    return;
}

export {
    getUUID,
    getSuffix,
    getType,
    //
    ls,
    mkdir,
    get,
    touch,
    put,
    mv,
    rm,
    cp,
};



