#!/bin/bash

echo "Migrating layered architecture to modular architecture..."

# Create modules directory
mkdir -p src/modules

# Define features based on existing routes/controllers
features=("auth" "user" "chat" "social" "group" "upload" "admin")

for feature in "${features[@]}"; do
  echo "Creating module: $feature"
  mkdir -p "src/modules/$feature"
  
  # Move controllers if they exist
  if [ -f "src/controllers/${feature}Controller.ts" ]; then
    mv "src/controllers/${feature}Controller.ts" "src/modules/$feature/${feature}.controller.ts"
  fi
  
  # Move routes if they exist
  if [ -f "src/routes/${feature}Routes.ts" ]; then
    mv "src/routes/${feature}Routes.ts" "src/modules/$feature/${feature}.route.ts"
  fi
  
  # Move services if they exist (ignoring casing for simplicity, e.g., AuthService -> auth.service.ts)
  # Finding matching services (e.g., AuthService.ts -> auth.service.ts)
  service_file=$(find src/services -iname "${feature}Service.ts" 2>/dev/null)
  if [ -n "$service_file" ]; then
    mv "$service_file" "src/modules/$feature/${feature}.service.ts"
  fi
  
  # Create an empty schema file for Zod validation
  touch "src/modules/$feature/${feature}.schema.ts"
  echo "import { z } from 'zod';" > "src/modules/$feature/${feature}.schema.ts"
done

echo "Architecture migration script generated successfully!"
echo "Note: You will need to update the import paths in your server.ts and across the modules to match the new structure."
