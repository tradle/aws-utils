#!/bin/bash

for p in packages/*
do
  aws_sdk_path="$p/node_modules/aws-sdk"
  if [[ -d $aws_sdk_path ]]
  then
    rm -rf $aws_sdk_path
  fi
done