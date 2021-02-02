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

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    Timer,
    string_ellipses,
};
