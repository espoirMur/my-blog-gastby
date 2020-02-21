---
title: Reading Emails from a Mailbox with python
date: "2020-02-14T22:12:03.284Z"
description: "Tutorails on how to read emails in Python"
---
### The Problem

Recently I received a strange requirement from the person am working with.
He said that I have to write a script that connect to a specific mailbox check everytime if there is a new emails , read it and get the attachement and do some data analysis from that attachement.
I was super excited and I asked myself , is it possible to read emails using python? 
I started googling and I found that it is possible to read emails using pyhton.
In the following blog post I am going to explain how I manage to read emails from an IMAP mail server and how I download the attachment and save them into a  specific folder.
If you are familiar with Python this tutorial is for you. In order to complete this tutorial you need to have python 3.6 installed in your laptop and virtual environement installed.

#### First thing first create the project and initialise your virtual environement

Let us create a project we will be using :
Naviguate to your command line and type the following code :
`mkdir read_emails_project & cd read_emails_project`

Once in the project let initialise git :

`git init`

Once git is initialised let us create a virtual environement:
`virtualenv -p python .venv`

You can actiavte the virtual environement with the following lines :

`source .venv/bin/activate`

It's not a must to use virtual environement you can use your prefered environement manager , for me I prefer to use virtual environements.

Once you are set up we can start with serious things.

#### Never Write credentials into code Use Environements variables 

Since we are reading mails from an inbox we will need emails credientials. Where to read those crendials from?
One thing is sure we are not putting them into the code , this is BAD PRACTISE you can be jailed for putting credentials or secret codes into a code base.

We will be using .env file that will be secret to us and we will never share it with anyone online , even putting it in a private git repository.

let us create the .env file 

`touch .env`

And create a gitignore file to tell git to ignore this file 

`touch .gitignore`

open the .gitignore and add the following line to it to ignore the env file :
```
    .venv
    env
```
In those lines we are telling git to ingore our env files and our virtualenvironements.

Now we can populate the env file with our crentatials :

