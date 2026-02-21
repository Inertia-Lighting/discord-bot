import { Prisma } from '../prisma/client.js'


interface FullPunishment extends Prisma.PunishmentsModel {
    punishedUser: Prisma.UserModel
    staffUser: Prisma.UserModel
}
