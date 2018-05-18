# Benchmarking Setup for GraphQL Frameworks

(Originally based on graphql-bench by Hasura, with modifications from Prisma and PostGraphile)

Uses Vegeta to generate load.

Run the environments manually using their manage.sh scripts; don't forget to load the seed data!

Specify the test setup to run in /vegeta/bench.json

Run the /vegeta/bench.sh which will run the program specified in bench.json.

The results will be in the results folder of the testcandidates with the current date and time together with a copy of the bench.json.
