To perform setup, change into this directory and then go through these one by one:

```
npm install -g prisma
cd testcandidates/prisma
mkdir project
cd project
# answers:  (new database, MySQL)
prisma init
cp ../clisetup/datamodel.graphql .
docker-compose up -d
prisma deploy
prisma import --data ../import/chinook.zip
echo "VERIFY THE FOLLOWING"
cat ../queries/byArtistId.json | curl -X POST -d @- -H 'Content-Type: application/json' -i  http://localhost:4466
```
