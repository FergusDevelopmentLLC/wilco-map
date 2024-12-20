#!/bin/bash

CONFIG_FILE="$1"

# Load configurations
SCRIPT_FOLDER=$(jq -r '.script.script_folder' "$CONFIG_FILE")
OUTPUT_FOLDER=$(jq -r '.output.output_folder' "$CONFIG_FILE")
LOG_FOLDER=$(jq -r '.log.log_folder' "$CONFIG_FILE")
LOG_FILE=$(jq -r '.log.log_file' "$CONFIG_FILE")
S3_BUCKET=$(jq -r '.aws.s3_bucket' "$CONFIG_FILE")

# Function to log messages with timestamps
log_msg() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $(basename "$0") - $1" | tee -a "$LOG_FOLDER/$LOG_FILE"
}

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

    # Prepare and log the command
    cmd="node \"$SCRIPT_FOLDER/generateSprite.js\" \"$SCRIPT_FOLDER/generate_sprite_config.json\" \"$base_map\" \"$sprite_version\" \"$output_dir\""
    log_msg "Executing: $cmd"

    # Execute the command and capture output
    if output=$(eval "$cmd" 2>&1); then
        # Check that the output directory contains files
        if [ -n "$(ls -A "$output_dir" 2>/dev/null)" ]; then
            log_msg "Successfully generated sprite for base map: $base_map, version: $sprite_version"
        else
            log_msg "ERROR: Sprite generation succeeded but $output_dir is empty."
            exit 1
        fi
    else
        log_msg "Error generating sprite for base map: $base_map, version: $sprite_version"
        log_msg "Node output: $output"
        exit 1
    fi
done

# Upload to S3 bucket
if [ -n "$S3_BUCKET" ]; then
    log_msg "Uploading generated contents of $OUTPUT_FOLDER to S3 bucket: $S3_BUCKET"

    if aws s3 sync "$OUTPUT_FOLDER" "s3://$S3_BUCKET" --delete; then
        log_msg "Successfully uploaded contents to S3 bucket: $S3_BUCKET"
    else
        log_msg "ERROR: Failed to upload contents to S3 bucket: $S3_BUCKET"
        exit 1
    fi
else
    log_msg "ERROR: S3 bucket is not defined in the config file."
    exit 1
fi