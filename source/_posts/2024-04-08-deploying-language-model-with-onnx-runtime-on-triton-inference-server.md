---
layout: post
title: "Deploy your language models to production using ONNX runtime and the Triton inference server"
permalink: deploying-language-model-with-onnx-runtime-on-triton-inference-server
date: 2024-04-07 22:12:57
comments: true
published: true 
description: "Deploy your language models to production using ONNX runtime and the Triton inference server with Docker and Kubernetes"
keywords: "ONNX Runtime, Triton Inference Server, Deploying language models with Docker, NVIDIA Triton, ONNX model deployment, Machine learning deployment, MLOPS, Deep learning inference"
categories:

tags:

---
{% include image.html name="cover-picture.png" caption="Lac Kivu in East DRC" %}

You are a Data Scientist who has finally trained a language model and it works in a jupyter notebook and you are happy with your results. Now you want to expose it to the users so that they can interact with it.

You have different options to serve your model to your users. You can use the jupyter notebook directly in production 🤣. You can wrap the model in a pickle file and serve it using an API 🤪. Both options work, but can they handle millions of requests per second in a production environment? In this post, I will show how you can use modern tools to deploy a language model in a scalable way.  We will use the ONNX runtime, Triton inference server, Docker and Kubernetes. These tools will help us to deploy  a production-ready language model.

This guide is addressed to Data scientists, Machine Learning Engineers and researchers aiming to use their Language Models in Production. It discusses the engineering principles of scalable language models APIs.

It will be divided into multiple parts. In the first part, we will prepare the model for a production setting. We will use the ONNX runtime and Docker container to achieve that goal. Finally, in the second part, we will learn how to scale our Apis using Kubernetes.

If I have time later, I'll explain how to use the embedding API in a  downstream app  like a Retrieval Augmentation Generation (RAG). 

Before we dive into the deployment bits of this application, let us first review some theory about language models.

We will be deploying an embedding model, so let start by defining a language model.

{% include image.html name="gorilla.png" caption="Mountain Gorilla, one our similar cousin." %}
## Embeddings.

Embedding models are the backbone of generative AI, they are representations of words in a vector space. They capture words semantics such as, with them similar vectors represent similar words. 

 Contextual embeddings are embeddings such as each word is represented with a vector given its context. 

Let's look at those two examples: 

_The bank of the river Thames is located in South London._

_I am going to withdraw cash at Lloyds Bank._

In those two sentences the word `bank` has two different meanings. In the first, bank means _the land alongside or sloping down to a river or lake._ In the second sentence, it means _a place where you save money._

Embedding models can capture those differences and represent words with two different vectors according to the context.

