import util from "util";

import * as fs from 'fs/promises';
import * as fp from '../../lib/FileProcessor';
import {get as getConfig} from "../../ServerConfig";
import FileModel from "../../model/FileModel";

const exec = util.promisify(require('child_process').exec);

class SysJob {
    static async scanOrphanFile(payload: { [key: string]: any }): Promise<any> {
        const config = getConfig();
        const fullPath = config.path.local;
        const fileSet = await scanDir(fullPath, true);
        const pathLs = Array.from(fileSet);
        // console.info(pathLs);
        for (let i1 = 0; i1 < pathLs.length; i1++) {
            let path = pathLs[i1];
            let subPath = path.substring(fullPath.length + 1);
            let uuid = subPath.split('.')[0].split(/\//).join('');
            //.gitignore .gitkeep 一类的无法解析
            if (!uuid) continue;
            console.info(i1, pathLs[i1], uuid);
            const file = await (new FileModel).where('uuid', uuid).first();
            if (file) continue;
            // const stat = await fs.stat(path);
            console.info('rm:', path);
            await fs.rm(path);
            do {
                path = await fp.getDir(path);
                const subLs = await fs.readdir(path);
                if (subLs.length) break;
                console.info('rmdir:', path);
                await fs.rmdir(path);
            } while (path.length > fullPath.length + 1);
        }
        return;
    }

    static async exec(payload: { [key: string]: any }): Promise<any> {
    }
}

async function scanDir(path: string, fileOnly: boolean = false, depth: number = -1): Promise<Set<string>> {
    const tPath = path.replace(/\/$/, '');
    const dirLs = await fs.readdir(tPath);
    const pathLs: string[] = [];
    // const targetMap = new Map<string, Stats>();
    const targetSet = new Set<string>();
    dirLs.forEach(sub => pathLs.push(`${tPath}/${sub}`));
    for (let i = 0; i < pathLs.length; i++) {
        const path = pathLs[i];
        const stat = await fs.stat(path);
        // targetMap.set(path, stat);
        if (fileOnly) {
            if (!stat.isDirectory()) {
                targetSet.add(path);
            }
        } else targetSet.add(path);
        //
        if (stat.isDirectory()) {
            if (depth == 0) continue;
            if (depth > 0) {
                depth -= 1;
            }
            const subLs = await scanDir(path, fileOnly, depth);
            subLs.forEach((path) => {
                // targetMap.add(key, stat);
                targetSet.add(path);
            })
        }
    }
    return targetSet;
}

export default SysJob;