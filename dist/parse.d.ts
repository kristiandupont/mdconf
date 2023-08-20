type ParseOptions = {
    keyNormalizationFunction?: (s: string) => string;
};
declare function parse(source: string, options?: ParseOptions): unknown;
export default parse;
