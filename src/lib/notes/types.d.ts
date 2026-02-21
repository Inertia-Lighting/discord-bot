import { Prisma } from '../prisma/client.ts'


interface FullNote extends Prisma.NotesModel {
    notedUser: Prisma.UserModel
    staffUser: Prisma.UserModel
}
