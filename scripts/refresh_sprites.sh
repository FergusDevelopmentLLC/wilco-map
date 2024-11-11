#!/bin/bash

CONFIG_FILE="$1"

# Load configurations
OUTPUT_FOLDER=$(jq -r '.output.output_folder' "$CONFIG_FILE")
SCRIPT_FOLDER=$(jq -r '.script.script_folder' "$CONFIG_FILE")
LOG_FOLDER=$(jq -r '.log.log_folder' "$CONFIG_FILE")
LOG_FILE=$(jq -r '.log.log_file' "$CONFIG_FILE")

# Function to log messages with timestamps
log_msg() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $(basename "$0") - $1" | tee -a "$LOG_FOLDER/$LOG_FILE"
}

# Load the .env file and check for errors
if [ -f "$SCRIPT_FOLDER"/scripts/.env ]; then
    if ! export $(grep -v '^#' "$SCRIPT_FOLDER"/scripts/.env | xargs); then
        log_msg "ERROR: Failed to load environment variables from .env file."
        exit 1
    fi
else
    log_msg "ERROR: .env file not found in $SCRIPT_FOLDER/scripts/."
    exit 1
fi

# Ensure GITHUB_PAT is set as an environment variable
if [ -z "$GITHUB_PAT" ]; then
    log_msg "Error: GITHUB_PAT environment variable is not set."
    exit 1
fi

# Git commands with timestamp
timestamp=$(date +"%Y-%m-%d %H:%M:%S")

# Fruit names array
fruits=("Apple" "Banana" "Cherry" "Date" "Elderberry" "Fig" "Grape" "Honeydew" "Kiwi" "Lemon")
# Select a random fruit
random_fruit=${fruits[RANDOM % ${#fruits[@]}]}

# Check if $OUTPUT_FOLDER exists and is not empty
if [ -d "$OUTPUT_FOLDER" ]; then
    if [ "$(ls -A "$OUTPUT_FOLDER")" ]; then
        log_msg "WARNING: $OUTPUT_FOLDER is not empty. Deleting all contents before proceeding."
        rm -rf "${OUTPUT_FOLDER:?}/"*
        log_msg "All files and folders in $OUTPUT_FOLDER have been deleted."
    else
        log_msg "$OUTPUT_FOLDER is empty. Proceeding with sprite generation."
    fi
else
    log_msg "Error: $OUTPUT_FOLDER does not exist. Exiting."
    exit 1
fi

# Prepare commit message
commit_msg="${random_fruit} - Cleared generated folder ${timestamp}"

# Write the commit message to a file
echo "$commit_msg" > "$SCRIPT_FOLDER/scripts/commit_msg.txt"

# Perform Git operations with enhanced logging
log_msg "Performing git operations in $SCRIPT_FOLDER..."
cd "$SCRIPT_FOLDER" || { log_msg "Error: Failed to change directory to $SCRIPT_FOLDER"; exit 1; }

# git add with error handling
log_msg "Performing: git add ."
if git_output=$(git add . 2>&1); then
    log_msg "git add completed successfully."
else
    log_msg "Error: git add failed. Output: $git_output"
    exit 1
fi

# Log the commit message before committing
log_msg "Committing changes with message: $commit_msg"

# Commit changes using commit_msg.txt content as the commit message
if git_output=$(git commit -F "$SCRIPT_FOLDER/scripts/commit_msg.txt" 2>&1); then
    log_msg "Commit completed successfully."
    # Clear commit_msg.txt after a successful commit
    > "$SCRIPT_FOLDER/scripts/commit_msg.txt"
else
    log_msg "Error: git commit failed. Full output: $git_output"
    exit 1
fi

# git push with error handling
log_msg "Pushing changes to GitHub..."
if git_output=$(git push https://$GITHUB_PAT@github.com/FergusDevelopmentLLC/wilco-map.git 2>&1); then
    log_msg "Changes successfully pushed to GitHub."
else
    log_msg "Error: git push failed. Output: $git_output"
    exit 1
fi

# List of map configurations to process
map_configs=(
    "dark-v10 sprite ${OUTPUT_FOLDER}/dark-v10"
    "dark-v10 sprite@2x ${OUTPUT_FOLDER}/dark-v10"
    "light-v10 sprite ${OUTPUT_FOLDER}/light-v10"
    "light-v10 sprite@2x ${OUTPUT_FOLDER}/light-v10"
    "outdoors-v11 sprite ${OUTPUT_FOLDER}/outdoors-v11"
    "outdoors-v11 sprite@2x ${OUTPUT_FOLDER}/outdoors-v11"
    "satellite-streets-v11 sprite ${OUTPUT_FOLDER}/satellite-streets-v11"
    "satellite-streets-v11 sprite@2x ${OUTPUT_FOLDER}/satellite-streets-v11"
    "streets-v11 sprite ${OUTPUT_FOLDER}/streets-v11"
    "streets-v11 sprite@2x ${OUTPUT_FOLDER}/streets-v11"
)

# Run the generateSprite script for each configuration
for config in "${map_configs[@]}"; do
    # Split the config string into variables
    read -r base_map sprite_version output_dir <<< "$config"

    # Log the start of processing for each map configuration
    log_msg "Starting sprite generation for base map: $base_map, version: $sprite_version, output directory: $output_dir"

    # Run the node command and capture output
    if output=$(node "$SCRIPT_FOLDER/refreshSprite.js" "$base_map" "$sprite_version" "$output_dir" 2>&1); then
        log_msg "Successfully generated sprite for base map: $base_map, version: $sprite_version"
    else
        log_msg "Error generating sprite for base map: $base_map, version: $sprite_version"
        log_msg "Node output: $output"
    fi
done

# Prepare commit message
commit_msg="${random_fruit} - New sprite generated ${timestamp}"

# Write the commit message to a file
echo "$commit_msg" > "$SCRIPT_FOLDER/scripts/commit_msg.txt"

# Perform Git operations with enhanced logging
log_msg "Performing git operations in $SCRIPT_FOLDER..."
cd "$SCRIPT_FOLDER" || { log_msg "Error: Failed to change directory to $SCRIPT_FOLDER"; exit 1; }

# git add with error handling
log_msg "Performing: git add ."
if git_output=$(git add . 2>&1); then
    log_msg "git add completed successfully."
else
    log_msg "Error: git add failed. Output: $git_output"
    exit 1
fi

# Log the commit message before committing
log_msg "Committing changes with message: $commit_msg"

# Commit changes using commit_msg.txt content as the commit message
if git_output=$(git commit -F "$SCRIPT_FOLDER/scripts/commit_msg.txt" 2>&1); then
    log_msg "Commit completed successfully."
    # Clear commit_msg.txt after a successful commit
    > "$SCRIPT_FOLDER/scripts/commit_msg.txt"
else
    log_msg "Error: git commit failed. Full output: $git_output"
    exit 1
fi

# git push with error handling
log_msg "Pushing changes to GitHub..."
if git_output=$(git push https://$GITHUB_PAT@github.com/FergusDevelopmentLLC/wilco-map.git 2>&1); then
    log_msg "Changes successfully pushed to GitHub."
else
    log_msg "Error: git push failed. Output: $git_output"
    exit 1
fi