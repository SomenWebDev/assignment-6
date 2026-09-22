import { PrismaPg } from "@prisma/adapter-pg";

import config from "../config";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: config.database_url });
const prisma = new PrismaClient({ adapter });

export default prisma;
