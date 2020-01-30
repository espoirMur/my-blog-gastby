---
title: My Customs Git Configurations
date: "2020-01-30T22:12:03.284Z"
description: "Hello World"
---

Git is a powerfull tool and you cannot say you are a modern software engineer if you are not using git our any other subversion system, unless you are an old school guy who write a code alone and share it in zip file. Trust me those guys still exist in my local village.

If you are reading this , it means you have internet and you use git at work or for personal and sometimes you need to make some customization to make your life easier.

In this blog post I would like to share with you 3 customs github settings I found and that may be usefull for you.

## The problem 

You are working on a project and they have a standard commit message template you have to for your commits, or like me you don't like writing your commit message in a the default git editor, Vim . I had headaches when trying to quit Vim once I am done editing  my commit message.

## The solution

If you have ever faced one of the problems above , git comes to your rescue with `git-config` where you can customize your default settings.

### Configuration levels 

You can customize your config on three levels :

- System wide level : It means you apply your customs settings for all users on your laptop. This is not important for us unless you are sharing your laptop with friends and family or working on a school computer where every student has his account on one laptop.

Any settings on system level will have `--system` argument 

`git config --system`

- Global Level or User level : this is specific to one user and the settings are for you and are shared across  all your repositories. 
On this level the settings are followed with `--global`argument.

`git config --global`

- Repository Level on Local level : this only applied to the git repository you are working on.
This is usefull for settings on project level when you want to follow a certain standard for the project you are working one.

For this you use `--local` argument.

`git config --local`


### Customs useful configurations

Once we know all levels for git configuration let see which configurations you can set up

#### Tell git who you are 

Like every relationship in real word , once you meet a new person you have to tell each other who you are . The same apply to git, before your first commit you have to set up your username and email if you want.

There comes user.name and user.email config that need to be make globally here are the commands:

`git config --global user.name "John Doe"`
`git config --global user.email johndoe@example.com`

Side note: 
As said [here](https://dev.to/msaracevic/comment/bdhb) If you use github only in your laptop you can setup your email like this :

`git config --global user.email ":USERNAME@users.noreply.github.com"`


It will still match your contributions correctly based on the no-reply address, but it won't include your real email address to in public commits, meaning that all those spams scripts won't pick you up and bother your on your main email address.

But if you use bitBucket, Gitlab and any other subversion system you can set up the email local per project. 

#### Change your default editor 

By default git uses  vim as text editor for commit message, rebase and merge message.
If like me you have never used vim because you find it difficult to use, the next  `core.editor` command comes to your rescue.

`git config --global core.editor "code -w"`

With this command you can tell git to use any text editor installed on your laptop which is available via command line.

For everyone who started to code after 2016 , I guess the de facto choice for editor is VSCode, but old school guys can use either `nano`, or `sublime text` and our grand parents in code  will keep `vim`or `emacs`

Ps note the -w argument after the editor name : 
that force Git to wait your commit message that are typing type on your custom editor other wise git will close and assuming there is an empty message. Thanks for this answer on [StackOverflow](https://stackoverflow.com/a/11702707/4683950)

#### All commits should wear the same uniform:

If you work on a structured project that have the same template for commit message the `commit.template` command can help.

`git config --local commit.template ~/.commit-message.md`

I prefer setting this local on project and having one global for my personal project

## Conclusion

Live is already complicated , we should not let git add another level of complication in it , 
We should not let git add  another level of complexity to it.

I hope those settings will helps you to make live easier when using git.

## References

- [Customizing Git Config](https://www.git-scm.com/book/en/v2/Customizing-Git-Git-Configuration)
