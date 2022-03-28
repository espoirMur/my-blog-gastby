### Migrating Data from Local Database to docker database.

Here are the step to migrate data from a local postgres database to a postgres database in a docker containner

- **Export database schemas to a .sql file:**

From [this](https://stackoverflow.com/a/50823671/4683950) question on stackoveflow the best way to do it in mack is to use the command pg_dump.

*Not via psql program but directly via commannd line*

```
pg_dump --host=localhost --port=ports_psql --username=your_username --dbname=db_name --format=custom --file=file_name.sql
```

once the file is exported it need to be copied in the docker container where the psql database is running.

- **Copy The database file in the docker container**

Here is the comand i use to copy a file from a local machine to a docker containner .
```
docker cp file_name $(docker-compose ps -q postgres):/new_file_name
```
Once it's exported in the docker container , the file need to be imported to the database here.

- **Import the schemas to the database**

inisde the docker container database make sure the database is created and not populated yet.
made a mistake to populate it via sql alchemy yesterday so I was obliged to delete it and recreate evrything using the dump file.

[link](https://stackoverflow.com/a/2732521/4683950) to import .

here is the syntax :

```
pg_restore -U username -d dbname -1 filename.sql.
```
And now all files are inside the docker psql database.

NB : But how to import only insert statements not all the statement for creating the database ??

Hope to fix it soon.
