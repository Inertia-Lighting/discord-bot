/* Copyright © Inertia Lighting | All Rights Reserved */
//---------------------------------------------------------------------------------------------------------------//
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMarkdownFriendlyTimestamp = exports.math_clamp = exports.array_random = exports.array_chunks = exports.object_sort = exports.string_ellipses = exports.random_range_inclusive = exports.Timer = void 0;
//---------------------------------------------------------------------------------------------------------------//
/**
 * Asynchronous setTimeout
 */
function Timer(time_in_milliseconds) {
    if (typeof time_in_milliseconds !== 'number')
        throw new TypeError('\`time_in_milliseconds\` must be a number');
    return new Promise((resolve, reject) => setTimeout(() => resolve(), time_in_milliseconds));
}
exports.Timer = Timer;
/**
 * Generates a random integer in an inclusive range: min <= return_value <= max
 */
function random_range_inclusive(min, max) {
    if (typeof min !== 'number')
        throw new TypeError('\`min\` must be a number!');
    if (typeof max !== 'number')
        throw new TypeError('\`max\` must be a number!');
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
exports.random_range_inclusive = random_range_inclusive;
/**
 * Ellipses a string to a specified length (including the ellipses)
 */
function string_ellipses(string_to_ellipses, output_length_limit = Number.MAX_SAFE_INTEGER, ellipses = '...') {
    if (typeof string_to_ellipses !== 'string')
        throw new TypeError('\`string_to_ellipses\` must be a string');
    if (typeof output_length_limit !== 'number')
        throw new TypeError('\`output_length_limit\` must be a number');
    if (typeof string_to_ellipses !== 'string')
        throw new TypeError('\`string_to_ellipses\` must be a string');
    const shortened_string = string_to_ellipses.slice(0, output_length_limit - ellipses.length);
    const shortened_string_with_ellipses = `${shortened_string}${shortened_string.length < string_to_ellipses.length ? ellipses : ''}`;
    return shortened_string_with_ellipses;
}
exports.string_ellipses = string_ellipses;
/**
 * Sorts an object based on it's keys (using Array.sort()) and returns the new sorted object
 */
function object_sort(object_of_things) {
    if (typeof object_of_things !== 'object' || !object_of_things)
        throw new TypeError('\`object_of_things\` must be an object');
    const sorted_object_keys = Object.keys(object_of_things).sort();
    const sorted_object = {};
    for (const sorted_object_key of sorted_object_keys) {
        sorted_object[sorted_object_key] = object_of_things[sorted_object_key];
    }
    return sorted_object;
}
exports.object_sort = object_sort;
/**
 * Splits an array into a new chunked array
 */
function array_chunks(array_of_things, chunk_size) {
    if (!Array.isArray(array_of_things))
        throw new TypeError('\`array_of_things\` must be an array');
    if (typeof chunk_size !== 'number' || chunk_size !== Math.floor(chunk_size))
        throw new TypeError('\`chunk_size\` must be a (whole) number');
    const array_of_things_clone = [...array_of_things]; // prevent mutation of the original array
    const chunks = [];
    while (array_of_things_clone.length) {
        chunks.push(array_of_things_clone.splice(0, chunk_size));
    }
    return chunks;
}
exports.array_chunks = array_chunks;
/**
 * Fetches a random item from the specified array
 */
function array_random(array_of_things) {
    if (!Array.isArray(array_of_things))
        throw new TypeError('\`array_of_things\` must be an array!');
    return array_of_things[random_range_inclusive(0, array_of_things.length - 1)];
}
exports.array_random = array_random;
/**
 * Clamps a number between a minimum and maximum value
 */
function math_clamp(value, min, max) {
    if (typeof value !== 'number')
        throw new TypeError('\`value\` must be a number');
    if (typeof min !== 'number')
        throw new TypeError('\`min\` must be a number');
    if (typeof max !== 'number')
        throw new TypeError('\`max\` must be a number');
    return Math.min(Math.max(value, min), max);
}
exports.math_clamp = math_clamp;
/**
 * Returns a valid discord timestamp from a unix timestamp
 */
function getMarkdownFriendlyTimestamp(timestamp) {
    if (typeof timestamp !== 'number')
        throw new TypeError('getMarkdownFriendlyTimestamp(): timestamp is not a number');
    return Math.floor(timestamp / 1000).toString(10);
}
exports.getMarkdownFriendlyTimestamp = getMarkdownFriendlyTimestamp;
//# sourceMappingURL=utilities.js.map