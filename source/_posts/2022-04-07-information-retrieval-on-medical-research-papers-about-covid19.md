---
layout: post
title: "Information retrieval on CORD-19 papers about COVID-19"
permalink: information-retrieval-on-medical-research-papers-about-covid19
date: 2022-04-07 12:03:59
comments: true
description: "information retrieval on medical research papers about CORD-19 dataset"
keywords: "Information Retrieval, Medical Research, Covid19, CORD-19 dataset"
categories:

tags:

---

#  Information Retrieval on the COVID-19 Open Research Dataset (CORD-19)

##  Scenario

In response to the COVID-19 pandemic, the White House and a coalition of leading research groups have prepared the [COVID-19](https://www.kaggle.com/allen-institute-for-ai/CORD-19-research-challenge) Open Research Dataset (CORD-19) . CORD-19 is a resource of over 181,000 scholarly articles, including over 80,000 with full text, about COVID-19, SARS-CoV-2, and related coronaviruses. This freely available dataset is provided to the global research community to apply recent advances in information retreival and other AI techniques to generate new insights in support of the ongoing fight against this infectious disease. There is a growing urgency for these approaches because of the rapid acceleration in new coronavirus literature, making it difficult for the medical research community to keep up.

## The task
For this tutorial, we will write an information retrieval pipeline that helps anyone to query the cord-19 dataset and find relevant articles for their queries.

We will show two different approaches to building that pipeline. The first approach uses the TF-IDF and cosine similarity between the query and the articles. We will use Elasticsearch with the python API to search our articles for the second one.

For the first step, we will leverage the TF-IDF vectorizer from Sklearn. In contrast, for the second one, we will leverage the python [elastic search dsl](https://github.com/elastic/elasticsearch-dsl-py).  If you are  familiar with ORMs, this library is like an object-relational framework to interact with the elastic search database. If you have a background in python and some NLP experience, this is a fantastic tool for a smooth interaction with elastic search.

This series is a part of an assignment I did for my Information Retrieval course. I decided to publish it online because of the lack of relevant tutorials on this topic. 

This writing will consist of the following section: 

For the first part : 

- **Data Collection:** In this section, we will go through downloading the dataset from Kaggle and how to process it in a CSV file.

- **Data Cleaning:** We will discover how to perform NLP preprocessing on the text file and create the cleaned version of the text.
- **Keyword selection:** We will use TF-IDF to find the appropriate keywords for each document.
- **Querying** : In this section we will query the article using TF-IDF.

For the second part : 

- Model Creation and Indexing: We will build our elastic search model and create our index in the database.
- Querying: We will show to perform some simple queries on our database and preprocess the results.

For this series, I am assuming the following : 

- You have elastic-search installed and running on your computer. 
- You have python 3.7 install 
- You are familiar with the basics of text processing in python and object-relational mapping.

If that is the case for you, let's get started.

{% include image.html name="information-retrival-elasticsearch-tfidf.png" caption="Our Information retrieval pipeline" %}



## Data Collection 

In this section, we will go through downloading the dataset from Kaggle and how to process it in chunks.

The dataset is large, and for this tutorial, we will use only the metadata release alongside the dataset. 

### Downloading the metadata file

The simplest way to download the data is to head to the [competetion link](https://www.kaggle.com/allen-institute-for-ai/CORD-19-research-challenge?select=metadata.csv) then select the metadata.csv file, and finally, click on the download button to download it and save it in a place in your local machine.

The data comes as a zip file; you will have to unzip it to start using it.

### Reading the dataset with Dask.

The dataset is large. It has more than 1.5Gb. We will use dask and pandas to read the file to make our life easier.

Make sure to have [dask](https://docs.dask.org/en/stable/) and [pandas](https://pandas.pydata.org/) installed in your environment for this project.

With the file downloaded in your local machine, dask and pandas installed, let us write the first code to read the dataset.


```python
import  pandas  as  pd
from  pathlib  import  Path
import  dask.dataframe  as  dd
import  numpy  as  np
```



If the libraries are well imported, let us read the file.


```python
DATA_PATH  =  Path.cwd().joinpath("data")
metadata_path  =  DATA_PATH.joinpath("metadata.csv")
data  =  dd.read_csv(metadata_path,  dtype={"pubmed_id":  np.object0,  'arxiv_id':  'object',  'who_covidence_id':  'object'})
```

Those lines, call the read_csv from function from dask to read the file and specify some columns data mapping.
Under the assumption that you have a data folder on the same level as this jupyter notebook and it is named `metadata.csv`. If that is not the case , you can pass the exact path of your csv file to the `read_csv` function.

__Why is dask faster than pandas?__ 

Remember, we are dealing with a large dataset. Pandas would like to load the whole data in memory. But for a small computer, 1.7 Gb is a lot of data to fit in memory, which would take us a lot of time. 

A workaround for this problem would be to read our dataset in different chunks with pandas. 
Dask is doing almost the same it read the dataset in parallel using chunk but transparently. 

It avoids us writing a lot of code that will read the data in chunks, process each chunk in parallel, and combine the whole data in one dataset. Check this tutorial [here](https://pythonspeed.com/articles/faster-pandas-dask/) for more details about how dask is faster than pandas.

Once our data is read, let us select a subset for our tutorial.


```python
important_columns  =  ["pubmed_id",  "title",  "abstract",  "journal",  "authors",  "publish_time"]
```

The dataset has 59k rows but for this exercice will will only work this the a sample of 1000 rows which is roughly the 1/60 of the whole dataframe


```python
sample_df = data.sample(frac=float(1/300))
sample_df  =  sample_df.dropna(subset=important_columns)
sample_df = sample_df.loc[:,  important_columns]
```

We are still using a dask dataframe; let us convert it to a pandas dataframe.



```python
data_df  =  sample_df.compute()
```

This line creates the pandas dataframe we will be working with for the rest of the tutorial.
The bellow lines will drop null values in the abstract of the dataset and 


```python
data_df  =  data_df.dropna(subset=['abstract'],  axis="rows")
data_df  =  data_df.set_index("pubmed_id")
data_df.head()
```




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>title</th>
      <th>abstract</th>
      <th>journal</th>
      <th>authors</th>
      <th>publish_time</th>
    </tr>
    <tr>
      <th>pubmed_id</th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>32165633</th>
      <td>Acid ceramidase of macrophages traps herpes si...</td>
      <td>Macrophages have important protective function...</td>
      <td>Nat Commun</td>
      <td>Lang, Judith; Bohn, Patrick; Bhat, Hilal; Jast...</td>
      <td>2020-03-12</td>
    </tr>
    <tr>
      <th>18325284</th>
      <td>Resource Allocation during an Influenza Pandemic</td>
      <td>Resource Allocation during an Influenza Pandemic</td>
      <td>Emerg Infect Dis</td>
      <td>Paranthaman, Karthikeyan; Conlon, Christopher ...</td>
      <td>2008-03-01</td>
    </tr>
    <tr>
      <th>30073452</th>
      <td>Analysis of pig trading networks and practices...</td>
      <td>East Africa is undergoing rapid expansion of p...</td>
      <td>Trop Anim Health Prod</td>
      <td>Atherstone, C.; Galiwango, R. G.; Grace, D.; A...</td>
      <td>2018-08-02</td>
    </tr>
    <tr>
      <th>35017151</th>
      <td>Pembrolizumab and decitabine for refractory or...</td>
      <td>BACKGROUND: The powerful ‘graft versus leukemi...</td>
      <td>J Immunother Cancer</td>
      <td>Goswami, Meghali; Gui, Gege; Dillon, Laura W; ...</td>
      <td>2022-01-11</td>
    </tr>
    <tr>
      <th>34504521</th>
      <td>Performance Evaluation of Enterprise Supply Ch...</td>
      <td>In order to make up for the shortcomings of cu...</td>
      <td>Comput Intell Neurosci</td>
      <td>Bu, Miaoling</td>
      <td>2021-08-30</td>
    </tr>
  </tbody>
</table>
</div>

The dataframe contains the following columns : 

The pub med id is a unique id to identify the article.
- Title: the title of the research paper 
- authors: the author of the paper
- publish time: the date the paper was published 
The abstract is the abstract of the paper, which is the text we will use for indexing purposes for this work.
With our pandas dataset in place, let us move to the next part: text processing. 

## Text Processing

{% include image.html name="text-processing-part.png" caption="The text Processing Part" %}

In this part, we will perform text processing. Our input is the raw text for the paper abstract for this section. Our output is the cleaned version of the input text.
Our preprocessing consists of the following steps: tokenization, lemmatization, stop word removal, lowercasing, special characters, and number removal.

For this step, we will be using [Spacy](https://spacy.io/usage),[NLTK](https://www.nltk.org/install.html), and regular expressions to perform our preprocessing. Ensure you have spacy and NLTK installed before running the code in this section. Check also if you have installed the `en_core_web_sm` package. If not install it from this [link](https://spacy.io/models/en#en_core_web_sm)


```python
import  spacy
import  nltk
import  re
nlp  =  spacy.load('en_core_web_sm')
stopwords_list  =  nltk.corpus.stopwords.words('english')
```

### Tokenization

Tokenization is the process of splitting a document into tokens, basically splitting a bunch of text into words. Spacy has a built-in tokenizer that helps us with this.

### Stopwords removal.

Stop words are words that have no special significance when analyzing the text. Those words are frequent in the corpus but are useless for our analysis and example of them are **_a_**, **_an_**, **_the_**, **_and_** the like.

The following function will perform stop word removal for us : 


```python
def  remove_stopwords(text,  is_lower_case=False):
    tokens  =  nltk.word_tokenize(text)
    tokens  =  [token.strip()  for  token  in  tokens]
    if  is_lower_case:
        filtered_tokens  =  [token  for  token  in  tokens  if  token  not  in  stopwords_list]
    else:
        filtered_tokens  =  [token  for  token  in  tokens  if  token.lower()  not  in  stopwords_list]
    filtered_text  =  '  '.join(filtered_tokens)
    return  filtered_text
```


### Special characters and number removal.

Special characters and symbols are usually non-alphanumeric or occasionally numeric characters which add to the extra noise in unstructured text. For our problem, since our corpus is built with articles from the biomedical field, there are a lot of numbers denoting quantities and dosages. We have decided to remove them to simplify the tutorial.


### Lematization

In this step, we will use lemmatization instead of stemming,

Chirstopher Maning define lemmatization as : 

_lemmatization usually refers to doing things properly using a vocabulary and morphological analysis of words, usually aiming to remove inflectional endings only and to return the base or dictionary form of a word, which is known as the lemma. If confronted with the token saw, stemming might return just s, whereas lemmatization would attempt to return either see or saw_

A good lemmatizer will replace words such as foot by feet, chosen, choose, by choice., etc.

This approach has some advantages because it will help not spread the information between different word forms derived from the same lemma. Therefore it will lead to an accurate TF-IDF because the same semantic information is assembled in one place.


The code for lemmatization is as follow : 


```python
def  lemmatize_text(text):
    text  =  nlp(text)
    text  =  '  '.join([word.lemma_  if  word.lemma_  !=  '-PRON-'  else  word.text  for  word  in  text])
    return  text
```

Finaly we apply the preprocessing function to our dataset to generate a cleaned version for each abstract.


```python
def preprocess_text(text,  text_lower_case=True,  text_lemmatization=True, stopword_removal=True):  
    if text_lower_case:
        text = text.lower().strip()
    
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'[\r|\n|\r\n]+', ' ',text)
    text = re.sub(r'\d+', '', text)
    if text_lemmatization:
        text = lemmatize_text(text)
    text = re.sub(' +', ' ', text)
        # remove stopwords
    if stopword_removal:
        text = remove_stopwords(text, is_lower_case=text_lower_case)
    return text
```


```python
data_df['abstract_cleaned']  =  data_df['abstract'].apply(preprocess_text)
```

With our text cleaned, we can move to our tutorial's next version, which generates the most relevant keywords for each abstract.

### Keyword Generation using Term Inverse - Document Frequency (Tf-IDF)

To generate keywords for each paper, we have to find a heuristic that finds the most relevant words while penalizing the common phrase in our corpus. Practitioners have widely used the term frequency-inverse document frequency (TF-IDF) to generate important keywords in documents in information retrieval. But what is TF-IDF? It combines two metrics, the term frequency and the inverse document frequency.

#### Term Frequency 

[K. Sparck Jones.] define the term frequency TF as a numerical statistic that reflects how important the word is to document in a collection or a corpus.

We compute it using the following formula. 

```
TF(t) = (Number of times term t appears in a document) / (Total number of terms in the document).
```

#### Inverse Document Frequency

[K. Sparck Jones.] defines the inverse document frequency as the log of the ratio between the total number of documents in the corpus and the number of documents with the word.

```
IDF(t) = log_e(Total number of documents / Number of documents with term t in it)
```

This helps to penalize the most common in a corpus. Those words carry fewer values for our analysis.
For the curious who want to know why we use the log in the IDF, check out [this answer](https://stackoverflow.com/a/33429876/4683950) from StackOverflow.

The TF-IDF combines both the term frequency and the inverse document frequency. 

$(tf_idf)_{t,d } = Idf_t * TF_{w, d}$

#### Applying Tf-IDF to our corpus



We will leverage the sklearn implementation of the TF-IDF, so before running the following code, make sure you have [sklearn](https://scikit-learn.org/stable/about.html) installed.

If the sklearn is installed, you can import it with the following code.



```python
from  sklearn.feature_extraction.text  import  TfidfVectorizer
```

[melanie and all ] recommended way to run  `TfidfVectorizer`  is with smoothing (`smooth_idf  =  True`) and normalization (`norm='l2") turned on. These parameters will better account for text length differences and produce more meaningful to–IDF scores. Smoothing and L2 normalization are the default settings for  `TfidfVectorizer,` so you don't need to include any extra code at all to turn them on. [melanie and all ]


```python
def create_tfidf_features(corpus, max_features=10000, max_df=0.95, min_df=2):
    """ Creates a tf-idf matrix for the `corpus` using sklearn. """
    tfidf_vectorizor = TfidfVectorizer(decode_error='replace', strip_accents='unicode', analyzer='word', 
                                       stop_words='english', ngram_range=(1, 3), max_features=max_features, 
                                       norm='l2', use_idf=True, smooth_idf=True, sublinear_tf=True,
                                       max_df=max_df, min_df=min_df)
    X = tfidf_vectorizor.fit_transform(corpus)
    print('tfidf matrix successfully created.')
    return X, tfidf_vectorizor
```

On top of the `smoth_idf`  and `norm` hyperparameters, the other keys hyperparameters are : 


- `max_features` which denotes the max number of words to keep in our vocabulary

- `max_df`: When building the vocabulary, ignore terms that have a document frequency strictly higher than the given threshold  

- `min_df:` When building the vocabulary, ignore terms that have a document frequency strictly lower than the given threshold. This value is also called a cut-off in the literature. 

`n_gram_range` is the number of n-grams to consider when building our vocabulary; for this task, we consider nonograms, bigrams, and trigrams.


```python
data_df = data_df.reset_index()
```


```python
tf_idf_matrix, tf_idf_vectorizer = create_tfidf_features(data_df['abstract_cleaned'])
```



After applying the tf_if vectorizer on to our corpus, it will result in the following two objects : 
-  The `tf_ifd matrix` , is a matrix where rows are the documents and columns are the words in our vocabulary.
- The `tf_idf_vectorizer` is an object that will help us to transform a new document to the TF-IDF version.

The value at the ith row and jth column is the TF-IDF score of the word j in document i.

For better analysis we converted the `tf_idf_matrix` into a pandas dataframe using the following code : 


```python
tfidf_df  =  pd.DataFrame(tf_idf_matrix.toarray(), columns=tf_idf_vectorizer.get_feature_names(), index=[data_df.index])
tfidf_df.head()
```




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>aa</th>
      <th>ab</th>
      <th>abbott</th>
      <th>abdomen</th>
      <th>abdominal</th>
      <th>abdominal pain</th>
      <th>abdominal wall</th>
      <th>ability</th>
      <th>ability induce</th>
      <th>ability perform</th>
      <th>...</th>
      <th>zip</th>
      <th>zip code</th>
      <th>zip code level</th>
      <th>zone</th>
      <th>zoonosis</th>
      <th>zoonotic</th>
      <th>zoonotic pathogen</th>
      <th>zoonotic virus</th>
      <th>μm</th>
      <th>μm respectively</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>...</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.00000</td>
      <td>0.000000</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
    </tr>
    <tr>
      <th>1</th>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>...</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.00000</td>
      <td>0.000000</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
    </tr>
    <tr>
      <th>2</th>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>...</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.08894</td>
      <td>0.098877</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
    </tr>
    <tr>
      <th>3</th>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>...</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.00000</td>
      <td>0.000000</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
    </tr>
    <tr>
      <th>4</th>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>...</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.00000</td>
      <td>0.000000</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
    </tr>
  </tbody>
</table>
<p>5 rows × 10000 columns</p>
</div>



The next step is to generate the top 20 keywords for each document, those word are the word with the highest tf-idf score in each document.

 Let’s reorganize the DataFrame so that the words are in rows rather than columns.


```python
tfidf_df = tfidf_df.sort_index().round(decimals=2)
tfidf_df_stacked = tfidf_df.stack().reset_index()
tfidf_df_stacked = tfidf_df_stacked.rename(columns={0:'tfidf','level_1': 'term', "level_0": "doc_id"})
```

 We  sort by document and tfidf score and then groupby document and take the first 20 values.


```python
tfidf_df_stacked.head()
```




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>doc_id</th>
      <th>term</th>
      <th>tfidf</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>0</td>
      <td>aa</td>
      <td>0.0</td>
    </tr>
    <tr>
      <th>1</th>
      <td>0</td>
      <td>ab</td>
      <td>0.0</td>
    </tr>
    <tr>
      <th>2</th>
      <td>0</td>
      <td>abbott</td>
      <td>0.0</td>
    </tr>
    <tr>
      <th>3</th>
      <td>0</td>
      <td>abdomen</td>
      <td>0.0</td>
    </tr>
    <tr>
      <th>4</th>
      <td>0</td>
      <td>abdominal</td>
      <td>0.0</td>
    </tr>
  </tbody>
</table>
</div>




```python
tfidf_df_stacked = tfidf_df_stacked.sort_values(by=['doc_id','tfidf'], ascending=[True,False])\
.groupby(['doc_id']).head(10)
```

Once we have sorted and find the top keywords we can save them in a dictionary where the keys are the the document id and the values are the another dictionary of the term and their tf-idf score.


```python
tfidf_df_stacked  =  tfidf_df_stacked.reset_index().rename(columns={'level_1':'term'})
document_tfidf  =  tfidf_df_stacked.groupby(['doc_id']).apply(lambda  x:  x[['term',  "tfidf"]].set_index("term").to_dict().get('tfidf'))

```

With our document and the top keyword mappings, we can now visualize what our corpus looks like to have an idea on each paper on the document. 

I recently come across a good piece of code that makes visualization for a document using TF-IDF. 

I grabbed it from this [article](https://melaniewalsh.github.io/Intro-Cultural-Analytics/05-Text-Analysis/03-TF-IDF-Scikit-Learn.html).


```python
tfidf_df_stacked.head()
```




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>index</th>
      <th>doc_id</th>
      <th>term</th>
      <th>tfidf</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>3977</td>
      <td>0</td>
      <td>hsv</td>
      <td>0.43</td>
    </tr>
    <tr>
      <th>1</th>
      <td>4957</td>
      <td>0</td>
      <td>macrophage</td>
      <td>0.26</td>
    </tr>
    <tr>
      <th>2</th>
      <td>6913</td>
      <td>0</td>
      <td>propagation</td>
      <td>0.22</td>
    </tr>
    <tr>
      <th>3</th>
      <td>7683</td>
      <td>0</td>
      <td>restrict</td>
      <td>0.19</td>
    </tr>
    <tr>
      <th>4</th>
      <td>6151</td>
      <td>0</td>
      <td>particle</td>
      <td>0.17</td>
    </tr>
  </tbody>
</table>
</div>




```python
import altair as alt
import numpy as np

# Terms in this list will get a red dot in the visualization
term_list = ["covid", 'traitement', 'ebola']

# adding a little randomness to break ties in term ranking
top_tfidf_plusRand = tfidf_df_stacked.loc[:800]
top_tfidf_plusRand['tfidf'] = top_tfidf_plusRand['tfidf'] + np.random.rand(tfidf_df_stacked.loc[:800].shape[0])*0.0001

# base for all visualizations, with rank calculation
base = alt.Chart(top_tfidf_plusRand).encode(
    x = 'rank:O',
    y = 'doc_id:N'
).transform_window(
    rank = "rank()",
    sort = [alt.SortField("tfidf", order="descending")],
    groupby = ["doc_id"],
)

# heatmap specification
heatmap = base.mark_rect().encode(
    color = 'tfidf:Q'
)

# red circle over terms in above list
circle = base.mark_circle(size=100).encode(
    color = alt.condition(
        alt.FieldOneOfPredicate(field='term', oneOf=term_list),
        alt.value('red'),
        alt.value('#FFFFFF00')        
    )
)

# text labels, white for darker heatmap colors
text = base.mark_text(baseline='middle').encode(
    text = 'term:N',
    color = alt.condition(alt.datum.tfidf >= 0.23, alt.value('white'), alt.value('black'))
)

# display the three superimposed visualizations
(heatmap + circle + text).properties(width = 1200)
```






<div id="altair-viz-8c982488d57d479c8809e2fc1cb135a0"></div>
<script type="text/javascript">
  (function(spec, embedOpt){
    let outputDiv = document.currentScript.previousElementSibling;
    if (outputDiv.id !== "altair-viz-8c982488d57d479c8809e2fc1cb135a0") {
      outputDiv = document.getElementById("altair-viz-8c982488d57d479c8809e2fc1cb135a0");
    }
    const paths = {
      "vega": "https://cdn.jsdelivr.net/npm//vega@5?noext",
      "vega-lib": "https://cdn.jsdelivr.net/npm//vega-lib?noext",
      "vega-lite": "https://cdn.jsdelivr.net/npm//vega-lite@4.8.1?noext",
      "vega-embed": "https://cdn.jsdelivr.net/npm//vega-embed@6?noext",
    };

    function loadScript(lib) {
      return new Promise(function(resolve, reject) {
        var s = document.createElement('script');
        s.src = paths[lib];
        s.async = true;
        s.onload = () => resolve(paths[lib]);
        s.onerror = () => reject(`Error loading script: ${paths[lib]}`);
        document.getElementsByTagName("head")[0].appendChild(s);
      });
    }

    function showError(err) {
      outputDiv.innerHTML = `<div class="error" style="color:red;">${err}</div>`;
      throw err;
    }

    function displayChart(vegaEmbed) {
      vegaEmbed(outputDiv, spec, embedOpt)
        .catch(err => showError(`Javascript Error: ${err.message}<br>This usually means there's a typo in your chart specification. See the javascript console for the full traceback.`));
    }

    if(typeof define === "function" && define.amd) {
      requirejs.config({paths});
      require(["vega-embed"], displayChart, err => showError(`Error loading script: ${err.message}`));
    } else if (typeof vegaEmbed === "function") {
      displayChart(vegaEmbed);
    } else {
      loadScript("vega")
        .then(() => loadScript("vega-lite"))
        .then(() => loadScript("vega-embed"))
        .catch(showError)
        .then(() => displayChart(vegaEmbed));
    }
  })({"config": {"view": {"continuousWidth": 400, "continuousHeight": 300}}, "layer": [{"mark": "rect", "encoding": {"color": {"type": "quantitative", "field": "tfidf"}, "x": {"type": "ordinal", "field": "rank"}, "y": {"type": "nominal", "field": "doc_id"}}, "transform": [{"window": [{"op": "rank", "field": "", "as": "rank"}], "groupby": ["doc_id"], "sort": [{"field": "tfidf", "order": "descending"}]}]}, {"mark": {"type": "circle", "size": 100}, "encoding": {"color": {"condition": {"value": "red", "test": {"field": "term", "oneOf": ["covid", "traitement", "ebola"]}}, "value": "#FFFFFF00"}, "x": {"type": "ordinal", "field": "rank"}, "y": {"type": "nominal", "field": "doc_id"}}, "transform": [{"window": [{"op": "rank", "field": "", "as": "rank"}], "groupby": ["doc_id"], "sort": [{"field": "tfidf", "order": "descending"}]}]}, {"mark": {"type": "text", "baseline": "middle"}, "encoding": {"color": {"condition": {"value": "white", "test": "(datum.tfidf >= 0.23)"}, "value": "black"}, "text": {"type": "nominal", "field": "term"}, "x": {"type": "ordinal", "field": "rank"}, "y": {"type": "nominal", "field": "doc_id"}}, "transform": [{"window": [{"op": "rank", "field": "", "as": "rank"}], "groupby": ["doc_id"], "sort": [{"field": "tfidf", "order": "descending"}]}]}], "data": {"name": "data-76268273770fab4049ea6c56cc2f14ca"}, "width": 1200, "$schema": "https://vega.github.io/schema/vega-lite/v4.8.1.json", "datasets": {"data-76268273770fab4049ea6c56cc2f14ca": [{"index": 3977, "doc_id": 0, "term": "hsv", "tfidf": 0.430096159854773}, {"index": 4957, "doc_id": 0, "term": "macrophage", "tfidf": 0.260006221576515}, {"index": 6913, "doc_id": 0, "term": "propagation", "tfidf": 0.22008280902365066}, {"index": 7683, "doc_id": 0, "term": "restrict", "tfidf": 0.19008872386046285}, {"index": 6151, "doc_id": 0, "term": "particle", "tfidf": 0.17000597488345323}, {"index": 5457, "doc_id": 0, "term": "mouse", "tfidf": 0.1600711282526556}, {"index": 1199, "doc_id": 0, "term": "ceramide", "tfidf": 0.15009467724095557}, {"index": 2899, "doc_id": 0, "term": "endocytosis", "tfidf": 0.14004798280120653}, {"index": 4347, "doc_id": 0, "term": "infection lack", "tfidf": 0.1400364871315096}, {"index": 4444, "doc_id": 0, "term": "inoculation", "tfidf": 0.14004199459822694}, {"index": 17618, "doc_id": 1, "term": "resource allocation", "tfidf": 0.5400332163271198}, {"index": 14392, "doc_id": 1, "term": "influenza pandemic", "tfidf": 0.510037124155343}, {"index": 10309, "doc_id": 1, "term": "allocation", "tfidf": 0.43008712567250634}, {"index": 14391, "doc_id": 1, "term": "influenza", "tfidf": 0.35003718845265497}, {"index": 17617, "doc_id": 1, "term": "resource", "tfidf": 0.3200233192757451}, {"index": 16062, "doc_id": 1, "term": "pandemic", "tfidf": 0.2000798945902687}, {"index": 10000, "doc_id": 1, "term": "aa", "tfidf": 2.1923129377428597e-05}, {"index": 10001, "doc_id": 1, "term": "ab", "tfidf": 1.732613329798155e-05}, {"index": 10002, "doc_id": 1, "term": "abbott", "tfidf": 6.652516178758821e-05}, {"index": 10003, "doc_id": 1, "term": "abdomen", "tfidf": 8.642751070306085e-05}, {"index": 26485, "doc_id": 2, "term": "pig", "tfidf": 0.28004867482344054}, {"index": 23227, "doc_id": 2, "term": "farmer", "tfidf": 0.23005375138270895}, {"index": 23226, "doc_id": 2, "term": "farm", "tfidf": 0.21006815253752303}, {"index": 26597, "doc_id": 2, "term": "pork", "tfidf": 0.21009559839615627}, {"index": 20836, "doc_id": 2, "term": "biosecurity", "tfidf": 0.17006122219379682}, {"index": 21792, "doc_id": 2, "term": "consumer", "tfidf": 0.16008106716421444}, {"index": 23477, "doc_id": 2, "term": "gate", "tfidf": 0.16000800521255357}, {"index": 26817, "doc_id": 2, "term": "price", "tfidf": 0.15003633157211874}, {"index": 25050, "doc_id": 2, "term": "market", "tfidf": 0.14006818675961194}, {"index": 26334, "doc_id": 2, "term": "pay", "tfidf": 0.14003749325370343}, {"index": 36344, "doc_id": 3, "term": "pd", "tfidf": 0.20006351582690834}, {"index": 38393, "doc_id": 3, "term": "singlecell", "tfidf": 0.17001069314035605}, {"index": 34771, "doc_id": 3, "term": "leukemia", "tfidf": 0.1600258712646877}, {"index": 30854, "doc_id": 3, "term": "blockade", "tfidf": 0.15008158083234}, {"index": 34133, "doc_id": 3, "term": "immunological", "tfidf": 0.15005342383942558}, {"index": 31101, "doc_id": 3, "term": "cd", "tfidf": 0.1300816067262941}, {"index": 31114, "doc_id": 3, "term": "cell", "tfidf": 0.13006140192303342}, {"index": 31767, "doc_id": 3, "term": "considerable", "tfidf": 0.1300561413479297}, {"index": 33255, "doc_id": 3, "term": "feasible", "tfidf": 0.13005079388657087}, {"index": 31105, "doc_id": 3, "term": "cd effector", "tfidf": 0.11000303410028019}, {"index": 46016, "doc_id": 4, "term": "overall performance", "tfidf": 0.34001117318177176}, {"index": 42950, "doc_id": 4, "term": "enterprise", "tfidf": 0.3300423119946526}, {"index": 46394, "doc_id": 4, "term": "performance evaluation", "tfidf": 0.31005749316373027}, {"index": 46392, "doc_id": 4, "term": "performance", "tfidf": 0.24007875798173506}, {"index": 48862, "doc_id": 4, "term": "supply chain", "tfidf": 0.22008819872475555}, {"index": 43056, "doc_id": 4, "term": "evaluation", "tfidf": 0.20003864882354697}, {"index": 44275, "doc_id": 4, "term": "index", "tfidf": 0.17007597528653012}, {"index": 46014, "doc_id": 4, "term": "overall", "tfidf": 0.1700073592916001}, {"index": 48861, "doc_id": 4, "term": "supply", "tfidf": 0.17004837890321678}, {"index": 49628, "doc_id": 4, "term": "value", "tfidf": 0.1700384539763419}, {"index": 50966, "doc_id": 5, "term": "cap", "tfidf": 0.2600827880373142}, {"index": 50666, "doc_id": 5, "term": "atypical", "tfidf": 0.24002476432510342}, {"index": 55526, "doc_id": 5, "term": "mycoplasma pneumoniae", "tfidf": 0.23004224680998317}, {"index": 56538, "doc_id": 5, "term": "pneumoniae", "tfidf": 0.23002977201114272}, {"index": 55525, "doc_id": 5, "term": "mycoplasma", "tfidf": 0.2200589064212554}, {"index": 54956, "doc_id": 5, "term": "macrolide", "tfidf": 0.21001011759201352}, {"index": 56177, "doc_id": 5, "term": "pathogen", "tfidf": 0.17001860950177153}, {"index": 59390, "doc_id": 5, "term": "umin", "tfidf": 0.170099487116851}, {"index": 59324, "doc_id": 5, "term": "tree", "tfidf": 0.15008746921079255}, {"index": 50229, "doc_id": 5, "term": "age year", "tfidf": 0.1300125458798032}, {"index": 64140, "doc_id": 6, "term": "immunosuppressed", "tfidf": 0.2300932882713022}, {"index": 66536, "doc_id": 6, "term": "pneumonia", "tfidf": 0.23002415414733074}, {"index": 67642, "doc_id": 6, "term": "respiratory syncytial", "tfidf": 0.20005577256943277}, {"index": 67643, "doc_id": 6, "term": "respiratory syncytial virus", "tfidf": 0.20002774529191952}, {"index": 68957, "doc_id": 6, "term": "syncytial", "tfidf": 0.2000236079482775}, {"index": 68958, "doc_id": 6, "term": "syncytial virus", "tfidf": 0.20009919335828774}, {"index": 69750, "doc_id": 6, "term": "virus infection", "tfidf": 0.19001167474297287}, {"index": 60164, "doc_id": 6, "term": "adult", "tfidf": 0.16000691283223642}, {"index": 66177, "doc_id": 6, "term": "pathogen", "tfidf": 0.15002430779682793}, {"index": 64141, "doc_id": 6, "term": "immunosuppressed patient", "tfidf": 0.1400950721496941}, {"index": 76376, "doc_id": 7, "term": "peptide", "tfidf": 0.2800017733691561}, {"index": 76865, "doc_id": 7, "term": "processing", "tfidf": 0.21001513734171523}, {"index": 76947, "doc_id": 7, "term": "proteasome", "tfidf": 0.1900207636295211}, {"index": 78541, "doc_id": 7, "term": "spp", "tfidf": 0.19001788320907806}, {"index": 79402, "doc_id": 7, "term": "unconventional", "tfidf": 0.1900893761625098}, {"index": 71367, "doc_id": 7, "term": "cleave", "tfidf": 0.18005420543211204}, {"index": 76190, "doc_id": 7, "term": "pathway", "tfidf": 0.18005140931429126}, {"index": 70322, "doc_id": 7, "term": "alternative", "tfidf": 0.15001219311757946}, {"index": 74801, "doc_id": 7, "term": "like", "tfidf": 0.14008704380575293}, {"index": 71354, "doc_id": 7, "term": "class", "tfidf": 0.13002723291503096}, {"index": 80908, "doc_id": 8, "term": "breathing", "tfidf": 0.2900694258976389}, {"index": 80289, "doc_id": 8, "term": "airway pressure", "tfidf": 0.26001832493578314}, {"index": 86009, "doc_id": 8, "term": "output", "tfidf": 0.2500467737185693}, {"index": 83000, "doc_id": 8, "term": "equivalent", "tfidf": 0.22009665983862206}, {"index": 80287, "doc_id": 8, "term": "airway", "tfidf": 0.21001545121957763}, {"index": 86776, "doc_id": 8, "term": "pressure", "tfidf": 0.21000401181332856}, {"index": 89804, "doc_id": 8, "term": "vs", "tfidf": 0.21002891415146357}, {"index": 85362, "doc_id": 8, "term": "mode", "tfidf": 0.20005193053150522}, {"index": 80978, "doc_id": 8, "term": "cardiac", "tfidf": 0.19009974422212444}, {"index": 86494, "doc_id": 8, "term": "place", "tfidf": 0.17003704488926977}, {"index": 99989, "doc_id": 9, "term": "zika", "tfidf": 0.38004229197414147}, {"index": 90463, "doc_id": 9, "term": "anxiety", "tfidf": 0.3100649053111392}, {"index": 99130, "doc_id": 9, "term": "threat", "tfidf": 0.26003138509637297}, {"index": 94023, "doc_id": 9, "term": "hypothesis", "tfidf": 0.22009275685151142}, {"index": 97027, "doc_id": 9, "term": "psychological", "tfidf": 0.2100100623560098}, {"index": 93695, "doc_id": 9, "term": "health anxiety", "tfidf": 0.18006263894458968}, {"index": 96704, "doc_id": 9, "term": "predict", "tfidf": 0.18000161027775868}, {"index": 90358, "doc_id": 9, "term": "analysis indicate", "tfidf": 0.17009400972517275}, {"index": 90470, "doc_id": 9, "term": "anxious", "tfidf": 0.1600572886959473}, {"index": 91387, "doc_id": 9, "term": "clinical implication", "tfidf": 0.16009861916342655}, {"index": 100815, "doc_id": 10, "term": "bind site", "tfidf": 0.29003999359774385}, {"index": 108408, "doc_id": 10, "term": "site", "tfidf": 0.22009040061295165}, {"index": 101305, "doc_id": 10, "term": "choice", "tfidf": 0.21002223106433435}, {"index": 101591, "doc_id": 10, "term": "comparison", "tfidf": 0.21003530927045447}, {"index": 100788, "doc_id": 10, "term": "benchmark", "tfidf": 0.20001445055060488}, {"index": 100807, "doc_id": 10, "term": "bind", "tfidf": 0.2000473807985977}, {"index": 101096, "doc_id": 10, "term": "cavity", "tfidf": 0.1800494184507462}, {"index": 103056, "doc_id": 10, "term": "evaluation", "tfidf": 0.150063441497643}, {"index": 109195, "doc_id": 10, "term": "tool", "tfidf": 0.14004884949353194}, {"index": 101592, "doc_id": 10, "term": "comparison assembly", "tfidf": 0.13005409899711495}, {"index": 110124, "doc_id": 11, "term": "ade", "tfidf": 0.34008424383749386}, {"index": 110440, "doc_id": 11, "term": "antimicrobial", "tfidf": 0.2800731232245128}, {"index": 110918, "doc_id": 11, "term": "broadspectrum", "tfidf": 0.2500420430742828}, {"index": 110444, "doc_id": 11, "term": "antimicrobial therapy", "tfidf": 0.20009751017709945}, {"index": 119476, "doc_id": 11, "term": "unwanted", "tfidf": 0.20006107262167616}, {"index": 112871, "doc_id": 11, "term": "empirical", "tfidf": 0.1900397801608411}, {"index": 114033, "doc_id": 11, "term": "icu", "tfidf": 0.19009041270448504}, {"index": 119111, "doc_id": 11, "term": "therapy", "tfidf": 0.15007724925164}, {"index": 110506, "doc_id": 11, "term": "appropriate", "tfidf": 0.12005152946085906}, {"index": 112282, "doc_id": 11, "term": "deescalation", "tfidf": 0.12004108736640481}, {"index": 126649, "doc_id": 12, "term": "postpartum", "tfidf": 0.20004632426802332}, {"index": 121210, "doc_id": 12, "term": "cesarean section", "tfidf": 0.1600066093857501}, {"index": 121209, "doc_id": 12, "term": "cesarean", "tfidf": 0.15004735382277926}, {"index": 129653, "doc_id": 12, "term": "vascular", "tfidf": 0.15000222164420296}, {"index": 123084, "doc_id": 12, "term": "examination", "tfidf": 0.14000407300238535}, {"index": 123429, "doc_id": 12, "term": "fresh", "tfidf": 0.1400716436848096}, {"index": 123794, "doc_id": 12, "term": "hemorrhagic", "tfidf": 0.14004667241580318}, {"index": 123892, "doc_id": 12, "term": "histological", "tfidf": 0.1400607780023156}, {"index": 128108, "doc_id": 12, "term": "section", "tfidf": 0.14003522209226463}, {"index": 129146, "doc_id": 12, "term": "thrombosis", "tfidf": 0.14006240080055005}, {"index": 131204, "doc_id": 13, "term": "cerebrovascular", "tfidf": 0.2300123026146155}, {"index": 130517, "doc_id": 13, "term": "ard", "tfidf": 0.2000350667378793}, {"index": 130098, "doc_id": 13, "term": "acute phase", "tfidf": 0.16004722999845275}, {"index": 130541, "doc_id": 13, "term": "arterial", "tfidf": 0.15005952568607447}, {"index": 134151, "doc_id": 13, "term": "impaired", "tfidf": 0.1500174580680392}, {"index": 131201, "doc_id": 13, "term": "cerebral", "tfidf": 0.14003456348060672}, {"index": 132498, "doc_id": 13, "term": "dioxide", "tfidf": 0.14005042732945627}, {"index": 133168, "doc_id": 13, "term": "extracorporeal", "tfidf": 0.14004032765603475}, {"index": 130975, "doc_id": 13, "term": "carbon", "tfidf": 0.13009527960820289}, {"index": 136451, "doc_id": 13, "term": "phase", "tfidf": 0.12009472046566293}, {"index": 145403, "doc_id": 14, "term": "module", "tfidf": 0.2600741883388696}, {"index": 147037, "doc_id": 14, "term": "pt", "tfidf": 0.25005593579452606}, {"index": 148685, "doc_id": 14, "term": "student", "tfidf": 0.23000674765823603}, {"index": 144033, "doc_id": 14, "term": "icu", "tfidf": 0.20009266885481683}, {"index": 142147, "doc_id": 14, "term": "curriculum", "tfidf": 0.1800556552348961}, {"index": 147896, "doc_id": 14, "term": "rotation", "tfidf": 0.18004197923481646}, {"index": 149410, "doc_id": 14, "term": "undergraduate", "tfidf": 0.17009724853386457}, {"index": 146744, "doc_id": 14, "term": "prepare", "tfidf": 0.16008018694086895}, {"index": 142244, "doc_id": 14, "term": "deal", "tfidf": 0.15002884137137384}, {"index": 143134, "doc_id": 14, "term": "expert", "tfidf": 0.15004254563714017}, {"index": 154118, "doc_id": 15, "term": "immunization", "tfidf": 0.31004384368992577}, {"index": 150164, "doc_id": 15, "term": "adult", "tfidf": 0.19006614352414514}, {"index": 153772, "doc_id": 15, "term": "heavily", "tfidf": 0.19001481800171302}, {"index": 150933, "doc_id": 15, "term": "burden", "tfidf": 0.18002853264071006}, {"index": 154918, "doc_id": 15, "term": "low middleincome", "tfidf": 0.17003756193226105}, {"index": 154919, "doc_id": 15, "term": "low middleincome country", "tfidf": 0.1700207244884274}, {"index": 155289, "doc_id": 15, "term": "middleincome", "tfidf": 0.17006571654058722}, {"index": 155290, "doc_id": 15, "term": "middleincome country", "tfidf": 0.17008500211313826}, {"index": 152739, "doc_id": 15, "term": "economic", "tfidf": 0.16002992456668771}, {"index": 151943, "doc_id": 15, "term": "country", "tfidf": 0.15003373170637663}, {"index": 161107, "doc_id": 16, "term": "cd lymphocyte", "tfidf": 0.260045564600248}, {"index": 161101, "doc_id": 16, "term": "cd", "tfidf": 0.25004432526113823}, {"index": 165420, "doc_id": 16, "term": "monocyte", "tfidf": 0.24003033789092695}, {"index": 164948, "doc_id": 16, "term": "lymphocyte", "tfidf": 0.23007087604636992}, {"index": 161102, "doc_id": 16, "term": "cd cd", "tfidf": 0.22008958946862228}, {"index": 164772, "doc_id": 16, "term": "leukocyte", "tfidf": 0.22008437729320354}, {"index": 166642, "doc_id": 16, "term": "postinfection", "tfidf": 0.21006959491081248}, {"index": 164852, "doc_id": 16, "term": "liver", "tfidf": 0.20003492618389399}, {"index": 164378, "doc_id": 16, "term": "infiltrate", "tfidf": 0.19009248374975815}, {"index": 162107, "doc_id": 16, "term": "cryptococcal", "tfidf": 0.18008980011465767}, {"index": 171527, "doc_id": 17, "term": "communication", "tfidf": 0.2000004210724432}, {"index": 171528, "doc_id": 17, "term": "communication skill", "tfidf": 0.18009681225122412}, {"index": 172147, "doc_id": 17, "term": "curriculum", "tfidf": 0.1800349174387868}, {"index": 178685, "doc_id": 17, "term": "student", "tfidf": 0.1800934708877115}, {"index": 176883, "doc_id": 17, "term": "programme", "tfidf": 0.17003659558791728}, {"index": 178416, "doc_id": 17, "term": "skill", "tfidf": 0.17005248407930065}, {"index": 170760, "doc_id": 17, "term": "basic", "tfidf": 0.1600533770819709}, {"index": 173114, "doc_id": 17, "term": "exist model", "tfidf": 0.16009441639737568}, {"index": 171603, "doc_id": 17, "term": "competence", "tfidf": 0.1500768822593495}, {"index": 174893, "doc_id": 17, "term": "longitudinal", "tfidf": 0.15009365653330456}, {"index": 185943, "doc_id": 18, "term": "optimism", "tfidf": 0.3200693293046427}, {"index": 188609, "doc_id": 18, "term": "steadily", "tfidf": 0.31009641935287635}, {"index": 187218, "doc_id": 18, "term": "rational", "tfidf": 0.2900728419552666}, {"index": 182328, "doc_id": 18, "term": "dental", "tfidf": 0.2800302197370461}, {"index": 187244, "doc_id": 18, "term": "reality", "tfidf": 0.28001378336400073}, {"index": 180656, "doc_id": 18, "term": "attitude", "tfidf": 0.24006421991759538}, {"index": 182313, "doc_id": 18, "term": "demand", "tfidf": 0.24002331690514872}, {"index": 183250, "doc_id": 18, "term": "fear", "tfidf": 0.23009166719767205}, {"index": 185653, "doc_id": 18, "term": "new", "tfidf": 0.23003270856764285}, {"index": 188458, "doc_id": 18, "term": "society", "tfidf": 0.22006021199928483}, {"index": 195420, "doc_id": 19, "term": "monocyte", "tfidf": 0.2900125066576262}, {"index": 192884, "doc_id": 19, "term": "encephalitis", "tfidf": 0.19001085831640693}, {"index": 195527, "doc_id": 19, "term": "myeloid", "tfidf": 0.19007140087371174}, {"index": 191161, "doc_id": 19, "term": "cell type", "tfidf": 0.1800347111671965}, {"index": 191746, "doc_id": 19, "term": "connect", "tfidf": 0.1800859544809553}, {"index": 194153, "doc_id": 19, "term": "impede", "tfidf": 0.1800767803890531}, {"index": 191441, "doc_id": 19, "term": "cns", "tfidf": 0.16007496428569162}, {"index": 195049, "doc_id": 19, "term": "marker", "tfidf": 0.15004029507835048}, {"index": 196186, "doc_id": 19, "term": "pathology", "tfidf": 0.14000970819128616}, {"index": 193130, "doc_id": 19, "term": "experimental", "tfidf": 0.13002356672784507}, {"index": 206121, "doc_id": 20, "term": "parasite", "tfidf": 0.24001439606264363}, {"index": 203216, "doc_id": 20, "term": "falciparum", "tfidf": 0.2300548458810206}, {"index": 204992, "doc_id": 20, "term": "malaria", "tfidf": 0.21000286420806327}, {"index": 207126, "doc_id": 20, "term": "rabbit", "tfidf": 0.19009465446352763}, {"index": 204116, "doc_id": 20, "term": "immunise", "tfidf": 0.18000960101700947}, {"index": 200433, "doc_id": 20, "term": "antigen", "tfidf": 0.17001974213868704}, {"index": 200856, "doc_id": 20, "term": "blood cell", "tfidf": 0.16008931560722364}, {"index": 207312, "doc_id": 20, "term": "red", "tfidf": 0.1600027402662041}, {"index": 202832, "doc_id": 20, "term": "elicit", "tfidf": 0.14000285160826265}, {"index": 208840, "doc_id": 20, "term": "suitable", "tfidf": 0.14004314700024437}, {"index": 213226, "doc_id": 21, "term": "farm", "tfidf": 0.2900996774866654}, {"index": 213334, "doc_id": 21, "term": "fish", "tfidf": 0.2800715614534594}, {"index": 216463, "doc_id": 21, "term": "phosphorus", "tfidf": 0.25001710564701385}, {"index": 211497, "doc_id": 21, "term": "column", "tfidf": 0.24000224874153583}, {"index": 215959, "doc_id": 21, "term": "organic", "tfidf": 0.23005984550738942}, {"index": 214445, "doc_id": 21, "term": "inorganic", "tfidf": 0.2000580892613197}, {"index": 215693, "doc_id": 21, "term": "nitrogen", "tfidf": 0.19005048113490536}, {"index": 215798, "doc_id": 21, "term": "nutrient", "tfidf": 0.1900099652838526}, {"index": 216461, "doc_id": 21, "term": "phosphate", "tfidf": 0.1900228933390737}, {"index": 219832, "doc_id": 21, "term": "water", "tfidf": 0.19009786544568588}, {"index": 222713, "doc_id": 22, "term": "ear", "tfidf": 0.22000345418301162}, {"index": 225884, "doc_id": 22, "term": "om", "tfidf": 0.21005293326510058}, {"index": 222986, "doc_id": 22, "term": "epithelial", "tfidf": 0.19003237651950636}, {"index": 222988, "doc_id": 22, "term": "epithelium", "tfidf": 0.1800555683728596}, {"index": 225285, "doc_id": 22, "term": "middle", "tfidf": 0.18009660537275957}, {"index": 222564, "doc_id": 22, "term": "disease mechanism", "tfidf": 0.1700187373327201}, {"index": 223495, "doc_id": 22, "term": "gene expression profile", "tfidf": 0.17005376443106326}, {"index": 225971, "doc_id": 22, "term": "original", "tfidf": 0.17006214034127018}, {"index": 229416, "doc_id": 22, "term": "underpin", "tfidf": 0.17004003289450412}, {"index": 222483, "doc_id": 22, "term": "differentiation", "tfidf": 0.16000051508049112}, {"index": 231645, "doc_id": 23, "term": "composite", "tfidf": 0.29000093273669925}, {"index": 231046, "doc_id": 23, "term": "catalyst", "tfidf": 0.23003432385739211}, {"index": 232590, "doc_id": 23, "term": "dispersion", "tfidf": 0.230027904114801}, {"index": 237930, "doc_id": 23, "term": "sa", "tfidf": 0.23006494435750713}, {"index": 235351, "doc_id": 23, "term": "ml", "tfidf": 0.19007150369408096}, {"index": 236151, "doc_id": 23, "term": "particle", "tfidf": 0.17009571438760857}, {"index": 233107, "doc_id": 23, "term": "exhibit", "tfidf": 0.16004108618763857}, {"index": 234800, "doc_id": 23, "term": "light", "tfidf": 0.1600105449481117}, {"index": 238875, "doc_id": 23, "term": "surface", "tfidf": 0.15005440297057723}, {"index": 230066, "doc_id": 23, "term": "acid", "tfidf": 0.14007894402424823}, {"index": 244197, "doc_id": 24, "term": "improvise", "tfidf": 0.25001345706224404}, {"index": 246615, "doc_id": 24, "term": "positive pressure", "tfidf": 0.2500613205236754}, {"index": 242416, "doc_id": 24, "term": "device", "tfidf": 0.2300951090588598}, {"index": 244508, "doc_id": 24, "term": "interface", "tfidf": 0.2200506990969348}, {"index": 243351, "doc_id": 24, "term": "flow rate", "tfidf": 0.17001146846045304}, {"index": 247295, "doc_id": 24, "term": "recommend use", "tfidf": 0.17007269659086657}, {"index": 246776, "doc_id": 24, "term": "pressure", "tfidf": 0.16004215608759376}, {"index": 247294, "doc_id": 24, "term": "recommend", "tfidf": 0.16007852177108958}, {"index": 243348, "doc_id": 24, "term": "flow", "tfidf": 0.15009400511622228}, {"index": 241509, "doc_id": 24, "term": "commercial", "tfidf": 0.14002045997663226}, {"index": 252692, "doc_id": 25, "term": "dub", "tfidf": 0.380071345738333}, {"index": 251355, "doc_id": 25, "term": "class enzyme", "tfidf": 0.21008265630444134}, {"index": 252963, "doc_id": 25, "term": "enzyme", "tfidf": 0.2000204230131629}, {"index": 256854, "doc_id": 25, "term": "probe", "tfidf": 0.1800901016941905}, {"index": 255413, "doc_id": 25, "term": "monitor", "tfidf": 0.1700624390140659}, {"index": 250085, "doc_id": 25, "term": "activity", "tfidf": 0.15008071119854088}, {"index": 254418, "doc_id": 25, "term": "inhibition", "tfidf": 0.1500384794692342}, {"index": 256480, "doc_id": 25, "term": "physiological", "tfidf": 0.1500582362745257}, {"index": 251354, "doc_id": 25, "term": "class", "tfidf": 0.14006667079876212}, {"index": 253515, "doc_id": 25, "term": "genetic", "tfidf": 0.14006038209841282}, {"index": 267333, "doc_id": 26, "term": "referral", "tfidf": 0.3100279096849572}, {"index": 269776, "doc_id": 26, "term": "visibility", "tfidf": 0.3000075204164096}, {"index": 266735, "doc_id": 26, "term": "preintervention", "tfidf": 0.19001008283640902}, {"index": 263512, "doc_id": 26, "term": "generate", "tfidf": 0.1800767100970404}, {"index": 266643, "doc_id": 26, "term": "postintervention", "tfidf": 0.1700901345056135}, {"index": 268015, "doc_id": 26, "term": "satisfied", "tfidf": 0.17000489133249225}, {"index": 267298, "doc_id": 26, "term": "record", "tfidf": 0.16007129187717542}, {"index": 264446, "doc_id": 26, "term": "inpatient", "tfidf": 0.15007094271411736}, {"index": 268575, "doc_id": 26, "term": "stakeholder", "tfidf": 0.15008482955041408}, {"index": 260126, "doc_id": 26, "term": "adequate", "tfidf": 0.14005617636520168}, {"index": 279868, "doc_id": 27, "term": "west", "tfidf": 0.26006724496817085}, {"index": 276498, "doc_id": 27, "term": "plane", "tfidf": 0.24009555781363634}, {"index": 274376, "doc_id": 27, "term": "infer", "tfidf": 0.23006168267841276}, {"index": 279086, "doc_id": 27, "term": "th", "tfidf": 0.21003735159508652}, {"index": 277352, "doc_id": 27, "term": "region", "tfidf": 0.2000256816045511}, {"index": 278677, "doc_id": 27, "term": "structural", "tfidf": 0.200087723456713}, {"index": 272922, "doc_id": 27, "term": "energy", "tfidf": 0.18004005936011516}, {"index": 278637, "doc_id": 27, "term": "strain", "tfidf": 0.16008306946018286}, {"index": 279327, "doc_id": 27, "term": "trend", "tfidf": 0.1600694782549695}, {"index": 272959, "doc_id": 27, "term": "environment", "tfidf": 0.15008198201142445}, {"index": 284525, "doc_id": 28, "term": "interpretability", "tfidf": 0.30005862817571927}, {"index": 282277, "doc_id": 28, "term": "deep", "tfidf": 0.2000999272399179}, {"index": 280651, "doc_id": 28, "term": "attention mechanism", "tfidf": 0.19008589987458546}, {"index": 282280, "doc_id": 28, "term": "deep neural", "tfidf": 0.19008798873211466}, {"index": 282281, "doc_id": 28, "term": "deep neural network", "tfidf": 0.19004748331567223}, {"index": 284755, "doc_id": 28, "term": "learning model", "tfidf": 0.19009820550745365}, {"index": 280788, "doc_id": 28, "term": "benchmark", "tfidf": 0.18008535836798722}, {"index": 282196, "doc_id": 28, "term": "dataset", "tfidf": 0.18001949883242782}, {"index": 286706, "doc_id": 28, "term": "prediction", "tfidf": 0.18003031293567043}, {"index": 289164, "doc_id": 28, "term": "time series", "tfidf": 0.18002127125969303}, {"index": 292282, "doc_id": 29, "term": "deescalation", "tfidf": 0.23006276564181372}, {"index": 293968, "doc_id": 29, "term": "hpv", "tfidf": 0.23009445688867497}, {"index": 290954, "doc_id": 29, "term": "cancer", "tfidf": 0.1800085213035211}, {"index": 290834, "doc_id": 29, "term": "biomolecule", "tfidf": 0.13007146906368555}, {"index": 290955, "doc_id": 29, "term": "cancer care", "tfidf": 0.13002221404015327}, {"index": 291207, "doc_id": 29, "term": "cervical", "tfidf": 0.1300094202086756}, {"index": 291208, "doc_id": 29, "term": "cervical cancer", "tfidf": 0.13002907709139752}, {"index": 291252, "doc_id": 29, "term": "checkpoint blockade", "tfidf": 0.1300038055885306}, {"index": 291825, "doc_id": 29, "term": "continuum", "tfidf": 0.13000878648269404}, {"index": 293457, "doc_id": 29, "term": "future direction", "tfidf": 0.13009227373643192}, {"index": 300286, "doc_id": 30, "term": "airport", "tfidf": 0.31008191615787045}, {"index": 304992, "doc_id": 30, "term": "malaria", "tfidf": 0.31001542689521877}, {"index": 304994, "doc_id": 30, "term": "malaria parasite", "tfidf": 0.17006582157893876}, {"index": 309658, "doc_id": 30, "term": "vector", "tfidf": 0.17009605792110333}, {"index": 301371, "doc_id": 30, "term": "climate change", "tfidf": 0.16000176679218614}, {"index": 309228, "doc_id": 30, "term": "trade", "tfidf": 0.16009069890960387}, {"index": 302434, "doc_id": 30, "term": "diagnosis treatment", "tfidf": 0.1500739440880038}, {"index": 306121, "doc_id": 30, "term": "parasite", "tfidf": 0.15007000597507952}, {"index": 301370, "doc_id": 30, "term": "climate", "tfidf": 0.14000550452758548}, {"index": 302974, "doc_id": 30, "term": "epidemiological", "tfidf": 0.13008199730644232}, {"index": 310895, "doc_id": 31, "term": "brain tumor", "tfidf": 0.32006164408420695}, {"index": 310894, "doc_id": 31, "term": "brain", "tfidf": 0.24005532485704614}, {"index": 310758, "doc_id": 31, "term": "base result", "tfidf": 0.22000826711661392}, {"index": 319356, "doc_id": 31, "term": "tumor", "tfidf": 0.21008483506154663}, {"index": 315468, "doc_id": 31, "term": "mri", "tfidf": 0.20001086607473156}, {"index": 313409, "doc_id": 31, "term": "fractal", "tfidf": 0.19006005537175846}, {"index": 314735, "doc_id": 31, "term": "layer", "tfidf": 0.19005455814173036}, {"index": 316761, "doc_id": 31, "term": "present novel", "tfidf": 0.1900031728772626}, {"index": 318118, "doc_id": 31, "term": "segmentation", "tfidf": 0.1900116106182745}, {"index": 314097, "doc_id": 31, "term": "image", "tfidf": 0.18000640578519636}, {"index": 326376, "doc_id": 32, "term": "peptide", "tfidf": 0.32003874486808154}, {"index": 320441, "doc_id": 32, "term": "antimicrobial peptide", "tfidf": 0.2600721662600817}, {"index": 321143, "doc_id": 32, "term": "cell membrane", "tfidf": 0.25009422519764424}, {"index": 320440, "doc_id": 32, "term": "antimicrobial", "tfidf": 0.24003713532416146}, {"index": 325518, "doc_id": 32, "term": "mutant", "tfidf": 0.24008736879615455}, {"index": 320336, "doc_id": 32, "term": "amino acid", "tfidf": 0.21008949664590337}, {"index": 320739, "doc_id": 32, "term": "bacterial cell", "tfidf": 0.21000097565838305}, {"index": 320335, "doc_id": 32, "term": "amino", "tfidf": 0.20006359537030072}, {"index": 325174, "doc_id": 32, "term": "membrane", "tfidf": 0.2000838579481296}, {"index": 320738, "doc_id": 32, "term": "bacterial", "tfidf": 0.19006534331925093}, {"index": 339692, "doc_id": 33, "term": "vestibular", "tfidf": 0.2600968679260199}, {"index": 335701, "doc_id": 33, "term": "noisy", "tfidf": 0.25009296033797723}, {"index": 338624, "doc_id": 33, "term": "stimulation", "tfidf": 0.22006055739369193}, {"index": 330742, "doc_id": 33, "term": "balance", "tfidf": 0.2100062761192067}, {"index": 333217, "doc_id": 33, "term": "fall", "tfidf": 0.2100816273265126}, {"index": 335876, "doc_id": 33, "term": "old adult", "tfidf": 0.1800865209352384}, {"index": 333254, "doc_id": 33, "term": "feasibility use", "tfidf": 0.15003053536245056}, {"index": 333467, "doc_id": 33, "term": "gait", "tfidf": 0.15005019413765916}, {"index": 338309, "doc_id": 33, "term": "sham", "tfidf": 0.15004777917344803}, {"index": 335875, "doc_id": 33, "term": "old", "tfidf": 0.1300353414539003}, {"index": 343539, "doc_id": 34, "term": "gh", "tfidf": 0.3400709741848578}, {"index": 345480, "doc_id": 34, "term": "mtor", "tfidf": 0.22009276679832385}, {"index": 346464, "doc_id": 34, "term": "phosphorylate", "tfidf": 0.2200669060198573}, {"index": 348408, "doc_id": 34, "term": "site", "tfidf": 0.21002908692037556}, {"index": 346465, "doc_id": 34, "term": "phosphorylation", "tfidf": 0.20006103557701752}, {"index": 346462, "doc_id": 34, "term": "phosphoproteomic", "tfidf": 0.19003447804835558}, {"index": 347388, "doc_id": 34, "term": "regulatory", "tfidf": 0.18003441295404957}, {"index": 342990, "doc_id": 34, "term": "equal", "tfidf": 0.15003920386928532}, {"index": 346957, "doc_id": 34, "term": "protein", "tfidf": 0.15003130979802834}, {"index": 341755, "doc_id": 34, "term": "consensus", "tfidf": 0.1300802871595065}, {"index": 353603, "doc_id": 35, "term": "graphene", "tfidf": 0.3900656188287999}, {"index": 356037, "doc_id": 35, "term": "oxide", "tfidf": 0.23005884583209762}, {"index": 351141, "doc_id": 35, "term": "cell line", "tfidf": 0.21001918298667802}, {"index": 354498, "doc_id": 35, "term": "interaction cell", "tfidf": 0.2100172233257333}, {"index": 351114, "doc_id": 35, "term": "cell", "tfidf": 0.19003214684948952}, {"index": 354823, "doc_id": 35, "term": "line", "tfidf": 0.18004136696673254}, {"index": 354497, "doc_id": 35, "term": "interaction", "tfidf": 0.14006958416682977}, {"index": 355061, "doc_id": 35, "term": "material", "tfidf": 0.14005229278337983}, {"index": 350638, "doc_id": 35, "term": "atp", "tfidf": 0.13003680459236752}, {"index": 351123, "doc_id": 35, "term": "cell cycle", "tfidf": 0.13001377226805733}, {"index": 365806, "doc_id": 36, "term": "object", "tfidf": 0.2900498715256253}, {"index": 368161, "doc_id": 36, "term": "sensing", "tfidf": 0.2700520310234074}, {"index": 362382, "doc_id": 36, "term": "detector", "tfidf": 0.26003973176743167}, {"index": 367477, "doc_id": 36, "term": "remote", "tfidf": 0.21002459345486688}, {"index": 361232, "doc_id": 36, "term": "channel", "tfidf": 0.19007066811834952}, {"index": 360053, "doc_id": 36, "term": "accuracy", "tfidf": 0.18007878051606122}, {"index": 368525, "doc_id": 36, "term": "speed", "tfidf": 0.1700077997753075}, {"index": 366926, "doc_id": 36, "term": "propose", "tfidf": 0.15004971896325908}, {"index": 369641, "doc_id": 36, "term": "variant", "tfidf": 0.14008705124866555}, {"index": 363530, "doc_id": 36, "term": "geometry", "tfidf": 0.13002609441780288}, {"index": 373911, "doc_id": 37, "term": "hn", "tfidf": 0.27009430834674875}, {"index": 370517, "doc_id": 37, "term": "ard", "tfidf": 0.23007279110958292}, {"index": 373912, "doc_id": 37, "term": "hn influenza", "tfidf": 0.17000287143224563}, {"index": 374935, "doc_id": 37, "term": "lung", "tfidf": 0.16005504638861373}, {"index": 375457, "doc_id": 37, "term": "mouse", "tfidf": 0.1600367937757162}, {"index": 375461, "doc_id": 37, "term": "mouse model", "tfidf": 0.1600889712702885}, {"index": 370324, "doc_id": 37, "term": "alveolar", "tfidf": 0.1500779465438076}, {"index": 378075, "doc_id": 37, "term": "sd", "tfidf": 0.14000515803600183}, {"index": 374299, "doc_id": 37, "term": "induce", "tfidf": 0.13008457987255426}, {"index": 372168, "doc_id": 37, "term": "cytokine", "tfidf": 0.12006290796587285}, {"index": 380102, "doc_id": 38, "term": "acute respiratory failure", "tfidf": 0.23007605434856349}, {"index": 387635, "doc_id": 38, "term": "respiratory failure", "tfidf": 0.19007590049025183}, {"index": 386195, "doc_id": 38, "term": "patient acute respiratory", "tfidf": 0.18003913346003944}, {"index": 389637, "doc_id": 38, "term": "variability", "tfidf": 0.17008222800422343}, {"index": 384261, "doc_id": 38, "term": "increase time", "tfidf": 0.16008147565690328}, {"index": 385951, "doc_id": 38, "term": "order", "tfidf": 0.16007667305848827}, {"index": 384093, "doc_id": 38, "term": "illness severity", "tfidf": 0.15008377106125204}, {"index": 385714, "doc_id": 38, "term": "noninvasive ventilation", "tfidf": 0.150042126970103}, {"index": 386194, "doc_id": 38, "term": "patient acute", "tfidf": 0.15009543490875943}, {"index": 382258, "doc_id": 38, "term": "decision make", "tfidf": 0.14000492045206286}, {"index": 396706, "doc_id": 39, "term": "prediction", "tfidf": 0.24006786346626938}, {"index": 394393, "doc_id": 39, "term": "influenza patient", "tfidf": 0.23007557626062133}, {"index": 393481, "doc_id": 39, "term": "gcn", "tfidf": 0.1800431280626101}, {"index": 394391, "doc_id": 39, "term": "influenza", "tfidf": 0.18001704643634553}, {"index": 396707, "doc_id": 39, "term": "prediction model", "tfidf": 0.18008835620469268}, {"index": 395144, "doc_id": 39, "term": "medical institution", "tfidf": 0.17006771163401227}, {"index": 393352, "doc_id": 39, "term": "flu", "tfidf": 0.16003362527712353}, {"index": 393696, "doc_id": 39, "term": "health authority", "tfidf": 0.16001190205269844}, {"index": 393348, "doc_id": 39, "term": "flow", "tfidf": 0.15003975619404317}, {"index": 390679, "doc_id": 39, "term": "authority", "tfidf": 0.14005048162779182}, {"index": 404789, "doc_id": 40, "term": "license", "tfidf": 0.21008759155024895}, {"index": 400391, "doc_id": 40, "term": "animal", "tfidf": 0.20000925142025816}, {"index": 409604, "doc_id": 40, "term": "vaccine", "tfidf": 0.20009719780667543}, {"index": 403998, "doc_id": 40, "term": "human vaccine", "tfidf": 0.18002736937705016}, {"index": 407127, "doc_id": 40, "term": "rabie", "tfidf": 0.18001168824745614}, {"index": 400208, "doc_id": 40, "term": "affordable", "tfidf": 0.17001693753451244}, {"index": 405689, "doc_id": 40, "term": "nile virus", "tfidf": 0.1700216067989191}, {"index": 409870, "doc_id": 40, "term": "west nile virus", "tfidf": 0.17009403024946002}, {"index": 405688, "doc_id": 40, "term": "nile", "tfidf": 0.16007926138530656}, {"index": 409869, "doc_id": 40, "term": "west nile", "tfidf": 0.1600240106967508}, {"index": 418405, "doc_id": 41, "term": "sirt", "tfidf": 0.3100517040347981}, {"index": 410082, "doc_id": 41, "term": "activator", "tfidf": 0.28006278527415474}, {"index": 411739, "doc_id": 41, "term": "conformational", "tfidf": 0.22007813828077516}, {"index": 417896, "doc_id": 41, "term": "rotation", "tfidf": 0.2200610260164435}, {"index": 412243, "doc_id": 41, "term": "deacetylation", "tfidf": 0.21008475487434075}, {"index": 410807, "doc_id": 41, "term": "bind", "tfidf": 0.17006389170484817}, {"index": 410085, "doc_id": 41, "term": "activity", "tfidf": 0.14006594487601157}, {"index": 411048, "doc_id": 41, "term": "catalytic activity", "tfidf": 0.13001413077147897}, {"index": 411834, "doc_id": 41, "term": "contribute increase", "tfidf": 0.13004010141310918}, {"index": 412242, "doc_id": 41, "term": "deacetylase", "tfidf": 0.13006618526387853}, {"index": 426442, "doc_id": 42, "term": "pf", "tfidf": 0.27009780129407746}, {"index": 420517, "doc_id": 42, "term": "ard", "tfidf": 0.2400477818483358}, {"index": 421436, "doc_id": 42, "term": "cmho", "tfidf": 0.24007224505093133}, {"index": 423936, "doc_id": 42, "term": "hospital mortality", "tfidf": 0.21001801916979065}, {"index": 427211, "doc_id": 42, "term": "ratio", "tfidf": 0.20006070811729867}, {"index": 420668, "doc_id": 42, "term": "auc", "tfidf": 0.19006960325247213}, {"index": 427287, "doc_id": 42, "term": "reclassify", "tfidf": 0.1700329928131525}, {"index": 425386, "doc_id": 42, "term": "moderate", "tfidf": 0.14001757699422965}, {"index": 421322, "doc_id": 42, "term": "ci", "tfidf": 0.13005927082694077}, {"index": 428294, "doc_id": 42, "term": "severity", "tfidf": 0.13002398490776987}, {"index": 439595, "doc_id": 43, "term": "uv", "tfidf": 0.21008817078319575}, {"index": 431371, "doc_id": 43, "term": "climate change", "tfidf": 0.16007167465256916}, {"index": 439861, "doc_id": 43, "term": "weekly", "tfidf": 0.15009198914790617}, {"index": 431370, "doc_id": 43, "term": "climate", "tfidf": 0.140097490341506}, {"index": 434275, "doc_id": 43, "term": "index", "tfidf": 0.1400373878101339}, {"index": 432960, "doc_id": 43, "term": "environmental", "tfidf": 0.13007200492185794}, {"index": 439042, "doc_id": 43, "term": "temperature", "tfidf": 0.13004673111980358}, {"index": 430624, "doc_id": 43, "term": "association", "tfidf": 0.12009665719212907}, {"index": 435858, "doc_id": 43, "term": "occurrence", "tfidf": 0.12005118585400582}, {"index": 430625, "doc_id": 43, "term": "association acute", "tfidf": 0.11004820732715538}, {"index": 445303, "doc_id": 44, "term": "milk", "tfidf": 0.40004914464120334}, {"index": 447220, "doc_id": 44, "term": "raw", "tfidf": 0.27002469731699547}, {"index": 440673, "doc_id": 44, "term": "aureus", "tfidf": 0.2500983144292955}, {"index": 445450, "doc_id": 44, "term": "mother", "tfidf": 0.23009785582791092}, {"index": 448078, "doc_id": 44, "term": "se", "tfidf": 0.23003716605264934}, {"index": 441441, "doc_id": 44, "term": "cns", "tfidf": 0.22003549728820712}, {"index": 441664, "doc_id": 44, "term": "concentration", "tfidf": 0.19008855600028465}, {"index": 446729, "doc_id": 44, "term": "pregnancy", "tfidf": 0.19000468094008763}, {"index": 443983, "doc_id": 44, "term": "human", "tfidf": 0.17007229840615543}, {"index": 447322, "doc_id": 44, "term": "reduce risk", "tfidf": 0.17007379277284718}, {"index": 456126, "doc_id": 45, "term": "parent", "tfidf": 0.23009514983624868}, {"index": 456129, "doc_id": 45, "term": "parental", "tfidf": 0.19003699350641404}, {"index": 456880, "doc_id": 45, "term": "program", "tfidf": 0.18007103426999024}, {"index": 450143, "doc_id": 45, "term": "administration", "tfidf": 0.1700332663414629}, {"index": 450499, "doc_id": 45, "term": "appreciate", "tfidf": 0.17001407252782744}, {"index": 452942, "doc_id": 45, "term": "enrolment", "tfidf": 0.1700817024727676}, {"index": 451505, "doc_id": 45, "term": "comfort", "tfidf": 0.16003266230369453}, {"index": 456148, "doc_id": 45, "term": "participate", "tfidf": 0.16008690673316944}, {"index": 450630, "doc_id": 45, "term": "asthma", "tfidf": 0.15002635575321235}, {"index": 452748, "doc_id": 45, "term": "ed", "tfidf": 0.15001414136282237}, {"index": 468340, "doc_id": 46, "term": "signature", "tfidf": 0.31004191696716676}, {"index": 469975, "doc_id": 46, "term": "yield", "tfidf": 0.23000298455252952}, {"index": 468162, "doc_id": 46, "term": "sensitive", "tfidf": 0.22004163856516157}, {"index": 465221, "doc_id": 46, "term": "method collect", "tfidf": 0.1900710778057379}, {"index": 465701, "doc_id": 46, "term": "noisy", "tfidf": 0.1900451754500407}, {"index": 466392, "doc_id": 46, "term": "performance", "tfidf": 0.19008583465789805}, {"index": 468024, "doc_id": 46, "term": "scalable", "tfidf": 0.19009846165673602}, {"index": 468387, "doc_id": 46, "term": "simulated", "tfidf": 0.19002153207746672}, {"index": 469572, "doc_id": 46, "term": "use tailor", "tfidf": 0.19005610634302586}, {"index": 469648, "doc_id": 46, "term": "various type", "tfidf": 0.19004405768683333}, {"index": 475327, "doc_id": 47, "term": "mirp", "tfidf": 0.27007927349604594}, {"index": 475325, "doc_id": 47, "term": "mirna", "tfidf": 0.2600931265291772}, {"index": 472062, "doc_id": 47, "term": "cpv", "tfidf": 0.23003717202533336}, {"index": 479005, "doc_id": 47, "term": "target gene", "tfidf": 0.2200072919425232}, {"index": 473491, "doc_id": 47, "term": "gene", "tfidf": 0.17003838651975484}, {"index": 470828, "doc_id": 47, "term": "biological process", "tfidf": 0.15005279902881147}, {"index": 472936, "doc_id": 47, "term": "enrichment", "tfidf": 0.150043948402228}, {"index": 479002, "doc_id": 47, "term": "target", "tfidf": 0.14009787243206692}, {"index": 470826, "doc_id": 47, "term": "biological", "tfidf": 0.130019367643916}, {"index": 472483, "doc_id": 47, "term": "differentiation", "tfidf": 0.13007860264677032}, {"index": 483543, "doc_id": 48, "term": "gl", "tfidf": 0.2500500233853234}, {"index": 486902, "doc_id": 48, "term": "promoter", "tfidf": 0.22009718486335372}, {"index": 483167, "doc_id": 48, "term": "extracellular", "tfidf": 0.20005641196450408}, {"index": 483805, "doc_id": 48, "term": "hepatocyte", "tfidf": 0.20004381075268413}, {"index": 486904, "doc_id": 48, "term": "promoter sequence", "tfidf": 0.20005013838560615}, {"index": 480816, "doc_id": 48, "term": "binding", "tfidf": 0.19005148539937847}, {"index": 488232, "doc_id": 48, "term": "serum level", "tfidf": 0.1900889314057983}, {"index": 480480, "doc_id": 48, "term": "apoptosis", "tfidf": 0.16001113325214364}, {"index": 488227, "doc_id": 48, "term": "serum", "tfidf": 0.16005185402654262}, {"index": 484433, "doc_id": 48, "term": "injury", "tfidf": 0.15006355003365}, {"index": 492797, "doc_id": 49, "term": "ehealth", "tfidf": 0.7300090220171548}, {"index": 495884, "doc_id": 49, "term": "om", "tfidf": 0.3300383495845107}, {"index": 499831, "doc_id": 49, "term": "wat", "tfidf": 0.33008021388020164}, {"index": 495621, "doc_id": 49, "term": "net", "tfidf": 0.280086981601175}, {"index": 490291, "doc_id": 49, "term": "al", "tfidf": 0.27002345223790025}, {"index": 492453, "doc_id": 49, "term": "die", "tfidf": 0.22003283870974055}, {"index": 495164, "doc_id": 49, "term": "meet", "tfidf": 0.20001696393413115}, {"index": 490000, "doc_id": 49, "term": "aa", "tfidf": 6.611754016523561e-05}, {"index": 490001, "doc_id": 49, "term": "ab", "tfidf": 3.9947814918690555e-05}, {"index": 490002, "doc_id": 49, "term": "abbott", "tfidf": 8.26819734932639e-06}, {"index": 503799, "doc_id": 50, "term": "hepatitis", "tfidf": 0.21000712325077492}, {"index": 503822, "doc_id": 50, "term": "hfmd", "tfidf": 0.21001861909772032}, {"index": 502706, "doc_id": 50, "term": "dysentery", "tfidf": 0.18009764595075284}, {"index": 503884, "doc_id": 50, "term": "highrisk", "tfidf": 0.17006866158233463}, {"index": 504206, "doc_id": 50, "term": "incidence", "tfidf": 0.17006314039044462}, {"index": 509000, "doc_id": 50, "term": "tap", "tfidf": 0.1700565638130598}, {"index": 502557, "doc_id": 50, "term": "disease hfmd", "tfidf": 0.15003461584951783}, {"index": 504208, "doc_id": 50, "term": "incidence rate", "tfidf": 0.15005212580739274}, {"index": 508499, "doc_id": 50, "term": "spatiotemporal distribution", "tfidf": 0.1500290427394382}, {"index": 503836, "doc_id": 50, "term": "high incidence rate", "tfidf": 0.14004242724917473}, {"index": 515873, "doc_id": 51, "term": "oi", "tfidf": 0.37003969277318566}, {"index": 517931, "doc_id": 51, "term": "sac", "tfidf": 0.2800938005357515}, {"index": 517014, "doc_id": 51, "term": "provisional", "tfidf": 0.2700280925646914}, {"index": 514837, "doc_id": 51, "term": "list", "tfidf": 0.2500505802499047}, {"index": 515934, "doc_id": 51, "term": "opportunistic", "tfidf": 0.18009965344970616}, {"index": 515060, "doc_id": 51, "term": "match", "tfidf": 0.16001474711306377}, {"index": 518502, "doc_id": 51, "term": "specialist", "tfidf": 0.1600861962831235}, {"index": 517754, "doc_id": 51, "term": "retrieve", "tfidf": 0.15005009524461368}, {"index": 511755, "doc_id": 51, "term": "consensus", "tfidf": 0.14002163019724934}, {"index": 517366, "doc_id": 51, "term": "registry", "tfidf": 0.14009096616394298}, {"index": 526026, "doc_id": 52, "term": "overweight", "tfidf": 0.2400012836904421}, {"index": 521932, "doc_id": 52, "term": "cost", "tfidf": 0.20000123921924143}, {"index": 526027, "doc_id": 52, "term": "overweight obesity", "tfidf": 0.20002484621305}, {"index": 527656, "doc_id": 52, "term": "respondent", "tfidf": 0.20009066140532697}, {"index": 523755, "doc_id": 52, "term": "healthrelate quality", "tfidf": 0.19005585605440353}, {"index": 523756, "doc_id": 52, "term": "healthrelate quality life", "tfidf": 0.19005463974525083}, {"index": 525804, "doc_id": 52, "term": "obesity", "tfidf": 0.19000801043902996}, {"index": 523754, "doc_id": 52, "term": "healthrelate", "tfidf": 0.1700594904885918}, {"index": 522755, "doc_id": 52, "term": "education level", "tfidf": 0.14003882764739234}, {"index": 523746, "doc_id": 52, "term": "healthcare cost", "tfidf": 0.14006141154181412}, {"index": 534864, "doc_id": 53, "term": "lnps", "tfidf": 0.32001230039140793}, {"index": 534863, "doc_id": 53, "term": "lnp", "tfidf": 0.30007274131585665}, {"index": 534831, "doc_id": 53, "term": "lipid", "tfidf": 0.2600596325695188}, {"index": 531309, "doc_id": 53, "term": "cholesterol", "tfidf": 0.23001891913253328}, {"index": 535469, "doc_id": 53, "term": "mrna", "tfidf": 0.18007777565382974}, {"index": 531643, "doc_id": 53, "term": "component", "tfidf": 0.13006871899928438}, {"index": 532309, "doc_id": 53, "term": "delivery", "tfidf": 0.13007476317586025}, {"index": 538875, "doc_id": 53, "term": "surface", "tfidf": 0.13004293086022228}, {"index": 530927, "doc_id": 53, "term": "buffer", "tfidf": 0.12000428675249934}, {"index": 531059, "doc_id": 53, "term": "cationic", "tfidf": 0.12001312456393305}, {"index": 543798, "doc_id": 54, "term": "hepatic", "tfidf": 0.21008335199073536}, {"index": 549356, "doc_id": 54, "term": "tumor", "tfidf": 0.200077784774501}, {"index": 540792, "doc_id": 54, "term": "benign", "tfidf": 0.19009371542507245}, {"index": 543681, "doc_id": 54, "term": "hcc", "tfidf": 0.19008448704736158}, {"index": 544852, "doc_id": 54, "term": "liver", "tfidf": 0.18001930612880784}, {"index": 544859, "doc_id": 54, "term": "liver tumor", "tfidf": 0.16006435101597588}, {"index": 545004, "doc_id": 54, "term": "malignant", "tfidf": 0.16006526895831766}, {"index": 544246, "doc_id": 54, "term": "increase incidence", "tfidf": 0.15002057412516492}, {"index": 544853, "doc_id": 54, "term": "liver disease", "tfidf": 0.15000738133670677}, {"index": 543191, "doc_id": 54, "term": "fact", "tfidf": 0.13009976953059943}, {"index": 558178, "doc_id": 55, "term": "sentinel", "tfidf": 0.2800523144421783}, {"index": 551422, "doc_id": 55, "term": "clone", "tfidf": 0.24006904564475415}, {"index": 551421, "doc_id": 55, "term": "clonal cell", "tfidf": 0.23000019962665658}, {"index": 556832, "doc_id": 55, "term": "primary tumor", "tfidf": 0.2300625550444745}, {"index": 551420, "doc_id": 55, "term": "clonal", "tfidf": 0.21004372559598292}, {"index": 559356, "doc_id": 55, "term": "tumor", "tfidf": 0.21000121278305875}, {"index": 553118, "doc_id": 55, "term": "expand", "tfidf": 0.1900211478247516}, {"index": 553119, "doc_id": 55, "term": "expand clone", "tfidf": 0.18003312319704007}, {"index": 551114, "doc_id": 55, "term": "cell", "tfidf": 0.17004516378911977}, {"index": 550905, "doc_id": 55, "term": "breast", "tfidf": 0.16007568177278284}, {"index": 569634, "doc_id": 56, "term": "vap", "tfidf": 0.2700539446142732}, {"index": 564433, "doc_id": 56, "term": "injury", "tfidf": 0.21000906349865428}, {"index": 569291, "doc_id": 56, "term": "trauma", "tfidf": 0.20004187731619766}, {"index": 569672, "doc_id": 56, "term": "ventilatorassociate", "tfidf": 0.19008391146800632}, {"index": 569673, "doc_id": 56, "term": "ventilatorassociate pneumonia", "tfidf": 0.19006070319053814}, {"index": 569262, "doc_id": 56, "term": "transfusion", "tfidf": 0.18005123238625928}, {"index": 569294, "doc_id": 56, "term": "trauma patient", "tfidf": 0.18009282162772716}, {"index": 564764, "doc_id": 56, "term": "length stay", "tfidf": 0.17006991976785327}, {"index": 560096, "doc_id": 56, "term": "acute kidney", "tfidf": 0.15004566942377567}, {"index": 560097, "doc_id": 56, "term": "acute kidney injury", "tfidf": 0.1500521728072668}, {"index": 575775, "doc_id": 57, "term": "nucleoside analogue", "tfidf": 0.3000874616476325}, {"index": 575774, "doc_id": 57, "term": "nucleoside", "tfidf": 0.27008894541883205}, {"index": 570344, "doc_id": 57, "term": "analogue", "tfidf": 0.25008829287928286}, {"index": 571647, "doc_id": 57, "term": "compound", "tfidf": 0.23003410287517342}, {"index": 577465, "doc_id": 57, "term": "remain topic", "tfidf": 0.18007184719071254}, {"index": 570239, "doc_id": 57, "term": "agent", "tfidf": 0.17007354622238605}, {"index": 572532, "doc_id": 57, "term": "discuss recent", "tfidf": 0.17003426318132867}, {"index": 573330, "doc_id": 57, "term": "firstline treatment", "tfidf": 0.17002299534043766}, {"index": 577828, "doc_id": 57, "term": "ring", "tfidf": 0.17004899877694965}, {"index": 572411, "doc_id": 57, "term": "development new", "tfidf": 0.16002842040459958}, {"index": 582567, "doc_id": 58, "term": "disease pandemic", "tfidf": 0.5300452413401733}, {"index": 586497, "doc_id": 58, "term": "plan", "tfidf": 0.3900995102979621}, {"index": 584371, "doc_id": 58, "term": "infectious disease", "tfidf": 0.3600589747400476}, {"index": 582257, "doc_id": 58, "term": "decision", "tfidf": 0.3500489378248126}, {"index": 584368, "doc_id": 58, "term": "infectious", "tfidf": 0.31003582764990223}, {"index": 582529, "doc_id": 58, "term": "discuss", "tfidf": 0.2900566310642536}, {"index": 580347, "doc_id": 58, "term": "analysis", "tfidf": 0.20002838335711}, {"index": 586062, "doc_id": 58, "term": "pandemic", "tfidf": 0.20006892766178994}, {"index": 582534, "doc_id": 58, "term": "disease", "tfidf": 0.1700663316279439}, {"index": 589508, "doc_id": 58, "term": "use", "tfidf": 0.14007609547577182}, {"index": 599976, "doc_id": 59, "term": "yoga", "tfidf": 0.24006945565932108}, {"index": 590031, "doc_id": 59, "term": "accentuate", "tfidf": 0.17007347887416585}, {"index": 590689, "doc_id": 59, "term": "autonomic", "tfidf": 0.17003918567552184}, {"index": 599977, "doc_id": 59, "term": "yogas", "tfidf": 0.17009636443334883}, {"index": 592306, "doc_id": 59, "term": "delineate", "tfidf": 0.1600314525835348}, {"index": 592982, "doc_id": 59, "term": "epigenetic", "tfidf": 0.16007187612271892}, {"index": 595598, "doc_id": 59, "term": "negative emotion", "tfidf": 0.16001935281106938}, {"index": 598661, "doc_id": 59, "term": "stress", "tfidf": 0.15004262414767006}, {"index": 592865, "doc_id": 59, "term": "emotion", "tfidf": 0.1400415961685046}, {"index": 593515, "doc_id": 59, "term": "genetic", "tfidf": 0.14007999343360272}, {"index": 603905, "doc_id": 60, "term": "hiv infection", "tfidf": 0.3100530378668235}, {"index": 601101, "doc_id": 60, "term": "cd", "tfidf": 0.2900785163011067}, {"index": 603904, "doc_id": 60, "term": "hiv", "tfidf": 0.24004197004318428}, {"index": 607384, "doc_id": 60, "term": "regulate", "tfidf": 0.16005904646613203}, {"index": 600081, "doc_id": 60, "term": "activation", "tfidf": 0.15001503538539995}, {"index": 608337, "doc_id": 60, "term": "signal", "tfidf": 0.15001031589854957}, {"index": 607887, "doc_id": 60, "term": "role", "tfidf": 0.14003886307364194}, {"index": 600130, "doc_id": 60, "term": "adhesion", "tfidf": 0.13002371755816416}, {"index": 601107, "doc_id": 60, "term": "cd lymphocyte", "tfidf": 0.130048028463606}, {"index": 601115, "doc_id": 60, "term": "cell activation", "tfidf": 0.13001573651187334}, {"index": 614391, "doc_id": 61, "term": "influenza", "tfidf": 0.22002980764448984}, {"index": 618794, "doc_id": 61, "term": "subject die", "tfidf": 0.2100271138097089}, {"index": 612970, "doc_id": 61, "term": "epidemic", "tfidf": 0.19002281153400197}, {"index": 611311, "doc_id": 61, "term": "chronic", "tfidf": 0.1800911624708638}, {"index": 619861, "doc_id": 61, "term": "weekly", "tfidf": 0.1800305515518516}, {"index": 612245, "doc_id": 61, "term": "death", "tfidf": 0.17006898327569625}, {"index": 618793, "doc_id": 61, "term": "subject", "tfidf": 0.1700395223647775}, {"index": 610517, "doc_id": 61, "term": "ard", "tfidf": 0.16003898249847237}, {"index": 611893, "doc_id": 61, "term": "coronary", "tfidf": 0.16008952348033298}, {"index": 619962, "doc_id": 61, "term": "year old", "tfidf": 0.15000803800932816}, {"index": 620821, "doc_id": 62, "term": "biochemically", "tfidf": 0.22001635791177948}, {"index": 624618, "doc_id": 62, "term": "isotype", "tfidf": 0.22000318505479277}, {"index": 625092, "doc_id": 62, "term": "mean ci", "tfidf": 0.2200885573701199}, {"index": 620683, "doc_id": 62, "term": "autoantibody", "tfidf": 0.2100895085508956}, {"index": 622291, "doc_id": 62, "term": "definite", "tfidf": 0.21000471367998033}, {"index": 620255, "doc_id": 62, "term": "aid", "tfidf": 0.20002449599237546}, {"index": 627948, "doc_id": 62, "term": "sample", "tfidf": 0.20005322180539972}, {"index": 620416, "doc_id": 62, "term": "antibodie", "tfidf": 0.19000774526202574}, {"index": 622837, "doc_id": 62, "term": "elisa", "tfidf": 0.18007384380191316}, {"index": 626531, "doc_id": 62, "term": "plus", "tfidf": 0.18003625386871386}, {"index": 634392, "doc_id": 63, "term": "influenza pandemic", "tfidf": 0.32000845078316714}, {"index": 632741, "doc_id": 63, "term": "economic impact", "tfidf": 0.2600892474687048}, {"index": 634391, "doc_id": 63, "term": "influenza", "tfidf": 0.2500528781129438}, {"index": 632638, "doc_id": 63, "term": "dollar", "tfidf": 0.22008314382973232}, {"index": 636076, "doc_id": 63, "term": "pandemic influenza", "tfidf": 0.2200162776882678}, {"index": 631932, "doc_id": 63, "term": "cost", "tfidf": 0.21009559716556991}, {"index": 632471, "doc_id": 63, "term": "different scenario", "tfidf": 0.2100941089496476}, {"index": 630805, "doc_id": 63, "term": "billion", "tfidf": 0.20000414593562146}, {"index": 630645, "doc_id": 63, "term": "attack", "tfidf": 0.1800394903776531}, {"index": 634148, "doc_id": 63, "term": "impact pandemic", "tfidf": 0.18007229892438625}, {"index": 648909, "doc_id": 64, "term": "susceptibility", "tfidf": 0.25004417465736545}, {"index": 640176, "doc_id": 64, "term": "advanced age", "tfidf": 0.19007192659883648}, {"index": 643140, "doc_id": 64, "term": "explain", "tfidf": 0.17005710919419043}, {"index": 649721, "doc_id": 64, "term": "viral replication", "tfidf": 0.17008584188674372}, {"index": 644391, "doc_id": 64, "term": "influenza", "tfidf": 0.16007765371142937}, {"index": 647609, "doc_id": 64, "term": "resilience", "tfidf": 0.1600768469630556}, {"index": 649641, "doc_id": 64, "term": "variant", "tfidf": 0.16001116078680583}, {"index": 643951, "doc_id": 64, "term": "host", "tfidf": 0.1500287011851875}, {"index": 645804, "doc_id": 64, "term": "obesity", "tfidf": 0.15003130494274441}, {"index": 640175, "doc_id": 64, "term": "advanced", "tfidf": 0.1400359202348478}, {"index": 658878, "doc_id": 65, "term": "surfactant", "tfidf": 0.35009126429192533}, {"index": 656743, "doc_id": 65, "term": "preparation", "tfidf": 0.2700453757638537}, {"index": 655613, "doc_id": 65, "term": "neonatal", "tfidf": 0.2600407972865281}, {"index": 650721, "doc_id": 65, "term": "baby", "tfidf": 0.23006523733505763}, {"index": 657224, "doc_id": 65, "term": "rd", "tfidf": 0.22004139504009793}, {"index": 655562, "doc_id": 65, "term": "natural", "tfidf": 0.17009782498582612}, {"index": 652649, "doc_id": 65, "term": "dose", "tfidf": 0.16009697323984404}, {"index": 654749, "doc_id": 65, "term": "leak", "tfidf": 0.15000141070747028}, {"index": 655446, "doc_id": 65, "term": "mortality reduce", "tfidf": 0.1500152205183407}, {"index": 657501, "doc_id": 65, "term": "replacement therapy", "tfidf": 0.15002095449191488}, {"index": 669910, "doc_id": 66, "term": "women", "tfidf": 0.2500060868026136}, {"index": 664552, "doc_id": 66, "term": "intimate", "tfidf": 0.23007981725292598}, {"index": 664553, "doc_id": 66, "term": "intimate partner", "tfidf": 0.23006445676010584}, {"index": 666161, "doc_id": 66, "term": "partner", "tfidf": 0.18003966543163558}, {"index": 668570, "doc_id": 66, "term": "stage", "tfidf": 0.17009414432479675}, {"index": 669901, "doc_id": 66, "term": "woman", "tfidf": 0.17008530022591056}, {"index": 660782, "doc_id": 66, "term": "behavioural", "tfidf": 0.1600137547565217}, {"index": 661752, "doc_id": 66, "term": "consciousness", "tfidf": 0.160050642757951}, {"index": 669705, "doc_id": 66, "term": "violence", "tfidf": 0.1600965685111218}, {"index": 661227, "doc_id": 66, "term": "change", "tfidf": 0.15009422204980855}, {"index": 672637, "doc_id": 67, "term": "dog", "tfidf": 0.34002222483212946}, {"index": 679939, "doc_id": 67, "term": "wound", "tfidf": 0.2400787028074781}, {"index": 671584, "doc_id": 67, "term": "compare previously", "tfidf": 0.22003264431356861}, {"index": 672699, "doc_id": 67, "term": "duration surgery", "tfidf": 0.22005658372837536}, {"index": 679031, "doc_id": 67, "term": "technique", "tfidf": 0.2000375893200262}, {"index": 676815, "doc_id": 67, "term": "previously report", "tfidf": 0.1900566719950605}, {"index": 672696, "doc_id": 67, "term": "duration", "tfidf": 0.18009351201664747}, {"index": 676809, "doc_id": 67, "term": "previously", "tfidf": 0.1800751267907802}, {"index": 675323, "doc_id": 67, "term": "minute", "tfidf": 0.17003312755750952}, {"index": 671636, "doc_id": 67, "term": "complication", "tfidf": 0.16005079217604554}, {"index": 681512, "doc_id": 68, "term": "commission", "tfidf": 0.27001637770366393}, {"index": 685767, "doc_id": 68, "term": "nuclear", "tfidf": 0.23007196900423366}, {"index": 685155, "doc_id": 68, "term": "medicine", "tfidf": 0.20008319321778906}, {"index": 685684, "doc_id": 68, "term": "nhs", "tfidf": 0.20000153056035286}, {"index": 683190, "doc_id": 68, "term": "facility", "tfidf": 0.19007270508380594}, {"index": 681404, "doc_id": 68, "term": "clinical study", "tfidf": 0.1700372178920913}, {"index": 689378, "doc_id": 68, "term": "uk", "tfidf": 0.16004422215758402}, {"index": 687267, "doc_id": 68, "term": "recent", "tfidf": 0.1300034017258523}, {"index": 681373, "doc_id": 68, "term": "clinical", "tfidf": 0.1200451128457498}, {"index": 683901, "doc_id": 68, "term": "historically", "tfidf": 0.1200076375488986}, {"index": 699282, "doc_id": 69, "term": "transplant", "tfidf": 0.49000804316377616}, {"index": 691529, "doc_id": 69, "term": "community", "tfidf": 0.2600871216484708}, {"index": 695981, "doc_id": 69, "term": "outbreak novel", "tfidf": 0.2600130132848669}, {"index": 699283, "doc_id": 69, "term": "transplant patient", "tfidf": 0.26001217262895443}, {"index": 690430, "doc_id": 69, "term": "anticipate", "tfidf": 0.23007119861865374}, {"index": 694154, "doc_id": 69, "term": "imperative", "tfidf": 0.22005631200078324}, {"index": 699285, "doc_id": 69, "term": "transplantation", "tfidf": 0.22004558265669127}, {"index": 694145, "doc_id": 69, "term": "impact", "tfidf": 0.21005323199120354}, {"index": 693076, "doc_id": 69, "term": "evolve", "tfidf": 0.19002780922718535}, {"index": 694042, "doc_id": 69, "term": "identification", "tfidf": 0.19006995133374874}, {"index": 700375, "doc_id": 70, "term": "anastomosis", "tfidf": 0.36003500785379045}, {"index": 707210, "doc_id": 70, "term": "rating scale", "tfidf": 0.2100152099348082}, {"index": 707209, "doc_id": 70, "term": "rating", "tfidf": 0.2000777561798374}, {"index": 702153, "doc_id": 70, "term": "cut", "tfidf": 0.19002010252232385}, {"index": 702921, "doc_id": 70, "term": "endtoend", "tfidf": 0.19006896779825702}, {"index": 708025, "doc_id": 70, "term": "scale", "tfidf": 0.18005651628476305}, {"index": 701430, "doc_id": 70, "term": "closure", "tfidf": 0.17001690686742474}, {"index": 706542, "doc_id": 70, "term": "point", "tfidf": 0.15006050815029906}, {"index": 705364, "doc_id": 70, "term": "model", "tfidf": 0.1400032862722976}, {"index": 703134, "doc_id": 70, "term": "expert", "tfidf": 0.13000379959879196}, {"index": 715265, "doc_id": 71, "term": "mgl", "tfidf": 0.26004587327049755}, {"index": 716365, "doc_id": 71, "term": "penicillin", "tfidf": 0.2600706152338498}, {"index": 717610, "doc_id": 71, "term": "resistance", "tfidf": 0.25003026722714444}, {"index": 714612, "doc_id": 71, "term": "isolate", "tfidf": 0.2400263113717416}, {"index": 710675, "doc_id": 71, "term": "australia", "tfidf": 0.2300422611936794}, {"index": 717477, "doc_id": 71, "term": "remote", "tfidf": 0.23001277245138765}, {"index": 710720, "doc_id": 71, "term": "azithromycin", "tfidf": 0.22004129085324492}, {"index": 715557, "doc_id": 71, "term": "nationally", "tfidf": 0.22000272139178104}, {"index": 711334, "doc_id": 71, "term": "ciprofloxacin", "tfidf": 0.19004216244454322}, {"index": 714647, "doc_id": 71, "term": "jurisdiction", "tfidf": 0.18002351768200806}, {"index": 720447, "doc_id": 72, "term": "antiplatelet therapy", "tfidf": 0.2300767151570731}, {"index": 720446, "doc_id": 72, "term": "antiplatelet", "tfidf": 0.2200294187360329}, {"index": 723403, "doc_id": 72, "term": "formulation", "tfidf": 0.20000579090580348}, {"index": 720066, "doc_id": 72, "term": "acid", "tfidf": 0.19001112624301422}, {"index": 727330, "doc_id": 72, "term": "reference formulation", "tfidf": 0.19005437836420558}, {"index": 722689, "doc_id": 72, "term": "dual", "tfidf": 0.18004258842329945}, {"index": 720668, "doc_id": 72, "term": "auc", "tfidf": 0.17007081235816462}, {"index": 721345, "doc_id": 72, "term": "cis", "tfidf": 0.16004592187610758}, {"index": 725261, "doc_id": 72, "term": "mg", "tfidf": 0.160081749068164}, {"index": 721296, "doc_id": 72, "term": "chinese", "tfidf": 0.15001439478517148}, {"index": 739284, "doc_id": 73, "term": "transplant recipient", "tfidf": 0.2000663430360926}, {"index": 737285, "doc_id": 73, "term": "recipient", "tfidf": 0.18008547353211607}, {"index": 737914, "doc_id": 73, "term": "rtpcr", "tfidf": 0.18003016090764706}, {"index": 739282, "doc_id": 73, "term": "transplant", "tfidf": 0.18002869037096952}, {"index": 737844, "doc_id": 73, "term": "risk factor associate", "tfidf": 0.17009164113492473}, {"index": 738211, "doc_id": 73, "term": "serological", "tfidf": 0.1700346273855107}, {"index": 734332, "doc_id": 73, "term": "infection confirm", "tfidf": 0.16009274587152475}, {"index": 737916, "doc_id": 73, "term": "rtpcr confirm", "tfidf": 0.150093561649813}, {"index": 730001, "doc_id": 73, "term": "ab", "tfidf": 0.14004923389794383}, {"index": 730416, "doc_id": 73, "term": "antibodie", "tfidf": 0.1400314769950335}, {"index": 742737, "doc_id": 74, "term": "ecmo", "tfidf": 0.25008686575684536}, {"index": 749843, "doc_id": 74, "term": "weaning", "tfidf": 0.1700345584989631}, {"index": 749138, "doc_id": 74, "term": "thrombocytopenia", "tfidf": 0.1600856015326243}, {"index": 744156, "doc_id": 74, "term": "implantation", "tfidf": 0.15005259489555456}, {"index": 744423, "doc_id": 74, "term": "inhospital mortality", "tfidf": 0.14003520951910395}, {"index": 745510, "doc_id": 74, "term": "multivariate", "tfidf": 0.14001895820257415}, {"index": 744422, "doc_id": 74, "term": "inhospital", "tfidf": 0.13000270046521167}, {"index": 745439, "doc_id": 74, "term": "mortality", "tfidf": 0.12005035319309401}, {"index": 747369, "doc_id": 74, "term": "regression analysis", "tfidf": 0.12004908977150949}, {"index": 746352, "doc_id": 74, "term": "pediatric", "tfidf": 0.11005622041357002}, {"index": 754702, "doc_id": 75, "term": "laparoscopic", "tfidf": 0.26001530295134667}, {"index": 751579, "doc_id": 75, "term": "compare open", "tfidf": 0.21005646071682235}, {"index": 750477, "doc_id": 75, "term": "apical", "tfidf": 0.20004858543140677}, {"index": 750755, "doc_id": 75, "term": "base finding", "tfidf": 0.20005650550310083}, {"index": 753570, "doc_id": 75, "term": "goldstandard treatment", "tfidf": 0.2000661329626851}, {"index": 754581, "doc_id": 75, "term": "invasive surgery", "tfidf": 0.20004762634175038}, {"index": 755313, "doc_id": 75, "term": "minimally invasive surgery", "tfidf": 0.20005576108292042}, {"index": 758611, "doc_id": 75, "term": "steep", "tfidf": 0.2000085414271786}, {"index": 753466, "doc_id": 75, "term": "gain popularity", "tfidf": 0.1900460556023408}, {"index": 753569, "doc_id": 75, "term": "goldstandard", "tfidf": 0.1900530758042781}, {"index": 763498, "doc_id": 76, "term": "gene therapy", "tfidf": 0.3400791671573188}, {"index": 761212, "doc_id": 76, "term": "cf", "tfidf": 0.25004139857360397}, {"index": 762167, "doc_id": 76, "term": "cystic fibrosis", "tfidf": 0.25003951269856994}, {"index": 762166, "doc_id": 76, "term": "cystic", "tfidf": 0.23000201559819436}, {"index": 763491, "doc_id": 76, "term": "gene", "tfidf": 0.2200121794480193}, {"index": 763295, "doc_id": 76, "term": "fibrosis", "tfidf": 0.2100197971466406}, {"index": 769111, "doc_id": 76, "term": "therapy", "tfidf": 0.19009334547726225}, {"index": 761383, "doc_id": 76, "term": "clinical efficacy", "tfidf": 0.14000719065498415}, {"index": 761778, "doc_id": 76, "term": "consortium", "tfidf": 0.14006380039302943}, {"index": 765402, "doc_id": 76, "term": "modulator", "tfidf": 0.1400927184940514}, {"index": 772328, "doc_id": 77, "term": "dental", "tfidf": 0.19002993410333008}, {"index": 775080, "doc_id": 77, "term": "maxillary", "tfidf": 0.1800198873688738}, {"index": 775352, "doc_id": 77, "term": "mm", "tfidf": 0.17002976615320528}, {"index": 778821, "doc_id": 77, "term": "success rate", "tfidf": 0.16008351316952815}, {"index": 778414, "doc_id": 77, "term": "skeletal", "tfidf": 0.1500260559223605}, {"index": 778464, "doc_id": 77, "term": "soft", "tfidf": 0.150032104768915}, {"index": 778465, "doc_id": 77, "term": "soft tissue", "tfidf": 0.15001045202323854}, {"index": 779289, "doc_id": 77, "term": "transverse", "tfidf": 0.1500880293412659}, {"index": 773120, "doc_id": 77, "term": "expansion", "tfidf": 0.14009520153417818}, {"index": 777834, "doc_id": 77, "term": "risk bias", "tfidf": 0.14002472800442314}, {"index": 789291, "doc_id": 78, "term": "trauma", "tfidf": 0.23001643842808675}, {"index": 787051, "doc_id": 78, "term": "publication", "tfidf": 0.1700456687963667}, {"index": 789293, "doc_id": 78, "term": "trauma centre", "tfidf": 0.16004413617314822}, {"index": 783438, "doc_id": 78, "term": "fulltext article", "tfidf": 0.1500898259826467}, {"index": 784631, "doc_id": 78, "term": "january april", "tfidf": 0.1500416608261884}, {"index": 785736, "doc_id": 78, "term": "norway", "tfidf": 0.1500669439354284}, {"index": 789182, "doc_id": 78, "term": "title", "tfidf": 0.15007779585464937}, {"index": 789183, "doc_id": 78, "term": "title abstract", "tfidf": 0.1500226700232034}, {"index": 781213, "doc_id": 78, "term": "chain", "tfidf": 0.14001532205759462}, {"index": 781943, "doc_id": 78, "term": "country", "tfidf": 0.1400699491845249}, {"index": 792592, "doc_id": 79, "term": "displacement", "tfidf": 0.2600476158374147}, {"index": 797492, "doc_id": 79, "term": "reoperation", "tfidf": 0.2400429112513537}, {"index": 795940, "doc_id": 79, "term": "optimal cutoff", "tfidf": 0.23005236877805188}, {"index": 795941, "doc_id": 79, "term": "optimal cutoff value", "tfidf": 0.23006274974917706}, {"index": 792156, "doc_id": 79, "term": "cutoff value", "tfidf": 0.22000574808979187}, {"index": 792154, "doc_id": 79, "term": "cutoff", "tfidf": 0.19006894544703723}, {"index": 793823, "doc_id": 79, "term": "hi", "tfidf": 0.1900760734217536}, {"index": 794451, "doc_id": 79, "term": "insert", "tfidf": 0.1700505300453887}, {"index": 792703, "doc_id": 79, "term": "dx", "tfidf": 0.1600542118053029}, {"index": 795939, "doc_id": 79, "term": "optimal", "tfidf": 0.1600435038543247}, {"index": 805186, "doc_id": 80, "term": "mental health problem", "tfidf": 0.18003778041843063}]}}, {"mode": "vega-lite"});
</script>



#### Querying using tf-idf

![Querying with Tf-IDF](images/query-processing-tfidf.png)

<p style="text-align: center;">The text Processing Part</p>


With our tfidf we could easily use it to run search and make queries that use the tf-idf score and cosine similarty.


```python
from sklearn.metrics.pairwise import cosine_similarity
```


```python
def calculate_similarity(query, X=tf_idf_matrix, vectorizor=tf_idf_vectorizer, top_k=5):
    """ Vectorizes the `query` via `vectorizor` and calculates the cosine similarity of
    the `query` and `X` (all the documents) and returns the `top_k` similar documents.
    """

    # Vectorize the query to the same length as documents
    query_vec = vectorizor.transform(query)
    # Compute the cosine similarity between query_vec and all the documents
    cosine_similarities = cosine_similarity(X, query_vec).flatten()
    # Sort the similar documents from the most similar to less similar and return the indices
    most_similar_doc_indices = np.argsort(cosine_similarities, axis=0)[:-top_k-1:-1]
    return (most_similar_doc_indices, cosine_similarities)

def show_similar_documents(df, cosine_similarities, similar_doc_indices):
    """ Prints the most similar documents using indices in the `similar_doc_indices` vector."""
    counter = 1
    for index in similar_doc_indices:
        print('Top-{}, Similarity = {}'.format(counter, cosine_similarities[index]))
        pubmed_id = df.loc[index]['pubmed_id']
        print('the pubmed id : {}, '.format(pubmed_id))
        print('title {}'.format(data_df.loc[index, "title"]))
        print("abstract {}".format(data_df.loc[index, "abstract"][:50]))
        counter += 1
        print(10 * '**==')
```

The above code, get our new query, generate it TF-IDF  vector. Then it computes the cosine similarity between the vectors and all our documents in the TF-IDF matrix. 

As the result, it returns the top n rows in the matrix which are similar to our query vector. 


```python
data_df.head()
```




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>pubmed_id</th>
      <th>title</th>
      <th>abstract</th>
      <th>journal</th>
      <th>authors</th>
      <th>publish_time</th>
      <th>abstract_cleaned</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>32165633</td>
      <td>Acid ceramidase of macrophages traps herpes si...</td>
      <td>Macrophages have important protective function...</td>
      <td>Nat Commun</td>
      <td>Lang, Judith; Bohn, Patrick; Bhat, Hilal; Jast...</td>
      <td>2020-03-12</td>
      <td>macrophage  important  protective  function  i...</td>
    </tr>
    <tr>
      <th>1</th>
      <td>18325284</td>
      <td>Resource Allocation during an Influenza Pandemic</td>
      <td>Resource Allocation during an Influenza Pandemic</td>
      <td>Emerg Infect Dis</td>
      <td>Paranthaman, Karthikeyan; Conlon, Christopher ...</td>
      <td>2008-03-01</td>
      <td>resource  allocation  influenza  pandemic</td>
    </tr>
    <tr>
      <th>2</th>
      <td>30073452</td>
      <td>Analysis of pig trading networks and practices...</td>
      <td>East Africa is undergoing rapid expansion of p...</td>
      <td>Trop Anim Health Prod</td>
      <td>Atherstone, C.; Galiwango, R. G.; Grace, D.; A...</td>
      <td>2018-08-02</td>
      <td>east  africa  undergo  rapid  expansion  pig  ...</td>
    </tr>
    <tr>
      <th>3</th>
      <td>35017151</td>
      <td>Pembrolizumab and decitabine for refractory or...</td>
      <td>BACKGROUND: The powerful ‘graft versus leukemi...</td>
      <td>J Immunother Cancer</td>
      <td>Goswami, Meghali; Gui, Gege; Dillon, Laura W; ...</td>
      <td>2022-01-11</td>
      <td>background  powerful  graft  versus  leukemia ...</td>
    </tr>
    <tr>
      <th>4</th>
      <td>34504521</td>
      <td>Performance Evaluation of Enterprise Supply Ch...</td>
      <td>In order to make up for the shortcomings of cu...</td>
      <td>Comput Intell Neurosci</td>
      <td>Bu, Miaoling</td>
      <td>2021-08-30</td>
      <td>order  make  shortcoming  current  performance...</td>
    </tr>
  </tbody>
</table>
</div>




```python
tfidf_df.head()
```




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>aa</th>
      <th>ab</th>
      <th>abbott</th>
      <th>abdomen</th>
      <th>abdominal</th>
      <th>abdominal pain</th>
      <th>abdominal wall</th>
      <th>ability</th>
      <th>ability induce</th>
      <th>ability perform</th>
      <th>...</th>
      <th>zip</th>
      <th>zip code</th>
      <th>zip code level</th>
      <th>zone</th>
      <th>zoonosis</th>
      <th>zoonotic</th>
      <th>zoonotic pathogen</th>
      <th>zoonotic virus</th>
      <th>μm</th>
      <th>μm respectively</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>...</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.00</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
    </tr>
    <tr>
      <th>1</th>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>...</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.00</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
    </tr>
    <tr>
      <th>2</th>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>...</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.09</td>
      <td>0.1</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
    </tr>
    <tr>
      <th>3</th>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>...</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.00</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
    </tr>
    <tr>
      <th>4</th>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>...</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.00</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
    </tr>
  </tbody>
</table>
<p>5 rows × 10000 columns</p>
</div>




```python
import time
```


```python
query = ['are gorillas responsible of ebola']
search_start = time.time()
sim_vecs, cosine_similarities = calculate_similarity(query)
search_time = time.time() - search_start
print("search time: {:.2f} ms".format(search_time * 1000))
print()
show_similar_documents(data_df, cosine_similarities, sim_vecs)
```

    search time: 7.60 ms
    
    Top-1, Similarity = 0.25484833157402037
    the pubmed id : 32287784, 
    title Wuhan virus spreads
    abstract We now know the virus responsible for deaths and i
    **==**==**==**==**==**==**==**==**==**==
    Top-2, Similarity = 0.2332808978421972
    the pubmed id : 32162604, 
    title How Is the World Responding to the Novel Coronavirus Disease (COVID-19) Compared with the 2014 West African Ebola Epidemic? The Importance of China as a Player in the Global Economy
    abstract This article describes similarities and difference
    **==**==**==**==**==**==**==**==**==**==
    Top-3, Similarity = 0.1286925639778678
    the pubmed id : 19297495, 
    title Aquareovirus effects syncytiogenesis by using a novel member of the FAST protein family translated from a noncanonical translation start site.
    abstract As nonenveloped viruses, the aquareoviruses and or
    **==**==**==**==**==**==**==**==**==**==
    Top-4, Similarity = 0.11561157619559267
    the pubmed id : 27325914, 
    title Consortia's critical role in developing medical countermeasures for re-emerging viral infections: a USA perspective.
    abstract Viral infections, such as Ebola, severe acute resp
    **==**==**==**==**==**==**==**==**==**==
    Top-5, Similarity = 0.10755790364315998
    the pubmed id : 33360484, 
    title Neuropathological explanation of minimal COVID-19 infection rate in newborns, infants and children – a mystery so far. New insight into the role of Substance P
    abstract Sars-Cov-2 or Novel coronavirus infection (COVID-1
    **==**==**==**==**==**==**==**==**==**==