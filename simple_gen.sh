#!/bin/bash

SRC_DIR="frontend/src"
DOCS_DIR="docs/frontend-reference"

mkdir -p "$DOCS_DIR"

# Create a simple index of all files
echo "# Aqualyn Frontend File Reference" > "$DOCS_INDEX"
echo "" >> "$DOCS_INDEX"

find "$SRC_DIR" -type f \( -name "*.ts" -o -name "*.tsx" \) | sort | while read -r file; do
    rel_path="${file#$SRC_DIR/}"
    echo "- [$rel_path](#$(echo "$rel_path" | tr '/' '-' | tr '.' '-'))" >> "$DOCS_INDEX"
done

# Create individual file references
find "$SRC_DIR" -type f \( -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
    rel_path="${file#$SRC_DIR/}"
    md_path="$DOCS_DIR/$(echo "$rel_path" | tr '/' '-')"
    md_path="${md_path%.tsx}.md"
    md_path="${md_path%.ts}.md"
    
    mkdir -p "$(dirname "$md_path")"
    
    {
        echo "# $rel_path"
        echo ""
        echo "## File Location"
        echo "\`$file\`"
        echo ""
        echo "## Purpose"
        echo "See implementation below for details."
        echo ""
        echo "## Implementation"
        echo ""
        echo "\`\`\`typescript"
        cat "$file"
        echo "\`\`\`"
    } > "$md_path"
    
    echo "Generated: $md_path"
done

echo "Reference generation complete. Files are in $DOCS_DIR"
echo "Index created at: $DOCS_INDEX"