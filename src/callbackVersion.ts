import https from "node:https";

const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=-26.2&longitude=28.04&current_weather=true";
const NEWS_URL = "https://dummyjson.com/posts?limit=5";

type Callback<T> = (error: Error | null, data?: T) => void;

interface Weather {
  current_weather: { temperature: number; windspeed: number };
}
interface News {
  posts: { id: number; title: string }[];
}

// Generic helper: GET a URL and return parsed JSON through a callback
function getJSON<T>(url: string, label: string, callback: Callback<T>): void {
  https
    .get(url, (res) => {
      let body = "";

      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        if (res.statusCode !== 200) {
          return callback(
            new Error(`${label} request failed (status ${res.statusCode})`)
          );
        }
        try {
          callback(null, JSON.parse(body) as T);
        } catch {
          callback(new Error(`${label} returned invalid JSON`));
        }
      });
    })
    .on("error", (err) => {
      callback(new Error(`${label} request failed (${err.message})`));
    });
}

function getWeather(callback: Callback<Weather>): void {
  getJSON<Weather>(WEATHER_URL, "Weather", callback);
}

function getNews(callback: Callback<News>): void {
  getJSON<News>(NEWS_URL, "News", callback);
}

// CALLBACK HELL: each dependent call is nested inside the previous one
console.log("Fetching weather...");

getWeather((weatherError, weather) => {
  if (weatherError || !weather) {
    console.log("❌ Error:", weatherError?.message);
    return;
  }
  console.log("\n🌤  Weather in Johannesburg");
  console.log(`   Temperature: ${weather.current_weather.temperature}°C`);
  console.log(`   Wind speed:  ${weather.current_weather.windspeed} km/h`);

  console.log("\nFetching news...");

  getNews((newsError, news) => {
    if (newsError || !news) {
      console.log("❌ Error:", newsError?.message);
      return;
    }
    console.log("\n📰 Latest headlines");
    news.posts.forEach((post, i) => {
      console.log(`   ${i + 1}. ${post.title}`);
    });

    console.log("\n✅ Done (weather -> news, nested callbacks)");
  });
});