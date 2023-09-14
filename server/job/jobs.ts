import FileJob from "./processor/FileJob";
import ImportJob from "./processor/ImportJob";

/**
 * @notice 考虑到现在队列是用worker跑
 * 可能需要处理线程安全问题
 * */
export default {
    'file/build': FileJob.build,
    'file/buildIndex': FileJob.buildIndex,
    'file/rebuild': FileJob.rebuild,
    'file/rebuildIndex': FileJob.rebuildIndex,
    'file/deleteForever': FileJob.deleteForever,
    'import/run': ImportJob.run,
} as { [key: string]: (payload: { [key: string]: any }) => Promise<any> };