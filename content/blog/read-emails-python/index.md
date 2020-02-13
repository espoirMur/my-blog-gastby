method, for each part we check if the main type is not multipart , and content disposition is  None
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
