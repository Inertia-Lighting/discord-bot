import { Prisma } from '../prisma/client.ts'


interface FullPunishment extends Prisma.PunishmentsModel {
    punishedUser: Prisma.UserModel
    staffUser: Prisma.UserModel
}
