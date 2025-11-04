import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@prisma/client"],
              message: "Import Prisma from @/lib/prisma/server (app) or ./lib/prisma/client (scripts) instead",
              allowTypeImports: true,
            },
          ],
          paths: [
            {
              name: "@/lib/prisma/server",
              message: "Cannot import @/lib/prisma/server from client components. Use server components or API routes only.",
              importNames: ["prisma"],
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
