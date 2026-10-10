import type { CapacitorConfig } from "@capacitor/cli"
const config: CapacitorConfig = {
  appId: "io.github.minhutc359.soulofmeal",
  appName: "Soul of Meal",
  webDir: "dist",
  android: { allowMixedContent: false },
  server: { androidScheme: "https", hostname: "localhost" },
}
export default config
