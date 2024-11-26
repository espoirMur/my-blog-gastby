---
layout: post
title: "Clustering french news articles: A case of study of DRCongo news."
permalink: news-summarizer-clustering
date: 2030-11-06 22:31:32
comments: true
description: "news-summarizer-clustering"
keywords: ""
categories:

tags:

published: "false"
---


```python
!which python
```

# Congo News Summarizer : Part one, News Clustering


Over the past month I have been collecting a lot of news article from major congolese news website. I have those article saved in a postgres database. There are lot of fun stuff I can do with them. Among them there is a news summarizer. I want to analyze the daily news and find out what are the main news the website are talking about.

In this blog or series of post I will try to build that news summarizer. As of now I will structure it as follow:

In the first part, I will talk about how I build the news clustering model, Then in the second part I will talk about how I build an LLM that does the summarization and how I deployed it, finally in the last part I will talk about how to scale the model and deploy it in a production setting.

The end goal of this project is two folds. First, I want  to have a news summarizer that I can open a morning and it will give me a summary of major news that are happening in congo. Second, while building this news summarizer I would like to sharpen my ML Engineering Knowledge and illustrate that I can build an end to end production ready project with the latest python stack.

Let us talk about how I build the clustering model.

## Data Collection


### Data

I have scrappers that run everyday and scrape the data that congolese news website produce, those article are saved as text in a postgres database.  


I  will query that database and load the data in a pandas dataframe for better analysis. I have the code to connect and read from the postgres database embedded in modules.


```python
%load_ext dotenv
```


```python
%dotenv ./.env_prod -o
```

The above line loads the database credentials so that we can query the database.


```python
from src.shared.database import execute_query, generate_database_connection
```


```python
yesterday_article_query = "select content, title, posted_at,url from article where posted_at::date = CURRENT_DATE - interval '1 day'"
```


```python
from os import getenv
```


```python
database_user = getenv('POSTGRES_USER')
database_password = getenv('POSTGRES_PASSWORD')
database_host = getenv('POSTGRES_HOST')
database_port = getenv('POSTGRES_PORT')
database_name = getenv('POSTGRES_DB')
```


```python
database_credentials = {
    'user': database_user,
    'password': database_password,
    'host': database_host,
    'port': database_port,
    'database': database_name
}
```


```python
connection = generate_database_connection(database_crendentials=database_credentials)
```

With the credentials, the database connection, the query we can go ahead and query the database to retrieve the data.


```python
results =execute_query(query=yesterday_article_query, database_connection=connection)
```


```python
results[0].title
```

We have our results in a list now we can put them in a dataframe from further analysis.


```python
import pandas as pd
```


```python
news_df  = pd.DataFrame.from_records(results)
```


```python
news_df.head()
```


```python
news_df.columns =  ["content", "title", "posted_at", "url"]
```


```python
from pathlib import Path
```


```python
current_directory = Path.cwd()
```


```python
news_directory = current_directory.joinpath("datasets", "today_news")
```


```python
news_directory.mkdir(exist_ok=True)
```


```python
from datetime import datetime
```


```python
today = datetime.now().strftime("%Y-%m-%d")
```


```python
news_df.to_csv(news_directory.joinpath(f"{today}-news.csv"))
```


```python
news_df.head()
```
## Preprocessing.


In the above code we have collected the data for the previous day, for one day we can have up to 72 news articles written by different news outlets.

We have got our news dataset, we need to now do some preprocessing. The only preprocessing we will do will be to drop the duplicate in the content.

```python
news_df = news_df.drop_duplicates(subset="content").reset_index(drop=True)
```


```python
news_df
```

## Embedding phase.

Machine learning model doesn't work with text data, we need to convert the text in a representation that machine can understand. To achieve this we need to use embeddings. We will use an  embedding  model to learn representation of our dataset in an embedding space.

