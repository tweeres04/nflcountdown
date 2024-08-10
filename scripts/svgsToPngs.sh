#!/bin/bash

BASE_DIR="public/logos/"

# Convert SVG to PNG with a size of 512x512 pixels
for file in ${BASE_DIR}*.svg; do
  if [ -f "$file" ]; then
    convert -background none -resize 512x512 "$file" "${file%.*}.png"
  fi
done

echo "SVG to PNG conversion complete!"