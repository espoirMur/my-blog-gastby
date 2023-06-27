
Pandas

It was created by [Wes McKinney](https://wesmckinney.com/) which is one the best and the most used Python Library. Most of us started our Python journey by installing Pandas.

Unfortunately, a nine years later after creating the library the founder wrote a post were he shared things he hate about pandas. He confess that he didn't follow the best engineering practices when developing the library and the code was ugly.He highlighted them in [this post](https://datapythonista.me/blog/pandas-20-and-the-arrow-revolution-part-i) , they are: 
1.  Internals too far from "the metal"
2.  No support for memory-mapped datasets
3.  Poor performance in database and file ingest / export
4.  Warty missing data support
5.  Lack of transparency into memory use, RAM management
6.  Weak support for categorical data
7.  Complex groupby operations awkward and slow
8.  Appending data to a DataFrame tedious and very costly
9.  Limited, non-extensible type metadata
10.  Eager evaluation model, no query planning
11.  "Slow", limited multicore algorithms for large datasets


In this short writeup and presentation I will try to explain how Pandas 2.0  and later polar solves some of those problem with some code and benchmarks. 

#### Pandas 2.0 and the Arrow revolution

To perform any operation pandas has to read data into the memory first, this step involves deciding which datatype to use to store the data in memory. For this the earlier version of python was using numpy as backend. However Numpy did not have a support for categorical data and missing values. In fact Numpy mean number Python. Arrow which is a  data structure library provide different and optimal metadata and for different datatypes.  It also provides a new column oriented format to managed data on top of which is based the parquet data type as well a zero copy feature to move data across different layers. 

For the seek of simplicity we will talk about how Pandas 2.0 benefit from the arrow type to improve **memory usage** and  **speed** of pandas operation.

Let see different improvement on datatype done by Arrow.

### Nan Values.
By default with Pandas and numpy Nan was considered as floats

[`NaN`  is considered a  `float`](https://stackoverflow.com/questions/48558973/why-is-nan-considered-as-a-float). The  [docs currently (as of v0.23)](http://pandas.pydata.org/pandas-docs/stable/gotchas.html#support-for-integer-na)  specify the reason why integer series are upcasted to  `float`:

> In the absence of high performance NA support being built into NumPy from the ground up, the primary casualty is the ability to represent NAs in integer arrays.
> 
> This trade-off is made largely for memory and performance reasons, and also so that the resulting Series continues to be “numeric”.
This lead to a problem when dealing with integer with Missing values. They are all converted into float which introduce a memory issue.

#### Why is a Problem to represent missing values?

In an 8 bit integer all values are taken  and there is no way to represent missing values using Int. If an integer column has missing value it is automatically converted to float.

More recently, after extension arrays were added to pandas, it was possible for pandas to add its own data types for missing values. These are implemented by using two arrays instead of one. The main array represents the data in the same way as if there were no missing values. But there is an additional boolean array that indicates which values from the main array are present and need to be considered, and which are not and must be ignored. (To rephrase). Isn't it more?


### What about String? 

In Arrow, categorical data is a first-class citizen, and we have prioritized having an efficient and consistent representation both in-memory and on the wire or in shared memory. We support sharing categories (called _dictionaries_ in Arrow) between multiple arrays.


### What about other datatypes?

- The boolean type in Arrow use a single **bit** per value and consume one eight of the memory contrary to numpy which use **byte**.
- In With Numpy datetime are saved  with 64 bits, however Arrow does better than that it has a better support of datae only and time only data with different precision, 32, 64 bits.

References: 
- https://www.reddit.com/r/Python/comments/12b7w3y/everything_you_need_to_know_about_pandas_200/
- https://stackoverflow.com/questions/11548005/numpy-or-pandas-keeping-array-type-as-integer-while-having-a-nan-value
- https://wesmckinney.com/blog/apache-arrow-pandas-internals/
- https://datapythonista.me/blog/pandas-20-and-the-arrow-revolution-part-i  
