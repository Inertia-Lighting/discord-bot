'use strict';

//---------------------------------------------------------------------------------------------------------------//

/**
 * Asynchronous setTimeout b/c I'm too lazy to type it out everywhere
 * @param {Number} time_in_milliseconds 
 * @returns {Promise} 
 */
function Timer(time_in_milliseconds) {
    return new Promise((resolve, reject) => setTimeout(resolve, time_in_milliseconds));
}

/**
 * Ellipses a string if it exceeds a specified length
 * @param {String} string_to_ellipses 
 * @param {Number} output_length_limit 
 * @returns {String} 
 */
function string_ellipses(string_to_ellipses='', output_length_limit=Number.MAX_SAFE_INTEGER) {
    const ellipses = '...';
    const shortened_string = string_to_ellipses.slice(0, output_length_limit - ellipses.length);
    return `${shortened_string}${shortened_string.length < string_to_ellipses.length ? ellipses : ''}`;
}

/**
 * Sorts an object based on it's keys (using Array.sort()) and returns the new sorted object
 * @param {Object} object_of_things 
 * @returns {Object} 
 */
function object_sort(object_of_things) {
    return Object.keys(object_of_things).sort().reduce((r, k) => (r[k] = object_of_things[k], r), {});
}

/**
 * Splits a large array into an array of chunks
 * @param {Array<*>} array_of_things 
 * @param {Number} chunk_size 
 * @returns {Array<Array<*>>} 
 */
function array_chunks(array_of_things, chunk_size) {
    const array_of_things_clone = [ ...array_of_things ];
    let chunks = [];
    while (array_of_things_clone.length) {
        chunks.push(array_of_things_clone.splice(0, chunk_size));
    }
    return chunks;
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    Timer,
    string_ellipses,
    object_sort,
};
