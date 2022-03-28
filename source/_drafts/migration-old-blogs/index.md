

Let us migrate all blog post from the old post to this place


The problems :

I have my old website that was deployed using github pages and the default github templates , now I need to migrate those blog posts into my new personal website build with javascript.

The folder structure of those 2  projects are different and I need to adapt what I have in my old blog to what I have in my new blog.

Where we come from is here :

```bash
.
|-- 2018-02-06-how\ to\ solve\ an\ 8-puzzle\ game\ using\ search\ algorithms.md
|-- 2018-04-30-Blogs_ideas.md
|-- 2018-05-01-ideal_day.md
|-- 2018-05-18-intro.md
|-- 2018-05-31-DataScienceAfrica_Day1.md
|-- 2018-06-10_conenct_pandas_to_a\ prosgres_sql_database_draft.md
|-- 2018-06-13_list-files-in-a-directory\ above\ the\ current\ working\ directory_draft.md
|-- 2018-06-19_draft_central_limit_theorem.md
|-- 2018-06-21-Adding-nginx-to-serve-applications-in-production.md
|-- 2018-06-21-Docker-Flask-Angular-Postgres.md
|-- 2018-06-22-export_data_from_local_database_to_dockerdatabase.md
|-- 2018-07-02-A-simple-approach-bias-and-variance-trade-off
|-- 2018-07-13-New-mac-dev-setup.md
|-- 2018-07-20-Ssh-Pemission_denied
|-- 2018-07-25-bayes-calssifier.md
|-- 2018-07-30-Using-flask-signals.md
|-- 2018-08-06-FPL-Analysis.md
|-- 2018-08-06-Mananging-import-errors.md
|-- 2018-08-10-Find-and-replace.md
|-- 2018-08-16-Test-Driven-development.md
|-- 2018-09-05-Regex-match-emails.md
|-- 2018-09-07-DIve-into-pandas.ipynb
|-- 2018-09-07-DIve-into-pandas.md
|-- 2018-09-21-Remaing-Step-DataScience.md
|-- 2018-09-28-My-First-Step-In-The-Bayesian-Word.md
|-- 2018-12-08-Linux-dev-setup.md
`-- pictures
    |-- Middlefielders.jpg
    |-- TDD.png
    |-- defender.jpg
    |-- domino_fail.gif
    |-- final_team.jpg
    |-- sending_request.png
    |-- signal_received.png
    |-- signals.png
    `-- signals_2.png
```

And what I need to have

```bash
my-personal-website/content/blog
|-- customs-git-config
|   |-- customizing.jpeg
|   |-- index.md
|   |-- uniform.JPG
|   |-- uniform.jpg.sb-838a8e2a-01nC8h
|   `-- uniform.png
`-- hello-world
    |-- index.md
    `-- migration.png
```

Let me explain the problem we have here :

In the old blog post all my blog post where save in a folder called posts.
That folder contains markdown files with times and names of the blog post.

The new structure contains have a folder for each blog post.
The folder name is the name of the blog post and within a folder we have a index.md which contain the blog post.

The index file contains the time the blog post was written, we need to get it from the old blog post.

I want to automate this process , write a script that migrate all post from the old blog repo to the new repo. this script should be written using bash.

what I need is to go to the old directory ;

- for every blog post 
create a folder with the name of the blog in the new directory
inside copy the old content from the old website to the new website


- for bonus I should parse the date from the old blog post and add it into the index

The function should take the path to the old post and the path to the new blog post 

```bash
#!/bin/sh

# Define your function here
migrate_directories () {
   echo "Hello World $1 $2"
   return 10
}

```
