---
title : Deploy a containerized python to AWS using Github Actions
date : 2021-02-26T12:14:07
description: Tutorial on how to build a ci/cd that use github actions to deploy a python to aws.
published : False
---

## Deploy a containerized python to AWS using Github Actions

Recently at work we decided to build a CI/CD pipeline to deploy our application directly to AWS . I had never worked with AWS and it was  the missing point on my cv to demonstrate that I have some devops skills . I decided to look for some tutorials online and I was not lucky to have what does what we need at work . I decided to write this guide by getting something working from various tutorials I found  online. 
### What you will learn from this tutorial 
- How to create an AWS architecture where you can deploy an python application
- How to use Github Actions to deploy to that architecture
- Some gotcha about deploying on AWS and how I a managed to solve them. 
### Who is this tutorial for

This tutorial is for middle level python developers who are familiar with docker and have a python application with docker-compose. 

### Which Application we will deploy 

In this tutorial we will deploy a python application which has a celery worker, a celery scheduler and a redis database for task messaging and task queues. 

I am not planning to talk about celery and task queue and how to use those framework but you can get start with them [here](https://medium.com/analytics-vidhya/python-celery-distributed-task-queue-demystified-for-beginners-to-professionals-part-1-b27030912fea) and to get started with docker you can use [this one](https://samwalpole.com/getting-started-with-docker) and [this one](https://adamtheautomator.com/docker-compose-tutorial/) to be familiar with docker compose.

I will not touch to any popular python web framework  such Django, Flask or FastAPi but you can adapt this tutorial to them and I am sure it will work like a charm.

My friends who write Php , Javascrpit or any other fancy language can also leverage this tutorial and adapt something to their language.

The application skeleton can be downloaded from [this link](https://github.com/espoirMur/deploy_python_to_aws_github_actions) to get start.

### Getting started 

To get start download a sample project we will be using by running the following command in your cmd, I hope you have git installed in your machine.

`git clone https://github.com/espoirMur/deploy_python_to_aws_github_actions.git`

As you can see this is just a dummy project which run with run 4 docker containers.

You can follow the readme to get the project running for you.

### Creating the AWS Architecture

Make sure you have created an AWS account and you have your credentials , the access key and the application secret.

Most of the service used in this tutorial are available with an AWS free tier account. 

We will be using this tutorial and follow the steps they gave us to create the architecture we need :

Basically those are the stack we need : 

<p>
    <img src="./images/aws_objects.png" alt>
</p>
 <p>
    <em><a href="https://chintugudiya.org/focus-areas/tech-work/overview-deploying-glific-on-aws-ecs-fargate-with-cd-in-place/">
    Source</a></em>
</p>

We will deploy our application using the AWS ECS Fragate launch type which will pull docker images from the Elastic Container Registry aka ECR.

#### Why Fragate and not EC2?

AWS provide us basically two accounts launch type which are the Fragate Launch type and the EC2. 

Amazon Elastic Compute Cloud (Amazon EC2) provides scalable computing capacity in the Amazon Web Services (AWS) Cloud. Using Amazon EC2 eliminates your need to invest in hardware up front, so you can develop and deploy applications faster. You can use Amazon EC2 to launch as many or as few virtual servers as you need, configure security and networking, and manage storage. With EC2 you don't need to care about hardware , everything hardware is managed by AWS. 

AWS Fargate is a technology that you can use with Amazon ECS to run [containers](https://aws.amazon.com/what-are-containers) without having to manage servers or clusters of Amazon EC2 instances.The  advantages Fragate over EC2 is the fact that you don't have to configure, provision or scale clusters instance and care about virtual machine.


In a nutshell : 

With a virtual machine, someone still has to manage the hardware, but with EC2 that someone is AWS and you never even see the hardware.

With ECS on EC2, someone still has to manage the instances, but with ECS on Fargate that someone is AWS and you never even see the EC2 instances.

ECS has a “launch type” of either EC2 (if you want to manage the instances yourself) or Fargate (if you want AWS to manage the instances). [Source](https://www.reddit.com/r/aws/comments/dvl601/eli5_aws_fargate/f7ddkup?utm_source=share&utm_medium=web2x&context=3). 

Add cloud watch to check the logs 
https://aws.amazon.com/blogs/containers/create-a-ci-cd-pipeline-for-amazon-ecs-with-github-actions-and-aws-codebuild-tests/

### The objects we need : 


To deploy the application we need the following objects : A cluster, a service , a task definition  with container definition, cloud watch for logging , iam roles. 
The bellow picture show how those AWS objects interacts with each other.

Let us define some of those objects and then we will investigate how to create a stack having them using the Python cdk . 

- __A cluster__: It is a logical group of container instances that ECS can use for deploying Docker containers. It provides compute power to run application container instances.  In practise a container is usually attached to an AWS Instance. 
- __A service__: It enables us to run and maintain a specified number of instances of a task definition simultaneously in an Amazon ECS cluster. ie. It helps us run single or multiple containers all using the same Task Definition.
- __The task definition__: A task definition is a specification. You use it to define one or more containers (with image URIs) that you want to run together, along with other details such as environment variables, CPU/memory requirements, etc. The task definition doesn't actually run anything, its a description of how things will be set up when something does run. The task definition is similar to the docker-compose file. We will later use the docker compose file to generate a task definition. 
- __A task__ : A task is an actual thing that is running. ECS uses the task definition to run the task; it downloads the container images, configures the runtime environment based on other details in the task definition. You can run one or many tasks for any given task definition. Each running task is a set of one or more running containers - the containers in a task all run on the same instance.
- __cloudwatch__: CloudWatch is a monitoring service , we are using it in this stack to get and visualize logs form the docker containers.


With all the objects describes we can now move to how to create the object using the python cdk. 

#### Creating the architecture: 

This picture will be describing what we need to run the application: 

<p>
    <img src="./images/aws_architecture.png" alt>
</p>
 <p>
    <em>Our architecture and workflow in  a nutshell <em>
</p>

To build the infrastructure, we will be leverage the [AWS Cloud Development Kit (CDK)](https://aws.amazon.com/cdk/). If you are new to the CDK, see [Getting Started with the AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html), it is  a simple and straigthforward to install. In this post, we will be using the CDK with Python 3.7.
Another alternative to the cdk is to create the application via the aws console, however I found the cdk to be simplest approach because , I am a programmer and with the code we can have a full control on what we are creating .

After installing the cdk check if it working with the following command: 

- `cdk --version ` it should put the your cdk version.

##### Initializing the AWS  CLI : 
Make sure you have the aws cli installed in your computer. . [Configure your AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html) with an IAM user that has permissions to create the resources (VPC, ECS, ECR, IAM Role) described in the template below. 
After the configuration you should have the aws keys stored in your computer at the following location : 
- `~/.aws/credentials` : if you are using a mac or linux
- ```C:\Users\`USERNAME`\.aws\config```: if you are on Windows 

The content of that file should look like this one: 

```
[default]
region=your region
aws_access_key_id = *********************************
aws_secret_access_key = ******************************
```
We the crendentials , the cli and the cdk installed let us move to the second step about creating the archictecture. 

#### Initializing The cdk Project : 

To initialize the cdk we will create another project wich will contains the code to create the architecture.

_*Step 1*_ : Creating the project 

Run the following command to creat a new cdk project : 
`mkdir ecs-devops-cdk`

Enter the project using : 
`cd ecs-devops-cdk`

Or if you are using Vscode you can open the project with vs code using : 
`code ecs-devops-cdk`
- _Step 2_:  Initialize the python cdk project : 

To initialize the cdk project run the following command : 
`cdk init --language python`

The command will create a new python cdk project and we will be editing it in the next step to build our stack. 

After a quick look you should see a structure like this in your project: 

```
.
├── README.md
├── app.py
├── cdk.json
├── ecs_devops_cdk
│   ├── __init__.py
│   └── ecs_devops_cdk_stack.py
├── requirements.txt
├── setup.py
└── source.bat
```

- __Step 3__ : activate virtual enviroment : 

You can activate your virtuall environment using the following code : 

On mac and linux : `source .env/bin/activate`
For windows : `.env\Scripts\activate.bat`

- __step 4__ : Installing dependencies: 
With the virtual environment created we can now install the dependencies : 

`pip install -r requirements.txt`
and 
`pip install aws_cdk.aws_ec2 aws_cdk.aws_ecs aws_cdk.aws_ecr aws_cdk.aws_iam`


With the project initialized we can now move to the next step where we will be creating our components. 

#### Creating the objects : 

We can now move to the stack creation step 

If you open the file under `ecs_devops_cdk/ecs_devops_cdk_stack.py`  you should be able to see the followings : 

```
from aws_cdk import core
class  EcsDevopsCdkStack(core.Stack):

  

def  __init__(self, scope: core.Construct, construct_id:  str,  **kwargs)  ->  None:

super().__init__(scope, construct_id,  **kwargs)

```
it is basically a class that will contains the code defining our stack. 

##### Import the core functionality : 

Edit the first line to import the code we need to create the following stack: 

`from aws_cdk import  (core, aws_ecs as ecs, aws_ecr as ecr, aws_ec2 as ec2, aws_iam as iam, aws_logs)`

##### Create the container repository 

To create a container repository you can use the following command : 

```
ecr_repository = ecr.Repository(self,  "ecs-devops-repository", repository_name="ecs-devops-repository")
```

##### Creating the VPC 

We can either create a vpc or use an existing vpc . 
To create a vpc use can add the following code the  `__init__` method. 

```
vpc = ec2.Vpc(self,  "ecs-devops-vpc", max_azs=3)
```
You can also use an existing vpc , if that is the case for you use the following lines: 

```
vpc = ec2.Vpc.from_lookup(self, "ecs-devops-vpc",vpc_id='vpc-number')
 ```
For this you need the vpc name and the corresponding id. 

##### Cluster Creation : 
With the vpc created we can attached the cluster to it . 
To create the cluster we can use the following code : 
```
cluster = ecs.Cluster(self,  
					  "ecs-devops-cluster", 
					  cluster_name="ecs-devops-cluster",
					  vpc=vpc)
```

#####  Creating the Role: 
Let us create the role , the role will give the service the permission to do some tasks . 
```
execution_role = iam.Role(self,  "ecs-devops-execution-role", assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"), role_name="ecs-devops-execution-role")
```

With the execution role created we can it to policy to give it the permission it needs (This sentence needs to be refractored)

```
execution_role.add_to_policy(iam.PolicyStatement( effect=iam.Effect.ALLOW, resources=["*"], actions=[  "ecr:GetAuthorizationToken",  "ecr:BatchCheckLayerAvailability",  "ecr:GetDownloadUrlForLayer",  "ecr:BatchGetImage",  "logs:CreateLogStream",  "logs:PutLogEvents"  ]  ))
```

With the iam role create we can attach to it a task definition

##### Creating the task definition : 

Here is the code we used to create the task definition ; 

```
task_definition = ecs.FargateTaskDefinition(self,  "ecs-devops-task-definition", execution_role=execution_role, family="ecs-devops-task-definition")
```

And  the container : 

```
container = task_definition.add_container("ecs-devops-sandbox", image=ecs.ContainerImage.from_registry("amazon/amazon-ecs-sample")  )
```

In the code above, we are initially specifying the Task Definition to run with an example container from a public AWS sample registry. This sample container is replaced with our application container when our CI/CD pipeline updates the Task Definition. We are using the container from the sample registry to allow the Service to stabilize before any application container images are added to our ECR repository.

With the task definition created we can attach a service that will be running it  . 

##### Creating the service : 

```
service = ecs.FargateService(self,  "ecs-devops-service", cluster=cluster, task_definition=task_definition, service_name="ecs-devops-service")
```

The service use the task definition and you can see it is attached to our created cluster. 

##### Creating the cloudwatch service : 

```
log_group = aws_logs.LogGroup(

self,

"ecs-devops-service-logs-groups",

log_group_name="ecs-devops-service-logs")
```
As stated before we will be transferring the docker logs to our log group created in cloudwatch.



With all the objects created let us make sure that we have all the ingredients for our stack in the following updated file . 

`ecs_devops_cdk/ecs_devops_cdk_stack.py`


```
from aws_cdk import  (core, aws_ecs as ecs, aws_ecr as ecr, aws_ec2 as ec2, aws_iam as iam, aws_logs)

  
  

class  EcsDevopsCdkStack(core.Stack):

  

def  __init__(self, scope: core.Construct, construct_id:  str,  **kwargs)  ->  None:

super().__init__(scope, construct_id,  **kwargs)

  

# The code that defines your stack goes here

  

ecr_repository = ecr.Repository(self,

"ecs-devops-repository",

repository_name="ecs-devops-repository")

  
  

vpc = ec2.Vpc(self,  "ecs-devops-vpc",  max_azs=3)

  

cluster = ecs.Cluster(self,

"ecs-devops-cluster",

cluster_name="ecs-devops-cluster",

vpc=vpc)

execution_role = iam.Role(self,

"ecs-devops-execution-role",

assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),

role_name="ecs-devops-execution-role")

  

execution_role.add_to_policy(iam.PolicyStatement(  effect=iam.Effect.ALLOW,

resources=["*"],

actions=["ecr:GetAuthorizationToken",

"ecr:BatchCheckLayerAvailability",

"ecr:GetDownloadUrlForLayer",

"ecr:BatchGetImage",

"logs:CreateLogStream",

"logs:PutLogEvents"  ]  ))

task_definition = ecs.FargateTaskDefinition(self,

"ecs-devops-task-definition",

execution_role=execution_role,

family="ecs-devops-task-definition")

container = task_definition.add_container("ecs-devops-sandbox",

image=ecs.ContainerImage.from_registry("amazon/amazon-ecs-sample"))

service = ecs.FargateService(self,

"ecs-devops-service",

cluster=cluster,

task_definition=task_definition,

service_name="ecs-devops-service")

log_group = aws_logs.LogGroup(self,

"ecs-devops-service-logs-groups",

log_group_name="ecs-devops-service-logs")
```

Before creating the stack  open the file `app.py` 

You should see something like this : 

```
from aws_cdk import core

  

from ecs_devops_cdk.ecs_devops_cdk_stack import EcsDevopsCdkStack

  
  

app = core.App()

EcsDevopsCdkStack(app,  "ecs-devops-cdk")

  

app.synth()
```

Replace the line where your stack is instanciate 4th line with the following : 

```
EcsDevopsCdkStack(app,  "ecs-devops-cdk",  env={

'account':  "**************",

'region':  "your region"

})
```

With this set you can now create your stack 
With the code created we can now run the following command to create our stack.

`cdk deploy`

If everything goes well you should have your stack created . As a results you will have a cluster , running a service that deploys a task definition , and a Cloudwatch log group create . 

You can check your stack from the AWS console by navigating to the following [link](https://us-east-2.console.aws.amazon.com/cloudformation/home?region=us-east-2#/stacks?filteringStatus=active&filteringText=&viewNested=true&hideStacks=false).

You should be able to see something like this : 

Put the screenshot here

If you want you can check this project on github [here](https://github.com/espoirMur/ecs-devops-cdk)
With the task created we can now move back to the project and see how to deploy it .


### Setup Github Actions


(Should probably talk about what is ci/cd and what are github actions)
In this section we will setup Github Actions  that will automatically deploy the code to the AWS stack we have just created. 

The action on every push to the master branch will build  a docker image for our application, login to ECR , push the image to the ECR , update the task definition with the new image pushed url , and start the service with the associated task definition in the AWS Cluster.

(Put an image here)

Here are a list of the github actions we will be using : 

-   [Configure-aws-credentials](http://github.com/aws-actions/configure-aws-credentials) –This will help to  configure AWS credential and region environment variables for use in other GitHub Actions. 
-   [Amazon-ecr-login](http://github.com/aws-actions/amazon-ecr-login) – This will enable us to log in the local Docker client to one or more Amazon Elastic Container Registry (ECR) registries. After logging we can therefore push our docker images to the registry. 
-   [Amazon ECS-render-task-definition](http://github.com/aws-actions/amazon-ecs-render-task-definition) – This will help us to render the docker image uri to the task definition.
-   [Amazon ECS-deploy-task-definition](http://github.com/aws-actions/amazon-ecs-deploy-task-definition) – This is the action that does the real deploy for us. It will register the AWS task definition to ECS and then deploys it to an Amazon ECS service.
- [Docker Buildx](https://github.com/docker/setup-buildx-action): This actions will help us to setup the most recent version of docker build , buildx which support caching. It is not mandotory if you don't need to use caching you can skip it . 

#### Back To the Business : The code we want to deploy .

Let go back to the project I introduced in the beginning and we will work from it. 
From your command line move to the project directory : 

`cd deploy_python_to_aws_github_actions`

Activate your virtual enviroment with : 

`source .venv/bin/activate`

#### Creating the task-definition: 
Let recall what is the a task definition it just  a specification. You use it to define one or more containers (with image URIs) that you want to run together, along with other details such as environment variables, CPU/memory requirements, etc.
Since the task definition role is similar to a docker-compose file role , we will therefore use the docker-compose file to generate the task-defintion. We will leverage a python tool called [container-transform](https://github.com/micahhausler/container-transform) to accomplish that actions.

You can install it in your project virtual environment with : 

`pip install container-transform`

With the tool installed we can now use to generate the task definition.

`cat docker-compose.yml | container-transform  -v > .aws/task-definition.json`

The output of this command is send to the file `.aws/task-definition.json` , if everything went well you can have something like this : 

```
{

"requiresCompatibilities":  [

"FARGATE"

],

"inferenceAccelerators":  [],

"containerDefinitions":  [{

"command":  ["celery",  "-A",  "celery_factory:celery",  "beat",  "--scheduler=redbeat.RedBeatScheduler",  "--loglevel=debug"],

"essential":  true,

"image":  "spiny-pi-cards-aws:00000",

"logConfiguration":  {

"logDriver":  "awslogs",

"options":  {

"awslogs-group":  "spiny-pi-cards-logs",

"awslogs-region":  "us-east-2",

"awslogs-stream-prefix":  "celery-beat"

}

},

"name":  "celery-beat",

"stopTimeout":  120

},

{

"command":  ["celery",  "-A",  "celery_factory:celery",  "worker",  "--loglevel=error",  "-E"],

"essential":  true,

"image":  "spiny-pi-cards-aws:00000",

"logConfiguration":  {

"logDriver":  "awslogs",

"options":  {

"awslogs-group":  "spiny-pi-cards-logs",

"awslogs-region":  "us-east-2",

"awslogs-stream-prefix":  "celery-worker"

}

},

"name":  "celery-worker",

"startTimeout":  10,

"stopTimeout":  120

},

{

"command":  [

"celery",

"-A",

"celery_factory:celery",

"flower",

"--loglevel=error",

"-E"

],

"environment":  [

{

"name":  "FLOWER_PORT",

"value":  "5556"

}

],

"essential":  true,

"image":  "spiny-pi-cards-aws:00000",

"logConfiguration":  {

"logDriver":  "awslogs",

"options":  {

"awslogs-group":  "spiny-pi-cards-logs",

"awslogs-region":  "us-east-2",

"awslogs-stream-prefix":  "celery-flower"

}

},

"name":  "flower",

"portMappings":  [

{

"containerPort":  5556,

"hostPort":  5556

}

],

"startTimeout":  30,

"stopTimeout":  120

},

{

"essential":  true,

"image":  "redis",

"name":  "redis",

"logConfiguration":  {

"logDriver":  "awslogs",

"options":  {

"awslogs-group":  "spiny-pi-cards-logs",

"awslogs-region":  "us-east-2",

"awslogs-stream-prefix":  "redis-database"

}

},

"startTimeout":  5,

"stopTimeout":  120,

"portMappings":  [

{

"containerPort":  6379

}

]

}

],

"volumes":  [],

"networkMode":  "awsvpc",

"memory":  "6144",

"cpu":  "2048",

"executionRoleArn":  "arn:aws:iam::969273490168:role/spiny_pi_cards-execution-role",

"family":  "spiny_pi_cards-task-definition",

"taskRoleArn":  "",

"placementConstraints":  []

}
```

What to note here , it all the services we have in the docker-compose file are now in the `containerDefinitions` sections of our task definition. 
However that file is not yet full completed we will have to update it with other keys such as the network mode, the resources, the execution role we created before, and the logging option for sending logs to Cloudwatch. Let go now and edit the file by adding the following. And we also need to remove the `link` key from each container definition. 

```
"requiresCompatibilities":  [

"FARGATE"

],

"inferenceAccelerators":  [],
"volumes":  [],

"networkMode":  "awsvpc",

"memory":  "512",

"cpu":  "256",

"executionRoleArn":  "arn:aws:iam::Your-id-from-aws:role/ecs-devops-execution-role",

"family":  "ecs-devops-task-definition",

"taskRoleArn":  "",

"placementConstraints":  []
```

What are those elements ? 

- `requiresCompatibilities` : Here we are just specifying that our launch type is of Fragate type . 
- `networkMode` : This is the Docker networking mode to use for the containers in the task. AWS offer the following network modes : `none`, `bridge`, `awsvpc`, and `host`. In Fragate launch type the `awsvpc` network mode is required.  With this setting the task is allocated its own elastic network interface (ENI) and a primary private IPv4 address. This gives the task the same networking properties as Amazon EC2 instances. (Put what I mean by this here) Learn more about the networking mode [here](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-networking.html) . 
- `memory`: is the amount of ram to allocate to the containners, if your cluster does not have any registered container instances with the requested memory available, the task will fail.
- `cpu`: The number of `cpu` units the Amazon ECS container agent will reserve for the container. 
- `executionRoleArn`: The Amazon Resource Name (ARN) of the task execution role that grants the Amazon ECS container agent permission to make AWS API calls on your behalf. As you can see it is the iam role  we created in our cloudformation stack.
- `family`: is the name of the task definition we created on the cloud formation stack.

In each container definition we need to add the code to send the container logs to cloudwatch.

```
"logConfiguration":  {

"logDriver":  "awslogs",

"options":  {

"awslogs-group":  "ecs-devops-service-logs-groups",

"awslogs-region":  "us-east-2",

"awslogs-stream-prefix":  "celery-beat"

}

},
```

Add those line to each aws service and just change the `awslogs-stream-prefix` key and put the containner name. 
To learn more about task-definitions parameters you can check [the aws documentation](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html)

With those parameters edited we end up with the following task-definition. 

```
{

"containerDefinitions":  [

{

"command":  [

"celery",

"-A",

"celery_factory:celery",

"beat",

"--scheduler=redbeat.RedBeatScheduler",

"--loglevel=debug"

],

"essential":  true,

"image":  "task_runner",

"links":  ["redis"],

"name":  "celery-beat",

"logConfiguration":  {

"logDriver":  "awslogs",

  

"options":  {

"awslogs-group":  "ecs-devops-service-logs-groups",

  

"awslogs-region":  "us-east-2",

  

"awslogs-stream-prefix":  "celery-beat"

}

}

},

{

"command":  [

"celery",

"-A",

"celery_factory:celery",

"worker",

"--loglevel=error",

"-E"

],

"essential":  true,

"image":  "task_runner",

"links":  ["redis"],

"name":  "celery-worker",

"logConfiguration":  {

"logDriver":  "awslogs",

  

"options":  {

"awslogs-group":  "ecs-devops-service-logs-groups",

  

"awslogs-region":  "us-east-2",

  

"awslogs-stream-prefix":  "celery-worker"

}

}

},

{

"command":  ["./start_flower"],

"environment":  [

{

"name":  "FLOWER_PORT",

"value":  "5556"

}

],

"essential":  true,

"image":  "task_runner",

"logConfiguration":  {

"logDriver":  "awslogs",

  

"options":  {

"awslogs-group":  "ecs-devops-service-logs-groups",

  

"awslogs-region":  "us-east-2",

  

"awslogs-stream-prefix":  "celery-flower"

}

},

"links":  ["redis"],

"name":  "flower",

"portMappings":  [

{

"containerPort":  5556,

"hostPort":  5556

}

]

},

{

"essential":  true,

"image":  "redis",

"name":  "redis",

"containerPort":  6379,

"logConfiguration":  {

"logDriver":  "awslogs",

"options":  {

"awslogs-group":  "ecs-devops-service-logs-groups",

  

"awslogs-region":  "us-east-2",

  

"awslogs-stream-prefix":  "celery-redis"

}

}

}

],

"requiresCompatibilities":  ["FARGATE"],

  

"inferenceAccelerators":  [],

"volumes":  [],

"networkMode":  "awsvpc",

"memory":  "512",

"cpu":  "256",

"executionRoleArn":  "arn:aws:iam::Your-id-from-aws:role/ecs-devops-execution-role",

"family":  "ecs-devops-task-definition",

"taskRoleArn":  "",

"placementConstraints":  []

}
```

With the task definition in place , let us move to the Github Actions: 

#### Creating the Github actions: 

To create Github Actions we can add them from the Github ui or do it from command line. 
To peform that operation via commad line you neet to have a folder called `.github/workflows` in your project directory and add your action `.yml` file within it.

Let us create the folder: 
`mkdir .github && mkdir .github/workflows`

Then we can create our action file with `touch .github/workflows/deploy_aws.yml
`

##### Setting up 

In the deploy to aws action we add the following code  : 

```
on:

push:

branches:

-  master

name:  Deploy to Amazon ECS
```

In this line we are only specifying the event that will trigger our action, this action will be trriggered on a push to master.

Next let us specify the set of job that our actions will run: 

```
jobs:

deploy:

name:  Deploy

runs-on:  ubuntu-latest
```

This tell our job to run on ubuntu instance . 
The job have the following steps 

```
steps:

-  name:  Checkout

uses:  actions/checkout@v1
```

This action checks-out your repository under `$GITHUB_WORKSPACE`, so your workflow can access it.

```
-  name:  Set up Python python-version

uses:  actions/setup-python@v1

with:

python-version:  3.7
```

This action setup the python version version to use for our application. 

```
-  name:  Set up QEMU

uses:  docker/setup-qemu-action@v1

# https://github.com/docker/setup-buildx-action

-  name:  Set up Docker Buildx

uses:  docker/setup-buildx-action@v1
```

This one setup the docker bulid tools we will be using .

```
-  name:  create docker cache

uses:  actions/cache@v1

with:

path:  ${{ github.workspace }}/cache

key:  ${{ runner.os }}-docker-${{ hashfiles('cache/**') }}

restore-keys:  |

${{ runner.os }}-docker-
```
This one create the cache we will be using in the build phase.

```
-  name:  generating the config files

run:  |

echo '''${{ secrets.CONFIGURATION_FILE }}''' >> .env

echo "done creating the configuration file"
```

This one generate our configuration file, so basically if you have enviroment variables in a .env file, this actions will generate them back. 

```
-  name:  Configure AWS credentials

uses:  aws-actions/configure-aws-credentials@v1

with:

aws-access-key-id:  ${{ secrets.AWS_ACCESS_KEY_ID }}

aws-secret-access-key:  ${{ secrets.AWS_SECRET_ACCESS_KEY }}

aws-region:  us-east-2
```

As the name stated this actions will configure your aws crendentials so that you can easily login to the ECR. Don't forget to add your credentials to your github repository secrets

```
-  name:  Login to Amazon ECR

id:  login-ecr

uses:  aws-actions/amazon-ecr-login@v1
```
As the name stated this use the credentials setup  in the previous steg to login to the container registry.

Once we are login we can now build the container and push to the container registry . 

```
-  name:  Build, tag, and push image to Amazon ECR

id:  build-image

env:

ECR_REGISTRY:  ${{ steps.login-ecr.outputs.registry }}

ECR_REPOSITORY:  ecs-devops-repository

IMAGE_TAG:  ${{ github.sha }}

run:  |

docker buildx build -f Dockerfile --cache-from "type=local,src=$GITHUB_WORKSPACE/cache" --cache-to "type=local,dest=$GITHUB_WORKSPACE/cache" --output "type=image, name=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG,push=true" .

echo "::set-output name=image::$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG"
```

This build the container and push the container registry. Note that the output of this step is the image uri or image name . we will need it in the next step. 

The next step we will fill the image name in the each container definition in our task-definition file , so that the docker container will be pulling the new build docker image.

There are 3 setps that are in sequence . The output of one step is used in the next step. 

```
-  name:  Fill in the new image ID in the Amazon ECS task definition of the beat container

id:  render-beat-container

uses:  aws-actions/amazon-ecs-render-task-definition@v1

with:

task-definition:  ./.aws/task-definition.json

container-name:  celery-beat

image:  ${{ steps.build-image.outputs.image }}

  

-  name:  Fill in the new image ID in the Amazon ECS task definition of the flower container

id:  render-flower-container

uses:  aws-actions/amazon-ecs-render-task-definition@v1

with:

task-definition:  ${{ steps.render-beat-container.outputs.task-definition }}

container-name:  flower

image:  ${{ steps.build-image.outputs.image }}

  

-  name:  Fill in the new image ID in the Amazon ECS task definition of the worker container

id:  render-worker-container

uses:  aws-actions/amazon-ecs-render-task-definition@v1

with:

task-definition:  ${{ steps.render-flower-container.outputs.task-definition }}

container-name:  celery-worker

image:  ${{ steps.build-image.outputs.image }}
```

With the task definition updated we can now push the task definitions to the service and start running the service. 

```
-  name:  Deploy Amazon ECS task definition

uses:  aws-actions/amazon-ecs-deploy-task-definition@v1

with:

task-definition:  ${{ steps.render-worker-container.outputs.task-definition }}

service:  ecs-devops-service

cluster:  ecs-devops-cluster

wait-for-service-stability:  false
```

This is the step that does the actual deployment, it push the task definitions to the service which start the tasks. 

(put informtion about logging to the service), explaine the wait-for-service-stability argunment. 


Put how to check ifi the application is deployed ... 


With this added we can make sure we have the following content in our `.github/workflows/deploy_aws.yml ` file . 

```
on:

push:

branches:

-  master

name:  Deploy to Amazon ECS

jobs:

deploy:

name:  Deploy

runs-on:  ubuntu-latest

steps:

-  name:  Checkout

uses:  actions/checkout@v1

-  name:  Set up Python python-version

uses:  actions/setup-python@v1

with:

python-version:  3.7

-  name:  Set up QEMU

uses:  docker/setup-qemu-action@v1

# https://github.com/docker/setup-buildx-action

-  name:  Set up Docker Buildx

uses:  docker/setup-buildx-action@v1

-  name:  create docker cache

uses:  actions/cache@v1

with:

path:  ${{ github.workspace }}/cache

key:  ${{ runner.os }}-docker-${{ hashfiles('cache/**') }}

restore-keys:  |

${{ runner.os }}-docker-

-  name:  generating the config files

run:  |

echo '''${{ secrets.CONFIGURATION_FILE }}''' >> .env

echo "done creating the configuration file"

-  name:  Configure AWS credentials

uses:  ws-actions/configure-aws-credentials@v1

with:

aws-access-key-id:  ${{ secrets.AWS_ACCESS_KEY_ID }}

aws-secret-access-key:  ${{ secrets.AWS_SECRET_ACCESS_KEY }}

aws-region:  us-east-2

-  name:  Login to Amazon ECR

id:  login-ecr

uses:  aws-actions/amazon-ecr-login@v1

  

-  name:  Build, tag, and push image to Amazon ECR

id:  build-image

env:

ECR_REGISTRY:  ${{ steps.login-ecr.outputs.registry }}

ECR_REPOSITORY:  ecs-devops-repository

IMAGE_TAG:  ${{ github.sha }}

run:  |

docker buildx build -f Dockerfile --cache-from "type=local,src=$GITHUB_WORKSPACE/cache" --cache-to "type=local,dest=$GITHUB_WORKSPACE/cache" --output "type=image, name=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG,push=true" .

echo "::set-output name=image::$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG"

-  name:  Fill in the new image ID in the Amazon ECS task definition of the beat container

id:  render-beat-container

uses:  aws-actions/amazon-ecs-render-task-definition@v1

with:

task-definition:  ./.aws/task-definition.json

container-name:  celery-beat

image:  ${{ steps.build-image.outputs.image }}

-  name:  Fill in the new image ID in the Amazon ECS task definition of the flower container

id:  render-flower-container

uses:  aws-actions/amazon-ecs-render-task-definition@v1

with:

task-definition:  ${{ steps.render-beat-container.outputs.task-definition }}

container-name:  flower

image:  ${{ steps.build-image.outputs.image }}

-  name:  Fill in the new image ID in the Amazon ECS task definition of the worker container

id:  render-worker-container

uses:  aws-actions/amazon-ecs-render-task-definition@v1

with:

task-definition:  ${{ steps.render-flower-container.outputs.task-definition }}

container-name:  celery-worker

image:  ${{ steps.build-image.outputs.image }}

  

-  name:  Deploy Amazon ECS task definition

uses:  aws-actions/amazon-ecs-deploy-task-definition@v1

with:

task-definition:  ${{ steps.render-worker-container.outputs.task-definition }}

service:  ecs-devops-service

cluster:  ecs-devops-cluster

wait-for-service-stability:  false
```

With that , we can now commit the code and see how the application will start the pipeline and get deployed to AWS. 
Run the following to deploy.

`git commit -am 'setup the ci cd pipeline'` 

`git push origin master`

We can check if our github actions are running

(put a screenshot)


If everything goes well you can visualize the deployement here

https://us-east-2.console.aws.amazon.com/ecs/v2/clusters/ecs-devops-cluster/services/ecs-devops-service/deployments?region=us-east-2

Please change your service and cluster with your cluster name and service name in the url. 

If everything in your deployment goes well you can check the logs for your worker to see what is happenning there

https://us-east-2.console.aws.amazon.com/cloudwatch/home?region=us-east-2#logsV2:log-groups/log-group/ecs-devops-service-logs

