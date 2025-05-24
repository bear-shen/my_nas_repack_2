export type nodePropsType={
    id: number,
    title: string,
    cover: string,
    preview: string,
    normal: string,
    raw: string,
    sameName:nodePropsType_sub[],
};

export type nodePropsType_sub= {
      title: string,
      type: string,
      raw: string,
      normal: string,
      preview: string,
};


