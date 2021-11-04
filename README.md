#### LEDN-API

## Table of contents
- [API overview](#api-overview)
- [Libraries used](#libraries-used)
- [Database structure](#database-structure)
- [Endpoints](#endpoints)
- [Mongoose Atomicity](#mongoose-atomicity)
- [Local environment setup](#local-environment-setup)



# API overview

This API is built using two docker containers. The first container runs mongodb using a single-node replica set (to allow the use of Mongodb transactions). The second container runs a node express API built using Typescript.

# Libraries used

The main npm libraries used for this api are:
- express for the api
- eslint and prettier for code formatting
- body-parser to process requests
- swagger-ui-express to host the api documentation and mongoose to interact with mongodb
- ts-jest and jest for tests

# Project structure

.vscode: contains settings files in order to run prettier automatically on save while using VsCode
sampl_data: contains the sample databases given in the requirements
src/api.ts: main entrypoint for the api
src/routes: contains the api routes information
src/controllers: contains the functions to handle the parameters and call the proper service for the request
src/services: contains the business logic as well as the database calls
src/helpers: contains the populate database helper function

# Database structure

The database is composed of 2 collections: Accounts and Transactions. They both follow the general requirements, with some modifications.

See the Mongoose schemas defined in src/schemas/schemas.ts
## Accounts


The accounts have an extra **id** field, but also have an index on emails to ensure uniqueness and improve performance. The referredBy field still contains the original email as a string however, since all the users had to be stored to get their id. This could be improved by first storing all the users without this field and keeping a map of the users referredBy data, then updating the users again using account ids. Since there are no features depending on this feature in the project however, I did not implement this logic.

I also added an extra **balance** field directly inside the Account schema. While it would have been possible to calculate the balance of accounts on demand using the transactions associated to it, in order to increase the speed of such querries on very big databases, I decided to keep track of it in the account. This introduces some concerns about simultaneous operations on the database, but the use of MongoDB Transactions can help solve this issue. (see [Mongoose Atomicity](#mongoose-atomicity) section for details on atomicity).

## Transactions

The transactions reference accounts by their ids, instead of by the account email.
In order to keep track of Admin transactions made through the /transactions endpoint (debits and credits) that are not part of transfers, transactions have an extra **admin** boolean field. When this is set to true, it means that this transaction came from an Admin debit/credit. This way, we can have a history of those transactions as well.

{ **type**: receive and **admin**: false } => account received money from transfer
{ **type**: receive and **admin**: true } => account received credit from admin

## Database population

Due to some timing issues while using scripts to seed the database on startup with Docker, I added a resetDb endpoint which can be used to populate the database from the samples provided. It can also be used to clear the collections and populate them again.

###Account processing

This endpoint goes through the sample json files and processes each entry using the shemas. Amongst other things it makes sure that the emails are unique, lowercase and indexed in the database. It makes sure that enum fields are respected and also uses regular expressions for emails and country codes. In the large account database, there were 10 duplicate accounts based on the email field, for the purpose of this project, I only log those duplicates in the console and discard them. A better solution for an API in production would be to have a document merging policy for such cases.

Once the Accounts have been created, the sample transactions are processed with the schema and using the userEmail, the accountId is added to the transaction. Transactions for which no account can be found will be discarded (although there were no such cases in this sample data).

# Endpoints

All endpoints and their descriptions are available at the following url once the stack is up: http://localhost:3000/api/docs/

http://localhost:3000/api/resetDb?type={} POST: Clear the Accounts and Transactions collections and populate them from the sample data again. For the large database, it can take up to 30 seconds for the script to finish.

http://localhost:3000/api/accounts?email={} GET: Get an account and it's balance

http://localhost:3000/api/transactions POST: Add entry to transaction collection and update the balance of the linked account. Only to be used by admin to Credit or Debit without a counterpart.

http://localhost:3000/api/transfers POST: Adds 2 transactions (send and receive), as well as updating the two accounts.


# Mongoose Atomicity

Given that the account keeps track of the balance, issues could arise if transactions were sent on the same account at the same time. I setup the mongodb container using a replica set in order to be able to use the Transactions feature from MongoDB. Using this feature, we can start a session and define operations that should be either all done together, or not at all. Coupling this with the optimisticConcurrency option in the schemas, we can ensure that if an account was edited and the balance changed between the read and the update of accounts, all the session is reverted and the db is back in the state it was before.

Example with a transfer:

get sender account , get recipient account
create sender transaction, create recipient transaction,
set sender account -> error, it has been edited and the balance is different.
revert all operations that changed the db above.

An even better solution would be to automatically retry transactions X number of times when this happens, so the person using the API doesn't even need to know that it failed once.

# Local environment setup
Note: Docker is required in order to run this API locally
1. Clone the repository
2. run: **docker-compose up** in the root directory of the repository
3. Look at the logs and wait until the 'mongoose is connected' message is sent from the ledn-api container
4. Open: http://localhost:3000/api/docs/#/default/get_resetDb \
5. At the swagger link from above, using the **Try it out** button, execute the request. This will populate your mongodb container (the default database used will be the small one, change the param for "large" in order to populate the bigger sample database. It can take up to 30 seconds to do so).
All the endpoints are defined in the swagger and linked to the api

While it is possible to only interact with the database using the api, I suggest using MongoDB Compass in order to be able to inspect documents more easily. The URI to connect to the db that way is: mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false