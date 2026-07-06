// Dogfooding: o lint deste pacote usa o preset que ele mesmo exporta
// (self-reference via campo "exports" do package.json).
import { base } from "@psiops/config/eslint";

export default [...base];