We will be using the `dunzhang/stella_en_400M_v5`, it is a good model from huggingface, It offer a good trade-off between the size and performance.  It has a good score on different tasks  in both French and English on the [MTEB leaderboard.](https://huggingface.co/spaces/mteb/leaderboard)

The bellow code section assume that we have the model downloaded in a locally repository of our machine. If you want do download the model locally you can refer tho this [script](put the path here) to learn how to download the model locally.

The code will loads the embedding model and uses it to encode the news. After the encoding we will have for each news article an embedding vector of shape 1024.

```python
embedding_model_id = "dunzhang/stella_en_400M_v5"
```


```python
current_directory
```


```python
model_path  = current_directory.joinpath(embedding_model_id)
```


```python
embedding_model_path = current_directory.joinpath("models", embedding_model_id)
```


```python

transformer_kwargs = {"model_name_or_path": embedding_model_path.__str__(),
                      "trust_remote_code": True,
                      "device": "cpu",
                      "config_kwargs": {"use_memory_efficient_attention": False,
                                        "unpad_inputs": False},
                      "cache_folder": model_path}
```


```python
from sentence_transformers import SentenceTransformer
```


```python
sentence_transformer_model = SentenceTransformer(
    **transformer_kwargs)
```


```python
today_news_embeddings = sentence_transformer_model.encode(
    news_df.content.tolist())
```


```python
today_news_embeddings.shape
```

Now we have encoded our news in the embeddings, for each news we have an embedding vector of shape 1024. With those embedding we can now start clustering our news.


# Clustering

## K-means

In this step, we will group our news embeddings in a cluster using the K-mean algorithm. The algorithm will try to group the news in clusters based on the similarity of their embedding vectors. After the clustering, we will have similar news grouped in similar clusters. You can learn more about the clustering algorithm [here](https://www.reddit.com/r/learnmachinelearning/comments/rmx04g/what_is_K-means_clustering_a_2minute_visual_guide/)

### How do we pick the number of cluster?

One question that is still unclear in the literature about K-mean is how to pick the number of clusters in the K-mean. 
A common approach is to use Silhouette Coefficient. In the next section I will to explain that coefficient. 

#### Silhouette Score.

We will use the silhouette score to get the best number of clusters.

>The Silhouette Coefficient is a measure of how well samples are clustered with samples that are similar to themselves. Clustering models with a high Silhouette Coefficient are said to be dense, where samples in the same cluster are similar to each other, and well separated, where samples in different clusters are not very similar to each other.



Given the a point $x_i$, and a cluster label $c_i$ to compute the silhouette score:
- we compute the mean distance of the $x_i$ to all the point in cluster $c_i$, we call it $a_i$

  ${\displaystyle a_i={\frac {1}{|C_{I}|-1}}\sum _{j\in C_{I},i\neq j}d(i,j)}$

  Note that we divide by don't want to include the current point when we are trying to compute the distance.
  
- $b_i$ is the a measure to how the point $x_i$ in cluster $c_i$ is dissimilar to all other clusters $c_j$ with $c_j != c_i$.

For each other clusters different $c_i$ we compute the mean distance between $x_i$ and all the points in the cluster.  Then we take the cluster that has the mean distance as the closest cluster to $x_i$.

We define $b_i$ as:

${\displaystyle b_i=\min _{J\neq I}{\frac {1}{|C_{J}|}}\sum _{j\in C_{J}}d(i,j)}$


With those $a_i$, and $b_I$ we define the silhouette score of the point $x_i$ as $s_i$ to be

${\displaystyle s_i={\frac {b_i-a_i}{\max\{a_i,b_i\}}}}$

This value varies between -1, and 1. 1 means our clusters are dense, and -1 means the opposite.

Let us write a python function that will perform the clustering and return the k that gives us the best cluster.



```python
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
```


```python

def find_best_estimator (X):
    """ compute the k mean clustering, and return the best k that maximize the silhouette score
    """
    k_mean_estimators = [
        (f"KMeans_{i}", KMeans(n_clusters=i, random_state=42, max_iter=3000)) for i in range(3, X.shape[0])]
    scores = []

    best_estimator = None
    best_metric = float("-inf")
    for estimator_name, estimator in k_mean_estimators :
        estimator.fit(X)
        labels = estimator.labels_
        score = silhouette_score(
            X, labels)
        if score > best_metric :
            best_metric = score
            best_estimator = estimator
        print(estimator_name, score)
        scores.append(score)
    return best_estimator, scores
```


```python
best_estimator, scores = find_best_estimator(today_news_embeddings)
```

In the above function we compute the silhouette score for values for k ranging from 2 to the max number of datapoints in our dataset.


Let plot now the similarity silhouette score and see how it grow with the number of cluster selected.


```python
import matplotlib.pyplot as plt
```


```python
axes = plt.figure(figsize=(5, 10))
```


```python
axes = plt.figure(figsize=(5, 10))
```


```python
fig, ax = plt.subplots()
ax.plot(range(3, today_news_embeddings.shape[0]), scores)
```
[PUT the image here]

```python
best_estimator
```

We can see that the best estimator gave us the n cluster equal to 29


```python
news_df["k_means_labels"] = best_estimator.labels_
```

Now let us analyze the clustering results.


```python
def analyse_embeddings(dataframe, embeddings, index, label_column="labels"):
    """ take a matrix of embeddings and the labels.
    for each label compute the cosine similarity of the document with that label.
    """
    document_in_index = dataframe.query(f"{label_column} == {index}")
    with pd.option_context('display.max_colwidth', None):
        display(document_in_index.title)
    document_index = document_in_index.index
    vectors = embeddings[document_index]
    return sentence_transformer_model.similarity(vectors,  vectors)
```


```python
analyse_embeddings(news_df, today_news_embeddings,29, label_column="k_means_labels")
```

After the first look at the results we can see that the results are good, we have around 29 news cluster, for 72 news.
Some news cluster have only one article which make sense, and other have up to 6 articles. In the later analysis we will only keep news articles that have more than one documents.

Can we do better than that? Let now try hierarchical clustering

## Hierarchical Clustering

Hierarchical clustering is a clustering that uses an iterative approach to build the `dendrogram`.

A dendrogram is a representation of a tree. In hierarchical clustering, it illustrates the arrangement of the clusters produced by the corresponding analyses.


**How do we build a dendrogram?**

Assuming we have `n` points that we would like to cluster, the algorithm starts with them and a similarity metric to use.
In the first step, all the `n` points are grouped in a `n ` clusters, as each observation is treated as a separate cluster.
Then, the next two similar clusters are fused into a cluster; at this point, we have `n-1` clusters.
The algorithm will process iteratively  by fusing similar clusters into each other until we have one cluster.  
With one cluster we have our dendrogram complete.

In the figure, [Put the figure here], illustrate a dendrogram resulting from the clustering.

**How do we compute similarity between clusters?**

We have the notion of similarity between two points but how do we compute the similarity between a point and a cluster or between two clusters?
The notion of similarity between two points can be extend to develop the notion of `linkage` which is how we evaluate the similarity between two groups of observation or clusters.
Given two clusters A and, linkage metrics start by computing the pairwise  dissimilarity between the observations in cluster A and those in cluster B. 

Depending on how we will compute the overall dissimilarity from those pairwise dissimilarities, the linkage metric will be defined.

The linkage is called:

- __complete__: When overall dissimilarity is the largest of the pairwise dissimilarity.

- __single__:  When overall dissimilarity is the smallest of the pairwise dissimilarity.  

- __average__: When overall dissimilarity is the average of the pairwise dissimilarity.


With the understanding of of Hierarchical clustering and the linkage metric, let implement hierarchical clustering using the `scipy package`.
As the result of the hierarchical clustering is a tree, which can be visualized as a dendrogram.
### Hierarchical Clustering with Scipy.


To implement the the hierarchical clustering, we will use two functions from the `scipy` package, the `linkage` and the `dendrogram` function.

The linkage function perform the clustering, it takes the input embeddings a a numpy array, the linkage method, and the similarity metric and it return the hierarchical clustering tree encoded as a linkage matrix. 

We use the `dendrogram` function to generate the tree plot of the linkage matrix.
The bellow code illustrate how the clustering is performed.

```python
from scipy.cluster.hierarchy import dendrogram, linkage
```

```python
# Complete Linkage
plt.figure(figsize = (20,10))
mergings = linkage(today_news_embeddings,
                   method='complete', metric='cosine')
dendrogram(mergings)
plt.show()
```
[PUT THe Image of the dendrogram here]


On the above plot, the x axis represent the document which are group into cluster based on th color, the y axis represent the distance cut-off use while computing the merging.


On the _y_ axis represent the distance cut-off use while computing the merging.
On the _x_ axis represent the document which are group into cluster based on th color.

__A quick note on the merging value__: 

Each row of the merging matrix is in the format [cluster_index, cluster_index, distance, sample_count], the colum index are the ith iteration at which those merging was done.

Recall that we said that the hierarchical clustering consider each point as a separate cluster to start with and then iteratively merge those points two by two to create new clusters. 

Let have a look at what happen in the first 8 iteration of our algorithm.




```
import numpy as np
mergings[:, 2] = 1 - mergings[:, 2] # the distance is 1 - the cosine similarity
with np.printoptions(precision=3, suppress=True):
    print(mergings[:9])
```
```
[[ 9.    40.     0.927  2.   ]
 [19.    72.     0.918  2.   ]
 [ 8.    42.     0.906  2.   ]
 [34.    71.     0.898  2.   ]
 [27.    52.     0.889  2.   ]
 [17.    49.     0.887  2.   ]
 [25.    47.     0.882  2.   ]
 [30.    81.     0.878  3.   ]
 [44.    80.     0.869  3.   ]]
```
In the above matrix we can see that the document with index 9, 40 and the similarity distance of those document: 0.92.

Let see how what is inside those two documents: 

```
with pd.option_context('display.max_colwidth', None):
        display(news_df.iloc[[9, 40]].title)
```

```
9     RD -États généraux de la justice : “Un minimum de volonté de nous tous suffit pour que nous ayons un appareil judiciaire fort” (Félix Tshisekedi)
40                              Félix Tshisekedi lançant les états généraux de la Justice : « Notre appareil judiciaire sera restauré bon gré mal gré »
Name: title, dtype: object
```

We can check other documents in the merging to understand how the merging work. When we get to the 9th iteration we can see that it merged 3 samples and the second cluster index  at that iteration is not a single document, it index is 80 which is greater than the number of documents we have in our set(79). That mean that the cluster 44 which has only one document, the document 44 was merged with the cluster 80 which contain 2 documents. They were merged at a distance of 0.878.

The cluster 80 is build with documents merged together in the `80 - len(document)th` iteration. In our case it represent the documents merged in the 1st iteration(80 - 79). From the above matrix we can see that in the first iteration the documents 9 and 40 were merged together. With that we can say that at the 9th iteration the three documents that were merged together are documents with id: 9, 40, and 44. Let see how those document look like from our set.

```
with pd.option_context('display.max_colwidth', None):
        display(news_df.iloc[[9, 40, 44]].title)
```

```
9     RD -États généraux de la justice : “Un minimum de volonté de nous tous suffit pour que nous ayons un appareil judiciaire fort” (Félix Tshisekedi)
40                              Félix Tshisekedi lançant les états généraux de la Justice : « Notre appareil judiciaire sera restauré bon gré mal gré »
44                                                                                      La justice congolaise malade, son traitement débute aujourd'hui
```


```python
import numpy as np
from scipy.cluster.hierarchy import fcluster
```


### Selecting the cluster labels for document

The `fcluster` function helps take a distance cutt-off and return the cluster label of each document the value of k as distance cutt off. So if we say k = 0.2, the function will give us the clustering of the document assuming that max distance of the document in a cluster is 0.2.

But how do we find the best k to select? 

- We can use domain knowledge or we can fine tune that metric. We have decided to fine tune, and by fine tuning we select the k that gives us the best silhouette score. 

The below code perform the fine tuning and return the k that maximize the silhouette score.
```python
def select_best_distance(X, merging):
    """ 
    Start with the document embedding x, and the hierarchical clustering, 
    find the k that maximize the max_silhouette score
    """
    max_max_silhouette = float("-inf")
    return_labels = np.zeros(X.shape[0])
    scores = []
    number_of_clusters = []
    best_k = 0
    for k in np.arange(0.2, 0.7, 0.01):
        labels = fcluster(merging, k, criterion="distance")
        score = silhouette_score(
            X, labels
        )
        scores.append(score)
        n_clusters = np.unique(labels).shape[0]
        number_of_clusters.append(n_clusters)
        if score > max_max_silhouette:
            max_max_silhouette = score
            return_labels = labels
            best_k = k
    return scores, return_labels, number_of_clusters, best_k
```


```python
scores, label_hierarchical, number_of_clusters, best_k =  select_best_distance(today_news_embeddings, mergings)
```
Which method do I prefer, at this point the automatic method does not work in most of the case. However setting the best metric to a value equal to k=0.3 seems to give me the best cluster. With my embedding most document which has a cosine similarity of 1-0.3 = 0.7 seems to be related with that cut-off distance the cluster are meaningful.

```python
fig, ax = plt.subplots()
ax.plot(np.arange(0.2, 0.7, 0.01), scores)
ax.set_xlabel("Distance metric")
ax.set_ylabel("silhouette score")
ax.set_title("silhouette score vs distance metric")
```


```python
np.unique(label_hierarchical).shape
```


```python
max(scores)
```


```python
best_k
```


```python
fig, ax = plt.subplots()
ax.plot(np.arange(0.2, 0.7, 0.01), number_of_clusters)
ax.set_xlabel("Distance metric")
ax.set_ylabel("silhouette score")
ax.set_title("distance vs number of clusters")
```


```python
news_df["label_hierarchical"] = label_hierarchical
```


```python

```


```python
news_df.query("label_hierarchical == 1")
```


```python
analyse_embeddings(news_df, today_news_embeddings, 4, "label_hierarchical")
```

Once i have got the best labeling, i can go ahead and select the most important cluster. 

This will be all the cluster with more than 1 document, the rest of the document will be considered as noise. Each cluster with one document will be considered as noise.


```python
cluster_counts = news_df.label_hierarchical.value_counts()
labels_with_more_than_one = cluster_counts[cluster_counts > 1].index
```


```python
important_news_df = news_df.loc[news_df.label_hierarchical.isin(labels_with_more_than_one)]
```


```python
np.unique(important_news_df.label_hierarchical).shape[0]
```


```python
important_news_df.to_csv(news_directory.joinpath(f"{today}-important-news-clusters.csv"))
```

### Conclusion


In this notebook I went trough the process of building a news clustering system. We started by pulling the data form the database, then we computed the news embedding using the embedding model. With the embedding vectors of the news, we started the clustering. We explain the silhouette score, which is the metric we use to evaluate the quality of clusters resulting from a clustering algorithm, then we explained and performed hierarchical clustering on our news embeddings. At the end of the hieararchical clustering we end up with news clusters finally we saved those data in a file for further analysis and downstream applications.

In the next post, we will move from the jupyter notebook to a production ready application. We will learn how to productionarize this simple news clustering system. Stay tunned for that post.

At this point we have a notebook with the clustering results and those results are saved back in the folder. The next step will be to build an news cluster component that will be use in a downstream application.


Reference:

- Article on The clustering : https://joernhees.de/blog/2015/08/26/scipy-hierarchical-clustering-and-dendrogram-tutorial/
- Machine Learning book on Clustering
- Wikipedia on the clustering
