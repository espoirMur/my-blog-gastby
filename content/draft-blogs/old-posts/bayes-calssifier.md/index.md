The first assumption we made for the bayes classifier is the fact that the data is IID (Identical independant distributed)

And from [here](https://stats.stackexchange.com/a/187492/154672) we can learn that 

__Two events are said to be independent if the occurrence of one does not give you any information as to whether the other event occurred or not. 
In particular,the probability that we ascribe to the second event is not affected by the knowledge that the first event has occurred.__

So the first basic assumption of a bayes classifier is that our dataset is IID

The goal of the bayes classifier is to maximize :

\begin{equation}

\argmax_\y P(Y=y|X=x)

\end{equation}

using the bayes theorem this turn out to be  proportional to :

\begin{equation}

\argmax_\y P(X=x|Y=y) x P(Y=y)

\end{equation}

It's equal to the likelyhood times the prior of the label

So we been assuming up to now that we know the class conditional density of each class in the bayes classifier.
But in general, we don't know that density, we have to pick it and approximate it.

We cannot construct a classifier without knowing the Probalility  of  P(X=x|Y=y), P(Y=y) or P(Y=y|X=x) we need to approximate it.

So in real life we are going to use the data to approximate the distribution.
We use the gaussian approximation for class distribution
 
 Naives bayes :
 
 We assume that our features are independants.
 
 ## Bayes Classifier :
 
So with the bayes classifier , we predict the class for
a new x to be the most probable label given the model and given training data.
That means :
we predict a new instance to be in class 1 if :
\begin{equation}
P(X=x|Y=1) x P(Y=1) > P(X=x|Y=0) x P(Y=0) 
\end{equation}
P(X=x|Y=1) : Likelyhood of X given it came from class 1 
P(Y=1) : prior of class 1
$$\begin{equation}
log\frac{P(X=x|Y=1) x P(Y=1)}{P(X=x|Y=0) x P(Y=0)} > 0
\end{equation}$$

The last formula is called the log odds, 
We can actually calculate it considering the fact that our data came from a multivariate gaussian.

