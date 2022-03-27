#!/bin/sh

# Define your function here

 echo 'migrating from '$1, $2
   for file in $1/*.md ; do 
    filename=$(basename $file)
    echo 'file', $filename
    echo 'time is ===>'
    kREGEX_DATE='^([0-9]{4}[-/][0-9]{2}[-/][0-9]{2})'

    [[ $filename =~ $kREGEX_DATE ]]
    time=${BASH_REMATCH[0]}
    echo $time
    filename=${filename//[[:digit:]]/''} # remove the time
    filename=${filename:3} # remove the remaining dash
    # remove .md extension
    echo $time, $filename
    # sed -i '5s/.*/ Good Morning /' $file
    mkdir $2/$filename
    cp $file $2/$filename/index.md
   done 


Next stop add the standard markdown file structure

#https://riptutorial.com/bash/example/19469/regex-matching