This is not a post to explain how embedding models are built, if you want to learn more about them refer to [this post.](https://mccormickml.com/2019/05/14/BERT-word-embeddings-tutorial/)

But one thing to know is that embedding models are built with language models or Large language models for the majority of cases.

{% include image.html name="word-embeddings-representation.webp" caption="Words Representation in 2D vector Space." %}

## Large Language Model.

Large language models are neural networks or probabilistic models that can predict the next word given the previous words.

One of the most common neural network architectures that power language models is the Transformer model. It was introduced in 2017 by Google researchers. Those models have a powerful capacity when it comes to understanding words and their meanings because they are trained on a large corpus of documents.

During their training, transformers' models can learn contextual word embeddings.  Those embeddings are useful in downstream applications such as chatbots, documents classification, topic modeling, documents clustering  et consort.

Again, this post is not about language models, there  are legions on the internet, my favorite one is the  [illustrated trasnfomer](https://jalammar.github.io/illustrated-transformer/).

If this post is not about word embedding theory, or large language model theory what is it about?

Nice question, this post is about deploying a large language model. We assume taht you have a model trained on you want to deploy it. We will learn how to create an embedding service, a api that developers can query to generate document embeddings. 

We will build a scalable API developers can query it to get word embeddings of their sentences. They can use the embeddings in downstream applications. This API can be part of a chatbot, or a Retrieval Augmented Generation application.

I made it for educational purposes while learning how to deploy a language model using Kubernetes.  If you want a production-ready application that can support multiple embedding models  [checkout this repository.](https://github.com/jina-ai/clip-as-service)

Enough talking let's show us the code!


## The embedding models.

In this post, we will explore the embedding model generated by the BioLinkBert. The BioLinkBert model is a model from the BERT family but it was fine-tuned on documents from the medical domain. The reason I used the Biolink model is that I wanted to build a chatbot application for the medical domain in the future.

The embedding of words is the last hidden state of a transformer model where the input is the word encoded as text. Let us see how it works  in practice. We will be using a custom Bert model which inherits the base Bert model from Huggingface.




```python
import torch
from dataclasses import dataclass
from typing import Optional, Mapping, OrderedDict
from transformers.onnx import OnnxConfig
from transformers.utils import ModelOutput
from transformers import BertModel

@dataclass
class EmbeddingOutput(ModelOutput):
    last_hidden_state: Optional[torch.FloatTensor] = None


class CustomEmbeddingBertModel(BertModel):
    def forward(
        self,
        input_ids: Optional[torch.Tensor] = None,
        attention_mask: Optional[torch.Tensor] = None,
        head_mask: Optional[torch.Tensor] = None,
        inputs_embeds: Optional[torch.Tensor] = None,
    ) -> EmbeddingOutput:
        embeddings = super().forward(input_ids=input_ids,
                                     attention_mask=attention_mask,
                                     head_mask=head_mask,
                                     inputs_embeds=inputs_embeds,
                                     output_attentions=True,
                                     output_hidden_states=True,
                                     return_dict=True)
        mean_embedding = embeddings.last_hidden_state.mean(dim=1)
        embedding_output = EmbeddingOutput(last_hidden_state=mean_embedding)
        return embedding_output
```

Our custom embedding is  a wrapper around the Bert embedding model. It  which take the input ids and return the embedding of a sentence. The input ids are the tokenized version of a sentence. The embeddings of the sentence are the average of the embedding of all words in a  sentence.

Here is how that work in practice.





```python
embedding_model_id = 'michiyasunaga/BioLinkBERT-large'
base_model = CustomEmbeddingBertModel.from_pretrained(embedding_model_id)

```

Before passing the text to the embedding, it needs to be transformed in a tokenizer.


```python
from transformers import AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained(embedding_model_id)


test_input = f"what is the cause of Covid"
encoded_input = tokenizer([test_input],
                          return_tensors='pt',
                          max_length=512,
                          truncation=True,)
```

With our encoded_input and the base model we can generate the text embedding for our text input.


```python
encoded_input
```


```python
encoded_input.pop('token_type_ids')
```


```python
embedding_output = base_model(**encoded_input)
text_embeddings = embedding_output.last_hidden_state.detach().numpy().reshape(-1)
print(text_embeddings.shape)
```

The text embedding is the embedding representation of the sentence in text_input.
It can be use in downstream application in different ways.

The next step is save the model in the format we can use to deploy it in production.

## Exporting the Model to Onnx format.

### What is the ONNX format?

ONNX stands for Open Neural Network Exchange. It is an open format built to represent machine learning models in a framework and language-agnostic way.

As you may know, neural networks are computation graphs with input, weights, and operations. ONNX format is a way of saving neural networks as computation graphs. That  computational graph represents the flow of data through the neural network.

The key benefits of saving neural networks in the ONNX format are interoperability and hardware access. Any deep learning platform can read a neural network saved in the ONNX format.  For example, a model trained in Pytorch can be exported to ONNX format and imported in Tensorflow and vice versa.

You don't need to use Python to read a model saved as ONNX. You can use any programming language of your choice, such as Javascript, C, or C++. 

ONNX makes the model easier to access hardware optimizations. You can apply other optimizations, such as quantization, to your ONNX model.

Let us see how we can convert our model to ONNX format to use the full benefits of it.

Let's see how we can achieve that with the code.


```python
from pathlib import Path
model_repository = Path.cwd().parent.joinpath("models_repository")
embedding_model_path = model_repository.joinpath("retrieval", "embedding_model", "1")
embedding_model_path.mkdir(exist_ok=True, parents=True)
```


```python
model_path
```


```python
!ls {model_path.__str__()}
```


```python
tuple(encoded_input.values())
```


```python
from torch.onnx import export as torch_onnx_export

torch_onnx_export(
    base_model,
    tuple(encoded_input.values()),
    f=embedding_model_path.joinpath('bio-bert-embedder.onnx'),
    input_names=['input_ids', 'attention_mask'],
    dynamic_axes={'input_ids': {0: 'batch_size', 1: 'sequence'},
                  'attention_mask': {0: 'batch_size', 1: 'sequence'},
                  'last_hidden_state': {0: 'batch_size', 1: 'sequence'}},
    do_constant_folding=True,
    opset_version=13,
)
```


```python
base_model.config.save_pretrained(embedding_model_path)
```

With the above code, we have our model exported into onnx format and ready to be deployed in production.

## Model deployment on Docker with the ONNX Runtime.

In this section, we will learn how  to use the model in a docker container.

One of the most obvious solutions is to deploy a model and wrap it in with Flask or Fastapi. While this solution can work in practice, it has some latency due to related the fact that the API is written in Python. For this blog I will try a different approach, I will deploy the model using the onnx runtime which is a C++ backend. We will leverage the fact that our model in ONNX format is platform agnostic and we can deploy on any language backend.

### Triton Server

Triton is a software tool for deploying machine learning models for inference. It is designed to produce high-quality inference across different hardware platforms, either GPU or CPU. It also supports inference across cloud, data center, and embedded devices.

One of the advantages of the triton server is that it supports dynamic batching and concurrent model execution.

- Dynamic batching: 

For models that support batching, which is the case for deep learning models, triton implements scheduling and batching algorithms.  That approach combines individual requests to improve inference throughput.

- Concurrency model execution is the capacity to run simultaneously multiple models on the same GPU or various GPUs.

### Triton Server Backend

Triton supports different backends to execute the model. A backend is a wrapper around a deep learning framework like Pytorch, TensorFlow, TensorRT, or ONNX Runtime.

Two backend types interested us for this post: the Python Backend and the ONNX runtime backend. 

The ONNX runtime backend executes ONNX models, and the Python backend allows the writing of the model logic in Python. 

In this post, we will be focused on the ONNX and the Python backend.

### The Triton Server

Let us set up the model repository for the triton inference server.


```python

!touch {embedding_model_path.parent.__str__()}/config.pbtxt


!mkdir -p {embedding_model_path.parent.__str__()}/ensemble_model/1
!touch {embedding_model_path.parent.__str__()}/ensemble_model/config.pbtxt

!mkdir -p {embedding_model_path.parent.__str__()}/tokenizer/1
!touch {embedding_model_path.parent.parent.__str__()}/tokenizer/1/model.py

!touch {embedding_model_path.parent.__str__()}/tokenizer/config.pbtxt
```

This bash script will create the model repository  for our embedding model. The next section will set up the files in that model repository to run our models.

The model repository should have three components, the tokenizer, the embedding model, and the ensemble model.
The tokenizer is the configuration of our tokenizer model, it uses the Python backend and handles the tokenization of our text input.
The tokenizer repository should have the files from our tokenizer, the model code, and the model configuration.

It should have the following layout:

```
└── tokenizer
    ├── 1
    │   ├── __pycache__
    │   ├── config.json
    │   ├── model.py
    │   ├── special_tokens_map.json
    │   ├── tokenizer.json
    │   ├── tokenizer_config.json
    │   └── vocab.txt
    └── config.pbtxt
```

To create the tokenizer file, we will have to save our tokenizer to the tokenizer repository, we will use the following code.


```python
model_repository
```


```python


tokenizer_path = model_repository.joinpath("retrieval", "tokenizer")
tokenizer_path = tokenizer_path.joinpath("1")
tokenizer.save_pretrained(tokenizer_path)

```


From that tokenizer we will create the `model.py` file, which will handle the tokeinization part.


Here is how the model should look like


```python
%%writefile  {embedding_model_path.parent.parent.__str__()}/tokenizer/1/model.py
import os
from typing import Dict, List

import numpy as np
import triton_python_backend_utils as pb_utils
from transformers import AutoTokenizer, PreTrainedTokenizer, TensorType


class TritonPythonModel:
    tokenizer: PreTrainedTokenizer

    def initialize(self, args: Dict[str, str]) -> None:
        """
        Initialize the tokenization process
        :param args: arguments from Triton config file
        """
        # more variables in https://github.com/triton-inference-server/python_backend/blob/main/src/python.cc
        path: str = os.path.join(
            args["model_repository"], args["model_version"])
        self.tokenizer = AutoTokenizer.from_pretrained(path)

    def execute(self, requests) -> "List[List[pb_utils.Tensor]]":
        """
        Parse and tokenize each request
        :param requests: 1 or more requests received by Triton server.
        :return: text as input tensors
        """
        responses = []
        # for loop for batch requests (disabled in our case)
        for request in requests:
            # binary data typed back to string
            query = [
                t.decode("UTF-8")
                for t in pb_utils.get_input_tensor_by_name(request, "TEXT")
                .as_numpy()
                .tolist()
            ]
            tokens: Dict[str, np.ndarray] = self.tokenizer(
                text=query, return_tensors=TensorType.NUMPY, padding=True, truncation=True
            )
            # tensorrt uses int32 as input type, ort uses int64
            tokens = {k: v.astype(np.int64) for k, v in tokens.items()}
            # communicate the tokenization results to Triton server
            outputs = list()
            for input_name in self.tokenizer.model_input_names:
                tensor_input = pb_utils.Tensor(input_name, tokens[input_name])
                outputs.append(tensor_input)

            inference_response = pb_utils.InferenceResponse(
                output_tensors=outputs)
            responses.append(inference_response)

        return responses
```

The `initialize` method from this class will create our tokenizer from this folder. All our tokenizer files will be initialized from it.

The `execute` method is the one that handles the request. It can take multiple requests and parse them. Finally,   create the  query from the text, and return the tokenized text.

With our tokenizer setup, let us configure the Python server to use it.

The content of the `tokenizer/config.pbxt` should look like this.


```python
%%writefile {embedding_model_path.parent.parent.__str__()}/tokenizer/config.pbtxt


name: "tokenizer"
max_batch_size: 0
backend: "python"

input [
{
    name: "TEXT"
    data_type: TYPE_STRING
    dims: [ -1 ]
}
]

output [
{
    name: "input_ids"
    data_type: TYPE_INT64
    dims: [-1, -1]
},
{
    name: "attention_mask"
    data_type: TYPE_INT64
    dims: [-1, -1]
}
]

instance_group [
    {
      count: 1
      kind: KIND_CPU
    }
]
```

In this file, we specify that our backend is a Python backend.  It will take an input named text, with dimension -1. The dimension -1 which means dynamic or it can be of any size. It returns the inputs_ids, and the attention_mask and will run on a CPU.

The second component of our model is the embedding model itself, it has the following layout:
```
├── embedding_model
│   ├── 1
│   │   ├── bio-bert-embedder.onnx
│   │   └── config.json
│   └── config.pbtxt

```

Let look at the `config.pbtxt` for the embedding model


```python
embedding_model_path
```


```python
%%writefile {embedding_model_path.parent.__str__()}/config.pbtxt

name: "embedding_model"
platform: "onnxruntime_onnx"
backend: "onnxruntime"
default_model_filename: "bio-bert-embedder.onnx"
max_batch_size: 0
input [
  {
    name: "input_ids"
    data_type: TYPE_INT64
    dims: [ -1, -1 ]
  },
{
    name: "attention_mask"
    data_type: TYPE_INT64
    dims: [ -1, -1 ]
  }
]
output [
  {
    name: "3391"  # not sure why this is name 3391, need to double check
    data_type: TYPE_FP32
    dims: [ -1, 1024 ]
  }
]

instance_group [
    {
      count: 1
      kind: KIND_CPU
    }
]
```

It is the configuration file for our embedding model, we can see that it takes the output from our tokenizer model and produces the embedding vector of shape, -1, 1024. With -1 meaning the dynamic shape, and 1024 is our embedding size.

Note: for some reason, the model output is named `3391` I  don't know why it is named like that.

We can connect our embedding model and the tokenizer's input and output with the ensemble model. It should have the following layout: 

```
├── ensemble_model
│   ├── 1
│   └── config.pbtxt
```

And the content of the `config.pbtxt` file in the ensemble model should be like this:


```python
%%writefile {embedding_model_path.parent.parent.__str__()}/ensemble_model/config.pbtxt
name: "ensemble_model"
# maximum batch size 
max_batch_size: 0 
platform: "ensemble"

#input to the model 
input [
{
    name: "TEXT"
    data_type: TYPE_STRING
    dims: [ -1 ] 
    # -1 means dynamic axis, aka this dimension may change 
}
]

#output of the model 
output {
    name: "3391"
    data_type: TYPE_FP32
    dims: [-1, 1024] 
    # two dimensional tensor, where 1st dimension: batch-size, 2nd dimension: #classes, not sure why name is 3391.
}

#Type of scheduler to be used
ensemble_scheduling {
    step [
        {
            model_name: "tokenizer"
            model_version: -1
            input_map {
            key: "TEXT"
            value: "TEXT"
        }
        output_map [
        {
            key: "input_ids"
            value: "input_ids"
        },
        {
            key: "attention_mask"
            value: "attention_mask"
        }
        ]
        },
        {
            model_name: "embedding_model"
            model_version: -1
        input_map [
            {
                key: "input_ids"
                value: "input_ids"
            },
            {
                key: "attention_mask"
                value: "attention_mask"
            }
        ]
        output_map {
                key: "3391"
                value: "3391"
            }
        }
    ]
}

```


In a nutshell, this config connects our tokenizer and the embedding model. The output of the tokenizer model is passed to the embedding model to produce the embedding vector.

If the three components were configured correctly we should have the following layout:

```

models_repository/retrieval
├── embedding_model
│   ├── 1
│   │   ├── bio-bert-embedder.onnx
│   │   └── config.json
│   └── config.pbtxt
├── ensemble_model
│   ├── 1
│   └── config.pbtxt
└── tokenizer
    ├── 1
    │   ├── __pycache__
    │   ├── config.json
    │   ├── model.py
    │   ├── special_tokens_map.json
    │   ├── tokenizer.json
    │   ├── tokenizer_config.json
    │   └── vocab.txt
    └── config.pbtxt

```


If you have all the following components we can go to the next stage.

### Building the triton Inference server image.

In this section, we will see how to build the triton inference server image. The base triton inference server docker image is huge and can weigh up to 10 GB. In the triton inference server there is a way to build a Cpu only image for triton.  I wasn't able to build it from my Macbook. 

We will be using the image [Jackie Xiao](https://github.com/Jackiexiao) built for that purpose.

It is a CPU-only image, hence the small size of 500Mb. If you are deploying the model in an infrastructure with a GPU, you will need to use the full Triton Image which is huge.

Here is the docker file used to build this image.




```python
%%writefile {Path.cwd().parent.__str__()}/Dockerfile

# Use the base image
FROM jackiexiao/tritonserver:23.12-onnx-py-cpu



# Install the required Python packages
RUN pip install transformers==4.27.1 sacremoses==0.1.1


```

You can see that we are pulling the base image and install in it the transformer and the Moses tokenizer.

With that docker image, we can build the docker image.

` docker build -t espymur/triton-onnx-cpu:dev  -f Dockerfile .`

If the image was successfully built we push it to the docker image repository:

`docker push espymur/triton-onnx-cpu:dev`

After pushing the image to the repository, you can start your docker container with the triton server in it.

```

 docker run --rm -p 8000:8000 -p 8001:8001 -p 8002:8002  -v ${PWD}/models_repository/retrieval:/models  espymur/triton-onnx-cpu:dev tritonserver --model-repository=/models

```

This command does the following:

It starts the docker container with the triton-onnx-cpu:dev image.

It exposes the different ports from the container to the external environment:

For HTTP connection,  it maps the port 8000 from the container to the port 8000 of the external environment.

For GRPC, it maps the port 8001 to the port 8001.

For the metric server, it maps the port 8002 to the port 8002

It maps the local directory, named `model_repository` to the folder named `/models` in the docker container by using volumes.

We specify that the triton server should use the model folder as the model repository.

If everything goes well with that command you should be able to see the following output which tells us which port is used by the model.

```

I0329 18:42:18.452806 1 grpc_server.cc:2495] Started GRPCInferenceService at 0.0.0.0:8001

I0329 18:42:18.460674 1 http_server.cc:4619] Started HTTPService at 0.0.0.0:8000

I0329 18:42:18.520315 1 http_server.cc:282] Started Metrics Service at 0.0.0.0:8002

```

With that code, we have our embedding API running and we can now send requests to it.



### Making Request to the inference Server.

We have now built our model, the next step is to make an inference request to it and analyze the response.

Since the model is deployed as a REST API you can make inference requests to it using any client of your choice in any language

.  The inference server is very strict in terms of what it expects as input, and how to interact with it. Fortunately, they have described different clients to use to build the inputs. 

For demonstration purposes, I will be using the Python HTTP client to make the inference requests. 

But nothing restricted you from using your language of choice to make HTTP requests to the API.



```python
import numpy as np
import tritonclient.http as httpclient
url = "localhost:8000"
http_client = httpclient.InferenceServerClient(url=url,verbose=False)
                  
```

The above code creates the http client, with our server url, let us define the input and output of it.


```python
text_input = httpclient.InferInput('TEXT', shape=[1], datatype='BYTES')

embedding_output = httpclient.InferRequestedOutput("3391", binary_data=False)
```


Those are the placeholder for our inputs and output, let us fill them now:



```python

```


```python
sentences = ["what cause covid"]
np_input_data = np.asarray([sentences], dtype=object)

```


```python
np_input_data.reshape(-1)
```


```python
text_input.set_data_from_numpy(np_input_data.reshape(-1))
```


```python
results = http_client.infer(model_name="ensemble_model", inputs=[text_input], outputs=[embedding_output])
```


```python
results
```

We can now convert back the output to numpy using


```python
inference_output = results.as_numpy('3391')
print(inference_output.shape)
```

That is all we have our embedding API, which takes the text and produces the embedding vector.

### Conclusion

In this post, we have learned how to deploy an embedding model as an API using the triton inference server. The knowledge learned in this post can be used to deploy any transformer model  with an encoder or decoder using the triton inference server. Any model from the BERT, or GPT family.  It can slightly  be adapted to use with encoder-decoder models such as T5 or M2M.

Once we deploy the model to the production server it will grow with users and need to scale. In the second part of this series, we will learn how to scale the model using Kubernetes.

