import { registerPlugin } from "../registry";
// PluginConfig type not needed here — plugins self-register via default export

import ColorBg from "./color";
import GradientBg from "./gradient";
import UnsplashBg from "./unsplash";

export { ColorBg, GradientBg, UnsplashBg };

registerPlugin(ColorBg);
registerPlugin(GradientBg);
registerPlugin(UnsplashBg);
