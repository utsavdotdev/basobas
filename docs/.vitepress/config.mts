import { defineConfig } from "vitepress";

const repositoryName =
  process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "basobas";
const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === "true";

export default defineConfig({
  title: "BasoBas Docs",
  description: "Project documentation for BasoBas",
  srcDir: ".",
  base: isGitHubPagesBuild ? `/${repositoryName}/` : "/",
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: "Home", link: "/" },
      { text: "General Guide", link: "/general" },
    ],
    sidebar: [
      {
        text: "Documentation",
        items: [
          { text: "Overview", link: "/" },
          { text: "General Guide", link: "/general" },
        ],
      },
    ],
  },
});
