#!/bin/bash

SRC_DIR="frontend/src"
DOCS_DIR="docs/frontend-reference"

# Create docs directory
mkdir -p "$DOCS_DIR"

# Create or overwrite the index file
echo "# Aqualyn Frontend File Reference" > "$DOCS_DIR/README.md"
echo "" >> "$DOCS_DIR/README.md"

# Find all TypeScript and TSX files
find "$SRC_DIR" -type f \( -name "*.ts" -o -name "*.tsx" \) | while IFS= read -r file; do
    # Get path relative to SRC_DIR
    rel_path="${file#$SRC_DIR/}"
    if [ -z "$rel_path" ]; then
        continue
    fi
    
    # Split into directory and filename
    rel_dir=$(dirname "$rel_path")
    base=$(basename "$rel_path")
    name="${base%.*}"  # Remove extension
    
    # Normalize directory (remove "." if present)
    if [ "$rel_dir" = "." ]; then
        rel_dir=""
    fi
    
    # Build markdown file path
    if [ -z "$rel_dir" ]; then
        md_file="$DOCS_DIR/${name}.md"
        link_path="${name}.md"
    else
        md_file="$DOCS_DIR/${rel_dir}/${name}.md"
        link_path="${rel_dir}/${name}.md"
    fi
    
    # Create directory for markdown file
    mkdir -p "$(dirname "$md_file")"
    
    # Generate markdown content
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
    } > "$md_file"
    
    # Add to index
    echo "- [$rel_path]($link_path)" >> "$DOCS_DIR/README.md"
    
    echo "Generated: $md_file"
done

echo "Reference generation complete. Files are in $DOCS_DIR"
echo "Index available at: $DOCS_DIR/README.md"