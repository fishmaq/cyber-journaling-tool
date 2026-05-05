import {PrismaClient} from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: "postgresql://cyber-journaling:cyber-journaling@localhost:5433/cyber-journaling",
});

const prisma = new PrismaClient({adapter: adapter})
export default prisma