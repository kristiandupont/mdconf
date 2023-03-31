export type Options = { normalize?: boolean };

declare function parse(str: string, options: Options): object;

export default parse;
