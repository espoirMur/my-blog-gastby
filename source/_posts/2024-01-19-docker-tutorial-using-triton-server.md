---
layout: post
title: "Deploy a Transformer models for Machine Translation in production using the Triton Server."
permalink: docker-m2m100-production-triton
date: 2024-01-19 07:03:59
comments: true
description: "How to deploy a transformer models in production using the triton server"
keywords: "triton, Docker, Machine-Translation"
categories: 
tags: docker, transformer, devops, translation
published: false
---


In this series of posts, we will learn how to productionalize  a machine translation model. We will start from a HuggingFace transformer model and learn how to deploy it in a production setting and make it accessible to users.

In the first notebook, we will learn how to prepare the model for production. We will load the model from the HuggingFace library and then quantize it; after quantization, we will use the triton server to deploy it in a docker container, and finally, we will learn how to make inference requests  to our model.

In the second post,  we will learn how to scale the model using Kserve and how to optimize the first version of our model.

This post is for Machine Learning Engineers/Enthusiasts with some knowledge of transformers models and Docker and who would like to learn how to deploy an encoder-decoder model in a production setting.

# Environment requirements

To run this code, you need to have `python 3.11` installed on your local machine. 

You can install these libraries directly from your Python interpreter, or you can create a virtual environment to run Python. I would rather recommend using a Python interpreter from a virtual environment.

## Install libraries

To install the useful libraries, you can use the following code: 

`pip transformers==4.30.2 optimum==1.9.0 onnxruntime==1.15.1 onnx==1.14.0`

# A brief history of the M2M100 Model

## Encoder-Decoder model 

Encoder-decoder models are large language models built with two components: the encoder and the decoder. They are used for natural language processing tasks that involve understanding input sequences and generating output sequences with different lengths and structures.

The encoder is a neural network that takes a variable-length sequence as an input and transforms it into a  vector representation.  For our machine translation task, the encoder takes the token in the source language and returns a vector representation of the source language. 

The decoder, on the other hand, is also a neural network  that takes the vector representation of the source text and generates the translation in the target language.

