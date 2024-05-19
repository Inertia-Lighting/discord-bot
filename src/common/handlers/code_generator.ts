//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//  No imports

//------------------------------------------------------------//

const word_array = ['white', 'black', 'source', 'inertia', 'green', 'copy', 'recovery', 'possible', 'new', 'native', 'rocks', 'apple', 'pear', 'tree', 'quackers', 'aiden', 'cole', 'cheese', 'pizza', 'man', 'roz', 'frost', 'transfer', 'ticket', 'products', 'alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliette', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa', 'quebec', 'romeo', 'sierra', 'tango', 'uniform', 'victor', 'whiskey', 'x-ray', 'yankee', 'zulu'];

//------------------------------------------------------------//
export async function generateVerificationCode(): Promise<string> {
    let code: string = '';
    for (let i = 0; i < 10; i++) {
        if (i === 5) {
            code += '\n';
        }
        code += `${word_array[Math.floor(Math.random()*word_array.length)]} `;
    }
    return code;
}
