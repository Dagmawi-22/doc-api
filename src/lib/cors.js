import Cors from "cors";
import initMiddleware from "./init-middleware";

const cors = Cors({
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  origin: "*",
});

export default initMiddleware(cors);
