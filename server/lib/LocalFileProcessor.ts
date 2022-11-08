import { Stream } from "stream";
import crypto from 'node:crypto';
import Config from "../ServerConfig";
import * as fs from 'fs/promises';
import { ReadStream, Stats } from 'fs';
import * as fsNP from 'fs';

//util
function getUUID(): string {
    return crypto.randomBytes(24).toString("base64url");
}
function getFileName(filePath: string): string {
    filePath = filePath.replace(/\/$/, '');
    const lastSlash = filePath.lastIndexOf('/');
    return filePath.substring(lastSlash + 1);
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
    return 'binary';
}
async function statFromStat(relPath: string): Promise<fileStatement> {
    const localPath = Config.path.local + relPath;
    console.info(localPath);
    const stat = await fs.stat(localPath);
    const result = {
        name: getFileName(relPath),
        path: relPath,
        timeModified: stat.mtime.toISOString(),
        timeCreated: stat.ctime.toISOString(),
        isFile: stat.isFile(),
        isDir: stat.isDirectory(),
        type: stat.isFile() ? getType(relPath) : 'directory',
        size: stat.size,
    };
    return result;
}
//dir
async function ls(path: string): Promise<fileStatement[]> {
    const nPath = path.replace(/\/$/, '');
    const fList = await fs.readdir(Config.path.local + path);
    console.info(fList);
    const targetF = [] as string[];
    fList.forEach(i => {
        targetF.push(nPath + '/' + i);
    });
    console.info(targetF);
    const target: fileStatement[] = [];
    for (let i1 = 0; i1 < targetF.length; i1++) {
        target.push(await stat(targetF[i1]));
    }
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

async function stat(path: string): Promise<fileStatement> {
    // console.info(Config.path.local + path);
    // console.info(fs.stat(Config.path.local + path));
    // console.info(await fs.stat(Config.path.local + path));
    return await statFromStat(path);
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
    stat,
    fileStatement,
};

type fileStatement = {
    name: string,
    path: string,
    timeModified: string,
    timeCreated: string,
    isFile: boolean,
    isDir: boolean,
    type: string,
    size: number,
}