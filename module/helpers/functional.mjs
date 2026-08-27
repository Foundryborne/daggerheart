/**
 * Methods that basically can be removed by installing something like es-toolkit.
 * These are basic helpers to operate on arrays and objects.
 */

/** Given an object, returns a new object with the keys listed in keys */
export function pick(obj, keys) {
    return keys.reduce((r, k) => {
        r[k] = obj[k];
        return r;
    }, {});
}

/** Given an object, returns a new object with the keys not listed in keys */
export function omit(obj, keys) {
    const keysAsString = keys.map(k => String(k));
    return Object.keys(obj).reduce((r, k) => {
        if (!keysAsString.includes(k)) {
            r[k] = obj[k];
        }
        return r;
    }, {});
}

/** 
 * Given an object, returns a new object with each value altered by a transform function
 * @template {string} K
 * @template V
 * @template R
 * @param {Record<K, V>} obj object to transform
 * @param {(value: V, index: number) => R} transform mapping function
 * @returns {Record<K, R>} new object with mapped values
 */
export function mapValues(obj, transform) {
    return Object.entries(obj).reduce((r, [k, v], index) => {
        r[k] = transform(v, index);
        return r;
    }, {});
}

/**
 * Given an array, creates an object that references each element by a key gen function
 * @template T
 * @template K
 * @param {T[]} arr 
 * @param {(value: T) => K} keyFn 
 * @returns {Record<K, T>}
 */
export function keyBy(arr, keyFn) {
    return arr.reduce((r, current) => {
        r[keyFn(current)] = current;
        return r;
    }, {})
}