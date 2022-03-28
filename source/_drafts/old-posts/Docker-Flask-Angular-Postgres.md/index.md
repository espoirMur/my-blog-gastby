I spent more than 24 hours trying to figure out why a flask app is unable to communicate with a postgres sql database 
while both are shipping in docker containners.


docker exec -it containaer_id command


run inside a container 


fix the problem with docker port for postgres

**1rst Attempt :**

[from this ](https://stackoverflow.com/a/48140493/4683950)
answer on stackoverflow i need to check my databse url, the dabase is correct

change database uri to
ENV DATABASE_URL="postgresql://espoir_mur:9874@0.0.0.0:5432/adra_hr"

**2nd Attempt :**

[Try this answer](https://stackoverflow.com/a/47378186/4683950)
here it' said that i should Y run a container called dadarek/wait-for-dependencies as a mechanism to wait 
for services to be up(in your case, postgres).

but it doesn't works also.


keep debugging 

**3rd attempt**:

I go and read about race condition with the python app and the docker container [here](https://github.com/arachnys/cabot/issues/416)
I need to write a python script that check if the port is open , but the script doesn't work also.

I'm sure that the prosgres database is up but I'm unable to connect to it .
how can i conenct to it ??
is it a problem of url??
sound like.
let go deeper
[This user](https://stackoverflow.com/q/49325745/4683950) also have the same error

**4th attempt:**

usinng this url schema

postgresql://testusr:password@postgres:5432/testdb

[this](https://stackoverflow.com/a/48422901/4683950) question gives also another explanation it said :
Postgres is not running in the same container as the flask application, that why it can not be acceded via localhost .
we should find the ip adress of the docker container with flask and add it , or just add __postgres__  or _volume_name_ in place of localhost.
And finaly this solve my problem.
Okey...

####I'm safe now





