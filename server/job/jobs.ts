import FileOperateJob from "./processor/FileOperateJob";
// import ImportJob from "./processor/ImportJob";
// import SysJob from "./processor/SysJob";
import ExtJob from "./processor/ExtJob";
// import StatisticsJob from "./processor/StatisticsJob";
import FileSyncJob from "./processor/FileSyncJob";

/**
 * @notice 考虑到现在队列是用worker跑
 * 可能需要处理线程安全问题
 * */
export default {
    'file/build': FileOperateJob.build,
    'file/checksum': FileOperateJob.checksum,
    'file/buildIndex': FileOperateJob.buildIndex,
    'file/rebuild': FileOperateJob.rebuild,
    'file/rebuildIndex': FileOperateJob.rebuildIndex,
    'file/rebuildAllIndex': FileOperateJob.rebuildAllIndex,
    'file/deleteForever': FileOperateJob.deleteForever,
    'file/cascadeDeleteStatus': FileOperateJob.cascadeDeleteStatus,
    'file/cascadeMoveFile': FileOperateJob.cascadeMoveFile,
    'file/cascadeCopyFile': FileOperateJob.cascadeCopyFile,
    'file/rmRaw': FileOperateJob.rmRaw,
    // 'import/run': ImportJob.run,
    'sync/local2db': FileSyncJob.local2db,
    'sync/check': FileSyncJob.check,
    'sync/db2local': FileSyncJob.db2local,
    // 'sys/scanOrphanFile': SysJob.scanOrphanFile,
    'ext/cascadeTag': ExtJob.cascadeTag,
    'ext/syncBGMTag': ExtJob.syncBGMTag,
    'ext/importEHTTag': ExtJob.importEHTTag,
    'ext/syncJRiverRate': ExtJob.syncJRiverRate,
    // 'statistics/node': StatisticsJob.node,
} as { [key: string]: (payload: { [key: string]: any }) => Promise<any> };
