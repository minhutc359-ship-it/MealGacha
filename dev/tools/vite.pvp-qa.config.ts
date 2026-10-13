import { defineConfig, mergeConfig } from "vite"
import production from "../../vite.config"
// QA runs fixed modules: writing release records must not reload an active host.
export default defineConfig(
  mergeConfig(production, { server: { hmr: false, watch: null } }),
)
