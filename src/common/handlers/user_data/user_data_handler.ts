import { DbUserData, DbUserDataArray } from '@root/types';

export async function dbUserArray(
    db_user_data: DbUserData
): Promise<DbUserDataArray> {
    const product_array: string[] = Object.keys(db_user_data.products).filter(product => db_user_data.products[product]);
    return {
        _id: db_user_data._id,
    identity: db_user_data.identity,
    lumens: db_user_data.lumens,
    products: product_array,
    };
}
