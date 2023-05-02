import FileJob from "./processor/FileJob";
import ImportJob from "./processor/ImportJob";

export default {
    'file/builds': FileJob.build,
    'import/run': ImportJob.run,
} as { [key: string]: (payload: { [key: string]: any }) => Promise<any> };