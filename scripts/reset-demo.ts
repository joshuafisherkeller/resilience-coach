import { loadConfig } from "../src/config.js";
import { createRepository } from "../src/repository.js";

const config = loadConfig();
const repository = createRepository(config);
await repository.resetSyntheticDemo();
console.log("Reset three synthetic demo profiles, insights, and safety handoffs.");
