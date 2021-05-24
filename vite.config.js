import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import viteImagemin from "vite-plugin-imagemin";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh(), viteImagemin()],
});
