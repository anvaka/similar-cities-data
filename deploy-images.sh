#!/bin/sh
cd ./images
git init
git add .
git commit -m 'Updating images'
git push --force git@github.com:anvaka/similar-cities-data.git master:gh-pages

