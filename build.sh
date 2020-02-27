#!/bin/bash

# Script makes sure that all modules that need building steps are built from source if needed

rootdir=$(pwd)

cd "$rootdir" || exit
echo "Running 'npm install' and 'npm run release' for irma-css"
cd irma-css || exit
npm install
npm run release

cd "$rootdir" || exit
echo "Running 'npm install' and 'npm run release' for irma-frontend"
cd irma-frontend || exit
npm install
npm run release
