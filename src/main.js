#!/usr/bin/env node

import simpleGit from "simple-git";
import chalk from "chalk";
import inquirer from "inquirer";
import { showVersion } from "./version.js";

const git = simpleGit();

// Function for managing branches
async function manageBranches() {
  const branches = await git.branch();
  console.log(chalk.yellow("\n📂 Branches:"));
  branches.all.forEach((branch) => {
    const isCurrent = branch === branches.current ? chalk.greenBright("*") : " ";
    console.log(`  ${isCurrent} ${branch}`);
  });

  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "What do you want to do?",
      choices: ["Switch Branch", "Create Branch", "Back"],
    },
  ]);

  if (action === "Switch Branch") {
    const { targetBranch } = await inquirer.prompt([
      {
        type: "input",
        name: "targetBranch",
        message: "Enter the branch name to switch to:",
      },
    ]);
    await git.checkout(targetBranch);
    console.log(chalk.green(`✅ Switched to branch: ${targetBranch}`));
  } else if (action === "Create Branch") {
    const { newBranch } = await inquirer.prompt([
      {
        type: "input",
        name: "newBranch",
        message: "Enter the new branch name:",
      },
    ]);
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
  const { option } = await inquirer.prompt([
    {
      type: "list",
      name: "option",
      message: "⚠️ Undo options:",
      choices: [
        "Unstage all changes",
        "Discard all unstaged changes",
        "Reset to a previous commit",
        "Back",
      ],
    },
  ]);

  if (option === "Unstage all changes") {
    await git.reset(["--soft", "HEAD"]);
    console.log(chalk.green("✅ All changes unstaged."));
  } else if (option === "Discard all unstaged changes") {
    await git.clean("f", ["-d"]);
    console.log(chalk.green("✅ All unstaged changes discarded."));
  } else if (option === "Reset to a previous commit") {
    const { commitHash } = await inquirer.prompt([
      {
        type: "input",
        name: "commitHash",
        message: "Enter the commit hash to reset to:",
      },
    ]);
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
    const { remoteUrl } = await inquirer.prompt([
      {
        type: "input",
        name: "remoteUrl",
        message: "Enter the remote URL to add:",
      },
    ]);
    await git.addRemote("origin", remoteUrl);
    console.log(chalk.green("✅ Remote added successfully."));
  } else {
    console.log(chalk.yellow("\n🌐 Current remotes:"));
    remotes.forEach((remote) =>
      console.log(`  ${remote.name}: ${remote.refs.fetch}`)
    );
  }
}

// Function to check status
async function checkStatus() {
  const status = await git.status();
  console.log(chalk.blue("\n📋 Git Status:"));
  console.log(`  On branch: ${chalk.green(status.current)}`);
  console.log(`  Changes to be committed: ${status.staged.length}`);
  console.log(`  Changes not staged for commit: ${status.modified.length}`);
  console.log(`  Untracked files: ${status.not_added.length}`);
}

// Core Git workflow: stage, commit, push
async function runGitWorkflow() {
  try {
    const status = await git.status();

    if (
      status.not_added.length === 0 &&
      status.modified.length === 0 &&
      status.staged.length === 0
    ) {
      console.log(chalk.yellow("\n⚠️ No changes detected. Returning to main menu."));
      return;
    }

    console.log(chalk.yellow("\n🔍 Changes detected:"));
    console.log("Untracked files:", status.not_added);
    console.log("Modified files:", status.modified);

    const { stageAll } = await inquirer.prompt([
      {
        type: "confirm",
        name: "stageAll",
        message: "Stage all changes?",
      },
    ]);

    if (stageAll) {
      await git.add(".");
      console.log(chalk.green("✅ All changes staged."));
    }

    const updatedStatus = await git.status();
    if (updatedStatus.staged.length === 0) {
      console.log(chalk.yellow("\n⚠️ No changes staged. Returning to main menu."));
      return;
    }

    const { commitMessage } = await inquirer.prompt([
      {
        type: "input",
        name: "commitMessage",
        message: "Enter a commit message:",
      },
    ]);
    await git.commit(commitMessage);
    console.log(chalk.green(`✅ Committed with message: "${commitMessage}"`));

    const { confirmPush } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirmPush",
        message: "Do you want to push these changes to the remote repository?",
      },
    ]);

    if (confirmPush) {
      await git.push();
      console.log(chalk.green("✅ Pushed changes to remote."));
    } else {
      console.log(chalk.yellow("⚠️ Changes were not pushed to the remote."));
    }
  } catch (error) {
    console.error(chalk.red("❌ Error during workflow:"), error.message);
  }
}

// Main menu for the CLI
async function mainMenu() {
  const args = process.argv.slice(2);
  if (args.includes("--version")) {
    showVersion();
    return;
  }

  try {
    console.log(chalk.greenBright("\n🚀 Welcome to Git-Friend!"));

    while (true) {
      const { choice } = await inquirer.prompt([
        {
          type: "list",
          name: "choice",
          message: "Main Menu:",
          choices: [
            "Stage, Commit, and Push Changes",
            "Manage Branches",
            "Pull Latest Changes",
            "Reset/Undo Changes",
            "View Git Logs",
            "Check or Configure Remote",
            "Check Status",
            "Exit",
          ],
          pageSize: 10,
        },
      ]);

      if (choice === "Stage, Commit, and Push Changes") {
        await runGitWorkflow();
      } else if (choice === "Manage Branches") {
        await manageBranches();
      } else if (choice === "Pull Latest Changes") {
        await pullChanges();
      } else if (choice === "Reset/Undo Changes") {
        await resetChanges();
      } else if (choice === "View Git Logs") {
        await viewLogs();
      } else if (choice === "Check or Configure Remote") {
        await manageRemotes();
      } else if (choice === "Check Status") {
        await checkStatus();
      } else if (choice === "Exit") {
        console.log(chalk.green("\nGoodbye! 👋"));
        break;
      }
    }
  } catch (error) {
    console.error(chalk.red("\n❌ An error occurred:"), error.message);
  }
}

mainMenu();
