import FileJob from "./processor/FileJob";

export default {
    'file/builds': FileJob.build,
} as { [key: string]: (payload: { [key: string]: any }) => Promise<any> };