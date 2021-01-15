#!/bin/bash
set -euxo pipefail

# Find all package.json files in subdirectories, except node_modules, examples, irma-popup and irma-frontend
standalone_packages=`find . -name "package.json" -not -path "*/node_modules/*" -not -path "*/examples/*" -not -path "*/irma-popup/*" -not -path "*/irma-frontend/*"`

set +x

echo ""
echo "Are you sure you want to release a new version of the following packages?"
for package in ${standalone_packages[@]}; do
  echo " - `dirname $package`"
done
read -p "(Enter y/n) "

set -x

if [[ $REPLY =~ ^[Yy]$ ]]
then
  root=`pwd`
  for package in ${standalone_packages[@]}; do
    cd `dirname $package`
    echo "Releasing $package"
    npm publish --access public
    cd $root
  done

  set +x

  echo ""
  echo "Releasing done."
  echo "Don't forget releasing the 'irma-frontend' package separately. Please check the README for more details."
fi
