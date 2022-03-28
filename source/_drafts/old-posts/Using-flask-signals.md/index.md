Learning how to send signals via flask:

but let define what is a signals

## Defintion 

We can find many definition of signals and event in the net but this is my prefered from [django documentation](https://docs.djangoproject.com/en/dev/topics/signals/)

*Django includes a “signal dispatcher” which helps allow decoupled applications get notified when actions occur elsewhere in the framework. 
In a nutshell, signals allow certain senders to notify a set of receivers that some action has taken place. 
They’re especially useful when many pieces of code may be in  the same events.*

And this other one came [from flask](http://flask.pocoo.org/docs/1.0/signals/):

*What are signals? Signals help you decouple applications by sending notifications when actions occur elsewhere in the core framework or another Flask extensions. In short, signals allow certain senders to notify subscribers that something happened.*

What are signals? Signals help you decouple applications by sending notifications when actions occur elsewhere in the core framework or another Flask extensions. 
In short, signals allow certain senders to notify subscribers that something happened.

The following picture illustrate well how signals works :

![this](pictures/signals.png)

so it means that a signals has a publisher (or an object that emit the signals ) and suscriber (object that are supposed to receive signals)

In a web application publisher can be an object or a table in a database , it send signals when any of the CRUD operation happens in the database.

A suscriber can be an application user or an admin who is logging any action happening in the application.

So basically here is what I try to accomplish .
I want our web application to be able to do this in the dasboard:

![this](pictures/signals_2.png)

Show a recent activity about some action that happens in the application.

## Implementation with flask

The next question is how to implement it with flask???

Here is [an answer](https://stackoverflow.com/questions/12340576/are-there-generic-python-libraries-that-provide-signals-event-capability-lik) from stackoverfow that gives  us some possibilities.
>
>There are a number of modules for this. Here are a few options, ordered by what I think their popularity is:

>* The [blinker](https://github.com/jek/blinker/) module provides a signal/event mechanism
>* [PyDispatcher](http://pydispatcher.sourceforge.net/) gives you event dispatch
>* The [PySignals](https://github.com/theojulienne/PySignals) module is the Django signals module without any dependency on >Django
>* [SpiffSignal](http://pypi.python.org/pypi/SpiffSignal/0.1.0) implements a signal/event framework, but its GitHub page seems to be missing

Flask also have [an extension](http://flask.pocoo.org/docs/1.0/signals/) that support signals  it's based on blinker.

Let us use the last tutorial and try to integrate signals in our blinker app:
The main ideas is to send signals each time a bucketlist is create edited and updated.

### Creating signals :

Here is how signals are created :

```
from blinker import Namespace
my_signals = Namespace()
```
We use Namespace class from blinker and create an signal object from that signal.

And we can create it like 

```
model_saved = my_signals.signal('model-saved')
```

Once signals are created they need to be sent :

### Sending signals

from the doc:

If you want to emit a signal, you can do so by calling the send() method. 
It accepts a sender as first argument and optionally some keyword arguments that are forwarded to the signal subscribers:

let add the following method to the buckelist class in the method save :


```
model_saved.send(self, message='bucketlist created')
```
###  Receiving signals (Suscribe to signals)

Once signals are send they need to be received :

> Signal.connect() registers a function to be invoked each time the signal is emitted. 
> Connected functions are always passed the object that caused the signal to be emitted.

```
def subscriber(sender):
...     print("Got a signal sent by %r" % sender)
...
model_saved.connect(subscriber)

```

Once signals are send they need to be received :


With this we can celbrate because we got our first signal:
Sending 

![getting](pictures/signal_received.png)
and receiving

![sending](pictures/sending_request.png)

Next steps:

The good new is we can send signals when an object is created to our database 

the bad new is how can we customised it :

so that it can be seen only by an admin and save in the transactions??

and send them only to admin?

thing that signals are not suitable for this process, it's just better to get data from datatbase and show it to the admin.

Stupid me:!!!!!!!!
how come I spend time learning those stuff while I will not using them

I just need to run query and get everything I need....

