import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import { Topia, DroppedAssetFactory, EcosystemFactory, VisitorFactory, WorldFactory } from "@rtsdk/topia";

const config = {
  apiDomain: process.env.INSTANCE_DOMAIN || "api.topia.io",
  apiKey: process.env.API_KEY,
  apiProtocol: process.env.INSTANCE_PROTOCOL || "https",
  interactiveKey: process.env.INTERACTIVE_KEY,
  interactiveSecret: process.env.INTERACTIVE_SECRET,
};

const myTopiaInstance = await new Topia(config);

const DroppedAsset = new DroppedAssetFactory(myTopiaInstance);
const Ecosystem = new EcosystemFactory(myTopiaInstance);
const Visitor = new VisitorFactory(myTopiaInstance);
const World = new WorldFactory(myTopiaInstance);

export { DroppedAsset, Ecosystem, Visitor, World };
