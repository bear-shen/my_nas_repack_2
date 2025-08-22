import {Fields, PersistentFile} from "formidable";
import {IncomingMessage, ServerResponse} from "http";

export type ParsedForm = {
    fields: Fields,
    files: Array<typeof PersistentFile>,
    uid: number | false
};

export type ControllerMethod = (
    data: ParsedForm,
    req: IncomingMessage,
    res: ServerResponse,
) => Promise<any>
    ;
