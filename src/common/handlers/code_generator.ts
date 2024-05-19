//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//  No imports

//------------------------------------------------------------//

const word_array = ['inertia', 'recovery', 'lighting', 'white', 'black', 'source', 'green', 'copy', 'possible', 'new', 'native', 'rocks', 'apple', 'pear', 'tree', 'quackers', 'aiden', 'cole', 'cheese', 'pizza', 'man', 'roz', 'frost', 'transfer', 'ticket', 'products', 'alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliette', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa', 'quebec', 'romeo', 'sierra', 'tango', 'uniform', 'victor', 'whiskey', 'x-ray', 'yankee', 'zulu'];
const special_word_array = ['inertia', 'recovery', 'lighting'];
//------------------------------------------------------------//
export async function generateVerificationCode(): Promise<string> {
    const code_length = 10;
    let code: string = '';
    const random_places:Array<string> = [];
    for (let i = 0; i < 3; i++) {
        random_places.push(Math.floor(Math.random()*code_length).toString());
    }

    for (let i = 0; i < code_length; i++) {
        const find_query = random_places.find((element) => element === i.toString());
        if (i === 5) {
            code += '\n';
        }
        if (find_query) {
            code += `${special_word_array[Math.floor(Math.random()*special_word_array.length)]} `;
        } else {

            code += `${word_array[Math.floor(Math.random()*word_array.length)]} `;
        }
    }
    return code;
}
