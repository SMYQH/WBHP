import { registerPlugin } from "../registry";

import TimeWidget from "./time";
import GreetingWidget from "./greeting";
import SearchWidget from "./search";
import LinksWidget from "./links";
import WeatherWidget from "./weather";
import TodoWidget from "./todo";
import NotesWidget from "./notes";
import QuoteWidget from "./quote";
import WorldClockWidget from "./worldclock";

export {
  TimeWidget,
  GreetingWidget,
  SearchWidget,
  LinksWidget,
  WeatherWidget,
  TodoWidget,
  NotesWidget,
  QuoteWidget,
  WorldClockWidget,
};

// Self-register on import
registerPlugin(TimeWidget);
registerPlugin(GreetingWidget);
registerPlugin(SearchWidget);
registerPlugin(LinksWidget);
registerPlugin(WeatherWidget);
registerPlugin(TodoWidget);
registerPlugin(NotesWidget);
registerPlugin(QuoteWidget);
registerPlugin(WorldClockWidget);

