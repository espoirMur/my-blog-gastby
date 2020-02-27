# Central Limit theorem

### How come I was learning Machine learning and data science without knowing the central limit theorem????


Here are some random ideas about what I'm learning about the central limit theorem

**Here is the full formulation of the theorem :**

__The distribution of means across repeated samples will be normal with a mean equal to the population mean 
and a standard deviation equal to the population standard deviation divided by the square root of n.__

If we split it in 2 part we get this :

- The mean of the sampling distribution of __**sample mean**__ is equal to the __population__ mean.
- The standard deviation of the sampling distribution if X_ is equal  (\sigma divide by sqrt(n))

let  some concepts : 


- A __sample__ is a subset of the population with a given size that size is called a __sample size__


A sampling distribution for the sample mean is produced by repeatedly selecting simple random samples from the same population and of the same size, 
and then computing the sample mean for each of these samples. 
These samples are to be thought of as being independent of one another.

When we are taking samples from a non-normal population,
the distribution of the sample means tends toward the normal when we increase the sample size.
if n >= 30 the distribution of the sample mean tend to be normal (rough guideline)

That means :
- if we are taking a sample of size 1 we will have the same distribution as our population distribution
- if n tend to be larger or let say n tend to the infinity we will have a normal distribution for our sample mean distribution.

Importance of that theorem is :

This is very important as you can compute many statistical properties which can be applied to many problems as 
it would be computed for a normal distribution. Once it holds true and you know underlying distribution is normal distribution, 
you compute mean and variance and so other statistical properties which would otherwise be very difficult 
if underlying distribution is unknown and you cannot make assumptions.
[Source](http://qr.ae/TUp4gH)

Central Limit Theorem in Practice
The unexpected appearance of a normal distribution from a population distribution that is skewed (even quite heavily skewed) has some very important applications in statistical practice. 
Many practices in statistics, such as those involving hypothesis testing or confidence intervals, make some assumptions concerning the population that the data was obtained from. 
One assumption that is initially made in a statistics course is that the populations that we work with are normally distributed.

The assumption that data is from a normal distribution simplifies matters but seems a little unrealistic. 
Just a little work with some real-world data shows that outliers, ​skewness, multiple peaks and asymmetry show up quite routinely.
We can get around the problem of data from a population that is not normal. 
The use of an appropriate sample size and the central limit theorem help us to get around the problem of data from populations that are not normal.

Thus, even though we might not know the shape of the distribution where our data comes from, 
the central limit theorem says that we can treat the sampling distribution as if it were normal.
Of course, in order for the conclusions of the theorem to hold, we do need a sample size that is large enough. 
Exploratory data analysis can help us to determine how large of a sample is necessary for a given situation.
[Source](https://www.thoughtco.com/importance-of-the-central-limit-theorem-3126556)


It's is important in inferential statics because we can infer many properties of a population which is not normal
by using properties of a sample size which tend to be normal.

[Reference](https://www.youtube.com/watch?v=Pujol1yC1_A)
