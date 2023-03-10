---
layout: post
title: "Data Science Take Home Task : Part one - Exploratory Data Analysis"
permalink: part-one-exploratory-data-analysis
date: 2022-07-23 10:03:59
comments: true
description: "Guide for exploratory data analysis in python for data science"
keywords: "data-science, Exploratory Data Analysis, Stores, Python, Machine Learning"
categories: 
published: false
tags: python, data-science, exploratory-data-analysis, machine-learning
---


### Context

This was a take home assignment I completed for a Data Scientist/Machine Learning Engineer Role I interviewed for a big retailer company in the UK. I would like to not disclose the name of the company for confidentiality reasons.

Unfortunately , I was not selected for the roles but I got feedback and I applied it on this assignment. That is the reason why I am sharing this post with you.

In the rest of this notebook I will use the name `The Store` to reference the company.


### Problem Statement

At The Store, the location of a retail store plays a huge role in its commercial success. Our Stores Team use various data sources to better understand the potential of candidate locations for new stores in the UK. They need data science help in designing a model that can predict the future sales **[normalised_sales]** of a store based on location characteristics. Your task is to examine the provided dataset and answer the questions below.

#### Dataset files

* `store-dataset/train.csv`
* `store-dataset/test.csv`

#### Columns

* [x] `location_id`: id of The Store property location
* [x] `normalised_sales`: normalised sales value of The Store
* [x] `crime_rate`: crime rate in the area (higher means more crime)
* [x] `household_size`: mean household size in the area
* [x] `household_affluency`: mean household affluency in the area (higher means more affluent)
* [x] `transport_availability`: availability of different transport
* [x] `public_transport_dist`: index of public transport availability in the area
* [x] `new_store`: new Store store opened recently
* [x] `proportion_nonretail`: proportion of non-retail commercial properties in the area
* [x] ` proportion_flats`: proportion of blocks of flats in the area
* [x] `proportion_newbuilds`: proportion of newly built property in the area
* [x] `property_value`: average property value in the area
* [x] `commercial_property`: percentage of commercial properties in the area
* [x] `competitor_density`: density of competitor retailers
* [x] `school_proximity`: average school proximity in the area
* [x] `county`: county code of the area

### Abstract TLDR

This assignment aimed to predict the number of sales using the different attributes of The Store dataset. The training dataset has 315 rows and 14 columns. 
First, the dataset was cleaned, and columns with missing values were removed. Then an analysis of the distribution of the data and the correlation between the normalized sales and different attributes was conducted. The key finding for the exploratory data analysis step was that the household ratio, the crime rate and the property values are highly correlated with the normalized sales.

The modelling consists of the following steps: binarization or conversion of attributes with outliers to categories, using one-hot encoding for categorical values, and features engineering, which resulted in creating a new feature called household_ratio.

The next step after the data preprocessing was the modelling. Tree-based models were used in this step: decision tree and random forest regressor. The evaluation was done using five-fold cross-validation. The key finding was that the decision tree model overfits the data; it yields an average mean absolute error of 0.04 on the training set but 0.38 on the validation set. 
The final random forest model yielded an average of 0.11 mean absolute error on the training set and 0.33 error on the validation set. 

After analyzing the errors, it was found that the mean absolute error has a normal distribution but with outliers. As part of the model's improvement, we suggest analyzing the data point where the model made high mean absolute errors, training a separate model with those values, and combining the results at the end.

For usage of the model, while the decision tree can be used to explain how the model works to product managers and other stakeholders, the random forest is the appropriate model for predictions.




## Exploratory Data Analysis

Before diving into the modelling, you are given the dataset and The Store team expect you to come back with an analysis of the data and any concerns you may have about it. They would also like to know which other information you think would be useful to collect for future developments.

### How I did on this question:

Here is the feedback I got from The Store team:

#### Positives:

You did some clever feature engineering with household features, combining them to increase predictive power

#### Negatives:

Unfortunately you wrongly interpreted negative normalized sales as store's losses .

My response, I think, I should have asked for more clarifications about how they interpret the normalized sales losses, it a big mistake and cost me a lot.

```python
import warnings
warnings.filterwarnings('ignore')
warnings.simplefilter('ignore')
```

```python
from scipy.stats import skew,norm  # for some statistics
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
```

```python
data_directory = Path.cwd().joinpath('data')
assert data_directory.exists()
```

```python
store_dataset = data_directory.joinpath("store-dataset")
assert store_dataset.exists()
train_file = store_dataset.joinpath("train.csv")
test_file = store_dataset.joinpath("test.csv")
assert train_file.exists()
assert test_file.exists()
```

```python
store_df = pd.read_csv(train_file)
store_df.head()
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
      <th>location_id</th>
      <th>crime_rate</th>
      <th>proportion_flats</th>
      <th>proportion_nonretail</th>
      <th>new_store</th>
      <th>commercial_property</th>
      <th>household_size</th>
      <th>proportion_newbuilds</th>
      <th>public_transport_dist</th>
      <th>transport_availability</th>
      <th>property_value</th>
      <th>school_proximity</th>
      <th>competitor_density</th>
      <th>household_affluency</th>
      <th>normalised_sales</th>
      <th>county</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>464</td>
      <td>17.600541</td>
      <td>0.0</td>
      <td>18.10</td>
      <td>no</td>
      <td>NaN</td>
      <td>2.926</td>
      <td>29.0</td>
      <td>2.9084</td>
      <td>All transport options</td>
      <td>666</td>
      <td>20.2</td>
      <td>368.74</td>
      <td>4.5325</td>
      <td>-0.399933</td>
      <td>c_40</td>
    </tr>
    <tr>
      <th>1</th>
      <td>504</td>
      <td>0.603556</td>
      <td>20.0</td>
      <td>3.97</td>
      <td>no</td>
      <td>14.85</td>
      <td>4.520</td>
      <td>10.6</td>
      <td>2.1398</td>
      <td>Average transport options</td>
      <td>264</td>
      <td>13.0</td>
      <td>388.37</td>
      <td>1.8150</td>
      <td>2.216308</td>
      <td>c_80</td>
    </tr>
    <tr>
      <th>2</th>
      <td>295</td>
      <td>0.606810</td>
      <td>0.0</td>
      <td>6.20</td>
      <td>no</td>
      <td>7.70</td>
      <td>2.981</td>
      <td>31.9</td>
      <td>3.6715</td>
      <td>Many transport options</td>
      <td>307</td>
      <td>17.4</td>
      <td>378.35</td>
      <td>2.9125</td>
      <td>0.166920</td>
      <td>c_53</td>
    </tr>
    <tr>
      <th>3</th>
      <td>187</td>
      <td>0.012385</td>
      <td>55.0</td>
      <td>2.25</td>
      <td>no</td>
      <td>1.95</td>
      <td>3.453</td>
      <td>68.1</td>
      <td>7.3073</td>
      <td>No transport options</td>
      <td>300</td>
      <td>15.3</td>
      <td>394.72</td>
      <td>2.0575</td>
      <td>-0.083804</td>
      <td>c_65</td>
    </tr>
    <tr>
      <th>4</th>
      <td>193</td>
      <td>0.016182</td>
      <td>100.0</td>
      <td>1.32</td>
      <td>no</td>
      <td>3.05</td>
      <td>3.816</td>
      <td>59.5</td>
      <td>8.3248</td>
      <td>Average transport options</td>
      <td>256</td>
      <td>15.1</td>
      <td>392.90</td>
      <td>0.9875</td>
      <td>0.962693</td>
      <td>c_97</td>
    </tr>
  </tbody>
</table>
</div>


```python
store_df.describe()
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
      <th>location_id</th>
      <th>crime_rate</th>
      <th>proportion_flats</th>
      <th>proportion_nonretail</th>
      <th>commercial_property</th>
      <th>household_size</th>
      <th>proportion_newbuilds</th>
      <th>public_transport_dist</th>
      <th>property_value</th>
      <th>school_proximity</th>
      <th>competitor_density</th>
      <th>household_affluency</th>
      <th>normalised_sales</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>count</th>
      <td>320.000000</td>
      <td>320.000000</td>
      <td>320.000000</td>
      <td>320.000000</td>
      <td>291.000000</td>
      <td>320.000000</td>
      <td>320.000000</td>
      <td>320.000000</td>
      <td>320.000000</td>
      <td>257.000000</td>
      <td>320.000000</td>
      <td>320.000000</td>
      <td>320.000000</td>
    </tr>
    <tr>
      <th>mean</th>
      <td>252.387500</td>
      <td>3.596375</td>
      <td>10.673438</td>
      <td>11.307906</td>
      <td>16.868557</td>
      <td>3.252803</td>
      <td>31.849063</td>
      <td>3.718765</td>
      <td>408.834375</td>
      <td>18.589494</td>
      <td>359.657562</td>
      <td>3.144008</td>
      <td>-0.016967</td>
    </tr>
    <tr>
      <th>std</th>
      <td>145.600582</td>
      <td>7.176342</td>
      <td>22.579232</td>
      <td>7.032693</td>
      <td>73.806051</td>
      <td>0.695442</td>
      <td>27.845777</td>
      <td>1.984765</td>
      <td>170.888974</td>
      <td>2.075529</td>
      <td>86.048632</td>
      <td>1.774041</td>
      <td>0.978561</td>
    </tr>
    <tr>
      <th>min</th>
      <td>1.000000</td>
      <td>0.007142</td>
      <td>0.000000</td>
      <td>0.740000</td>
      <td>1.750000</td>
      <td>0.561000</td>
      <td>0.000000</td>
      <td>1.137000</td>
      <td>188.000000</td>
      <td>13.000000</td>
      <td>3.500000</td>
      <td>0.432500</td>
      <td>-1.936974</td>
    </tr>
    <tr>
      <th>25%</th>
      <td>126.500000</td>
      <td>0.087937</td>
      <td>0.000000</td>
      <td>5.130000</td>
      <td>5.450000</td>
      <td>2.879750</td>
      <td>6.350000</td>
      <td>2.138075</td>
      <td>277.000000</td>
      <td>17.400000</td>
      <td>376.722500</td>
      <td>1.803750</td>
      <td>-0.585250</td>
    </tr>
    <tr>
      <th>50%</th>
      <td>251.500000</td>
      <td>0.289681</td>
      <td>0.000000</td>
      <td>9.900000</td>
      <td>9.400000</td>
      <td>3.197500</td>
      <td>23.400000</td>
      <td>3.095750</td>
      <td>330.000000</td>
      <td>19.100000</td>
      <td>392.205000</td>
      <td>2.808750</td>
      <td>-0.143759</td>
    </tr>
    <tr>
      <th>75%</th>
      <td>377.250000</td>
      <td>4.063553</td>
      <td>12.500000</td>
      <td>18.100000</td>
      <td>14.050000</td>
      <td>3.597250</td>
      <td>54.450000</td>
      <td>5.116700</td>
      <td>666.000000</td>
      <td>20.200000</td>
      <td>396.352500</td>
      <td>4.091875</td>
      <td>0.243227</td>
    </tr>
    <tr>
      <th>max</th>
      <td>506.000000</td>
      <td>51.693093</td>
      <td>100.000000</td>
      <td>27.740000</td>
      <td>1009.000000</td>
      <td>5.725000</td>
      <td>94.000000</td>
      <td>10.710300</td>
      <td>711.000000</td>
      <td>21.200000</td>
      <td>396.900000</td>
      <td>9.492500</td>
      <td>2.968477</td>
    </tr>
  </tbody>
