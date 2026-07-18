import { createConfiguredServer } from "./server.js";

// Vercel recognizes a default-exported Express app at src/index.ts and wraps
// it in one Node.js Function. Local development continues to use server.ts.
const app = createConfiguredServer();

export default app;
