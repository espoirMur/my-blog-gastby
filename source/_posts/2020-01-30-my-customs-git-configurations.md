---
title: My Customs Git Configurations
description: "customizing git settings."
date: "2020-01-30T00:12:03.284Z"
layout: post
comments: true
categories: tech
---

![Configurations](https://cdn.lynda.com/course/514200/514200-636141225565412095-16x9.jpg)


Git is a powerful tool, and you cannot call yourself a modern software engineer if you are not using Git or any other subversion system unless you are an old school guy who writes code alone and shares it in a zip file. Trust me!! Those guys still exist in my local village.

If you are reading this, it means you have the internet, and you use git at work or for personal projects, and sometimes you need to make customizations to make your life easier.

In this blog post, I would like to share with you four custom GitHub settings I found, and that may be useful for you.

## The problem 

You are working on a project, and the team has a standard commit message template you have to use for your commits, or like me, you don't like writing your commit messages in the default git editor, Vim. I had headaches while trying to quit Vim; once I have finished editing my commit message.

## The solution

If you have ever faced one of the problems above, Git comes to your rescue with `git config`{:.language-clojure .highlight} where you can customize your default settings.

### Configuration levels 

You can customize your config on three levels :

- System-wide level: It means you apply your customs settings for all users on your laptop. Settings on system level are not essential for us unless you are sharing your computer with friends and family or working on a school computer where every student has his account on one laptop.

Any settings on system-level will have `--system`{:.language-clojure .highlight} argument. 

`git config --system`{:.language-clojure .highlight}

- Global Level or User level: this is specific to one user, and the settings are for you, and you share them across all your repositories. 
On this level, the settings are followed with `--global`{:.language-clojure .highlight} argument.

`git config --global`{:.language-clojure .highlight}

- Repository Level or Local level: this only applied to the git repository you are working on.
Setting global configuration is useful for settings on the project level when you want to follow a certain standard for the project.

For this, you use the `--local`{:.language-clojure .highlight} argument.

`git config --local`{:.language-clojure .highlight}


### Customs useful configurations

Once we know all levels for git configuration, let see which settings you can set up.

#### Tell Git who you are 

Like in real-world relationships, once you meet a new person, you have to introduce yourself. The same applies to Git; before the first commit, you have to set up your username and email.

![Introducing ourself](https://media.giphy.com/media/Y0mC3y5G53PsQ/giphy.gif)

There comes user.name, and user.email config that needs to be made globally here are the commands:

`git config --global user.name "John Doe"`{:.language-clojure .highlight}

`git config --global user.email johndoe@example.com`{:.language-clojure .highlight}

Side note: 
As said [here](https://dev.to/msaracevic/comment/bdhb) If you use Github only in your laptop, you can set up your email like this :

`git config --global user.email ":USERNAME@users.noreply.github.com"`{:.language-clojure .highlight}


It will still match your contributions correctly based on the no-reply address, but it won't include your real email address to in public commits, meaning that all those spams scripts won't pick you up and bother yours on your primary email address.

But if you use bitBucket, Gitlab and any other subversion system you can set up the email local per project. 

#### Change your default editor 

By default, Git uses Vim as the text editor for commits messages, rebase and merge messages.
If like me you have never used Vim because you find it challenging to use, the next `core.editor`{:.language-clojure .highlight} the command comes to your rescue.

`git config --global core.editor "code -w"`{:.language-clojure .highlight}

With this command, you can tell Git to use a text editor installed on your laptop which is available via command line.

For everyone who started to code after 2016, I guess the de facto choice for the editor is VSCode, but old school guys can use `nano`, `sublime text` or like our grandparents in code will keep `vim` or ` emacs.`{:.language-clojure .highlight}

Note the -w argument after the editor name : 
That force Git to wait for your commit message that is typing type on your custom editor otherwise Git will close and assuming there is an empty message. Thanks to this [StackOverflow](https://stackoverflow.com/a/11702707/4683950) answer

#### All commits should wear the same uniform:

![uniform](https://www.eduquepsp.education/wp-content/uploads/2018/06/epspbanner.jpg)
*Source : [national-education-DRC](https://www.eduquepsp.education/)*

If you work on a structured project that has the same template for commit message the `commit.template`{:.language-clojure .highlight} a command can help.

`git config --local commit.template ~/.commit-message.md`{:.language-clojure .highlight}

I prefer setting this local on projects and having one global for my project.

#### They don't deserve to be on Git

You may be familiar with the .gitignore file on projects.
Sometimes some files don't deserve to be on Git, instead of ignoring them for a project you ignore them globally using a global template for Git ignore with the `core.excludesfile`{:.language-clojure .highlight} command

`git config --global core.excludesfile ~/.gitignore_global`{:.language-clojure .highlight}



## Conclusion

Live is already complicated; we should not let Git add another level of complication in it.

I hope those settings will helps you to make life more comfortable when using Git.

## References

- [Customizing Git Config](https://www.git-scm.com/book/en/v2/Customizing-Git-Git-Configuration)