```
USER_EMAIL='your@email.com'
USER_PASSWORD='your secret password'
```
Once our emails credentails are created , let us write a function that will be reading it .
for this we will be using a pyhton package called [python-dotenv](https://github.com/theskumar/python-dotenv)

let install it with :
`pip install -U python-dotenv`

let us write a function that read and return those environements : 

You can create a file name `utils.py` and add the following code : 

```python
import os
from dotenv import load_dotenv

def read_credentails():
    """
    Return users credentials from the environnement variable
    raise a an exception if the credentials are empty
    
    Raises:
        NotImplementedError: [description]
    """
    load_dotenv()

    USER_EMAIL = os.getenv("USER_EMAIL")
    USER_PASSWORD = os.getenv("USER_PASSWORD")
    if USER_EMAIL and USER_PASSWORD:
        return USER_EMAIL, USER_PASSWORD
    else:
        raise ValueError('Please add a .env file and put the credentials on it,\
                         refer to the sample')
```

From that function you can noticed that we are using `load_env` function that load the environement variables from our .env files and expose them to system environment variables so we can be able to read them from that.
The function return those environement variables so that we can be able to use them easily.
In the next section we are going to do do serious stuff which envolves reading mails and download attachments.

#### Reading emails 

I was happy to find that Python has a build in feature to that enable us to connect to a mailbox .
It comes in the `imaplib` module and has utils to parse emails in the `email`
module.

let create a file `readaing_emails_scripts.py` inside it we are going to perform all the magic we need .

Let us import the module we need :

```python
from email import message_from_bytes
from imaplib import IMAP4_SSL
from .utils import read_credentails
```

We are importing the : 
- message_from_bytes function from emails module, it will helps us to read the emails which comes as bytes and convert it to text.
- IMAP4_SSL : class which is the main class that will help us to perform all the operations
Note that we are using IMAP4 protocol to read mails IMAP4 is an mail protocol used to access a mailbox on a remote server from a local email client. IMAP can be more complex, but provide more convenience for syncing across multiple devices.
You can read more about emails protocol [here](https://www.navigator.ca/support/imap-pop3-smtp/) 
- our read_credentials function which is self explanatory.

I have create a funtion that perform the operation and return a generator with all mails found in the mail box , here it's is :

```python
def get_filter_unseen_emails(email_address, password):
    """
    Filter the email and return unseen emails
    Args:
        email_address (string): recipient email
        password (password): recipient password
    """
    with IMAP4_SSL("your_imap_server") as mail_connection:
        mail_connection.login(email_address, password)
        mail_connection.list()
        mail_connection.select('INBOX')
        (retcode, messages) = mail_connection.search(None,
            '(OR (UNSEEN) (FROM your.email@gmail.com))')
        if retcode == 'OK' and messages[0]:
            for index, num in enumerate(messages[0].split()):
                typ, data = mail_connection.fetch(num, '(RFC822)')
                msg = message_from_bytes(data[0][1])
                typ, data = mail_connection.store(num, '+FLAGS', '\\Seen')
                yield msg
```
You can see that we are instaciating a secure mail_connection from the IMAP4SSL class.
We will be using the mail_connection object to perform all operatiosn we want to our mailbox.

After instanciating we login to the mail box with our credentials , then we list all the mailbox names we have eg : In google we have INBOX, SPAM, UPDATES, FORUMS , SPAMS etc
The we select only inbox folder , and from inbox we filter only unseen messages or coming from your address email.
Note that you can make any specific search in your inbox and even complicated queries you may think about.

The serach return retcodes with messaes and their IDS 
Note that : 
>Message ids are assigned by the server, and are implementation dependent. The IMAP4 >protocol makes a distinction between sequential ids for messages at a given point in time >during a transaction and UID identifiers for messages, but not all servers seem to bother.

Once have messages ids we can fetch ids and the hearders format we are looking for.
We are using RFC822 to fetch  the entire message as an RFC 2822 fromated message.
RFC 2822 is a protocol for standard messages send between computers , you can read more about it [here](https://tools.ietf.org/html/rfc2822.html)

The next line we are using the message_from_bytes function from the email module to convert the bytes we received as a message.

Next we mark the message as seen by using the store method

and we yied the results to our iterator (add an explantion of that )

Once we have retrieve the emails let us check the function that get attachement from that email.
```pyhton
def get_mail_attachments(message, condition_check):
    """
    Get attachments files from mail
    Args:
        message (email ): email object to retrieve attachment from
        condition_check ([function]): the function to use when filtering the
        email should return specific condition we are filtering
    Returns:
        [filename, file]: the file name, input stream from the files
    """
    for part in message.walk():
        if part.get_content_maintype() == 'multipart':
            continue
        if not part.get('Content-Disposition'):
            continue
        file_name = part.get_filename()
        if condition_check(file_name):
            return part.get_filename(), part.get_payload(decode=1)
```
This function take the email object yield by the  last function and a filter function which tell which extension we can filter from the email, iterate over all his part using walk() method, for each part we check if the main type is not multipart , and content disposition is  None
(Need to check this)

if none of those condition is satisfied we get the file name and return the byte stream from the email.

#### Putting everything together:*
We now have all the building block of the applicaiton let put them in the main function:
```python
if __name__ == "__main__":
 email_address, password = read_credentails()
    messages = get_filter_unseen_emails(email_address, password)
    if messages:
        for message in messages:
            attachment = get_mail_attachments(message,
                                              lambda x: x.endswith('.xml'))
            if attachment:
                with open('./data/xml_files/{}'.format(attachment[0]), 'wb') as file:
                    file.write(attachment[1])
```

And we are done

REFerence
https://pymotw.com/2/imaplib/

https://medium.com/@sdoshi579/to-read-emails-and-download-attachments-in-python-6d7d6b60269
