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
if [ -f "$SCRIPT_FOLDER"/.env ]; then
    if ! export $(grep -v '^#' "$SCRIPT_FOLDER"/.env | xargs); then
        log_msg "ERROR: Failed to load environment variables from .env file."
        exit 1
    fi
else
    log_msg "ERROR: .env file not found in $SCRIPT_FOLDER."
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

    # Run the node command and log success or failure
    if node "$SCRIPT_FOLDER/generateSprite.js" "$base_map" "$sprite_version" "$output_dir"; then
        log_msg "Successfully generated sprite for base map: $base_map, version: $sprite_version"
    else
        log_msg "Error generating sprite for base map: $base_map, version: $sprite_version"
    fi
done

# Git commands with timestamp
timestamp=$(date +"%Y-%m-%d %H:%M:%S")

# Ensure GITHUB_PAT is set as an environment variable
if [ -z "$GITHUB_PAT" ]; then
    log_msg "Error: GITHUB_PAT environment variable is not set."
    exit 1
fi

# Perform Git operations
cd "$SCRIPT_FOLDER" || exit
git add .
git commit -m "new sprite generated ${timestamp}"
git push https://$GITHUB_PAT@github.com/FergusDevelopmentLLc/wilco-map.git