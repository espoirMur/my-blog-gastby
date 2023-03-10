---
layout: post
title: "Getting Started with Seldon-core and Kubernetes, Part 1: My Struggles with Kubernetes"
permalink: struggles-with-docker
date: 2022-03-07 10:03:59
comments: true
description: "Getting start with seldon-core and kubernetes."
keywords: "Kubernetes, Docker, MLops"
categories: 
published: true
tags: docker, kubernetes, devops
---

Learning Kubernetes has been on my bucket list for years. I always said that when I had the time, I would learn it because it is one of those tools missing from my developer toolbox.

In January, I decided to start my learning journey. I watched this amazing video, which gave me a basic overview of Kubernetes components, and I managed to install it on my local laptop.

To practice, I used Kubernetes to deploy a machine learning model. After researching, I found out that there are currently two tools used to deploy machine learning models using Kubernetes: Kserve and Seldon-core. After struggling to run Kserve on my machine, I decided to go with Seldon-core because it was well-documented and seemed more mature compared to Kserve. While following the getting started tutorial on Seldon-core, I encountered some bugs that tested my knowledge of Kubernetes. In this post, I will write about some of them, how I encountered them, and the lessons I learned from them.

The tutorial describes how to create a machine learning service on top of Kubernetes that will be used to make predictions.

My troubles and bugs started when I ran the following command to create the Seldon deployment:

```
yaml
$ kubectl apply -f - << END
apiVersion: machinelearning.seldon.io/v1
kind: SeldonDeployment
metadata:
  name: iris-model
  namespace: seldon
spec:
  name: iris
  predictors:
  - graph:
      implementation: SKLEARN_SERVER
      modelUri: gs://seldon-models/v1.16.0-dev/sklearn/iris
      name: classifier
    name: default
    replicas: 1
END
```

This command was supposed to start a SeldonDeployment, which consists of a deployment, a service, and a pod running the model. I hoped that the command would run successfully, but it didn't. Over the past three days, I faced different errors that made me learn more about Kubernetes. Let me talk about the first one.

### Downgrading Kubernetes version with Docker Desktop.
I don't remember many details about the first bug I faced because I didn't document it much. I remember using Docker Desktop as a backend for Kubernetes, and it was using Kubernetes 1.26. The fix for the issue was to use a lower version of Kubernetes, such as 1.24, but with Docker Desktop, there is no way to downgrade the version of Kubernetes. I had to switch to using Minikube; with it, I could specify the version of Kubernetes to use. Here is the command I used to downgrade it:

`minikube start --kubernetes-version=v1.24.1`

### Unable to pull the large images in the pod.

After solving the first issue, I faced another one. I noticed my pod was not starting, so I decided to debug the pod to find out what was going wrong. When I checked the pod's status, I found that it was stuck with this message: Error: ImagePullBackOff. I ran the following command:

`kubectl describe pod PodName -n podNamespace.`

And I ended up with the following error message:

```

  Normal   Scheduled  13m   default-scheduler  Successfully assigned seldon/xgboost-default-0-classifier-786f456bd4-jxjm6 to minikube
  Normal   Pulled     13m   kubelet   Container image "seldonio/rclone-storage-initializer:1.15.0" already present on machine
  Normal   Created    13m   kubelet   Created container classifier-model-initializer
  Normal   Started    13m   kubelet   Started container classifier-model-initializer
  Warning  Failed     10m   kubelet   Error: ErrImagePull
  Warning  Failed     10m   kubelet   Failed to pull image "seldonio/xgboostserver:1.15.0": rpc error: code = Unknown desc = context deadline exceeded
  Normal   Pulled     10m   kubelet   Container image "docker.io/seldonio/seldon-core-executor:1.15.0" already present on machine
  Normal   Created    10m   kubelet   Created container seldon-container-engine
  Normal   Started    10m   kubelet   Started container seldon-container-engine
  Normal   BackOff    9m58s (x2 over 9m59s)   kubelet   Back-off pulling image "seldonio/xgboostserver:1.15.0"
  Warning  Failed     9m58s (x2 over 9m59s)   kubelet   Error: ImagePullBackOff
  Normal   Pulling    9m45s (x2 over 13m)     kubelet   Pulling image "seldonio/xgboostserver:1.15.0"
  Warning  Unhealthy  3m14s (x84 over 9m39s)  kubelet   Readiness probe failed: HTTP probe failed with statuscode: 503
```

