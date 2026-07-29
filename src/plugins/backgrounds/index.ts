import { registerPlugin } from "../registry";

import CustomBg from "./custom";
import PresetBg from "./preset";
import BingBg from "./bing";

export { CustomBg, PresetBg, BingBg };

registerPlugin(CustomBg);
registerPlugin(PresetBg);
registerPlugin(BingBg);

