---
title :  How I break up with pip and fall in love with poetry , my new girlfriend.
date : 2021-10-17T15:33:42
description: How to migrate a python project from pip to poetry 
published : True
featuredimage:
  src: "./picture-pip-poetry.jpeg"
  alt: "Migrating pip to poetry "
---


I have recently stumbled across [poetry](https://python-poetry.org/) new dependency management for python and decided to give it a try.

I have been a die hard fan of pip and had used it in most of my projects before I discovered poetry. Furthermore, I had heard about pyenv in the past but was reluctant to use it in my projects for preference reasons. Since Python dependency management is an interesting topic, I would like to explain the difference in another article such as [pip](https://github.com/pypa/pip) vs [pyenv](https://github.com/pyenv/pyenv) vs [petry](https://github.com/python-poetry/poetry).

When I discovered poetry and tested it, I fell in love with it.


## What is poetry?

Although I will be talking about girlfriends, falling in love , and breakups in this article, the poetry I am talking about is not about love, prose, poems, or Shakespeare.


_Poetry is a tool for **dependency management** and **packaging** in Python. It allows you to declare the libraries your project depends on and it will manage (install/update) them for you._ It supports Python 2.7 and 3.5+

  
If you work with python and install packages you should be familiar with `pip` my old girlfriend.

  

  

## Why we should use poetry in lieu of pip?

After 2 weeks of usages and successful migration of five personal projects from `pip` to `poetry`, I can choose poetry because :

  

- It has a good dependency resolver. It does the job better than PIP. Read the interesting article [www.activestate.com](https://www.activestate.com/resources/quick-reads/python-dependencies-everything-you-need-to-know/). The author explicitly said

> Unfortunately, pip makes no attempt to resolve dependency conflicts. For example, if you install two packages, package A may require a different version of a dependency than package B requires.

  

- And another advantage I found is that anytime you add a new dependency to the project poetry update for you the `pyproject.toml` with the new top-level dependency, it, therefore, avoid you to do `pip freeze` to generate a new requirement file for your project.

  

- You can use the same tool to build and publish your packages. And it is easy to do so. I my opinion this is why I think `poetry` outweighed `pip`

  

In my opinion, I think `poetry` outweigh `pip` in many aspects. It is like pip but on steroids

In the following sections, I will guide you on how to migrate an existing project from pip to poetry.


## Installing Poetry in your system

  

  

![](https://lh5.googleusercontent.com/prDFZYFCdhOvTIpSpv8fItqiZ3GHrHEypuEhY0J2IyORNHoOwd6JlneUEUEGlcE-yRR0xVGkOUlwIeDWc5DfSCMrpJqX5m_CQxcERZ2fUzLmmOeV-dF-OYUbMAAg0t0uvxhAN-o=s0)

  

  

Installing poetry is very straightforward, if you have python installed and `curl` you can easily install it by running :

  

#### osx / linux / bashonwindows install instructions

  

```bash

curl -sSL https://raw.githubusercontent.com/python-poetry/poetry/master/get-poetry.py | python -

```

  

### windows powershell install instructions

``` bash

(Invoke-WebRequest -Uri https://raw.githubusercontent.com/python-poetry/poetry/master/install-poetry.py -UseBasicParsing).Content | python -

```

> **Warning**: The previous `get-poetry.py` installer is now deprecated, if you are currently using it you should migrate to the new, supported, `install-poetry.py` installer.

  

>The installer installs the `poetry` tool to Poetry's `bin` directory. This location depends on your system:

  

- `$HOME/.local/bin` for Unix

- `%APPDATA%\Python\Scripts` on Windows

  

> If this directory is not on your `PATH`, you will need to add it manually if you want to invoke Poetry with simply `poetry`.

  

> Alternatively, you can use the full path to `poetry` to use it.

  

There is also another version of installing it with `pip` but why would you use your ex to attract your new girlfriend? 🤔🤪

  

  

Once everything is installed you can restart your terminal and run the following command to check the poetry version:

`poetry --version`

  

If installation is unsuccessfully or encountering incompatibility issues. Please heads up to [Github Poetry](https://github.com/python-poetry/poetry) to get a help, to learn more or to fire an issue.

  

## The Migration
![](https://lh4.googleusercontent.com/S09PZBBBn_Q9Vx8vpxLNP67_9HmU-JEM50KpnZZaZavhqS3y2tzfDFuvHlL59CJo_UKhtRtYyWofhx5zlUtvUbk3yO5HHsMM4rqs6xH0fCKaGWZsjlBX7T3j_R0WdPjvf1gG3U0=s0)

  

  

### Generate top-level dependencies

  

  

Before moving to the next step you need to make sure you can generate the top-level dependencies for your project, to do that you will need a package called [pipdeptree](https://pypi.org/project/pipdeptree/) . For context, the top-level dependencies are the root of your dependencies tree. What is even the dependency tree? Each package you install using `pip` has the other dependencies that rely on it. And before installing a new package it installs his top-level dependencies. For example, pandas is a package but `pandas` depends on `numpy`, if you install pandas it install also numpy as a dependent.

  


The following command will generate only the top-level dependencies, so if you have installed pandas, it will just generate pandas and not numpy as a requirement.

  

  

_Why is this important? :_

This should be filled

`pipdeptree --warn silence | grep -E '^\w+' > requirements-new.txt`

Once you have generated the top-level dependencies, I would suggest you deactivate your virtual environment and delete it to make the break-up complete before moving to the next steps.

  

### Adding poetry to an existing project.

If you have a new project where you are using `pip` and have the `requirements.txt` file inside you can run the following command to initialize poetry in the project.


`poetry init`

This will prompt you to set up poetry to your existing project and asked you to give some details about your project such as the project name, the python version you want to use, and the description. It will consequently generate the `pyproject.toml` file which will contain all the details about your project as well as the top-level projects requirement and their versions.

### Creating virtual environment

Poetry creates by default virtual environment in a folder called `~/Library/Application Support/pypoetry` but you can change those settings by using the following command :

`poetry config virtualenvs.in-project true `

After running that command you can run the following :


`poetry shell `

It will activate the project’s virtual environment and create a new one if the project does not have one.

### Installing the requirements for your projects.

If you have the `requirements-news.txt` file resulting from the command you run on the first step, you can install all the packages in that and their corresponding version by running the following command:

`for item in $(sed -n 's/==/@/p' requirements-new.txt); do poetry add "${item}" ; done`


> This will work only on Linux and Mac, still trying to find the exact version of it for Windows.


What does that command do?
I loop over every line of the `requirement-new.txt` file take the dependency, and just replace the `==` in the dependency with `@` and then add it with poetry.


If for example in the file you have pandas==1.1.1, it will install the following with poetry `poetry add pandas@1.11`

  If everything goes well you should have the all the top-level packages installed with their dependencies.

  
Once the command has successfully run and you have everything installed, you should check if your `pyproject.toml` file contains all the packages and their top-level dependencies.

 

You can now remove the old `requirements.txt` file and the newly create `requirement-new.txt `file by running.

 

`rm -f requirements.*`

  

### A section about using poetry with conda enviroment


Some people like to have multiples girlfriend and may like to keep their old conda or pip environment. I haven't tried this approach yet , but according to[ this issue](https://github.com/python-poetry/poetry/issues/105#issuecomment-498042062) it is possible to use poetry to install packages in a python environment.

You just have to configure poetry to not create a virtual environment in a project and install your packages in the conda  or pip environment.

I think you can try it and let us know in comment how it goes.


### Bonus, the Dockerfile.



If you have a dockerfile you can edit it and use the following docker images which use multi-stage build to install all your requirement with poetry.

  
```
FROM python:3.7.5 AS base
LABEL maintainer="Espoir Murhabazi < first_name.second_name[:3] on gmail.com>"

ENV  PYTHONUNBUFFERED=1  \
PYTHONDONTWRITEBYTECODE=1  \
PIP_NO_CACHE_DIR=off  \
PIP_DISABLE_PIP_VERSION_CHECK=on  \
PIP_DEFAULT_TIMEOUT=100  \
POETRY_HOME="/opt/poetry"  \
POETRY_VIRTUALENVS_IN_PROJECT=true  \
POETRY_NO_INTERACTION=1  \
PYSETUP_PATH="/opt/pysetup"  \
VENV_PATH="/opt/pysetup/.venv"

ENV  PATH="$POETRY_HOME/bin:$VENV_PATH/bin:$PATH"

FROM  base  AS  python-deps

RUN  apt-get  update  \

&&  apt-get  install  --no-install-recommends  -y  \

curl  \

build-essential
# Install Poetry - respects $POETRY_VERSION & $POETRY_HOME
ENV POETRY_VERSION=1.1.7

RUN curl -sSL https://raw.githubusercontent.com/sdispater/poetry/master/get-poetry.py | python
WORKDIR $PYSETUP_PATH

COPY ./poetry.lock ./pyproject.toml ./
RUN poetry install --no-dev
FROM base AS runtime
COPY --from=python-deps $POETRY_HOME $POETRY_HOME
COPY --from=python-deps $PYSETUP_PATH $PYSETUP_PATH
RUN useradd -ms /bin/bash espy
COPY . /home/espy
WORKDIR /home/espy
USER espy
CMD [" you command "]
```

  

  

Basically, what the docker file does, it uses a multi-stage build to first install the packages in the first step and copy only the packages installed in the second as well as the project repository. One of the advantages of the multi-stage build is that it uses only the necessary files your project needs and therefore reduce the memory of your docker container.

  

You can learn more about multi-stage build using the [following tutorial.]([https://pythonspeed.com/articles/multi-stage-docker-python/](https://pythonspeed.com/articles/multi-stage-docker-python/))

  

  

## Conclusion

 
And the story of my break up comes to an end. As you may know, all separations are not smooth, sometimes the daemons of your old girlfriend come and start causing troubles in your new relationship. So if you find any issue during this break-up, feel free to let me know in the comment I will try to help you as much as I can 🤔.
