/**
 * @param {string} paramString The parameter inside the brackets of something like @Template[] to parse
 * @param {Object} options
 * @param {string} options.first If set, the first parameter is treated as a value with this as its key
 * @returns {Record<string, string | undefined> | null}
 */
export function parseInlineParams(paramString, { first } = {}) {
    const parts = paramString.split('|').map(x => x.trim());
    const params = {};
    for (const [idx, param] of parts.entries()) {
        if (first && idx === 0) {
            params[first] = param;
        } else {
            const parts = param.split(':');
            params[parts[0]] = parts.length > 1 ? parts[1] : true;
        }
    }

    return params;
}
