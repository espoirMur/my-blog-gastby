---
title: How to use the AWS Python CDK to create an infrastructure on ECS.
layout: post
date: "2021-02-26T22:12:03.284Z"
comments: true
categories: tech
canonical_url: https://www.murhabazi.com/ci-cd-deploy-to-aws-github-actions/
cover_image: https://dev-to-uploads.s3.amazonaws.com/uploads/articles/192jcpsx4wzh9xolo178.jpeg
series: Deploy a containerized python to AWS using Github Actions
---

Recently at work, we decided to build a CI/CD pipeline that deploys our application directly to AWS. I had never worked with AWS, and it was a missing point on my CV which demonstrates that I have some DevOps skills. I decided to search for some tutorials online and I was not lucky to get what we needed at work. I decided to write this guide by getting something working from various tutorials I found online.

  

### What you will learn from this series.

  

In this 3 parts tutorial, we will learn how to Create an AWS architecture where you can deploy an application, how to convert a docker-compose file in a Task Definition and how to deploy a Task Definition to an AWS Architecture using GitHub Actions.

### Who is this series for ?

  

This tutorial is for developers who are familiar with docker and have an application with docker-compose. Although the series was written by a Python developer and using Python, the concepts can be applied to other programming languages.

  

### Which application will we deploy?

  

In this tutorial, we will deploy a Python application that has a celery worker, a celery scheduler, and a Redis database for task messaging and task queues.

  

