import { registerPlugin } from "../registry";
// PluginConfig type not needed here — plugins self-register via default export

import TimeWidget from "./time";
import GreetingWidget from "./greeting";
import SearchWidget from "./search";
import LinksWidget from "./links";
import WeatherWidget from "./weather";

export { TimeWidget, GreetingWidget, SearchWidget, LinksWidget, WeatherWidget };

// Self-register on import
registerPlugin(TimeWidget);
registerPlugin(GreetingWidget);
registerPlugin(SearchWidget);
registerPlugin(LinksWidget);
registerPlugin(WeatherWidget);
