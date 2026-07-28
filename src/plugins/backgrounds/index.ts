import { registerPlugin } from "../registry";

import ColorBg from "./color";
import GradientBg from "./gradient";
import CustomBg from "./custom";
import PresetBg from "./preset";
import BingBg from "./bing";

export { ColorBg, GradientBg, CustomBg, PresetBg, BingBg };

registerPlugin(ColorBg);
registerPlugin(GradientBg);
registerPlugin(CustomBg);
registerPlugin(PresetBg);
registerPlugin(BingBg);
