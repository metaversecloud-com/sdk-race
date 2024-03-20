import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import router from "./routes.js";

const app = express();

import { cleanReturnPayload } from "./utils/cleanReturnPayload.js";
import { fileURLToPath } from "url";
dotenv.config({ path: "../.env" });

function checkEnvVariables() {
  const requiredEnvVariables = ["INTERACTIVE_KEY", "INTERACTIVE_SECRET"];
  const missingVariables = requiredEnvVariables.filter((variable) => !process.env[variable]);

  if (missingVariables.length > 0) {
    throw new Error(`Missing required environment variables in the .env file: ${missingVariables.join(", ")}`);
  } else {
    console.log("All required environment variables provided.");
  }
}
checkEnvVariables();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cors());

app.use(function (req, res, next) {
  const ogSend = res.send;
  res.send = function (data) {
    if (data) {
      try {
        const cleanData = cleanReturnPayload(typeof data === "string" ? JSON.parse(data) : data, "topia");
        res.send = ogSend;
        return res.send(cleanData);
      } catch (error) {
        console.log(error);
        next();
      }
    }
  };
  next();
});

app.use("/api", router);

if (process.env.NODE_ENV !== "development") {
  // Node serves the files for the React app
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  app.use(express.static(path.resolve(__dirname, "../client/build")));

  // All other GET requests not handled before will return our React app
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../client/build", "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
