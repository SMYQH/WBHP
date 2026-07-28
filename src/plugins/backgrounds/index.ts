import { registerPlugin } from "../registry";

import ColorBg from "./color";
import GradientBg from "./gradient";
import CustomBg from "./custom";
import PresetBg from "./preset";

export { ColorBg, GradientBg, CustomBg, PresetBg };

registerPlugin(ColorBg);
registerPlugin(GradientBg);
registerPlugin(CustomBg);
registerPlugin(PresetBg);
