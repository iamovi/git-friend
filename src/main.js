import { Command } from "commander";
import simpleGit from "simple-git";
import chalk from "chalk";
import readline from "readline";

// Initialize Git client and readline
const git = simpleGit();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Helper for interactive prompts
const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

// Function for managing branches
async function manageBranches() {
  const branches = await git.branch();
  console.log(chalk.yellow("\n📂 Branches:"));
  branches.all.forEach((branch) => {
    const isCurrent = branch === branches.current ? chalk.greenBright("*") : " ";
    console.log(`  ${isCurrent} ${branch}`);
  });

  const action = await askQuestion("\nWhat do you want to do? (switch/create/back): ");
  if (action === "switch") {
    const targetBranch = await askQuestion("Enter the branch name to switch to: ");
    await git.checkout(targetBranch);
    console.log(chalk.green(`✅ Switched to branch: ${targetBranch}`));
  } else if (action === "create") {
    const newBranch = await askQuestion("Enter the new branch name: ");
    await git.checkoutLocalBranch(newBranch);
    console.log(chalk.green(`✅ Created and switched to branch: ${newBranch}`));
  }
}

// Function to pull changes
async function pullChanges() {
  console.log(chalk.blue("\n🔄 Pulling latest changes from remote..."));
  await git.pull();
  console.log(chalk.green("✅ Pulled latest changes successfully."));
}

// Function to reset changes
async function resetChanges() {
  console.log(chalk.yellow("\n⚠️ Undo options:"));
  console.log("1. Unstage all changes");
  console.log("2. Discard all unstaged changes");
  console.log("3. Reset to a previous commit");

  const option = await askQuestion("Choose an option (1/2/3): ");
  if (option === "1") {
    await git.reset(["--soft", "HEAD"]);
    console.log(chalk.green("✅ All changes unstaged."));
  } else if (option === "2") {
    await git.clean("f", ["-d"]);
    console.log(chalk.green("✅ All unstaged changes discarded."));
  } else if (option === "3") {
    const commitHash = await askQuestion("Enter the commit hash to reset to: ");
    await git.reset(["--hard", commitHash]);
    console.log(chalk.green(`✅ Reset to commit: ${commitHash}`));
  }
}

// Function to view logs
async function viewLogs() {
  const logs = await git.log({ n: 5 });
  console.log(chalk.blue("\n📜 Recent commits:"));
  logs.all.forEach((log) => {
    console.log(`${chalk.green(log.hash.slice(0, 7))} - ${log.message} (${log.date})`);
  });
}

// Function to manage remotes
async function manageRemotes() {
  const remotes = await git.getRemotes(true);
  if (remotes.length === 0) {
    console.log(chalk.red("\n⚠️ No remotes configured."));
    const remoteUrl = await askQuestion("Enter the remote URL to add: ");
    await git.addRemote("origin", remoteUrl);
    console.log(chalk.green("✅ Remote added successfully."));
  } else {
    console.log(chalk.yellow("\n🌐 Current remotes:"));
    remotes.forEach((remote) => console.log(`  ${remote.name}: ${remote.refs.fetch}`));
  }
}

// Main menu for the CLI
async function mainMenu() {
  try {
    console.log(chalk.greenBright("\n🚀 Welcome to Git-Friend!"));

    while (true) {
      console.log(chalk.cyan("\nMain Menu:"));
      console.log("1. Stage, Commit, and Push Changes");
      console.log("2. Manage Branches");
      console.log("3. Pull Latest Changes");
      console.log("4. Reset/Undo Changes");
      console.log("5. View Git Logs");
      console.log("6. Check or Configure Remote");
      console.log("7. Exit");

      const choice = await askQuestion("Choose an option (1-7): ");

      if (choice === "1") {
        await runGitWorkflow();
      } else if (choice === "2") {
        await manageBranches();
      } else if (choice === "3") {
        await pullChanges();
      } else if (choice === "4") {
        await resetChanges();
      } else if (choice === "5") {
        await viewLogs();
      } else if (choice === "6") {
        await manageRemotes();
      } else if (choice === "7") {
        console.log(chalk.green("\nGoodbye! 👋"));
        rl.close();
        break;
      } else {
        console.log(chalk.red("❌ Invalid option. Please choose again."));
      }
    }
  } catch (error) {
    console.error(chalk.red("\n❌ An error occurred:"), error.message);
    rl.close();
  }
}

// Core Git workflow: stage, commit, push
async function runGitWorkflow() {
  try {
    const status = await git.status();
    console.log(chalk.yellow("\n🔍 Changes detected:"));
    console.log("Untracked files:", status.not_added);
    console.log("Modified files:", status.modified);

    const stageAll = await askQuestion("\nStage all changes? (y/n): ");
    if (stageAll.toLowerCase() === "y") {
      await git.add(".");
      console.log(chalk.green("✅ All changes staged."));
    }

    const commitMessage = await askQuestion("Enter a commit message: ");
    await git.commit(commitMessage);
    console.log(chalk.green(`✅ Committed with message: "${commitMessage}"`));

    const confirmPush = await askQuestion("\nDo you want to push these changes to the remote repository? (y/n): ");
    if (confirmPush.toLowerCase() === "y") {
      await git.push();
      console.log(chalk.green("✅ Pushed changes to remote."));
    } else {
      console.log(chalk.yellow("⚠️ Changes were not pushed to the remote."));
    }
  } catch (error) {
    console.error(chalk.red("❌ Error during workflow:"), error.message);
  }
}


// Start the CLI
mainMenu();
