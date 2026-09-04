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

/**
 * @template {T extends Record<string, any>} T
 * @param {T} obj 
 * @param {(value: T[keyof T], key: keyof T) => boolean} fn 
 * @returns {Partial<T>}
 */
export function pickBy(obj, fn) {
    return Object.entries(obj).reduce((r, [k, v]) => {
        if (fn(v, k)) {
            r[k] = obj[k];
        }
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

/**
 * Returns an array sorted by a function that returns a thing to compare, or an array to compare in order
 * Similar to lodash's sortBy function.
 */
export function sortBy(arr, fn) {
    const directCompare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
    const cmp = (a, b) => {
        const resultA = fn(a);
        const resultB = fn(b);
        if (Array.isArray(resultA) && Array.isArray(resultB)) {
            for (let idx = 0; idx < Math.min(resultA.length, resultB.length); idx++) {
                const result = directCompare(resultA[idx], resultB[idx]);
                if (result !== 0) return result;
            }
            return 0;
        }
        return directCompare(resultA, resultB);
    };
    return arr.sort(cmp);
}