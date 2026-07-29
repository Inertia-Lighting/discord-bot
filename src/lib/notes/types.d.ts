/* -------------------------------------------------------------------------- */
/*            Copyright (c) Inertia Lighting, Some Rights Reserved            */
/* -------------------------------------------------------------------------- */

/* ------------------------------ Dependencies ------------------------------ */

import { Prisma } from '../prisma/client.ts'

/* ------------------------------- Definition ------------------------------- */

interface FullNote extends Prisma.NotesModel {
    notedUser: Prisma.UserModel
    staffUser: Prisma.UserModel
}
