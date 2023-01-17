import { Fields, PersistentFile } from "formidable";

export type ParsedForm = {
    fields: Fields,
    files: Array<typeof PersistentFile>,
    uid: number | false
};