{% include image.html name="encoder-decoder-model.jpeg" caption="Illustration of the original transformer architecture proposed in [Attention Is All You Need, 2017](https://arxiv.org/abs/1706.03762)
" %}

You can learn more about transformer models and encoder-decoder models [here](https://jalammar.github.io/illustrated-transformer/)  and [here](https://magazine.sebastianraschka.com/p/understanding-encoder-and-decoder)


## The M2M100 model:


The M2M100 stands for Many to Many multilingual translation model that can translate between any pair of 100 languages it was trained on. It helps to alleviate the fact that most machine translation training is done from or to English. You can learn more about the M2M100 model [here](https://huggingface.co/docs/transformers/model_doc/m2m_100).

It was trained to translate English to Swahili. Why did I pick Swahili? Because I am a native Swahili speaker. 

# Testing the raw model

We will start by loading our model from the huggingface repository!
The below code will load the model from the HuggingFace library and perform a translation inference by using the generate method.


```python
from transformers import AutoTokenizer, M2M100ForConditionalGeneration, pipeline
```

```python
MODEL_NAME = "masakhane/m2m100_418M_en_swa_rel_news"
```


```python
model: M2M100ForConditionalGeneration = M2M100ForConditionalGeneration.from_pretrained(MODEL_NAME)
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
```


```python
text_to_translate = "Hello, my name is Espoir Murhabazi,  I am a Software Engineer from Congo DRC but living in UK"

```


```python
model_input = tokenizer(text_to_translate, return_tensors="pt")

```


```python
model_input.keys()

```


```python
generated_tokens = model.generate(**model_input, forced_bos_token_id=tokenizer.lang_code_to_id["sw"])

```

At this point our model have generate the translation token, the next step is to use our tokenizer to convert back the token to the text. This is called decoding.


```python
translated_text = tokenizer.batch_decode(generated_tokens, skip_special_tokens=True)
print(translated_text)
```


The translated test shows us that the model is working. The next step is to prepare the production model. 
To productionalize our model, we will deploy it to ONNX format.

# Preparing the model for Production.

## What is the ONNX format?

ONNX stands for Open Neural Network Exchange. It is an open format built to represent machine learning models in a framework-agnostic way.

As you may know, neural networks are computation graphs with input, weights, and operations.

ONNX format is a way of saving neural networks as computation graphs. That  computational graph represents the flow of data through the neural network.


The key benefits of saving neural networks in the ONNX format are interoperability and hardware access. Any deep learning platform can read a neural network saved in the ONNX format.  For example, a model trained in Pytorch can be exported to ONNX format and imported in Tensorflow and vice versa.

You don't need to use Python to read a model saved as ONNX; you can use any programming language of your choice, such as Javascript, C, or C++. 

ONNX makes the model easier to access hardware optimizations, and you can apply other optimizations, such as quantization, to your ONNX model.

Let us see how we can convert our model to ONNX format to use the full benefits of it.

Trying to export the model manually and see if we can load the model.

To export the model to onnx format we will be using the optimum cli from Huggingface.


```python
! optimum-cli export onnx --model masakhane/m2m100_418M_en_swa_rel_news --task seq2seq-lm-with-past --for-ort onnx/m2m100_418M_en_swa_rel_news

```
If the previous command was run successfully, we can see our model saved at `onnx/m2m100_418M_en_swa_rel_news`. 

By checking the size we notice data our encoder model have 1.1 Gb, and our decoder model have 1.7Gb which make our model size to 2.8GB. Additionally, in the same folder we have the tokenizer data.


```python
from pathlib import Path

```


```python
base_model_onnx_dir = Path.cwd().joinpath('onnx').joinpath('m2m100_418M_en_swa_rel_news')

```


```python
base_model_onnx_dir.exists()

```

## Applying Quantization

Quantization is the process of reducing the model size by using fewer bits to represent its parameters. Instead of using 32-bit precision floating points for most of the models, with quantization, we can use 12 bits to represent a number and consequently reduce the size of the model.

Smaller models resulting from quantization are faster to deploy and have low latency in production.

It has [been shown](https://github.com/huggingface/notebooks/blob/main/examples/onnx-export.ipynb) that you can improve the inference time by 75% by using an ONNX quantized model without a considerable loss in performance.

For this tutorial, we will use quantization to reduce the size of our model for inference.


```python
from optimum.onnxruntime import ORTQuantizer, ORTModelForSeq2SeqLM
from optimum.onnxruntime.configuration import AutoQuantizationConfig

```


```python
encoder_quantizer = ORTQuantizer.from_pretrained(base_model_onnx_dir, file_name="encoder_model.onnx")

```


```python
decoder_quantizer = ORTQuantizer.from_pretrained(base_model_onnx_dir, file_name="decoder_model.onnx")

```


```python
decoder_with_past_quantizer = ORTQuantizer.from_pretrained(base_model_onnx_dir, file_name="decoder_with_past_model.onnx")

```


```python
quantizers = [encoder_quantizer, decoder_quantizer, decoder_with_past_quantizer]

```

We will use dynamic quantization to our model.


```python
dynamic_quantization_config = AutoQuantizationConfig.avx512_vnni(is_static=False, per_channel=False)

```


```python
quantized_model_path = Path("onnx").joinpath(f"{MODEL_SUFFIX}_quantized/")
quantized_model_path.mkdir(parents=True, exist_ok=True)

```


```python
for quantizer in quantizers:
    quantizer.quantize(quantization_config=dynamic_quantization_config, save_dir=quantized_model_path)

```

Our model are save as quantized version, we can now check the size of the quantized models.


```python
for model in quantized_model_path.glob("*.onnx"):
    print(f"the size of {model.stem} the model in MB is: {model.stat().st_size / (1024 * 1024)}")

```

We can see that we have managed to reduce the size of our initial models by two! From 1.6 Gb without quantization to 800 Mb with quantization. Let us see how to use the quantized model for inference.

## Using the quantized model


```python
quantized_model_path = base_model_onnx_dir

```


```python
quantized_model = ORTModelForSeq2SeqLM.from_pretrained(quantized_model_path, 
                                                       decoder_file_name='decoder_model_quantized.onnx',
                                                       encoder_file_name='encoder_model_quantized.onnx',)

```


```python
quantized_pipeline = pipeline("translation_en_to_sw", model=quantized_model, tokenizer=tokenizer)

```


```python
translated_text_quantized = quantized_pipeline(text_to_translate)

```


```python
print(translated_text_quantized)

```

The quantization has reduced the size of the model, but it gave the same translation of our base text. We may need to run more extensive tests to find out what is the accuracy difference between our quantized model and the base model. Assuming the performance lost was not considerable, we move to the next step of our tutorial.



# Deploy the Model for inference

At this point, we have our model quantized and saved in ONNX format. We will now deploy it to a production server using the triton inference server. 
In the first section, we will deploy with the triton server as a docker container, and then we will use Kserve to deploy it to the Kubernetes deployment environment.

## Triton Server

Triton is a software tool for deploying machine learning models for inference. It is designed to produce high-quality inference across different hardware platforms, either GPU or CPU. It also supports inference across cloud, data center, and embedded devices.
One of the advantages of the triton server is that it supports dynamic batching and concurrent model execution.


- Dynamic batching, for models that support batching, which is the case for deep learning models, triton implements scheduling and batching algorithms that combine individual requests to improve inference throughput.


- Concurrency model execution is the capacity to run simultaneously multiple models on the same GPU or various GPUs.


### Triton Server Backend

Triton supports different backends to execute the model. A backend is a wrapper around a deep learning framework like Pytorch, TensorFlow, TensorRT, or ONNX Runtime.
Two backend types interested us for this post: the Python Backend and the ONNX runtime backend. 

The ONNX runtime backend executes ONNX models, and the Python backend allows the writing of the model logic in Python. 

In this post, we will be focused on the ONNX and the Python backend.

I decided to go with the Python backend because I struggled to deploy the encoder decode model using an ensemble of the ONNX model. I still have a question in progress on [StackOverlow](https://stackoverflow.com/q/76638766/4683950).  

### Uploading the Model to Repository.

The first step before using our model is to upload it to the model repository. For this tutorial,   we will be using our local storage as a model repository but later we will use static storage such as google cloud or AWS S3 to host our model.

### Configuration

After uploading the model ot the repository, we will need to configure it.

The configuration sets up the model and defines the input shape and the output shape of our models.


```python
# %load ./triton_model_repository/m2m100_translation_model/config.pbtxt
name: "m2m100_translation_model"
backend: "python"
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
    name: "generated_indices"
    data_type: TYPE_FP32
    dims: [ -1, -1 ]
  }
]

instance_group [
    {
      count: 1
      kind: KIND_CPU
    }
]

```

In the above configuration, we can see that the model is expecting two inputs:  the input ids and the attention masks, and it returns the generated input indices. 
Additionally, we can notice that the model is running on a 1 CPU. If we had a GPU available, we would put it in the instance settings.

The input ids and the attention masks are the outputs from the tokenization process. The generated indices are the tokenized output that our tokenizer will decode.

The configuration file needs to be save at the root folder  of our model repository.

### Create the load model script

The load model script is the python script that load our model before and run it for inference.


```python
# %load ./triton_model_repository/m2m100_translation_model/1/model.py
from typing import Dict, List
import triton_python_backend_utils as pb_utils
from pathlib import Path
from optimum.onnxruntime import ORTModelForSeq2SeqLM
import torch

TOKENIZER_SW_LANG_CODE_TO_ID = 128088


class TritonPythonModel:

    def initialize(self, args: Dict[str, str]) -> None:
        """
        Initialize the tokenization process
        :param args: arguments from Triton config file
        """
        current_path: str = Path(args["model_repository"]).parent.absolute()
        model_path = current_path.joinpath("m2m100_translation_model", "1", "m2m100_418M_en_swa_rel_news_quantized")
        self.device = "cpu" if args["model_instance_kind"] == "CPU" else "cuda"
        # more variables in https://github.com/triton-inference-server/python_backend/blob/main/src/python.cc
        self.model = ORTModelForSeq2SeqLM.from_pretrained(model_path,
                                                          decoder_file_name="decoder_model_quantized.onnx",
                                                          encoder_file_name="encoder_model_quantized.onnx")
        if self.device == "cuda":
            self.model = self.model.cuda()
        print("TritonPythonModel initialized")

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
            input_ids = pb_utils.get_input_tensor_by_name(request, "input_ids").as_numpy()
            attention_masks = pb_utils.get_input_tensor_by_name(request, "attention_mask").as_numpy()
            input_ids = torch.as_tensor(input_ids, dtype=torch.int64)
            attention_masks = torch.as_tensor(attention_masks, dtype=torch.int64)
            if self.device == "cuda":
                input_ids = input_ids.to("cuda")
                attention_masks = attention_masks.to("cuda")
            model_inputs = {"input_ids": input_ids, "attention_mask": attention_masks}
            generated_indices = self.model.generate(**model_inputs,
                                                    forced_bos_token_id=TOKENIZER_SW_LANG_CODE_TO_ID)
            tensor_output = pb_utils.Tensor("generated_indices", generated_indices.numpy())
            responses.append(tensor_output)
        responses = [pb_utils.InferenceResponse(output_tensors=responses)]
        return responses
    
    def finalize(self):
        """`finalize` is called only once when the model is being unloaded.
        Implementing `finalize` function is optional. This function allows
        the model to perform any necessary clean ups before exit.
        """
        print('Cleaning up...')

```

The model contains a class with two methods:

- Initialize: The initialize method uses the ORT model to load the model in the memory!
- The execute method parse and tokenize each request received by the triton server. It calls the generate method on the input of the request and returns the generated text indices. This text will be later decoded by the tokenizer.

If our configuration is done properly and the model is saved properly, we should have a model repository that looks like this:

```
triton_model_repository
└── m2m100_translation_model
    ├── 1
    │   ├── m2m100_418M_en_swa_rel_news_quantized
    │   │   ├── config.json
    │   │   ├── decoder_model_quantized.onnx
    │   │   ├── decoder_with_past_model_quantized.onnx
    │   │   ├── encoder_model_quantized.onnx
    │   │   └── ort_config.json
    │   └── model.py
    └── config.pbtxt
```

Make sure that you have the file located at the precise location as me in order to be able to run the code.


### Building the docker image

If you look carefully at the code for our Python model, you can see that the model is importing the ONNX runtime! However, that runtime is not installed in the base triton server image. The reason why we decided to build our own image based on the triton server.


```python
# %load Dockerfile
# Use the base image
FROM nvcr.io/nvidia/tritonserver:23.06-py3

# Install the required Python packages
RUN pip install optimum==1.9.0 onnxruntime==1.15.1 onnx==1.14.0

```

The above code shows how we build our docker image.
We use the base Tritonserver image, and then we add the different packages we need to run our model.

Next we can build our model using:

`docker build -t espymur/triton-onnx:dev  -f Dockerfile .`

Please note that the image is huge. Its size is around 15 GB. In the next post, I will try to optimize its size by using the technique suggested in the documentation.

If our model build is finished, we can now run the docker container that serves the model.


`docker run --rm -p 8000:8000 -p 8001:8001 -p 8002:8002  --shm-size 128M -v ${PWD}/triton_model_repository:/models  espymur/triton-onnx:dev tritonserver --model-repository=/models`

- This command runs the docker container and map the port 8000, 8001, 8002 to 8000, 8001, and 8002 of our local machine.

- It then creates a volume that maps the `${PWD}/triton_model_repository` path from our local machine to /models in the container.

- It is also using a shared memory of 128 Mb.


With this model we can see that our model is running and we can perform inference without any problem.

At this point, we have got our model running inside the docker container, the next step will be to make inference requests. Let see how we can achieve that.

## Making Inference Requests

The model is now updated and saved as a Triton backend model. We will apply tokenization offline and query the model with the tokenized words and the attention mask. 
The model will return the indices of the translated test; we will use the tokenizer again to decode the indices and produce the output.

We can later have the tokenizer as a separate service people can interact with using HTTP.


```python
MODEL_NAME = "masakhane/m2m100_418M_en_swa_rel_news"

```


```python
from transformers import AutoTokenizer

```


```python
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

```


```python
import numpy as np
import tritonclient.http as httpclient

```

### The HTTP client


```python
client = httpclient.InferenceServerClient(url="localhost:8000")

```

### The inputs

This line creates the client object we will be using to interact with our server. To create the client object, we are passing the URL of the inference service as parameters.


```python
input_ids = httpclient.InferInput("input_ids", shape=(-1,1) , datatype="TYPE_INT64",)
attention_mask = httpclient.InferInput("attention_mask", shape=(-1,1) , datatype="TYPE_INT64",)

```

### The outputs.


```python
outputs = httpclient.InferRequestedOutput("generated_indices", binary_data=False)

```

To prepare our model input, we are using the Triton client library. 
The above code creates two objects for the input ID and the attention mask, respectively! We can specify the shape of the element and its datatype when creating the code.

Additionally to our inputs and outputs, we will need some utility function to perform the tokenization. Here are those functions:

### Utilities Functions


```python
def get_tokenizer(model_name):
    """Returns a tokenizer for a given model name

    Args:
        model_name (_type_): _description_

    Returns:
        _type_: _description_
    """
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    return tokenizer

```


```python
from typing import Tuple, List

import numpy as np

```


```python
from transformers import AutoTokenizer

```


```python

def tokenize_text(tokenizer: AutoTokenizer, text:str) -> Tuple[np.ndarray , np.ndarray]:
    tokenized_text = tokenizer(text, padding=True, return_tensors="np")
    return tokenized_text.input_ids, tokenized_text.attention_mask

```


```python
def generate_inference_input(input_ids: np.ndarray, attention_mask: np.ndarray) -> List[httpclient.InferInput]:
    """
    Generate inference inputs for Triton server

    Args:
        input_ids (np.ndarray): _description_
        attention_mask (np.ndarray): _description_

    Returns:
        List[httpclient.InferInput]: _description_
    """
    inputs = []
    inputs.append(httpclient.InferInput("input_ids", input_ids.shape, "INT64"))
    inputs.append(httpclient.InferInput("attention_mask", attention_mask.shape, "INT64"))

    inputs[0].set_data_from_numpy(input_ids.astype(np.int64), binary_data=False)
    inputs[1].set_data_from_numpy(attention_mask.astype(np.int64), binary_data=False)
    return inputs


```


```python
text = ["I am learning how to use Triton Server for Machine Learning", "Hello, my name is Espoir Murhabazi,  I am a Software Engineer from Congo DRC but living in UK"]

```


```python
tokenizer = get_tokenizer(MODEL_NAME)

```


```python
input_ids, attention_mask = tokenize_text(tokenizer, text)

```


```python
inference_inputs = generate_inference_input(input_ids, attention_mask)

```



With our input prepared we can now make an inference request to our server. Here is the code we will be using to make the inference request.


```python
results = client.infer(model_name="m2m100_translation_model", inputs=inference_inputs, outputs=[outputs])
inference_output = results.as_numpy('generated_indices')

```

If everything goes as planned, we should be able to see the inference response.


```python
inference_output

```


```python
decoded_output = tokenizer.batch_decode(inference_output, skip_special_tokens=True)

```


```python
decoded_output

```

With the decoded output, we can see that our inference server is working!

## Conclusion


In this post, we saw how we can start form a raw translation model from huggingface, we then quantized it to reduce it's size, and finally deployed the model on a triton server to perform inference.
In the second part of this blog we will learn how to scale the whole prototype and build an end to end pipeline using kubernetes and Kserve.
