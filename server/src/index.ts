import { app } from "./app";
import { environment } from "./config/env";
import { logger } from "./logger";

const PORT = environment.port;

logger.info(
  {
    nodeEnv: environment.nodeEnv,
    clientUrl: environment.clientUrl,
  },
  "Server configuration loaded"
);

app.listen(PORT, () => {
  logger.info({ port: PORT }, "Local server started 🚀");
});

export default app;