</table>
</div>


```python
store_df = store_df.set_index("location_id")
```

```python
store_df.head()
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
      <th>crime_rate</th>
      <th>proportion_flats</th>
      <th>proportion_nonretail</th>
      <th>new_store</th>
      <th>commercial_property</th>
      <th>household_size</th>
      <th>proportion_newbuilds</th>
      <th>public_transport_dist</th>
      <th>transport_availability</th>
      <th>property_value</th>
      <th>school_proximity</th>
      <th>competitor_density</th>
      <th>household_affluency</th>
      <th>normalised_sales</th>
      <th>county</th>
    </tr>
    <tr>
      <th>location_id</th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>464</th>
      <td>17.600541</td>
      <td>0.0</td>
      <td>18.10</td>
      <td>no</td>
      <td>NaN</td>
      <td>2.926</td>
      <td>29.0</td>
      <td>2.9084</td>
      <td>All transport options</td>
      <td>666</td>
      <td>20.2</td>
      <td>368.74</td>
      <td>4.5325</td>
      <td>-0.399933</td>
      <td>c_40</td>
    </tr>
    <tr>
      <th>504</th>
      <td>0.603556</td>
      <td>20.0</td>
      <td>3.97</td>
      <td>no</td>
      <td>14.85</td>
      <td>4.520</td>
      <td>10.6</td>
      <td>2.1398</td>
      <td>Average transport options</td>
      <td>264</td>
      <td>13.0</td>
      <td>388.37</td>
      <td>1.8150</td>
      <td>2.216308</td>
      <td>c_80</td>
    </tr>
    <tr>
      <th>295</th>
      <td>0.606810</td>
      <td>0.0</td>
      <td>6.20</td>
      <td>no</td>
      <td>7.70</td>
      <td>2.981</td>
      <td>31.9</td>
      <td>3.6715</td>
      <td>Many transport options</td>
      <td>307</td>
      <td>17.4</td>
      <td>378.35</td>
      <td>2.9125</td>
      <td>0.166920</td>
      <td>c_53</td>
    </tr>
    <tr>
      <th>187</th>
      <td>0.012385</td>
      <td>55.0</td>
      <td>2.25</td>
      <td>no</td>
      <td>1.95</td>
      <td>3.453</td>
      <td>68.1</td>
      <td>7.3073</td>
      <td>No transport options</td>
      <td>300</td>
      <td>15.3</td>
      <td>394.72</td>
      <td>2.0575</td>
      <td>-0.083804</td>
      <td>c_65</td>
    </tr>
    <tr>
      <th>193</th>
      <td>0.016182</td>
      <td>100.0</td>
      <td>1.32</td>
      <td>no</td>
      <td>3.05</td>
      <td>3.816</td>
      <td>59.5</td>
      <td>8.3248</td>
      <td>Average transport options</td>
      <td>256</td>
      <td>15.1</td>
      <td>392.90</td>
      <td>0.9875</td>
      <td>0.962693</td>
      <td>c_97</td>
    </tr>
  </tbody>
</table>
</div>


```python
def visualize_attribute(attribute_name, x_range=5, store_df=store_df):
    """plot the boxplot and the hsitorogram of an attribute

    Args:
        attribute_name (_type_): the attribute name to plot
    """
    fig, axes = plt.subplots(figsize=(16, 6), ncols=2)
    plot = sns.distplot(store_df[attribute_name],ax=axes[0], fit=norm)
    box_plot = sns.boxplot( y=store_df[attribute_name], ax=axes[1])
    ticks = axes[0].set_xticks(np.arange(store_df[attribute_name].min(), store_df[attribute_name].max(), x_range))
```

## Exploratory Data Analysis

This step consists of the exploratory data analysis of the dataset. For each column, missing values and outliers will be checked. Then the value distribution and the correlation between the attributes, and the correlation between each attribute and the target value will be conducted. As the results this analyze will help to find the varialbles that are highly correlated with the number of sales.
### The Target Variable : Normalised Sales

For this problem,  we are predicting the normalized sales of a store. The normalized sale can be positive or negative.
<strike>
 From our understanding, a negative normalized sales mean loss and a positive normalized sales mean gain. A loss happens when a store has products it was supposed to sell in a given period but didn't sell them and has to clear the items from The Store. A gain or a positive value of normalized sales is when the product was sold in the given period, resulting in a profit for store.
</strike>

That is the paragraph that cost me point in this section . I should have also added that I am not sure about that and I will need more clarification.

### Information about the dataset

The dataset has 320 rows and 12 columns, it can be considered as a small dataset.

```python
visualize_attribute("normalised_sales", x_range=.8)
```


![Information about the dataset](images/Exploratory-data-analysis_17_0.png){: .center-image }

```python
store_df.normalised_sales.std().round(2)
```
    0.98



As per the plot show that sales values follow a normal distribution centered around {{store_df.normalised_sales.mean().round(2)}}, and with  a standard deviation of {{store_df.normalised_sales.std().round(2)}}.


### Missing values Computation 
Since there is no reason for the missing values, different missing values computation methods were used to compare the effect of each computation method on the predictor variable.

```python
print(store_df.isnull().sum())
```

    crime_rate                 0
    proportion_flats           0
    proportion_nonretail       0
    new_store                  0
    commercial_property       29
    household_size             0
    proportion_newbuilds       0
    public_transport_dist      0
    transport_availability     0
    property_value             0
    school_proximity          63
    competitor_density         0
    household_affluency        0
    normalised_sales           0
    county                     0
    dtype: int64

The above table illustrate that the school proximity and commercial property columns have are 10% and 20% of the values respectively. The next step will have a closer look on those values and find how to deal with them.

#### Possible Reason for Missing Values

For recall , let us note what are three main reason for missing values in the data according to the mechanism of missingness.

- Missing completely at Random:  is defined as when the probability that the data are missing is not related to either the specific value which is supposed to be obtained or the set of observed responses.

- Missing at Random : ) is a more realistic assumption for the studies performed in the anesthetic field. Data are regarded to be MAR when the probability that the responses are missing depends on the set of observed responses, but is not related to the specific missing values which is expected to be obtained.

- Missing not at Random: if the characters of the data do not meet those of MCAR or MAR, then they fall into the category of missing not at random (MNAR).


Upon looking at the dataset, there seems to be a valid reason for the missing values in the two columns, there seems to be missing at random. So now, a decision cannot be made about the best method to deal with those missing values before looking at each variable separately.

The next section will analyze the correlation between each attributes and the target variable, the an analysis of each variable will be conducted.
### Correlation Analysis

```python
correlation_matrix = store_df.corr(method='pearson')
mask = np.zeros_like(correlation_matrix, dtype=bool)
mask[np.triu_indices_from(mask)] = True
correlation_matrix[mask] = np.nan
(correlation_matrix
 .style
 .background_gradient(cmap='coolwarm', axis=None, vmin=-1, vmax=1)
 .highlight_null(null_color='#f1f1f1')  # Color NaNs grey
 .set_precision(2))
