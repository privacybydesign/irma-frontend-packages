#!/bin/bash

# Script makes sure that all modules that need building steps are built from source if needed

packages=$(find . -name "package-lock.json" -not -path "*/node_modules/*" -not -path "*/examples/*")

rootdir=$(pwd)
for package in ""${packages[@]}""; do
  cd "$rootdir" || exit
  if git ls-files --error-unmatch "$package" &> /dev/null; then
    directory=$(dirname "$package")
    echo "Running 'npm install' and 'npm run release' for $directory"
    cd "$directory" || (echo "Directory does not exit" & exit)
    npm install
    npm run release
  fi
done
