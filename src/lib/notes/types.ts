import { Prisma } from '../prisma/client.js'


export interface FullNote extends Prisma.NotesModel {
    notedUser: Prisma.UserModel
    staffUser: Prisma.UserModel
}
