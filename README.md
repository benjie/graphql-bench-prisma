# Benchmarking Setup for GraphQL Frameworks

Approximate history:

- Originally created as `graphql-bench` by Hasura
- Modified by Prisma to use `vegeta` to generate load instead of `wrk2` and to
  change the environmental setup
- Modified by Benjie (PostGraphile) to add greater automation, to make sure
  each environment is torn down before the next one is set up, to fix
  PostGraphile setup, and to add `postgraphile@next` testing

I ([@benjie](https://twitter.com/benjie)) ran these benchmarks on a Digital
Ocean compute-optimised droplet, specifically the 8GB RAM, 4 vCPU, 50GB SSD
Droplet that works out at $0.119/hr.

Assuming you want to do the same, I've included as many instructions as I can
remember below. (The commands are from memory or screenshots so may not be
exact - please validate as you go through.)

Really, if you're serious about benchmarking, you should run the client
(`vegeta`) on completely different hardware to the server (Prisma /
PostGraphile); and they should connect to a similar/identical database that's
hosted on yet another server. This would prevent the various softwares from
interfering from each other. Sadly I did not have the time to accomplish this.

## Setup

### Provision the Droplet

1. Visit https://cloud.digitalocean.com/droplets/new
2. Select "One-click apps"
3. Select "Docker 17.12.0~ce on 16.04"
4. Select Optimized Droplet with 8GB of RAM
5. Add you SSH key
6. Create

### Check docker works

1. SSH into the box `ssh root@IP.ADDRESS.HERE`
2. Run `docker run hello-world` - you should receive "Hello from Docker"

### Setup the box

First, update the box and reboot. Then:

#### Install vegeta

The benchmarking tool.

1. SSH into the box `ssh root@IP.ADDRESS.HERE`
2. `mkdir vegeta && cd vegeta`
3. `curl -LO https://github.com/tsenart/vegeta/releases/download/v6.3.0/vegeta-v6.3.0-linux-amd64.tar.gz`
4. `tar xf vegeta*`
5. `cp vegeta /usr/local/bin`

#### Install Node

Required to set up Prisma locally.

1. SSH into the box `ssh root@IP.ADDRESS.HERE`
2. `mkdir node && cd node`
3. `curl -LO https://nodejs.org/dist/v10.1.0/node-v10.1.0-linux-x64.tar.xz`
4. `tar xf node-v*`
5. `ln -s node-v10.1.0-linux-x64 latest`
6. Add `PATH="$PATH:/root/node/latest/bin"` to your `~/.bashrc`
7. Log out then SSH into the box `ssh root@IP.ADDRESS.HERE`
8. `node --version` - should give 10.1.0

#### Increase open files limit

Benchmarking consumes a lot of file descriptors! The values below worked for me, but you might want to raise them higher still...

1. edit `/etc/security/limits.conf`;  
  add "root        soft nofile 16192"
  add "*           soft nofile 16192"
2. edit `/etc/pam.d/common-session` and add "session required pam_limits.so"
3. reboot server `shutdown -r now`

#### Install postgresql-client

Required to load the `chinook` dataset into the PostGraphile database.

`sudo apt update && sudo apt install postgresql-client`

### Install the benchmark suite

1. SSH into the box `ssh root@IP.ADDRESS.HERE`
2. `git clone https://github.com/benjie/graphql-bench-prisma.git`

### Set up a new Prisma project

1. change into the `prisma` folder `graphql-bench-prisma/testcandidates/prisma`
2. run the following (line by line)

```
npm install -g prisma
mkdir project
cd project
prisma init
# answers:  (new database, MySQL)
cp ../clisetup/datamodel.graphql .
cp ../clisetup/docker-compose.yml .
docker-compose up -d
prisma deploy
prisma import --data ../import/chinook.zip
echo "VERIFY THE FOLLOWING"
cat ../queries/byArtistId.json | curl -X POST -d @- -H 'Content-Type: application/json' -i  http://localhost:4466
```

You should receive a sensible result from the curl request - if you do - well done!

These instructions were based on the following instructions given to me by @do4gr, Prisma's engineer responsible for benchmarking:

> The files are probably not in the correct folders for the script to work, sorry. I just set that one up by hand I think. This is what you need to do  
> Install the Prisma CLI `npm install -g prisma`  
> Setup a new project `prisma init`  
> Change the datamodel to the one in the datamodel.graphql file  
> Run `prisma deploy` and choose local  
> Then start the docker container  
> then run `prisma import --data chinook.zip` to import the data  
> then you can verify in the databrowser that there is data (edited)  
>
> You then have a prisma instance running locally with that data. and in the bench.json can target it with  
> ```
> {
>     “dir”: “prisma”,
>     “url”: “http://localhost:4466”
> }
> ```


## Run the benchmarks

1. SSH into the box `ssh root@IP.ADDRESS.HERE`
2. `cd graphql-bench-prisma/vegeta`
3. [OPTIONAL] edit bench.json with the configuration you wish to run
4. `./bench.sh`
5. The results are written to the `results` folder under each project's directory

## Viewing the benchmark results

I recommend copying the resulting files to your local computer, which you can
do easily with rsync:

`rsync -avz root@IP.ADDRESS.HERE:graphql-bench-prisma path/to/destination/`

Once done, you can change into the `testcandidates` and run `node ./parser.js`
(you may need to tweak the `dataFilter` at the top of the file if you've ran
more than one benchmark) - this will write a `data.json` file into the
`visualizer/src` folder.

You can then change into `visualizer` and run `yarn && yarn start` - this will
spawn a React server rendering the data.
