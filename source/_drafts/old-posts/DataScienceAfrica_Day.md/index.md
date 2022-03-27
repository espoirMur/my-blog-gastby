# Fundemental of IOT session

I finally landed to Nyeri after a long trip of more than 1000 km by bus .I think I should write a blog post the trip too.

But let me talk about serious things first.

Later that year I applied to the data science summer school which is organized with data science africa and I had the privelge to
be among the few people who was selected to attend the event.
The summer school is a workshop where suddent are trained about data science and their pratical application.
you can fouund more about the 2018 event [here](http://www.datascienceafrica.org/dsa2018/).

The theme of this year workshop is : **_End-to-end data science._** and it took place at [Dedan kimati university of science and technology in Nyeri](https://www.dkut.ac.ke/).

We started with a brief introduction to data science done by : 
**Dina Machuve**  from  Nelson Mandela African Institute of Science and Technology
she gaves us a short introduction on data science and explain us the difference between Machine learning and data science(the famous debate)

The intresting stuffs  started when **Jan Jongboom** from ARM begun his lecture about **Fundamentals of IoT**
i was confused on  what IOT has to do with data science and machine learning but he gives me clarification when he said that :

**_Playing with machine learning models is fun but...
but data acquisition is even more important_** ch

He give us an introduction to data collection with sensors.

He talked us about ARM devices for data collection :
We played with 4 devices we are going to use for data collection:
- we learned about the ARM MBED micro controller whith the [NUCLEO F446RE board](http://www.st.com/en/evaluation-tools/nucleo-f446re.html) similar to arduino , 
- LoRaWAN connectivity shield basically it allows for things to talk to the internet without 3G or WiFi. So no WiFi codes and no mobile subscriptions.
- the moisure sensor 
- and the humidity and temperature sensor

In the first part of the pratical session we learned how to connect the differents componements , connect it to the [think network](https://www.thethingsnetwork.org/) dashboard and played with some simulation on theirs online IDE.
After the first part we was able to build a full working kit.
- [check this tweet](https://twitter.com/EspyMur/status/1002135942826790912)


After the break we went to the field to start collecting data in real life.
The goal of this session was to discovered how to use data sceince to improve agriculture in africa and collect real data about real african problem.
Before deploying ours kit we spoke to the farmers and she told us what problem they are facing and how internet of things could help them.
we noticed that they are actually in need of chlorophylle sensor.
then we deployed our kits in the tomatoes green house and connect them to thing network

- [check this tweet](https://twitter.com/DCivin/status/1002210061010243584) 

The data was directly being saved in an ElasticSearch database and visualised via Kibana platfeform (In the comming days data engineers from ARM will explain us  the whole process of collecting data from sensorto kibana plateform.)

That was all for today workshop, we learned a lot specially about the electronic behind data science, I also learned that we can now run tensorflow on micro controller with a open source plateform called utensorflow.
If you are intrested in electronic and Machine learning fill free to check out their [github repos](http://utensor.ai/).
See you tommorow for the next session.
