export function isDefined<V>(v: V | undefined | null): v is V {
    return v !== undefined && v !== null;
}
