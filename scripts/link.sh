#!/bin/bash

PWD=$(pwd)
MODULES=(
  "aws-common-utils"
  "aws-client-factory"
  "aws-sns-client"
  "aws-cloudwatch-client"
  "aws-cloudformation-client"
  "aws-s3-client"
  "aws-lambda-client"
  "aws-combo"
)

# for item in ${MODULES[*]}
# do
#   cd "packages/$item" && npm link && cd $OLDPWD
# done

for item in ${MODULES[*]}
do
  cd "packages/$item"
  for otherItem in ${MODULES[*]}
  do
    DEPENDS=$(grep $otherItem package.json)
    if [[ $DEPENDS && $item != $otherItem ]]
    then
      echo "linking @tradle/$item in $otherItem"
      npm link @tradle/$otherItem
    fi
  done

  cd $OLDPWD
done

cd "$PWD"