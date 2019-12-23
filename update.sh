#!/bin/bash

# Please make sure you are working on a clean git tree before running this
# script. It can deal with some issues, but we have to be able to switch
# branches.

# Create a new branch off of master for our update
git checkout master
git checkout -B update-dependencies-`date "+%Y-%m-%d"`

# Find all package.json files in subdirectories, except node_modules
packages=`find . -name "package.json" -not -path "*/node_modules/*"`

# Loop over directories where package.json files are found and `npm update`
root=`pwd`
for package in ${packages[@]}; do
  cd `dirname $package`
  echo "Running 'npm update' for $package"
  rm -r ./node_modules
  npm install
  npm audit fix
  npm update
  cd $root
done

# Commit result to git
git add -u ./*package.json
git add -u ./*package-lock.json
git commit -m "Auto-updated dependencies of all packages"
git clean -f ./*package-lock.json

# Be friendly to our user
echo
echo "🥳 Done, ready to push to Github and make a PR there."
