type Validator<T> = ((obj: unknown) => T) | {
    parse: (obj: unknown) => T;
};
declare function parse<T = unknown>(source: string, options?: {
    keyNormalizationFunction?: (s: string) => string;
    validator?: Validator<T>;
}): T;
export default parse;