```



<style type="text/css">
#T_d7db2_row0_col0, #T_d7db2_row0_col1, #T_d7db2_row0_col2, #T_d7db2_row0_col3, #T_d7db2_row0_col4, #T_d7db2_row0_col5, #T_d7db2_row0_col6, #T_d7db2_row0_col7, #T_d7db2_row0_col8, #T_d7db2_row0_col9, #T_d7db2_row0_col10, #T_d7db2_row0_col11, #T_d7db2_row1_col1, #T_d7db2_row1_col2, #T_d7db2_row1_col3, #T_d7db2_row1_col4, #T_d7db2_row1_col5, #T_d7db2_row1_col6, #T_d7db2_row1_col7, #T_d7db2_row1_col8, #T_d7db2_row1_col9, #T_d7db2_row1_col10, #T_d7db2_row1_col11, #T_d7db2_row2_col2, #T_d7db2_row2_col3, #T_d7db2_row2_col4, #T_d7db2_row2_col5, #T_d7db2_row2_col6, #T_d7db2_row2_col7, #T_d7db2_row2_col8, #T_d7db2_row2_col9, #T_d7db2_row2_col10, #T_d7db2_row2_col11, #T_d7db2_row3_col3, #T_d7db2_row3_col4, #T_d7db2_row3_col5, #T_d7db2_row3_col6, #T_d7db2_row3_col7, #T_d7db2_row3_col8, #T_d7db2_row3_col9, #T_d7db2_row3_col10, #T_d7db2_row3_col11, #T_d7db2_row4_col4, #T_d7db2_row4_col5, #T_d7db2_row4_col6, #T_d7db2_row4_col7, #T_d7db2_row4_col8, #T_d7db2_row4_col9, #T_d7db2_row4_col10, #T_d7db2_row4_col11, #T_d7db2_row5_col5, #T_d7db2_row5_col6, #T_d7db2_row5_col7, #T_d7db2_row5_col8, #T_d7db2_row5_col9, #T_d7db2_row5_col10, #T_d7db2_row5_col11, #T_d7db2_row6_col6, #T_d7db2_row6_col7, #T_d7db2_row6_col8, #T_d7db2_row6_col9, #T_d7db2_row6_col10, #T_d7db2_row6_col11, #T_d7db2_row7_col7, #T_d7db2_row7_col8, #T_d7db2_row7_col9, #T_d7db2_row7_col10, #T_d7db2_row7_col11, #T_d7db2_row8_col8, #T_d7db2_row8_col9, #T_d7db2_row8_col10, #T_d7db2_row8_col11, #T_d7db2_row9_col9, #T_d7db2_row9_col10, #T_d7db2_row9_col11, #T_d7db2_row10_col10, #T_d7db2_row10_col11, #T_d7db2_row11_col11 {
  background-color: #000000;
  color: #f1f1f1;
  background-color: #f1f1f1;
}
#T_d7db2_row1_col0 {
  background-color: #bbd1f8;
  color: #000000;
}
#T_d7db2_row2_col0 {
  background-color: #f6a283;
  color: #000000;
}
#T_d7db2_row2_col1 {
  background-color: #89acfd;
  color: #000000;
}
#T_d7db2_row3_col0, #T_d7db2_row3_col2, #T_d7db2_row7_col3, #T_d7db2_row10_col3 {
  background-color: #e3d9d3;
  color: #000000;
}
#T_d7db2_row3_col1 {
  background-color: #d2dbe8;
  color: #000000;
}
#T_d7db2_row4_col0, #T_d7db2_row7_col4, #T_d7db2_row10_col9 {
  background-color: #a6c4fe;
  color: #000000;
}
#T_d7db2_row4_col1 {
  background-color: #f7b89c;
  color: #000000;
}
#T_d7db2_row4_col2, #T_d7db2_row6_col0, #T_d7db2_row9_col0 {
  background-color: #98b9ff;
  color: #000000;
}
#T_d7db2_row4_col3, #T_d7db2_row6_col3 {
  background-color: #d8dce2;
  color: #000000;
}
#T_d7db2_row5_col0 {
  background-color: #9dbdff;
  color: #000000;
}
#T_d7db2_row5_col1 {
  background-color: #f18f71;
  color: #f1f1f1;
}
#T_d7db2_row5_col2 {
  background-color: #7396f5;
  color: #f1f1f1;
}
#T_d7db2_row5_col3 {
  background-color: #d6dce4;
  color: #000000;
}
#T_d7db2_row5_col4 {
  background-color: #f5c2aa;
  color: #000000;
}
#T_d7db2_row6_col1 {
  background-color: #ea7b60;
  color: #f1f1f1;
}
#T_d7db2_row6_col2 {
  background-color: #6a8bef;
  color: #f1f1f1;
}
#T_d7db2_row6_col4 {
  background-color: #f5c0a7;
  color: #000000;
}
#T_d7db2_row6_col5 {
  background-color: #dc5d4a;
  color: #f1f1f1;
}
#T_d7db2_row7_col0 {
  background-color: #e67259;
  color: #f1f1f1;
}
#T_d7db2_row7_col1, #T_d7db2_row8_col5 {
  background-color: #aec9fc;
  color: #000000;
}
#T_d7db2_row7_col2 {
  background-color: #e36c55;
  color: #f1f1f1;
}
#T_d7db2_row7_col5, #T_d7db2_row10_col6 {
  background-color: #8badfd;
  color: #000000;
}
#T_d7db2_row7_col6 {
  background-color: #88abfd;
  color: #000000;
}
#T_d7db2_row8_col0, #T_d7db2_row11_col9 {
  background-color: #f7b79b;
  color: #000000;
}
#T_d7db2_row8_col1 {
  background-color: #a1c0ff;
  color: #000000;
}
#T_d7db2_row8_col2 {
  background-color: #f7a688;
  color: #000000;
}
#T_d7db2_row8_col3 {
  background-color: #e0dbd8;
  color: #000000;
}
#T_d7db2_row8_col4 {
  background-color: #b2ccfb;
  color: #000000;
}
#T_d7db2_row8_col6 {
  background-color: #b6cefa;
  color: #000000;
}
#T_d7db2_row8_col7 {
  background-color: #f59d7e;
  color: #000000;
}
#T_d7db2_row9_col1 {
  background-color: #efcebd;
  color: #000000;
}
#T_d7db2_row9_col2 {
  background-color: #aac7fd;
  color: #000000;
}
#T_d7db2_row9_col3 {
  background-color: #dddcdc;
  color: #000000;
}
#T_d7db2_row9_col4 {
  background-color: #eed0c0;
  color: #000000;
}
#T_d7db2_row9_col5, #T_d7db2_row11_col6 {
  background-color: #f5c1a9;
  color: #000000;
}
#T_d7db2_row9_col6 {
  background-color: #f6bfa6;
  color: #000000;
}
#T_d7db2_row9_col7 {
  background-color: #9ebeff;
  color: #000000;
}
#T_d7db2_row9_col8 {
  background-color: #c1d4f4;
  color: #000000;
}
#T_d7db2_row10_col0 {
  background-color: #ee8669;
  color: #f1f1f1;
}
#T_d7db2_row10_col1 {
  background-color: #9fbfff;
  color: #000000;
}
#T_d7db2_row10_col2 {
  background-color: #ec7f63;
  color: #f1f1f1;
}
#T_d7db2_row10_col4 {
  background-color: #779af7;
  color: #f1f1f1;
}
#T_d7db2_row10_col5 {
  background-color: #7da0f9;
  color: #f1f1f1;
}
#T_d7db2_row10_col7 {
  background-color: #f29072;
  color: #f1f1f1;
}
#T_d7db2_row10_col8 {
  background-color: #f7b599;
  color: #000000;
}
#T_d7db2_row11_col0 {
  background-color: #97b8ff;
  color: #000000;
}
#T_d7db2_row11_col1 {
  background-color: #f7b497;
  color: #000000;
}
#T_d7db2_row11_col2 {
  background-color: #8fb1fe;
  color: #000000;
}
#T_d7db2_row11_col3 {
  background-color: #d4dbe6;
  color: #000000;
}
#T_d7db2_row11_col4 {
  background-color: #e46e56;
  color: #f1f1f1;
}
#T_d7db2_row11_col5 {
  background-color: #f7b093;
  color: #000000;
}
#T_d7db2_row11_col7 {
  background-color: #93b5fe;
  color: #000000;
}
#T_d7db2_row11_col8 {
  background-color: #96b7ff;
  color: #000000;
}
#T_d7db2_row11_col10 {
  background-color: #6282ea;
  color: #f1f1f1;
}
</style>
<table id="T_d7db2_">
  <thead>
    <tr>
      <th class="blank level0" >&nbsp;</th>
      <th class="col_heading level0 col0" >crime_rate</th>
      <th class="col_heading level0 col1" >proportion_flats</th>
      <th class="col_heading level0 col2" >proportion_nonretail</th>
      <th class="col_heading level0 col3" >commercial_property</th>
      <th class="col_heading level0 col4" >household_size</th>
      <th class="col_heading level0 col5" >proportion_newbuilds</th>
      <th class="col_heading level0 col6" >public_transport_dist</th>
      <th class="col_heading level0 col7" >property_value</th>
      <th class="col_heading level0 col8" >school_proximity</th>
      <th class="col_heading level0 col9" >competitor_density</th>
      <th class="col_heading level0 col10" >household_affluency</th>
      <th class="col_heading level0 col11" >normalised_sales</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th id="T_d7db2_level0_row0" class="row_heading level0 row0" >crime_rate</th>
      <td id="T_d7db2_row0_col0" class="data row0 col0" >nan</td>
      <td id="T_d7db2_row0_col1" class="data row0 col1" >nan</td>
      <td id="T_d7db2_row0_col2" class="data row0 col2" >nan</td>
      <td id="T_d7db2_row0_col3" class="data row0 col3" >nan</td>
      <td id="T_d7db2_row0_col4" class="data row0 col4" >nan</td>
      <td id="T_d7db2_row0_col5" class="data row0 col5" >nan</td>
      <td id="T_d7db2_row0_col6" class="data row0 col6" >nan</td>
      <td id="T_d7db2_row0_col7" class="data row0 col7" >nan</td>
      <td id="T_d7db2_row0_col8" class="data row0 col8" >nan</td>
      <td id="T_d7db2_row0_col9" class="data row0 col9" >nan</td>
      <td id="T_d7db2_row0_col10" class="data row0 col10" >nan</td>
      <td id="T_d7db2_row0_col11" class="data row0 col11" >nan</td>
    </tr>
    <tr>
      <th id="T_d7db2_level0_row1" class="row_heading level0 row1" >proportion_flats</th>
      <td id="T_d7db2_row1_col0" class="data row1 col0" >-0.23</td>
      <td id="T_d7db2_row1_col1" class="data row1 col1" >nan</td>
      <td id="T_d7db2_row1_col2" class="data row1 col2" >nan</td>
      <td id="T_d7db2_row1_col3" class="data row1 col3" >nan</td>
      <td id="T_d7db2_row1_col4" class="data row1 col4" >nan</td>
      <td id="T_d7db2_row1_col5" class="data row1 col5" >nan</td>
      <td id="T_d7db2_row1_col6" class="data row1 col6" >nan</td>
      <td id="T_d7db2_row1_col7" class="data row1 col7" >nan</td>
      <td id="T_d7db2_row1_col8" class="data row1 col8" >nan</td>
      <td id="T_d7db2_row1_col9" class="data row1 col9" >nan</td>
      <td id="T_d7db2_row1_col10" class="data row1 col10" >nan</td>
      <td id="T_d7db2_row1_col11" class="data row1 col11" >nan</td>
    </tr>
    <tr>
      <th id="T_d7db2_level0_row2" class="row_heading level0 row2" >proportion_nonretail</th>
      <td id="T_d7db2_row2_col0" class="data row2 col0" >0.46</td>
      <td id="T_d7db2_row2_col1" class="data row2 col1" >-0.52</td>
      <td id="T_d7db2_row2_col2" class="data row2 col2" >nan</td>
      <td id="T_d7db2_row2_col3" class="data row2 col3" >nan</td>
      <td id="T_d7db2_row2_col4" class="data row2 col4" >nan</td>
      <td id="T_d7db2_row2_col5" class="data row2 col5" >nan</td>
      <td id="T_d7db2_row2_col6" class="data row2 col6" >nan</td>
      <td id="T_d7db2_row2_col7" class="data row2 col7" >nan</td>
      <td id="T_d7db2_row2_col8" class="data row2 col8" >nan</td>
      <td id="T_d7db2_row2_col9" class="data row2 col9" >nan</td>
      <td id="T_d7db2_row2_col10" class="data row2 col10" >nan</td>
      <td id="T_d7db2_row2_col11" class="data row2 col11" >nan</td>
    </tr>
    <tr>
      <th id="T_d7db2_level0_row3" class="row_heading level0 row3" >commercial_property</th>
      <td id="T_d7db2_row3_col0" class="data row3 col0" >0.05</td>
      <td id="T_d7db2_row3_col1" class="data row3 col1" >-0.08</td>
      <td id="T_d7db2_row3_col2" class="data row3 col2" >0.05</td>
      <td id="T_d7db2_row3_col3" class="data row3 col3" >nan</td>
      <td id="T_d7db2_row3_col4" class="data row3 col4" >nan</td>
      <td id="T_d7db2_row3_col5" class="data row3 col5" >nan</td>
      <td id="T_d7db2_row3_col6" class="data row3 col6" >nan</td>
      <td id="T_d7db2_row3_col7" class="data row3 col7" >nan</td>
      <td id="T_d7db2_row3_col8" class="data row3 col8" >nan</td>
      <td id="T_d7db2_row3_col9" class="data row3 col9" >nan</td>
      <td id="T_d7db2_row3_col10" class="data row3 col10" >nan</td>
      <td id="T_d7db2_row3_col11" class="data row3 col11" >nan</td>
    </tr>
    <tr>
      <th id="T_d7db2_level0_row4" class="row_heading level0 row4" >household_size</th>
      <td id="T_d7db2_row4_col0" class="data row4 col0" >-0.35</td>
      <td id="T_d7db2_row4_col1" class="data row4 col1" >0.33</td>
      <td id="T_d7db2_row4_col2" class="data row4 col2" >-0.44</td>
      <td id="T_d7db2_row4_col3" class="data row4 col3" >-0.04</td>
      <td id="T_d7db2_row4_col4" class="data row4 col4" >nan</td>
      <td id="T_d7db2_row4_col5" class="data row4 col5" >nan</td>
      <td id="T_d7db2_row4_col6" class="data row4 col6" >nan</td>
      <td id="T_d7db2_row4_col7" class="data row4 col7" >nan</td>
      <td id="T_d7db2_row4_col8" class="data row4 col8" >nan</td>
      <td id="T_d7db2_row4_col9" class="data row4 col9" >nan</td>
      <td id="T_d7db2_row4_col10" class="data row4 col10" >nan</td>
      <td id="T_d7db2_row4_col11" class="data row4 col11" >nan</td>
    </tr>
    <tr>
      <th id="T_d7db2_level0_row5" class="row_heading level0 row5" >proportion_newbuilds</th>
      <td id="T_d7db2_row5_col0" class="data row5 col0" >-0.41</td>
      <td id="T_d7db2_row5_col1" class="data row5 col1" >0.55</td>
      <td id="T_d7db2_row5_col2" class="data row5 col2" >-0.64</td>
      <td id="T_d7db2_row5_col3" class="data row5 col3" >-0.05</td>
      <td id="T_d7db2_row5_col4" class="data row5 col4" >0.26</td>
      <td id="T_d7db2_row5_col5" class="data row5 col5" >nan</td>
      <td id="T_d7db2_row5_col6" class="data row5 col6" >nan</td>
      <td id="T_d7db2_row5_col7" class="data row5 col7" >nan</td>
      <td id="T_d7db2_row5_col8" class="data row5 col8" >nan</td>
      <td id="T_d7db2_row5_col9" class="data row5 col9" >nan</td>
      <td id="T_d7db2_row5_col10" class="data row5 col10" >nan</td>
      <td id="T_d7db2_row5_col11" class="data row5 col11" >nan</td>
    </tr>
    <tr>
      <th id="T_d7db2_level0_row6" class="row_heading level0 row6" >public_transport_dist</th>
      <td id="T_d7db2_row6_col0" class="data row6 col0" >-0.43</td>
      <td id="T_d7db2_row6_col1" class="data row6 col1" >0.64</td>
      <td id="T_d7db2_row6_col2" class="data row6 col2" >-0.70</td>
      <td id="T_d7db2_row6_col3" class="data row6 col3" >-0.04</td>
      <td id="T_d7db2_row6_col4" class="data row6 col4" >0.28</td>
      <td id="T_d7db2_row6_col5" class="data row6 col5" >0.76</td>
      <td id="T_d7db2_row6_col6" class="data row6 col6" >nan</td>
      <td id="T_d7db2_row6_col7" class="data row6 col7" >nan</td>
      <td id="T_d7db2_row6_col8" class="data row6 col8" >nan</td>
      <td id="T_d7db2_row6_col9" class="data row6 col9" >nan</td>
      <td id="T_d7db2_row6_col10" class="data row6 col10" >nan</td>
      <td id="T_d7db2_row6_col11" class="data row6 col11" >nan</td>
    </tr>
    <tr>
      <th id="T_d7db2_level0_row7" class="row_heading level0 row7" >property_value</th>
      <td id="T_d7db2_row7_col0" class="data row7 col0" >0.67</td>
      <td id="T_d7db2_row7_col1" class="data row7 col1" >-0.31</td>
      <td id="T_d7db2_row7_col2" class="data row7 col2" >0.70</td>
      <td id="T_d7db2_row7_col3" class="data row7 col3" >0.05</td>
      <td id="T_d7db2_row7_col4" class="data row7 col4" >-0.36</td>
      <td id="T_d7db2_row7_col5" class="data row7 col5" >-0.51</td>
      <td id="T_d7db2_row7_col6" class="data row7 col6" >-0.52</td>
      <td id="T_d7db2_row7_col7" class="data row7 col7" >nan</td>
      <td id="T_d7db2_row7_col8" class="data row7 col8" >nan</td>
      <td id="T_d7db2_row7_col9" class="data row7 col9" >nan</td>
      <td id="T_d7db2_row7_col10" class="data row7 col10" >nan</td>
      <td id="T_d7db2_row7_col11" class="data row7 col11" >nan</td>
    </tr>
    <tr>
      <th id="T_d7db2_level0_row8" class="row_heading level0 row8" >school_proximity</th>
      <td id="T_d7db2_row8_col0" class="data row8 col0" >0.34</td>
      <td id="T_d7db2_row8_col1" class="data row8 col1" >-0.38</td>
      <td id="T_d7db2_row8_col2" class="data row8 col2" >0.43</td>
      <td id="T_d7db2_row8_col3" class="data row8 col3" >0.03</td>
      <td id="T_d7db2_row8_col4" class="data row8 col4" >-0.29</td>
      <td id="T_d7db2_row8_col5" class="data row8 col5" >-0.31</td>
      <td id="T_d7db2_row8_col6" class="data row8 col6" >-0.26</td>
      <td id="T_d7db2_row8_col7" class="data row8 col7" >0.48</td>
      <td id="T_d7db2_row8_col8" class="data row8 col8" >nan</td>
      <td id="T_d7db2_row8_col9" class="data row8 col9" >nan</td>
      <td id="T_d7db2_row8_col10" class="data row8 col10" >nan</td>
      <td id="T_d7db2_row8_col11" class="data row8 col11" >nan</td>
    </tr>
    <tr>
      <th id="T_d7db2_level0_row9" class="row_heading level0 row9" >competitor_density</th>
      <td id="T_d7db2_row9_col0" class="data row9 col0" >-0.44</td>
      <td id="T_d7db2_row9_col1" class="data row9 col1" >0.17</td>
      <td id="T_d7db2_row9_col2" class="data row9 col2" >-0.33</td>
      <td id="T_d7db2_row9_col3" class="data row9 col3" >0.00</td>
      <td id="T_d7db2_row9_col4" class="data row9 col4" >0.15</td>
      <td id="T_d7db2_row9_col5" class="data row9 col5" >0.27</td>
      <td id="T_d7db2_row9_col6" class="data row9 col6" >0.28</td>
      <td id="T_d7db2_row9_col7" class="data row9 col7" >-0.40</td>
      <td id="T_d7db2_row9_col8" class="data row9 col8" >-0.19</td>
      <td id="T_d7db2_row9_col9" class="data row9 col9" >nan</td>
      <td id="T_d7db2_row9_col10" class="data row9 col10" >nan</td>
      <td id="T_d7db2_row9_col11" class="data row9 col11" >nan</td>
    </tr>
    <tr>
      <th id="T_d7db2_level0_row10" class="row_heading level0 row10" >household_affluency</th>
      <td id="T_d7db2_row10_col0" class="data row10 col0" >0.59</td>
      <td id="T_d7db2_row10_col1" class="data row10 col1" >-0.40</td>
      <td id="T_d7db2_row10_col2" class="data row10 col2" >0.62</td>
      <td id="T_d7db2_row10_col3" class="data row10 col3" >0.05</td>
      <td id="T_d7db2_row10_col4" class="data row10 col4" >-0.62</td>
      <td id="T_d7db2_row10_col5" class="data row10 col5" >-0.59</td>
      <td id="T_d7db2_row10_col6" class="data row10 col6" >-0.51</td>
      <td id="T_d7db2_row10_col7" class="data row10 col7" >0.54</td>
      <td id="T_d7db2_row10_col8" class="data row10 col8" >0.34</td>
      <td id="T_d7db2_row10_col9" class="data row10 col9" >-0.36</td>
      <td id="T_d7db2_row10_col10" class="data row10 col10" >nan</td>
      <td id="T_d7db2_row10_col11" class="data row10 col11" >nan</td>
    </tr>
    <tr>
      <th id="T_d7db2_level0_row11" class="row_heading level0 row11" >normalised_sales</th>
      <td id="T_d7db2_row11_col0" class="data row11 col0" >-0.45</td>
      <td id="T_d7db2_row11_col1" class="data row11 col1" >0.36</td>
      <td id="T_d7db2_row11_col2" class="data row11 col2" >-0.49</td>
      <td id="T_d7db2_row11_col3" class="data row11 col3" >-0.07</td>
      <td id="T_d7db2_row11_col4" class="data row11 col4" >0.69</td>
      <td id="T_d7db2_row11_col5" class="data row11 col5" >0.38</td>
      <td id="T_d7db2_row11_col6" class="data row11 col6" >0.27</td>
      <td id="T_d7db2_row11_col7" class="data row11 col7" >-0.46</td>
      <td id="T_d7db2_row11_col8" class="data row11 col8" >-0.45</td>
      <td id="T_d7db2_row11_col9" class="data row11 col9" >0.34</td>
      <td id="T_d7db2_row11_col10" class="data row11 col10" >-0.74</td>
      <td id="T_d7db2_row11_col11" class="data row11 col11" >nan</td>
    </tr>
  </tbody>
</table>



```python
correlation_matrix.loc["normalised_sales"].sort_values(ascending=False)
```




    household_size           0.692506
    proportion_newbuilds     0.380474
    proportion_flats         0.355756
    competitor_density       0.338284
    public_transport_dist    0.268658
    commercial_property     -0.065091
    crime_rate              -0.445005
    school_proximity        -0.447789
    property_value          -0.463462
    proportion_nonretail    -0.485237
    household_affluency     -0.743277
    normalised_sales              NaN
    Name: normalised_sales, dtype: float64



Here is few information noticeable from the correlation matrix : 
 - The highest correlated attribute is the proportion of new builds and public transport distribution.
 - The property values and the proportion of non-retail commercial properties. 
 - Public transport distribution and proportion of non retails are negatively correlated.

In terms of Pearson correlation with the target variable, the normalized sales are negatively correlated with the household_affluency but positively correlated with the household size.


### Variable Distribution 


The following section will analyze each variable deeper. For each variable, it will draw a histogram and a boxplot. This plot will help to find out the outliers and the variable distribution. It will then plot a correlation between the variable and the normalized sales. If a feature has outlier values, it will have a deeper look at those and deal with them with the appropriate method.

```python
number_of_columns = len(store_df.columns)
number_of_rows = 3
fig, axes = plt.subplots(nrows=number_of_rows, ncols=number_of_columns // number_of_rows, figsize=(25, 7))
fig.suptitle("Distribution of each feature")
for column_index, column in enumerate(store_df.columns):
    if column_index == number_of_columns:
        continue
    binwidth = 5
    axe = axes[column_index % number_of_rows, column_index // number_of_rows]
    axe.hist(store_df[column], bins = int(180/binwidth),
             color = 'blue', edgecolor = 'black')
    
    # Title and labels
    axe.set_title(f"{column} distribution", pad=-20)
fig.tight_layout()
```

![Distribution of Variables](images/Exploratory-data-analysis_31_0.png){: .center-image }

#### Crime Rate

```python
visualize_attribute("crime_rate")
```

![crime rate ratio](images/Exploratory-data-analysis_33_0.png){: .center-image }

The graph of the crime rate ration illustrates that there crime rate is not normally distributed but have a sort of logarithmic distribution. The plot also shows that the crime rate has outlier values. For a deeper analysis, a conversion of the crime rate ration into high, medium, and low category will be performed.

```python
def categorize_attribute(attribute, bins_range, categories_names):
    """
    Categorize an attribute into bins
    """
    intervals = pd.IntervalIndex.from_tuples(bins_range)
    bins = pd.cut(store_df[attribute].values, intervals, labels=categories_names, include_lowest=True)
    bins.categories = categories_names
    return bins
```

```python
store_df['crime_rate_bin'] = categorize_attribute("crime_rate", [(0, 10), (10, 20), (20, 30)], ["low", "medium", "high"])
```

```python
store_df.crime_rate_bin.value_counts().plot(kind='barh')
```




    <AxesSubplot:>


![crime rate ratio](images/Exploratory-data-analysis_37_1.png){: .center-image }

```python
store_df.loc[store_df.crime_rate_bin == 'high']
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
      <th>crime_rate</th>
      <th>proportion_flats</th>
      <th>proportion_nonretail</th>
      <th>new_store</th>
      <th>commercial_property</th>
      <th>household_size</th>
      <th>proportion_newbuilds</th>
      <th>public_transport_dist</th>
      <th>transport_availability</th>
      <th>property_value</th>
      <th>school_proximity</th>
      <th>competitor_density</th>
      <th>household_affluency</th>
      <th>normalised_sales</th>
      <th>county</th>
      <th>crime_rate_bin</th>
    </tr>
    <tr>
      <th>location_id</th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>127</th>
      <td>27.564994</td>
      <td>0.0</td>
      <td>18.1</td>
      <td>no</td>
      <td>17.50</td>
      <td>1.652</td>
      <td>0.0</td>
      <td>1.4672</td>
      <td>All transport options</td>
      <td>666</td>
      <td>20.2</td>
      <td>396.90</td>
      <td>7.0700</td>
      <td>-1.337419</td>
      <td>c_52</td>
      <td>high</td>
    </tr>
    <tr>
      <th>249</th>
      <td>29.312878</td>
      <td>0.0</td>
      <td>18.1</td>
      <td>no</td>
      <td>16.45</td>
      <td>2.304</td>
      <td>10.9</td>
      <td>1.6475</td>
      <td>All transport options</td>
      <td>666</td>
      <td>20.2</td>
      <td>127.36</td>
      <td>6.6600</td>
      <td>-1.348320</td>
      <td>c_23</td>
      <td>high</td>
    </tr>
    <tr>
      <th>61</th>
      <td>22.695937</td>
      <td>0.0</td>
      <td>18.1</td>
      <td>no</td>
      <td>17.50</td>
      <td>1.368</td>
      <td>8.8</td>
      <td>1.4395</td>
      <td>All transport options</td>
      <td>666</td>
      <td>NaN</td>
      <td>285.83</td>
      <td>7.6575</td>
      <td>-1.522736</td>
      <td>c_45</td>
      <td>high</td>
    </tr>
    <tr>
      <th>404</th>
      <td>25.534723</td>
      <td>0.0</td>
      <td>18.1</td>
      <td>no</td>
      <td>17.50</td>
      <td>2.000</td>
      <td>10.5</td>
      <td>1.5184</td>
      <td>All transport options</td>
      <td>666</td>
      <td>20.2</td>
      <td>396.90</td>
      <td>7.9975</td>
      <td>-1.675350</td>
      <td>c_37</td>
      <td>high</td>
    </tr>
    <tr>
      <th>23</th>
      <td>20.435598</td>
      <td>0.0</td>
      <td>18.1</td>
      <td>no</td>
      <td>16.45</td>
      <td>3.434</td>
      <td>0.0</td>
      <td>1.8347</td>
      <td>All transport options</td>
      <td>666</td>
      <td>20.2</td>
      <td>27.25</td>
      <td>7.2625</td>
      <td>-1.697152</td>
      <td>c_23</td>
      <td>high</td>
    </tr>
    <tr>
      <th>181</th>
      <td>28.302093</td>
      <td>0.0</td>
      <td>18.1</td>
      <td>no</td>
      <td>17.15</td>
      <td>2.987</td>
      <td>0.0</td>
      <td>1.5888</td>
      <td>All transport options</td>
      <td>666</td>
      <td>20.2</td>
      <td>396.90</td>
      <td>6.6925</td>
      <td>-1.871568</td>
      <td>c_25</td>
      <td>high</td>
    </tr>
    <tr>
      <th>452</th>
      <td>20.902966</td>
      <td>0.0</td>
      <td>18.1</td>
      <td>no</td>
      <td>15.90</td>
      <td>1.138</td>
      <td>0.0</td>
      <td>1.1370</td>
      <td>All transport options</td>
      <td>666</td>
      <td>20.2</td>
      <td>396.90</td>
      <td>9.4925</td>
      <td>-0.977686</td>
      <td>c_42</td>
      <td>high</td>
    </tr>
    <tr>
      <th>104</th>
      <td>28.025921</td>
      <td>0.0</td>
      <td>18.1</td>
      <td>no</td>
      <td>17.15</td>
      <td>2.349</td>
      <td>4.0</td>
      <td>1.7028</td>
      <td>All transport options</td>
      <td>666</td>
      <td>20.2</td>
      <td>396.90</td>
      <td>4.9425</td>
      <td>-1.577241</td>
      <td>c_45</td>
      <td>high</td>
    </tr>
    <tr>
      <th>210</th>
      <td>24.917743</td>
      <td>0.0</td>
      <td>18.1</td>
      <td>no</td>
      <td>NaN</td>
      <td>2.818</td>
      <td>7.6</td>
      <td>1.8662</td>
      <td>All transport options</td>
      <td>666</td>
      <td>20.2</td>
      <td>391.45</td>
      <td>5.5275</td>
      <td>-1.337419</td>
      <td>c_24</td>
      <td>high</td>
    </tr>
  </tbody>
</table>
</div>


Once we have grouped the crime rate by bins , let us visualize the normalize sales in those bins
-- Continue here
https://blog.pragmaticengineer.com/becoming-a-better-writer-in-tech/
https://www.naturalreaders.com/
Find a community of proofreaders
##### Sales per Crime Rate

```python
mean_sales_per_crime_rate = store_df.groupby('crime_rate_bin').normalised_sales.mean()
```

```python
mean_sales_per_crime_rate
```




    crime_rate_bin
    low       0.131247
    medium   -0.823125
    high     -1.482766
    Name: normalised_sales, dtype: float64



```python
sns.barplot(y=mean_sales_per_crime_rate.index, x=mean_sales_per_crime_rate)
```




    <AxesSubplot:xlabel='normalised_sales', ylabel='crime_rate_bin'>



![proportion of flats](images/Exploratory-data-analysis_43_1.png){: .center-image }

```python

sns.boxplot(y="normalised_sales", x='crime_rate_bin', data=store_df)
```




    <AxesSubplot:xlabel='crime_rate_bin', ylabel='normalised_sales'>



![crime rate vs sales](images/Exploratory-data-analysis_44_1.png){: .center-image }


The above plot can confirm that the region with the lowest crime rate has the highest sales.
#### Proportion of Flats

```python
visualize_attribute("proportion_flats")
```

![proportion of flats](images/Exploratory-data-analysis_47_0.png){: .center-image }

As for the crime rate in the area, the proportion of flats in the area have outliers. It can be split in two categories for further analysis.

```python
categories_bins = [(-1, 10), (10, 60), (60, store_df["proportion_flats"].max())]
proportion_flats_bin = categorize_attribute("proportion_flats", categories_bins, ["low", "medium", "high"])
store_df['proportion_flats_bin'] = proportion_flats_bin
```

```python
store_df.proportion_flats_bin.value_counts().plot(kind='barh')
```




    <AxesSubplot:>



![proportion of flats](images/Exploratory-data-analysis_50_1.png){: .center-image }

Upon binarizing the proportion of flats in the area, let us visualize the sales in within those bins.

```python

sns.boxplot(y="normalised_sales", x='proportion_flats_bin', data=store_df)
```




    <AxesSubplot:xlabel='proportion_flats_bin', ylabel='normalised_sales'>



![proportion of flats](images/Exploratory-data-analysis_52_1.png){: .center-image }

As per the visualization, the area with low flats proportion has the lowest sales, whereas the area with high flats ratio has the highest sales.
This makes sense because the flats attract more people and those people will like to buy more in The Store.

#### Proportion of commercial properties.
The next property to analyze is the proportion of commercial properties in the area.

As per the documentation, this column contains the percentage of commercial properties in the area; therefore since it contains the percentage, we expect the values to be between 0 and 100. Unfortunately, some values are null and others are not between 0 and 200.

The columns has 29 null values; since there not any information about tne area without commercial properties, for now the missing value can be filled with 0. Then we can ask the business or the data collector why there are missing values. Another alternative would be to drop the attribute with those null values.

#### Property value in the Area



The property values will help to find out how wealthy the area is. The area with expensive property will be more likely to have more sales.

```python
store_df.property_value.isna().value_counts()
```




    False    320
    Name: property_value, dtype: int64



```python
visualize_attribute("property_value", 50)
```

![proportion of flats](images/Exploratory-data-analysis_57_0.png){: .center-image }

The plot illustrates two different bins of property values: one with values lower than 500 and another with values higher than 500.

```python
property_value_correlation = store_df.loc[:, ["property_value"]].corrwith(store_df.normalised_sales).values[0].round(2)
```

```python
sns.relplot(x="property_value", y="normalised_sales", data=store_df);
```



![proportion of flats](images/Exploratory-data-analysis_60_0.png){: .center-image }

The above  plot illustrates that there is no clear linear correlation between property value and normalized sales. It seems to be negative with a Pearson coefficient of {{property_value_correlation}}

Since we have two categories in the property values, we would like to split the columns into two categories and visualize the sales values within those categories.

```python
categories_bins = [(0, 500), (500, store_df["property_value"].max())]
property_value_bin = categorize_attribute("property_value", categories_bins, ["low", "high"])
store_df['property_value_bin'] = property_value_bin
```

```python
sns.boxplot(x="property_value_bin", y="normalised_sales", data=store_df)
```




    <AxesSubplot:xlabel='property_value_bin', ylabel='normalised_sales'>



![proportion of flats](images/Exploratory-data-analysis_64_1.png){: .center-image }

Looking at the property value itself, it seems to correlate with the sales negatively. The areas with the most expensive properties have the lowest sales. In contrast, the area with less expensive property has the highest sales. 

The reason may be that we are not considering the ratio of commercial properties in the area.

Let us combine the property value and the proportion of retail property to get the values of non-retail property and analyze how they are correlated with the sales.

##### Proportion of non_retails

```python
store_df.proportion_nonretail.isna().value_counts()
```




    False    320
    Name: proportion_nonretail, dtype: int64



```python
visualize_attribute("proportion_nonretail")
```

![proportion of flats](images/Exploratory-data-analysis_68_0.png){: .center-image }

Let us combine the property values with the ration of non retails property in the area and visualize

```python
store_df["ratio_property_value_nonretail"] = store_df.property_value / store_df.proportion_nonretail
```

```python
visualize_attribute("ratio_property_value_nonretail", 40)
```

![proportion of flats](images/Exploratory-data-analysis_71_0.png){: .center-image }

```python
sns.relplot(x="ratio_property_value_nonretail", y="normalised_sales", data=store_df)
```




    <seaborn.axisgrid.FacetGrid at 0x131bcbb10>



![proportion of flats](images/Exploratory-data-analysis_72_1.png){: .center-image }

```python
store_df.loc[:, ["ratio_property_value_nonretail"]].corrwith(store_df.normalised_sales)
```




    ratio_property_value_nonretail    0.300517
    dtype: float64



Using the ratio, we cannot capture the correlation between the percentage of property values and the sales.

#### Retail Property Values

Now let combine the property value with retail property values

```python
store_df["retail_property_value"] = store_df.property_value  -  (store_df.property_value * store_df.proportion_nonretail/100)
```

```python
store_df.loc[:, ["commercial_property", "retail_property_value", "property_value", "normalised_sales"]].head()
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
      <th>commercial_property</th>
      <th>retail_property_value</th>
      <th>property_value</th>
      <th>normalised_sales</th>
    </tr>
    <tr>
      <th>location_id</th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>464</th>
      <td>NaN</td>
      <td>545.4540</td>
      <td>666</td>
      <td>-0.399933</td>
    </tr>
    <tr>
      <th>504</th>
      <td>14.85</td>
      <td>253.5192</td>
      <td>264</td>
      <td>2.216308</td>
    </tr>
    <tr>
      <th>295</th>
      <td>7.70</td>
      <td>287.9660</td>
      <td>307</td>
      <td>0.166920</td>
    </tr>
    <tr>
      <th>187</th>
      <td>1.95</td>
      <td>293.2500</td>
      <td>300</td>
      <td>-0.083804</td>
    </tr>
    <tr>
      <th>193</th>
      <td>3.05</td>
      <td>252.6208</td>
      <td>256</td>
      <td>0.962693</td>
    </tr>
  </tbody>
</table>
</div>


```python
visualize_attribute("retail_property_value", 50)
```

![proportion of flats](images/Exploratory-data-analysis_78_0.png){: .center-image }

```python
store_df.loc[:, ["retail_property_value"]].corrwith(store_df.normalised_sales)
```




    retail_property_value   -0.438095
    dtype: float64



```python
sns.relplot(y="retail_property_value", x="normalised_sales", data=store_df)
```




    <seaborn.axisgrid.FacetGrid at 0x131ec8e90>



![proportion of flats](images/Exploratory-data-analysis_80_1.png){: .center-image }

The newly created variable negatively correlates with the normalized sales. The higher the retail property value, the lowers the sales. Therefore, we can assume that the most expensive property attracts fewer people.

After exploring the property attribute, we can visualize the household attributes.

#### Household Attributes

- `household_size`: mean household size in the area
- `household_affluency`: mean household affluency in the area (higher means more affluent)

These attributes hold different household information. For example, they contain the household size and the household affluence.
We will assume that the larger household size in the area yields more sales. Or the more affluent the house is, the more sales in the region. 
The two attributes can be combined to create the household ratio, then a visualization will be made to find out how it correlated with the sales.

```python
store_df.household_size.isna().value_counts()
```




    False    320
    Name: household_size, dtype: int64



```python
store_df.household_affluency.isna().value_counts()
```




    False    320
    Name: household_affluency, dtype: int64



```python
visualize_attribute("household_affluency")
```

![proportion of flats](images/Exploratory-data-analysis_85_0.png){: .center-image }

```python
visualize_attribute("household_size")
```

![proportion of flats](images/Exploratory-data-analysis_86_0.png){: .center-image }

The plot showed us that those attributes follow a normal distribution without outliers.

```python
store_df.loc[:, ["household_size", "household_affluency", "normalised_sales"]].corr()
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
      <th>household_size</th>
      <th>household_affluency</th>
      <th>normalised_sales</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>household_size</th>
      <td>1.000000</td>
      <td>-0.618884</td>
      <td>0.692506</td>
    </tr>
    <tr>
      <th>household_affluency</th>
      <td>-0.618884</td>
      <td>1.000000</td>
      <td>-0.743277</td>
    </tr>
    <tr>
      <th>normalised_sales</th>
      <td>0.692506</td>
      <td>-0.743277</td>
      <td>1.000000</td>
    </tr>
  </tbody>
</table>
</div>


```python
sns.relplot(x="household_size", y="normalised_sales", data=store_df,  hue="property_value_bin")
```




    <seaborn.axisgrid.FacetGrid at 0x131f734d0>



![proportion of flats](images/Exploratory-data-analysis_89_1.png){: .center-image }

The above plot illustrates that a household size greater than two have lower property values, it also describes the linear relationship between the household size and the normalized sales.

```python
sns.relplot(x="household_affluency", y="normalised_sales", data=store_df, hue="property_value_bin")
```




    <seaborn.axisgrid.FacetGrid at 0x13206e610>



![proportion of flats](images/Exploratory-data-analysis_91_1.png){: .center-image }

The two household attributes are correlated with each other on the one hand. However, on the other hand, household size is positively correlated with sales, whereas household affluence is negatively correlated with sales.

Let us create a ratio of the household size and the household affluence and evaluate how it will be correlated with the target variable.

```python
store_df["household_ratio"] = store_df.household_size / store_df.household_affluency
```

```python
visualize_attribute("household_ratio")
```

![proportion of flats](images/Exploratory-data-analysis_94_0.png){: .center-image }

```python
sns.relplot(x="household_ratio", y="normalised_sales", data=store_df, hue="property_value_bin")
```




    <seaborn.axisgrid.FacetGrid at 0x131e20910>



![proportion of flats](images/Exploratory-data-analysis_95_1.png){: .center-image }

An exciting property of that plot is that the new household ratio is highly correlated with sales. The property values shows that the most expensive property also has a lower household ratio and therefore lowers sales.

```python
store_df.loc[:, ["household_size", "household_affluency", "normalised_sales", "household_ratio"]].corr()
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
      <th>household_size</th>
      <th>household_affluency</th>
      <th>normalised_sales</th>
      <th>household_ratio</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>household_size</th>
      <td>1.000000</td>
      <td>-0.618884</td>
      <td>0.692506</td>
      <td>0.741650</td>
    </tr>
    <tr>
      <th>household_affluency</th>
      <td>-0.618884</td>
      <td>1.000000</td>
      <td>-0.743277</td>
      <td>-0.703458</td>
    </tr>
    <tr>
      <th>normalised_sales</th>
      <td>0.692506</td>
      <td>-0.743277</td>
      <td>1.000000</td>
      <td>0.819967</td>
    </tr>
    <tr>
      <th>household_ratio</th>
      <td>0.741650</td>
      <td>-0.703458</td>
      <td>0.819967</td>
      <td>1.000000</td>
    </tr>
  </tbody>
</table>
</div>


By combining the both variable into the household ratio, we have found out that the ration is highly correlated with the target variable with a pearson correlation coefficient of 0.81.

#### New store distribution 

The new store distribution attribute tells us if The Store is recent or not; we can assume that recent stores have fewer sales than older stores. Because people are more likely to buy from the old stores. Let us look at the data and how it spread within The Store.

```python
store_df.new_store.value_counts().plot(kind='barh')
```




    <AxesSubplot:>



![new store distribution](images/Exploratory-data-analysis_100_1.png){: .center-image }

The barplot illustrates that we have more old stores than new one in the areas.

```python
sns.boxplot(y="normalised_sales", x='new_store', data=store_df)
```




    <AxesSubplot:xlabel='new_store', ylabel='normalised_sales'>



![proportion of flats](images/Exploratory-data-analysis_102_1.png){: .center-image }

```python
store_df.new_store.value_counts()
```




    no     301
    yes     19
    Name: new_store, dtype: int64



#### Competitor density

Let's analyze the effect of competitor density on sales.

```python
store_df.competitor_density.max(
)
```




    396.9



```python
visualize_attribute("competitor_density", 50)
```

![proportion of flats](images/Exploratory-data-analysis_107_0.png){: .center-image }

The plot is left-skewed with more regions with a higher density of competitors. Categorizing the attributes may be helpful here.

```python
store_df["competitor_density_bin"] = categorize_attribute("competitor_density", [(0, 300), (300, 400)], ["low", "high"])
```

```python
sns.boxplot(y="normalised_sales", x="competitor_density_bin", data=store_df)
```




    <AxesSubplot:xlabel='competitor_density_bin', ylabel='normalised_sales'>



![proportion of flats](images/Exploratory-data-analysis_110_1.png){: .center-image }

```python
store_df.loc[:, ["competitor_density"]].corrwith(store_df.normalised_sales)
```




    competitor_density    0.338284
    dtype: float64



```python
sns.relplot(y="competitor_density", x="normalised_sales", data=store_df)
```




    <seaborn.axisgrid.FacetGrid at 0x1318d6e10>



![proportion of flats](images/Exploratory-data-analysis_112_1.png){: .center-image }

Even after binarizing the attribute, it can be noticed that the region with higher competitors tends to have higher sales. The correct explanation is that competitors tend to establish their stores in the area, which is attractive in terms of sales. They have done the analysis before and found a viable market in the region, and the demand is high, so they have established their stores.

#### Transport Availability

This illustrates the availability of different transport in the area; this attribute can help us to assess how accessible a shop is; a more accessible shop should be expected to have more sales.

```python
store_df.transport_availability.isna().value_counts()
```




    False    320
    Name: transport_availability, dtype: int64



```python
store_df.transport_availability.value_counts().plot(kind='barh')
```




    <AxesSubplot:>



![proportion of flats](images/Exploratory-data-analysis_116_1.png){: .center-image }

In those categories , let us visualize the mean of of the sales.

```python
sns.boxplot(y="normalised_sales", x=store_df.transport_availability.str.split(" ", expand=True)[0], data=store_df)
```




    <AxesSubplot:xlabel='0', ylabel='normalised_sales'>



![proportion of flats](images/Exploratory-data-analysis_118_1.png){: .center-image }

```python
store_df.groupby("transport_availability").agg({"normalised_sales": lambda x: np.abs(x).mean()})
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
      <th>normalised_sales</th>
    </tr>
    <tr>
      <th>transport_availability</th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>All transport options</th>
      <td>0.903049</td>
    </tr>
    <tr>
      <th>Average transport options</th>
      <td>0.699405</td>
    </tr>
    <tr>
      <th>Few transport options</th>
      <td>0.515991</td>
    </tr>
    <tr>
      <th>Many transport options</th>
      <td>0.656850</td>
    </tr>
    <tr>
      <th>No transport options</th>
      <td>0.679603</td>
    </tr>
  </tbody>
</table>
</div>


The transport availability is not linear correlated with the sales and the few locations with higher sales are spread out in different transport availability categories.

#### Public Transport Distribution 

```python
store_df.public_transport_dist.isna().value_counts()
```




    False    320
    Name: public_transport_dist, dtype: int64



There is no null values of the public transport distribution , let us now visualize the distribution of the public transport distribution

```python
visualize_attribute("public_transport_dist")
```

![proportion of flats](images/Exploratory-data-analysis_124_0.png){: .center-image }

```python
store_df.public_transport_dist.max()
```




    10.7103



```python
to_drop_index = store_df.loc[store_df.public_transport_dist == store_df.public_transport_dist.max()].index
```

```python
store_df = store_df.drop(to_drop_index, inplace=False)
```

```python
store_df.loc[:, ["public_transport_dist"]].corrwith(store_df.normalised_sales)
```




    public_transport_dist    0.279198
    dtype: float64



```python
visualize_attribute("public_transport_dist")
```

![proportion of flats](images/Exploratory-data-analysis_129_0.png){: .center-image }

This attribute does not have any linear correlation with thne target attribute.

```python
store_df.head()
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
      <th>crime_rate</th>
      <th>proportion_flats</th>
      <th>proportion_nonretail</th>
      <th>new_store</th>
      <th>commercial_property</th>
      <th>household_size</th>
      <th>proportion_newbuilds</th>
      <th>public_transport_dist</th>
      <th>transport_availability</th>
      <th>property_value</th>
      <th>...</th>
      <th>household_affluency</th>
      <th>normalised_sales</th>
      <th>county</th>
      <th>crime_rate_bin</th>
      <th>proportion_flats_bin</th>
      <th>property_value_bin</th>
      <th>ratio_property_value_nonretail</th>
      <th>retail_property_value</th>
      <th>household_ratio</th>
      <th>competitor_density_bin</th>
    </tr>
    <tr>
      <th>location_id</th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>464</th>
      <td>17.600541</td>
      <td>0.0</td>
      <td>18.10</td>
      <td>no</td>
      <td>NaN</td>
      <td>2.926</td>
      <td>29.0</td>
      <td>2.9084</td>
      <td>All transport options</td>
      <td>666</td>
      <td>...</td>
      <td>4.5325</td>
      <td>-0.399933</td>
      <td>c_40</td>
      <td>medium</td>
      <td>low</td>
      <td>high</td>
      <td>36.795580</td>
      <td>545.4540</td>
      <td>0.645560</td>
      <td>high</td>
    </tr>
    <tr>
      <th>504</th>
      <td>0.603556</td>
      <td>20.0</td>
      <td>3.97</td>
      <td>no</td>
      <td>14.85</td>
      <td>4.520</td>
      <td>10.6</td>
      <td>2.1398</td>
      <td>Average transport options</td>
      <td>264</td>
      <td>...</td>
      <td>1.8150</td>
      <td>2.216308</td>
      <td>c_80</td>
      <td>low</td>
      <td>medium</td>
      <td>low</td>
      <td>66.498741</td>
      <td>253.5192</td>
      <td>2.490358</td>
      <td>high</td>
    </tr>
    <tr>
      <th>295</th>
      <td>0.606810</td>
      <td>0.0</td>
      <td>6.20</td>
      <td>no</td>
      <td>7.70</td>
      <td>2.981</td>
      <td>31.9</td>
      <td>3.6715</td>
      <td>Many transport options</td>
      <td>307</td>
      <td>...</td>
      <td>2.9125</td>
      <td>0.166920</td>
      <td>c_53</td>
      <td>low</td>
      <td>low</td>
      <td>low</td>
      <td>49.516129</td>
      <td>287.9660</td>
      <td>1.023519</td>
      <td>high</td>
    </tr>
    <tr>
      <th>187</th>
      <td>0.012385</td>
      <td>55.0</td>
      <td>2.25</td>
      <td>no</td>
      <td>1.95</td>
      <td>3.453</td>
      <td>68.1</td>
      <td>7.3073</td>
      <td>No transport options</td>
      <td>300</td>
      <td>...</td>
      <td>2.0575</td>
      <td>-0.083804</td>
      <td>c_65</td>
      <td>low</td>
      <td>medium</td>
      <td>low</td>
      <td>133.333333</td>
      <td>293.2500</td>
      <td>1.678250</td>
      <td>high</td>
    </tr>
    <tr>
      <th>193</th>
      <td>0.016182</td>
      <td>100.0</td>
      <td>1.32</td>
      <td>no</td>
      <td>3.05</td>
      <td>3.816</td>
      <td>59.5</td>
      <td>8.3248</td>
      <td>Average transport options</td>
      <td>256</td>
      <td>...</td>
      <td>0.9875</td>
      <td>0.962693</td>
      <td>c_97</td>
      <td>low</td>
      <td>high</td>
      <td>low</td>
      <td>193.939394</td>
      <td>252.6208</td>
      <td>3.864304</td>
      <td>high</td>
    </tr>
  </tbody>
</table>
<p>5 rows × 22 columns</p>
</div>


```python
sns.relplot(x="public_transport_dist", y="normalised_sales", data=store_df, hue="transport_availability");
```

![proportion of flats](images/Exploratory-data-analysis_132_0.png){: .center-image }

By combining the public transport distribution with the transport availability , there is no clear correlation between the two variables.

#### School Proximity

```python
store_df.school_proximity.min
```




    <bound method NDFrame._add_numeric_operations.<locals>.min of location_id
    464    20.2
    504    13.0
    295    17.4
    187    15.3
    193    15.1
           ... 
    106    15.2
    24     13.0
    473    21.0
    76      NaN
    401    17.6
    Name: school_proximity, Length: 319, dtype: float64>



The two columns has missing values , 
- an idea before continuing may be to fill those values with the mean of the attribute. 
- Or since the columns have more than 20 % of missing  values we can consider dropping them and leverage the information from the other columns.

#### County

```python
store_df.groupby("county").aggregate({"normalised_sales": np.mean}).sort_values("normalised_sales", ascending=False)
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
      <th>normalised_sales</th>
    </tr>
    <tr>
      <th>county</th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>c_137</th>
      <td>2.968477</td>
    </tr>
    <tr>
      <th>c_144</th>
      <td>2.968477</td>
    </tr>
    <tr>
      <th>c_112</th>
      <td>2.968477</td>
    </tr>
    <tr>
      <th>c_114</th>
      <td>2.968477</td>
    </tr>
    <tr>
      <th>c_122</th>
      <td>2.968477</td>
    </tr>
    <tr>
      <th>...</th>
      <td>...</td>
    </tr>
    <tr>
      <th>c_0</th>
      <td>-1.424627</td>
    </tr>
    <tr>
      <th>c_25</th>
      <td>-1.438253</td>
    </tr>
    <tr>
      <th>c_30</th>
      <td>-1.451879</td>
    </tr>
    <tr>
      <th>c_24</th>
      <td>-1.517285</td>
    </tr>
    <tr>
      <th>c_32</th>
      <td>-1.533637</td>
    </tr>
  </tbody>
</table>
<p>98 rows × 1 columns</p>
</div>


```python
sales_by_count_sorted = store_df.groupby("county").aggregate({"normalised_sales": np.mean}).sort_values("normalised_sales", ascending=False)
```

```python
fig, axe = plt.subplots(figsize=(25, 10), ncols=1, nrows=1)
sns.boxplot(y="normalised_sales", x="county", data=store_df, order=sales_by_count_sorted.index, ax=axe)
axe.tick_params(axis='x', labelrotation=90)
```

![proportion of flats](images/Exploratory-data-analysis_140_0.png){: .center-image }

The plot illustrates that the sales are higher in some region , but lowers in other region. A further analysis can be conducted to find out what are affecting the sales in those regions.

### Conclusion on the Data Analysis:

This section the Exploratory data analysis was completed. This analysis help in understanding the variables distributions, the correlations between each variable and the target attribute. At the end of the analysis, different ways of combining features were explored.

As per the analysis, here are the key findings.


#### Linear Correlations with the target variable

- By splitting the crime rate into different categories, we discovered that the crime rate is negatively correlated with sales. Therefore, the region with a higher crime rate has lower sales.
- A strong linear correlation exists between the household ratio and the number of sales. The household ratio is defined as of the  household size divided by the  household affluency.
- The more competitor in the region, the higher are the sales in that region.
- There seems not to be a clear linear correlation between the transport attributes and the sales.
- The property values are negatively correlated with the sales, the more expensive the property values in the region, the lower the rates in the area.
- A new variable combining the property values and the ratio of non-retail property were created. The it was found that the new created ratio is silghly correlated with the sales.
- The region with a higher proportion of flats seems to have higher sales.
- The higher sales in the dataset came from the specific county. For now, we didn't dive deeper into that attribute to find out if that may be a random phenomenon.  

#### Variables with Missing values: 

- We found that the school_proximity and the commercial property values have more than 9 % of missing values. For the further steps, we decided not to use those values for the machine learning modeling and will ask the business to collect more data about the missing values.

#### Other important attributes that may be useful: 

- We found that *demographic data* about the region may be necessary for our analysis. Attributes such as the population's median age may be important for our analysis.

- *Geo coordinates* information can also be necessary for our analysis. It could be useful if we have latitude and longitude information for every location.

- On a more general notes, collecting more samples and filling the missing data could be usefull for the analysis.


Add this notebook https://jaketae.github.io/blog/jupyter-automation/

```python

```
