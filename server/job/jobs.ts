import FileJob from "./processor/FileJob";
import ImportJob from "./processor/ImportJob";
import SysJob from "./processor/SysJob";
import ExtJob from "./processor/ExtJob";
import StatisticsJob from "./processor/StatisticsJob";

/**
 * @notice 考虑到现在队列是用worker跑
 * 可能需要处理线程安全问题
 * */
export default {
    'file/build': FileJob.build,
    'file/checksum': FileJob.checksum,
    'file/buildIndex': FileJob.buildIndex,
    'file/rebuild': FileJob.rebuild,
    'file/rebuildIndex': FileJob.rebuildIndex,
    'file/deleteForever': FileJob.deleteForever,
    'import/run': ImportJob.run,
    'sys/scanOrphanFile': SysJob.scanOrphanFile,
    'ext/cascadeTag': ExtJob.cascadeTag,
    'ext/rmRaw': ExtJob.rmRaw,
    'ext/importEHT': ExtJob.importEHT,
    'statistics/node': StatisticsJob.node,
} as { [key: string]: (payload: { [key: string]: any }) => Promise<any> };