I will not talk about celery and task queues and how to use those tools but you can get start with them [here]([https://medium.com/analytics-vidhya/python-celery-distributed-task-queue-demystified-for-beginners-to-professionals-part-1-b27030912fea](https://medium.com/analytics-vidhya/python-celery-distributed-task-queue-demystified-for-beginners-to-professionals-part-1-b27030912fea)), and to get started with docker you can use [this one](https://dev.to/javascriptcoff1/what-is-docker-3be2) ,and [this one](https://adamtheautomator.com/docker-compose-tutorial/) to be familiar with docker-compose.

  

This series is not based on any popular Python web framework such as Django, Flask, or FastAPi but you can adapt this tutorial to them and I am sure it will work like a charm.

  

The application skeleton can be downloaded from [this link](https://github.com/espoirMur/deploy_python_to_aws_github_actions) to get started.

  

In this first part of the tutorial, we will learn how to create the Cloudformation stack.

  

### What is AWS CloudFormation?

  

From [the official documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html), Cloudformation is defined as :

  

> AWS CloudFormation is a service that helps you model and set up your Amazon Web Services resources so that you can spend less time managing those resources and more time focusing on your applications that run in AWS. You create a template that describes all the AWS resources that you want (like Amazon EC2 instances or Amazon RDS DB instances), and CloudFormation takes care of provisioning and configuring those resources for you. You don't need to individually create and configure AWS resources and figure out what's dependent on what; CloudFormation handles all of that.

  
  

### Creating the AWS Architecture

  

Make sure that you have created an AWS account and you have your credentials; the access key, and the application secret key.

  

Most of the services used in this tutorial are available within an AWS free tier.

  

We will deploy our application using the AWS ECS Fargate launch type which will pull docker images from the Elastic Container Registry aka ECR.

  

#### Why Fargate and not EC2?

  

{% include image.html name="https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif" caption="Alt Text" %}

  

AWS provides us basically two launch types which are the Fargate launch type and the EC2.

  

Amazon Elastic Compute Cloud (Amazon EC2) provides scalable computing capacity in the Amazon Web Services (AWS) Cloud. Using Amazon EC2 eliminates the need to invest in hardware upfront, so you can develop and deploy applications faster. You can use Amazon EC2 to launch as many or as few virtual servers as you need. It allows you to configure security and networking, and manage storage yourself. With EC2 you don’t have to worry about the hardware, the hardware is managed by AWS.

  

AWS Fargate is a technology that you can use with Amazon ECS to run [containers](https://aws.amazon.com/what-are-containers) without having to manage servers or clusters of Amazon EC2 instances. The advantage of Fargate over EC2 is the fact that you don’t have to configure, provision, or scale cluster instances and don't have to worry about the virtual machines.

  

In a nutshell :

  

With a virtual machine, someone still has to manage the hardware, but with EC2 that someone is AWS and you never even see the hardware.

  

With ECS on EC2, someone still has to manage the instances, but with ECS on Fargate that someone is AWS and you never even see the EC2 instances.

  

ECS has a “launch type” of either EC2 (if you want to manage the instances yourself) or Fargate (if you want AWS to manage the instances). [Source](https://www.reddit.com/r/aws/comments/dvl601/eli5_aws_fargate/f7ddkup?utm_source=share&utm_medium=web2x&context=3).

  

#### The objects we need :

  

To deploy the application we need the following objects: a cluster, a service, a task definition with containers definition, cloud watch for logging, and IAM roles. The below picture illustrates how those AWS objects interact with each other.

  

{% include image.html name="https://dev-to-uploads.s3.amazonaws.com/uploads/articles/k5bcp5zjq6ssob06mgyt.png" caption="Alt Text" %}

  

Let us define some of those objects and then we will investigate how to create a stack, containing them, using Python cdk.

  

- **A cluster**: It is a logical group of container instances that ECS can use for deploying Docker containers. It provides computing power to run application container instances. In practice, a cluster is usually attached to an AWS Instance.

  

- **A service**: It enables us to run and maintain a specified number of instances of a task definition simultaneously in an Amazon ECS cluster. ie. It helps us run single or multiple containers all using the same Task Definition.

  

- **The task definition**: A task definition is a specification. You use it to define one or more containers (with image URIs) that you want to run together, along with other details such as environment variables, CPU/memory requirements, etc. The task definition doesn’t actually run anything, it's a description of how things will be set up when something does run. The task definition shares some similarities with the docker-compose file. In the second part of this tutorial, we will convert a docker-compose file into a task definition.

  

- **A task**: A task is an actual thing that is running. ECS uses the task definition to run the task; it downloads the container images, configures the runtime environment based on other details in the task definition. You can run one or many tasks for any given task definition. Each running task is a set of one or more running containers - containers in a task all run on the same instance.

- **cloudwatch**: CloudWatch is a monitoring service, we are using it in this stack to get and visualize logs from the docker containers.

  

With all the objects described, we can now learn how to create them using the Python CDK.

  

#### Creating the architecture:

To build the infrastructure, we will leverage the [AWS Cloud Development Kit (CDK)](https://aws.amazon.com/cdk/). If you are new to CDK, see [Getting Started with AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html), it is simple and straightforward to install. In this post, we will be using the CDK with Python 3.7. Another alternative to the CDK is to create the application via the AWS console. However, I found the CDK to be the simplest approach because it allows you to have control over the code you are writing.

  

After installing the CDK check if it is working with the following command:

  

- `cdk --version`{:.language-clojure .highlight} should output your CDK version.

  

##### Initializing the AWS CLI :

  

Make sure you have AWS CLI installed on your computer. [Configure your AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html) with an IAM user that has permissions to create the resources (VPC, ECS, ECR, IAM Role) described in the template below. After the configuration you should have the AWS keys stored in your computer at the following location :

  

- `~/.aws/credentials`{:.language-clojure .highlight}: if you are using Mac or Linux

- `C:\Users\`USERNAME`\.aws\config`{:.language-clojure .highlight}: if you are on Windows

  

The content of that file should look like this one:

  

```

[default]

region=your region

aws_access_key_id = *********************************

aws_secret_access_key = ******************************

```

  

With the credentials, the cli client and the CDK installed let us move to the second step about creating the architecture.

  

#### Initializing The CDK Project :

  

To initialize the CDK we will create a new Python project which will contain the code to create the architecture.

  

_Step 1_: Creating the project

  

Run the following command to create a new CDK project:

  

`mkdir ecs-devops-cdk`{:.language-clojure .highlight}

  

Enter the project using:

  

`cd ecs-devops-cdk`{:.language-clojure .highlight}

  

Or if you are using VSCode you can open the project with vs code using:

  

`code ecs-devops-cdk`{:.language-clojure .highlight}

  

- _Step 2_: Initialize the python CDK project :

  

To initialize the CDK project run the following command:

  

`cdk init --language python`{:.language-clojure .highlight}

  

The command will create a new python CDK project and we will be editing it in the next step to build our stack.

  

After a quick look you should see a structure like this in your project:

  

```bash

.

├── README.md

├── app.py

├── cdk.json

├── ecs_devops_cdk

│ ├── __init__.py

│ └── ecs_devops_cdk_stack.py

├── requirements.txt

├── setup.py

└── source.bat

```

  

- _Step 3_: activate virtual environment :

  

You can activate your virtual environment using the following command :

  

On mac and linux : `source .env/bin/activate`{:.language-clojure .highlight}

For windows : `.env\Scripts\activate.bat`{:.language-clojure .highlight}

  

- _step 4_: Installing dependencies:

  

With the virtual environment created we can now install the dependencies :

  

`pip install -r requirements.txt`and`pip install aws_cdk.aws_ec2 aws_cdk.aws_ecs aws_cdk.aws_ecr aws_cdk.aws_iam`{:.language-clojure .highlight}

  

With the project initialized we can now move to the next step where we will be creating our components.

  

#### Creating the objects :

  

We can now move to the stack creation step

  

If you open the file under `ecs_devops_cdk/ecs_devops_cdk_stack.py`{:.language-clojure .highlight} you should be able to see the followings :

  

```python

from aws_cdk import core

class EcsDevopsCdkStack(core.Stack):

def __init__ (self, scope: core.Construct, construct_id: str, **kwargs) -> None:

super(). __init__ (scope, construct_id, **kwargs)

```

  

It is basically a class that will contain the code defining our stack.

  

__step 1__: Import the core functionality

  

Edit the first line to import the code we need to create the following stack:

  

`python

from aws_cdk import (core, aws_ecs as ecs, aws_ecr as ecr, aws_ec2 as ec2, aws_iam as iam, aws_logs)`

  

__step 2__: Create the container repository

  

To create a container repository you can use the following command :

  

```python

ecr_repository = ecr.Repository(self, "ecs-devops-repository", repository_name="ecs-devops-repository")

```

  

__step 3__: Creating the VPC :

  

We can either create a vpc or use an existing vpc. To create a vpc use can add the following code the ` __init__ `{:.language-clojure .highlight} method.

  

```python

vpc = ec2.Vpc(self, "ecs-devops-vpc", max_azs=3)

```

  

You can also use an existing vpc , if that is the case for you use the following lines:

  

```python

vpc = ec2.Vpc.from_lookup(self, "ecs-devops-vpc",vpc_id='vpc-number')

```

  

For this, you need the vpc name and the corresponding id.

  

_step 4:_ Cluster Creation :

  

With the vpc created we can attach the cluster to it . To create the cluster we can use the following code :

  

```python

cluster = ecs.Cluster(self,

"ecs-devops-cluster",

cluster_name="ecs-devops-cluster",

vpc=vpc)

```

  

_step 5:_ Creating the Role:

  

Let us create the role, the role will give the service permission to perform tasks.

  

```python

execution_role = iam.Role(self, "ecs-devops-execution-role", assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"), role_name="ecs-devops-execution-role")

```

  

With the execution role created we can attach policy to it to give it the permission it needs.

  

```python

execution_role.add_to_policy(iam.PolicyStatement( effect=iam.Effect.ALLOW, resources=["*"], actions=["ecr:GetAuthorizationToken", "ecr:BatchCheckLayerAvailability", "ecr:GetDownloadUrlForLayer", "ecr:BatchGetImage", "logs:CreateLogStream", "logs:PutLogEvents"] ))

```

  

With the IAM role created we can attach a task definition to it

  

_Step 6_: Creating the task definition :

  

Here is the code we used to create the task definition ;

  

```python

task_definition = ecs.FargateTaskDefinition(self, "ecs-devops-task-definition", execution_role=execution_role, family="ecs-devops-task-definition")

```

  

And the container :

  

```python

container = task_definition.add_container("ecs-devops-sandbox", image=ecs.ContainerImage.from_registry("amazon/amazon-ecs-sample") )

```

  

In the code above, we are initially specifying the Task Definition to run with an example container from a public AWS sample registry. This sample container is replaced with our application container when our CI/CD pipeline updates the Task Definition. We are using the container from the sample registry to allow the Service to stabilize before any application container images are added to our ECR repository.

  

With the task definition created we can attach a service that will be running it.

  

_step 7:_ Creating the service :

```python

service = ecs.FargateService(self, "ecs-devops-service", cluster=cluster, task_definition=task_definition, service_name="ecs-devops-service")

```

  

The service uses the task definition and you can see it is attached to our created cluster.

  

PS: When your AWS instance is in a public subnet , you need to auto-assign public IP addresses to the containers to grant them internet access. This will help your service to download a docker image from a public repository. In that case, you can use the following code when creating the service. :

  

```python

service = ecs.FargateService(self,

"service-name",

cluster=cluster,

task_definition=task_definition,

service_name="service-name",

assign_public_ip=True, # this is important

security_groups=[list of security groups , also important],

vpc_subnets=[list of subnets]

)

```

Note the assign_public_ip , the security group and the VPC subnets.

  

_Step 8_: Creating the cloudwatch Log group:

  

```python

log_group = aws_logs.LogGroup(

  

self,

  

"ecs-devops-service-logs-groups",

  

log_group_name="ecs-devops-service-logs")

```

  

As stated before we will be transferring the docker logs to our log group created in Cloudwatch.

  

With all the objects created let us make sure that we have all the ingredients for our stack in the following updated file.

  

`ecs_devops_cdk/ecs_devops_cdk_stack.py`{:.language-clojure .highlight}

  

```python

from aws_cdk import (core, aws_ecs as ecs, aws_ecr as ecr, aws_ec2 as ec2, aws_iam as iam, aws_logs)

  

class EcsDevopsCdkStack(core.Stack):

def __init__ (self, scope: core.Construct, construct_id: str, **kwargs) -> None:

  

super(). __init__ (scope, construct_id, **kwargs)

ecr_repository = ecr.Repository(self, "ecs-devops-repository", repository_name="ecs-devops-repository")

vpc = ec2.Vpc(self, "ecs-devops-vpc", max_azs=3)

cluster = ecs.Cluster(self, "ecs-devops-cluster", cluster_name="ecs-devops-cluster", vpc=vpc)

execution_role = iam.Role(self, "ecs-devops-execution-role", assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"), role_name="ecs-devops-execution-role")

execution_role.add_to_policy(iam.PolicyStatement(

effect=iam.Effect.ALLOW, resources=["*"],

actions=["ecr:GetAuthorizationToken",

"ecr:BatchCheckLayerAvailability",

"ecr:GetDownloadUrlForLayer",

"ecr:BatchGetImage",

  

"logs:CreateLogStream",

  

"logs:PutLogEvents" ] ))

  

task_definition = ecs.FargateTaskDefinition(self, "ecs-devops-task-definition", execution_role=execution_role,

family="ecs-devops-task-definition")

container = task_definition.add_container("ecs-devops-sandbox", image=ecs.ContainerImage.from_registry("amazon/amazon-ecs-sample"))

service = ecs.FargateService(self, "ecs-devops-service", cluster=cluster, task_definition=task_definition, service_name="ecs-devops-service")

log_group = aws_logs.LogGroup(self, "ecs-devops-service-logs-groups", log_group_name="ecs-devops-service-logs")

```

  

Before creating the stack open the file `app.py`{:.language-clojure .highlight}

  

You should see something like this :

  

```python

from aws_cdk import core

from ecs_devops_cdk.ecs_devops_cdk_stack import EcsDevopsCdkStack

app = core.App()

  

EcsDevopsCdkStack(app, "ecs-devops-cdk")

app.synth()

```

  

Replace the line where your stack is instantiated, 4th line, with the following :

  

```python

EcsDevopsCdkStack(app, "ecs-devops-cdk", env={

  

'account': " **************",

  

'region': "your region"

  

})

```

  

With this set; you can now create your stack. With the code created we can now run the following command to create our stack.

  

`cdk deploy`{:.language-clojure .highlight}

  

If everything goes well you should have your stack created. As a result, you will have a cluster, running a service that deploys a task definition, and a Cloudwatch log group created.

  

You can check your stack from the AWS console by navigating to the following [link](https://us-east-2.console.aws.amazon.com/cloudformation/home?region=us-east-2#/stacks?filteringStatus=active&filteringText=&viewNested=true&hideStacks=false).

  

If you want, you can check this project on GitHub [here](https://github.com/espoirMur/ecs-devops-cdk).

  

That is all for this first part, we managed to build our ship and added the most important objects to it.

We are now ready to pack containers and deliver our content to our client.

  

In the second part of this series, we will learn how to convert our docker-compose file to a task definition described in this tutorial. See you then!
