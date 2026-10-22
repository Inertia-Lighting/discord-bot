/* -------------------------------------------------------------------------- */
/*            Copyright (c) Inertia Lighting, Some Rights Reserved            */
/* -------------------------------------------------------------------------- */

/* ------------------------------ Dependencies ------------------------------ */

import { Prisma } from '../prisma/client.ts'

/* ------------------------------- Definition ------------------------------- */

interface FullPunishment extends Prisma.PunishmentsModel {
    punishedUser: Prisma.UserModel
    staffUser: Prisma.UserModel
}
