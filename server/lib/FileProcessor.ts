import { Stream } from "stream";
import crypto from 'node:crypto';
import Config from "../ServerConfig";

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
function getNode(path: string): string {

    return '';
}
async function parsePath(path: string): Promise<number[]> {
    const dirNameLs = path.split(/\//);
    const dirIdLs = [0];
    dirNameLs.shift();
    // @todo
    // console.info(dirNameLs);
    //
    return dirIdLs;
}
//dir
async function ls(nodeId: number): Promise<boolean> {
    return;
}

async function mkdir(parentNodeId: number, name: string, description?: string): Promise<boolean> {
    return;
}
//file
async function get(nodeId: number): Promise<boolean> {
    return;
}

async function touch(parentNodeId: number, name: string, description?: string): Promise<boolean> {
    return;
}

async function put(nodeId: number, stream: Stream): Promise<boolean> {
    return;
}

async function mv(nodeId: number, targetDirId: number): Promise<boolean> {
    return;
}

async function rm(nodeId: number): Promise<boolean> {
    return;
}

async function cp(nodeId: number, targetDirId: number, name: string, description?: string): Promise<boolean> {
    return;
}

export {
    getUUID,
    getSuffix,
    getType,
    getNode,
    parsePath,
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



