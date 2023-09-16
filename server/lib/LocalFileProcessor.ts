import {Stream} from "stream";
import crypto from 'node:crypto';
import {get as getConfig,get_sync as getConfigSync} from "../ServerConfig";
import * as fs from 'fs/promises';
import {ReadStream, Stats} from 'fs';
import * as fsNP from 'fs';
import type {api_local_file_statement} from "../../share/Api";

//util
function getUUID(): string {
    return crypto.randomBytes(24).toString("base64url");
}

function getDir(filePath: string): string {
    filePath = filePath.replace(/\/$/, '');
    const lastSlash = filePath.lastIndexOf('/');
    return filePath.substring(0, lastSlash);
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
    // console.info(suffix);
    for (const key in getConfigSync().suffix) {
        ifHit = getConfigSync().suffix[key].indexOf(suffix);
        if (ifHit === -1) continue;
        return key;
    }
    return 'binary';
}

async function statFromStat(relPath: string, isFullPath?: boolean): Promise<api_local_file_statement> {
    const localPath = isFullPath ? relPath : (await getConfig()).path.root_local + relPath;
    // console.info(localPath);
    try {
        const stat = await fs.stat(localPath);
        const result = {
            name: getFileName(relPath),
            path: relPath,
            timeModified: stat.mtime.toISOString(),
            timeCreated: stat.ctime.toISOString(),
            isFile: stat.isFile(),
            isDir: stat.isDirectory(),
            type: stat.isFile() ? getType(getSuffix(relPath)) : 'directory',
            size: stat.size,
        };
        return result;
    } catch (e: any) {
        console.info(
            'statFromStat:',
            (e as Error).message,
            (e as Error).name,
        )
    }
    return;
}

//dir
async function ls(path: string): Promise<api_local_file_statement[]> {
    const nPath = path.replace(/\/$/, '');
    const fList = await fs.readdir((await getConfig()).path.root_local + path);
    // console.info(fList);
    const targetF = [] as string[];
    fList.forEach(i => {
        targetF.push(nPath + '/' + i);
    });
    // console.info(targetF);
    const target: api_local_file_statement[] = [];
    for (let i1 = 0; i1 < targetF.length; i1++) {
        const fStat = await stat(targetF[i1]);
        if (!fStat) continue;
        target.push(fStat);
    }
    return target;
}

async function mkdir(relPath: string): Promise<boolean> {
    const fullPath = (await getConfig()).path.root_local + relPath;
    const nPath = fullPath.replace(/\/$/, '');
    const ifExs = await stat(nPath);
    // console.info(ifExs);
    if (ifExs) return;
    console.info(nPath);
    await fs.mkdir(nPath, {
        mode: 0o666,
        recursive: true,
    });
    return;
}

//file
function get(path: string, from: number, to: number): ReadStream {
    const fullPath = getConfigSync().path.root_local + path;
    console.info(fullPath, from, to);
    return fsNP.createReadStream(fullPath, {
        autoClose: true,
        // encoding: 'binary',
        start: from, end: to
    });
}

async function touch(path: string): Promise<boolean> {
    const fullPath = (await getConfig()).path.root_local + path;
    await fs.writeFile(fullPath, '');
    return;
}

async function put(fromTmpPath: string, toPath: string): Promise<boolean> {
    const targetPath = (await getConfig()).path.root_local + toPath;
    const targetDir = getDir(targetPath);
    if (!statFromStat(targetDir, true)) {
        await fs.mkdir(targetDir, {mode: 0o777, recursive: true})
    }
    await fs.rename(fromTmpPath, targetPath);
    return;
}

async function mv(fromPath: string, toPath: string): Promise<boolean> {
    await fs.rename((await getConfig()).path.root_local + fromPath, (await getConfig()).path.root_local + toPath);
    return;
}

async function rm(relPath: string): Promise<boolean> {
    await fs.rm((await getConfig()).path.root_local + relPath, {recursive: true});
    return;
}

async function cp(fromPath: string, toPath: string): Promise<boolean> {
    await fs.copyFile((await getConfig()).path.root_local + fromPath, (await getConfig()).path.root_local + toPath);
    return;
}

async function stat(relPath: string): Promise<api_local_file_statement> {
    // console.info(Config.path.root_local + path);
    // console.info(fs.stat(Config.path.root_local + path));
    // console.info(await fs.stat(Config.path.root_local + path));
    return await statFromStat(relPath);
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
};

