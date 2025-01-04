import fs from "fs";
import path from "path";
import axios from "axios";
import chalk from "chalk";

// Function to display the current version and check for updates
export async function showVersion() {
  try {
    // Resolve the path to package.json
    const packagePath = path.resolve("./package.json");
    const packageData = JSON.parse(fs.readFileSync(packagePath, "utf8"));
    const currentVersion = packageData.version;
    const packageName = "git-friend"; // Manually set the package name here

    console.log(chalk.greenBright(`Git-Friend Version: ${currentVersion}`));

    // Fetch the latest version from the npm registry
    console.log(chalk.blue("🔄 Checking for updates..."));
    const response = await axios.get(`https://registry.npmjs.org/${packageName}`);
    const latestVersion = response.data["dist-tags"].latest;

    if (latestVersion !== currentVersion) {
      console.log(
        chalk.yellow(
          `⚠️ A new version (${latestVersion}) is available. Please update by running:\n\n` +
            `npm update -g ${packageName}\n`
        )
      );
    } else {
      console.log(chalk.green("✅ You are using the latest version."));
    }
  } catch (error) {
    console.error(chalk.red("❌ Error checking for updates:"), error.message);
  }
}
