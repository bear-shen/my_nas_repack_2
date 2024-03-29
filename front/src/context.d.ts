export type contextItemDef = {
    title: string,
    auth: 'none' | 'guest' | 'user' | 'admin',
    // child?: contextItemDef[],
    method: (e: MouseEvent) => any,
};
export type contextListDef = (
    contextItemDef
    & { child?: contextItemDef[], }
    )[];