import { updateAllMembershipStates } from "../src/jobs/updateMembershipStates.js";

const isMainModule =
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"));

if (isMainModule) {
  updateAllMembershipStates({ closePool: true })
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(`[${new Date().toISOString()}] Error:`, error.message);
      process.exit(1);
    });
}

export { updateAllMembershipStates };
