#!/bin/bash

dir=`dirname $0`
required_version=`$dir/version.js`
if [ $? != '0' ]; then
  echo "$required_version"
  exit 1
fi
echo ""
echo "> Installing version of aws-sdk found to be used in lambda files: $required_version"
echo ""

# Updating package.json's peerDependency
json="$dir/../../packages/aws-common-utils/package.json"
data=$(jq ".peerDependencies[\"aws-sdk\"]=\"^$required_version\"" $json)
echo "$data" > "${json}"

npm i aws-sdk@$required_version -s
