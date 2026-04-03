
import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  earlyAccess: true,
  schema: path.join("prisma", "schema.prisma"),
  migrate: {
    //url: "postgresql://postgres:postgres@localhost:5432/basketballapp",
    url: "postgresql://postgres:IklMTppGnORhRmSfEISewzXWgvSXCkbE@postgres.railway.internal:5432/basketballapp",
  },
});