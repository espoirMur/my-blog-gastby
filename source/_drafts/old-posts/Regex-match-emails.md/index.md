# Usings regular expressions to extract emails from documents

I'm facing a big issue , need to filter a very large document and I need to get names and emails from it:

the document contained lines line this :

_17/07/2018 22:49E:5s6poir MurhabaziEspoir Murhabazeispoir.mur@gmail.com espoir.mur@gmail.com 7 6 4
I have worked on a project called mining educational data to improve student orientation to university. it's build with pandas and sklearn._

Working with regex has never been easy for me.

Using [this](https://regex101.com/r/rN7hV8/2) tool I was able to build this regex:

the tool gives us those description about the regex:

`(\w+\s)(\w+\s)([\w\.-]+@[\w\.-]+)\s([\w\.-]+@[\w\.-]+)`{:.language-clojure .highlight}

in that regex 

`()`{:.language-clojure .highlight} means a group
`\w`{:.language-clojure .highlight} matches any word character (equal to [a-zA-Z0-9_])
`\w+`{:.language-clojure .highlight} : one or more \w
 `\s`{:.language-clojure .highlight} : means matches any whitespace character (equal to [\r\n\t\f\v ])
 
 so : 
 
 `(\w+\s)`{:.language-clojure .highlight}: means find a name followed by a space: this is used to retreive the first name
 
 `([\w\.-]+@[\w\.-]+)`{:.language-clojure .highlight} : this is used to retreive a mail address 
 
 `[\w\.-]+`{:.language-clojure .highlight}: means matches any word character followed by a dot . or a dash - 
 
 after using the expresion was able to retreive a 4 differents groups :
 
 names, prename and 2 emails addresses 
 
 
