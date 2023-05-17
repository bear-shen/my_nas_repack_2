import FileJob from "./processor/FileJob";
import ImportJob from "./processor/ImportJob";

export default {
    'file/build': FileJob.build,
    'file/deleteForever': FileJob.deleteForever,
    'import/run': ImportJob.run,
} as { [key: string]: (payload: { [key: string]: any }) => Promise<any> };