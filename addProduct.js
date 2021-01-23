const mongo = require('./mongo');
const productSchema = require('./schemas/productSchema');

async function main() {
    await mongo();
    await productSchema.findOneAndUpdate({
        'id': '',
    }, {
        'id': '',
        'code': '',
        'name': '',
        'discord_role_id': '',
        'description': '',
    }, {
        upsert: true
    });
}

main();