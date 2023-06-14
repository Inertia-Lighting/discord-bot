//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

type ObjectWithKeys = {
    [key: string]: unknown;
};

//------------------------------------------------------------//

/**
 * Asynchronous setTimeout
 */
export function delay(
    time_in_milliseconds: number,
): Promise<void> {
    if (typeof time_in_milliseconds !== 'number') throw new TypeError('\`time_in_milliseconds\` must be a number');

    return new Promise((resolve, reject) => setTimeout(() => resolve(), time_in_milliseconds));
}

/**
 * Generates a random integer in an inclusive range: min <= return_value <= max
 */
export function randomRangeInclusive(min: number, max: number): number {
    if (typeof min !== 'number') throw new TypeError('\`min\` must be a number!');
    if (typeof max !== 'number') throw new TypeError('\`max\` must be a number!');

    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Ellipses a string to a specified length (including the ellipses)
 */
export function ellipseString(
    string_to_ellipses: string,
    output_length_limit: number = Number.MAX_SAFE_INTEGER,
    ellipses: string = '...',
): string {
    if (typeof string_to_ellipses !== 'string') throw new TypeError('\`string_to_ellipses\` must be a string');
    if (typeof output_length_limit !== 'number') throw new TypeError('\`output_length_limit\` must be a number');
    if (typeof string_to_ellipses !== 'string') throw new TypeError('\`string_to_ellipses\` must be a string');

    const shortened_string = string_to_ellipses.slice(0, output_length_limit - ellipses.length);
    const shortened_string_with_ellipses = `${shortened_string}${shortened_string.length < string_to_ellipses.length ? ellipses : ''}`;

    return shortened_string_with_ellipses;
}

/**
 * Sorts an object based on it's keys (using Array.sort()) and returns the new sorted object
 */
export function sortObject(
    object_of_things: ObjectWithKeys,
): ObjectWithKeys {
    if (typeof object_of_things !== 'object' || !object_of_things) throw new TypeError('\`object_of_things\` must be an object');

    const sorted_object_keys = Object.keys(object_of_things).sort();

    const sorted_object: ObjectWithKeys = {};
    for (const sorted_object_key of sorted_object_keys) {
        sorted_object[sorted_object_key] = object_of_things[sorted_object_key];
    }

    return sorted_object;
}

/**
 * Splits an array into a new chunked array
 */
export function chunkArray<T>(
    array_of_things: T[],
    chunk_size: number,
): T[][] {
    if (!Array.isArray(array_of_things)) throw new TypeError('\`array_of_things\` must be an array');
    if (typeof chunk_size !== 'number' || chunk_size !== Math.floor(chunk_size)) throw new TypeError('\`chunk_size\` must be a (whole) number');

    const array_of_things_clone = [ ...array_of_things ]; // prevent mutation of the original array

    const chunks = [];
    while (array_of_things_clone.length) {
        chunks.push(array_of_things_clone.splice(0, chunk_size));
    }

    return chunks;
}

/**
 * Fetches a random item from the specified array
 */
export function randomArrayItem<T>(
    array_of_things: T[],
): T {
    if (!Array.isArray(array_of_things)) throw new TypeError('\`array_of_things\` must be an array!');

    return array_of_things[randomRangeInclusive(0, array_of_things.length - 1)];
}

/**
 * Clamps a number between a minimum and maximum value
 */
export function clampNumber(
    value: number,
    min: number,
    max: number,
): number {
    if (typeof value !== 'number') throw new TypeError('\`value\` must be a number');
    if (typeof min !== 'number') throw new TypeError('\`min\` must be a number');
    if (typeof max !== 'number') throw new TypeError('\`max\` must be a number');

    return Math.min(Math.max(value, min), max);
}

/**
 * Returns a valid discord timestamp from a unix epoch (in milliseconds)
 */
export function getMarkdownFriendlyTimestamp(
    unix_epoch_ms: number,
): string {
    if (typeof unix_epoch_ms !== 'number') throw new TypeError('getMarkdownFriendlyTimestamp(): unix_epoch_ms is not a number');

    return Math.floor(unix_epoch_ms / 1000).toString(10);
}

/**
 * Converts milliseconds into rounded seconds
 */
export function millisecondsToRoundedSeconds(
    milliseconds: number,
): number {
    if (typeof milliseconds !== 'number') throw new TypeError('millisecondsToSecondsRounded(): milliseconds is not a number');

    return Math.round(milliseconds / 1000);
}
