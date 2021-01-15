#!/bin/bash

echo "Preparing irma-popup for release"

version=`echo "console.log(require('./irma-core/package.json').version);" | node`

read -p "We are going to use $version as version number. Is this okay? (y/n) "

if [[ $REPLY =~ ^[Yy]$ ]]
then
  set -euxo pipefail

  root=`pwd`
  cd ./plugins/irma-popup
  rm -rf ./node_modules ./dist

  npm install
  dependencies=`npm ls --parseable | grep -o '@privacybydesign/.*'`
  for package in ${dependencies[@]}; do
    eval "npm install $package@$version --save-prod"
  done

  npm audit fix
  npm update
  eval "npm version $version"
  # Make sure dev dependencies are not included to prevent artifact pollution
  rm -rf ./node_modules
  npm install --only=prod

  cd $root
  set +x

  echo ""
  echo "Preparing irma-popup for release done."
  echo "Please check whether all output satisfies you."
  echo "If you are happy, you can run 'cd ./plugins/irma-popup && npm publish --access public'"
fi