The first lines of the logs show that Kubernetes could not pull the image for my container:


`kubelet Failed to pull image "seldonio/xgboostserver:1.15.0": rpc error: code = Unknown desc = context deadline exceeded` 

Initially, I thought that my pod was not connected to the internet because it could not pull the container image, but that was not the case. On closer inspection, I found that the pod could pull the `docker.io/seldonio/seldon-core-executor:1.15.0` container image and was starting the executor container but not the MLServer image.

After several hours of debugging, I discovered that the error was due to the size of my image and the timeout while pulling the image for the first time. The container was trying to pull the images, but it took a long time to pull, and the container timed out. After Googling, two possible workarounds were suggested:

1.  Increase the size of the runtime timeout to a larger time and hope it will work.
2.  Download the images with a separate command and run the container once the image is downloaded in the machine.

To apply the first workaround, I had to run the following command:


`minikube ssh "sudo sed -i 's/KUBELET_ARGS=/KUBELET_ARGS=--runtime-request-timeout=TIME /g' /etc/systemd/system/kubelet.service.d/10-kubeadm.conf && sudo systemctl daemon-reload && sudo systemctl restart kubelet"` 

I tried it, but it didn't work in my case, so I had to use the second method, which consists of downloading the image separately inside Minikube. I used the following command:


`minikube image load seldonio/sklearnserver:1.15.0` 

The image was large and took approximately 10 minutes to download, maybe because my internet connection this weekend was not at its best. But after that, I passed that issue, but that was not all. There was another bug waiting for me:


`Readiness probe failed` 

When I described my pod, I found that the image was pulled and the container was running for a few seconds, and then it stopped with this message:


`kubelet Readiness probe failed: HTTP probe failed with statuscode: 503` 

When I read about the error message, I found that Kubernetes uses readiness probes to know if a container is ready to accept traffic. The service keeps sending the request to the pod until the pod is ready to accept the traffic. So it was not passing that status. It is an error on the container side. But the container was stopped; how could I log in to a stopped container? I found this command:


`kubectl logs podName -c ContainerName -n=seldon` 

By checking the log of the container to my satisfaction, I found that the container was failing because of an error with the Python image. I fixed it by changing the container image I used in my deployment. Then I had everything running.

With the pod running and the service working, how could I connect to the container inside a cluster? I had to create an ingress component connecting to the external service serving my pod on port 9000, where the model was running. I did everything to set up the ingress, but I could not connect to the internal service on my Mac.

I spent quite some time learning about Kubernetes networking and how services work, but networking is out of the scope of this tutorial. In the short term, I had to use tunneling to access my ingress from outside the container.

Thanks to this [stackoverflow question](https://stackoverflow.com/a/73735009/4683950), which provided the steps to solve the issue, I finally managed to access the deployment. However, when I attempted to access the URL, I discovered that it was not working and all of the endpoints on the server were returning a 404 error. Although I have not yet solved the issue, I plan to do so soon.


### Conclusion

Yes, I did struggles a lot, but this was a good learning lesson for me.  I learned how to debug containers on kubernetes and how minikube works with kuberenetes. I also learn some bit of kubernetes networking. I hope this post will serve my future self if I am facing the same issue as well as anyone else who is struggling with those bugs. My journey is not completed yet, I haven't managed to deploy a large language model on Kubernetes, I am still struggling with that. In part two of this post I will talk about how I managed to deploy a transformer model with kubernetes.
