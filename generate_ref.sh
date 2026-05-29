#!/bin/bash

SRC_DIR="frontend/src"
DOCS_DIR="docs/frontend-reference"

mkdir -p "$DOCS_DIR"

# Find all TS and TSX files
find "$SRC_DIR" -type f \( -name "*.ts" -o -name "*.tsx" \) | while IFS= read -r file; do
    # Get relative path from src
    rel_path="${file#$SRC_DIR/}"
    # Create corresponding markdown file path
    md_file="$DOCS_DIR/${rel_path%.tsx}.md"
    md_file="$DOCS_DIR/${md_file%.ts}.md"
    # Create directory for markdown file
    mkdir -p "$(dirname "$md_file")"
    
    # Start writing markdown
    {
        echo "# $rel_path"
        echo ""
        echo "## File Path"
        echo "\`$file\`"
        echo ""
        
        echo "## Purpose"
        # Extract first comment block (/** ... */ or // lines) - first 5 comment lines
        purpose=$(grep -E '^\s*\/\*\*|^\s*\/\/|^\s*\*' "$file" | head -5 | \
                 sed -E 's/^\s*\/\*\*\s*//;s/^\s*\*\s*//;s/^\s*\/\/.*//' | \
                 grep -v '^$' | head -1)
        if [ -z "$purpose" ]; then
            purpose="Component/Screen file - see implementation below"
        fi
        echo "$purpose"
        echo ""
        
        echo "## Imports"
        grep -E '^\s*import\s+' "$file" | sed 's/^\s*import\s*//;s/^\s*//' | sort -u
        if [ -z "$(grep -E '^\s*import\s+' "$file")" ]; then
            echo "*No imports*"
        fi
        echo ""
        
        echo "## Exports"
        grep -E '^\s*export\s+(default\s+)?(function|const|class|type|interface)' "$file"
        if [ -z "$(grep -E '^\s*export\s+(default\s+)?(function|const|class|type|interface)' "$file")" ]; then
            echo "*No explicit exports*"
        fi
        echo ""
        
        echo "## Component/Function Signature"
        # Extract main export
        main_export=$(grep -E '^\s*export\s+default\s+(function|const)' "$file" | head -1)
        if [ -z "$main_export" ]; then
            main_export=$(grep -E '^\s*export\s+(function|const)' "$file" | head -1)
        fi
        if [ -n "$main_export" ]; then
            echo "\`$main_export\`"
        else
            # Try to find any function or const
            func=$(grep -E '^\s*(function|const)\s+[A-Z][a-zA-Z0-9_]*\s*[=\(]' "$file" | head -1)
            if [ -n "$func" ]; then
                echo "\`$func\`"
            else
                echo "*See implementation below*"
            fi
        fi
        echo ""
        
        echo "## Props Interface (if applicable)"
        # Look for props interface
        props_interface=$(grep -E 'interface\s+\w+Props\s*{|\type\s+\w+Props\s*=' "$file" | head -1)
        if [ -n "$props_interface" ]; then
            echo "\`$props_interface\`"
            # Try to extract the interface body
            interface_start=$(grep -n 'interface\s+\w+Props\s*{' "$file" | cut -d: -f1)
            if [ -n "$interface_start" ]; then
                echo ""
                echo "### Props Details"
                # Extract lines until closing brace
                sed -n "${interface_start},\$p" "$file" | sed -n '/interface\s+\w+Props\s*{/,/^}/p' | sed '1d;$d'
            fi
        else
            echo "*No explicit props interface found*"
        fi
        echo ""
        
        echo "## State and Effects (if applicable)"
        # Look for useState, useEffect, etc.
        hooks=$(grep -E 'useState|useEffect|useContext|useReducer|useMemo|useCallback' "$file" | head -5)
        if [ -n "$hooks" ]; then
            echo "### Hooks Used"
            echo "$hooks"
            echo ""
            echo "### State Variables"
            # Extract useState calls
            grep -E 'useState\s*\([^)]*\)' "$file"
        else
            echo "*No React hooks found*"
        fi
        echo ""
        
        echo "## Key Functions"
        # Extract function declarations (not arrow functions in props)
        functions=$(grep -E '^\s*function\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(' "$file")
        if [ -n "$functions" ]; then
            echo "$functions"
        else
            echo "*No function declarations found*"
        fi
        echo ""
        
        echo "## Styling and Theme Usage"
        # Look for theme usage, classNames, style props
        theme_usage=$(grep -E 'theme\.|useAppContext|accentColor|bubbleStyle|fontSize|aquaIntensity|dark\.' "$file" | head -3)
        if [ -n "$theme_usage" ]; then
            echo "$theme_usage"
        else
            echo "*No explicit theme usage found*"
        fi
        echo ""
        
        echo "## Usage"
        # Find where this file is imported
        usage=$(grep -r "from [\"\']\.$rel_path[\"\']" "$SRC_DIR" 2>/dev/null | head -3 | sed 's/.*from //;s/[\"\']//g')
        if [ -n "$usage" ]; then
            echo "Used in:"
            echo "$usage"
        else
            echo "*Not found as imports in other files (may be a screen or root component)*"
        fi
        echo ""
        
        echo "## Full Implementation"
        echo ""
        echo "\`\`\`typescript"
        cat "$file"
        echo "\`\`\`"
        
    } > "$md_file"
    
    echo "Generated: $md_file"
done

echo "Reference generation complete. Files are in $DOCS_DIR"