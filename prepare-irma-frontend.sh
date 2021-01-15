#!/bin/bash

echo "Preparing irma-frontend for release"

version=`echo "console.log(require('./irma-core/package.json').version);" | node`

read -p "We are going to use $version as version number. Is this okay? (y/n) "

if [[ $REPLY =~ ^[Yy]$ ]]
then
  set -euxo pipefail

  cd ./irma-frontend
  rm -rf ./node_modules ./dist

  npm install
  dependencies=`npm ls --parseable | grep -o '@privacybydesign/.*'`
  for package in ${dependencies[@]}; do
    eval "npm install $package@$version --save-dev"
  done

  npm audit fix
  npm update
  npm run release
  eval "npm version $version"
  # Make sure dev dependencies are not included to prevent artifact pollution
  rm -rf ./node_modules
  npm install --only=prod

  set +euxo pipefail

  echo ""
  echo "Preparing irma-frontend for release done."
  echo "Please check whether all output satisfies you."
  echo "If you are happy, you can run 'cd ./irma-frontend && npm publish --access public'"
fi
