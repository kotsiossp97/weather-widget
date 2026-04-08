import { WeatherWidget } from "./index";
import "./styles/demo.css";

const coordinates = { lat: 35.1856, lon: 33.3823, name: "Nicosia" };
const multiLocations = [
  coordinates,
  { lat: 34.6937, lon: 33.0445, name: "Limassol" },
  { lat: 35.3387, lon: 25.1442, name: "Heraklion" },
];

new WeatherWidget({
  locations: multiLocations,
  theme: "light",
  density: "compact",
  modules: {
    hourly: { enabled: false, hours: 6, stepHours: 1 },
    daily: { enabled: true, days: 3 },
    details: {
      enabled: true,
      fields: ["cloudCover", "shortwaveRadiation", "feelsLike"],
    },
  },
  showUpdatedAt: false,
}).mount("#demo-compact");

new WeatherWidget({
  location: coordinates,
  layout: "card",
  theme: "auto",
  icons: { colorMode: "themed" },
  modules: {
    hourly: { enabled: true, hours: 12, stepHours: 1 },
    daily: { enabled: true, days: 5 },
    details: {
      enabled: true,
      fields: ["feelsLike", "humidity", "wind", "precip", "uv"],
    },
  },
}).mount("#demo-card");

new WeatherWidget({
  location: coordinates,
  layout: "forecast",
  theme: "dark",
  icons: { colorMode: "themed" },
  refreshMinutes: 30,
  modules: {
    hourly: { enabled: true, hours: 24, stepHours: 1 },
    daily: { enabled: true, days: 7 },
    details: {
      enabled: true,
      fields: ["wind", "humidity", "sunrise", "sunset"],
    },
  },
}).mount("#demo-forecast");

new WeatherWidget({
  location: coordinates,
  layout: "horizontal",
  theme: "auto",
  density: "compact",
  icons: { style: "animated", colorMode: "colored" },
  modules: {
    current: true,
    daily: { enabled: true, days: 7 },
  },
}).mount("#demo-horizontal");
