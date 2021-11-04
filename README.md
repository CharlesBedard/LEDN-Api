#### LEDN-API

## Table of contents
- [API overview](#api-overview)
- [Libraries used](#libraries-used)
- [Database structure](#database-structure)
- [Endpoints](#endpoints)
- [Mongoose Atomicity](#mongoose-atomicity)
- [Local environment setup](#local-environment-setup)



# API overview

This API is built using two docker containers. The first container runs mongodb using a single-node replica set (to allow the use of Mongodb transactions). The second container runs a node express API.

# Libraries used

The main npm libraries used for this api are express for the api, eslint and prettier for code formatting, body-parser to process requests, swagger-ui-express to host the api documentation and mongoose to interact with mongodb.

# Database structure

The database is composed of 2 collections: Accounts and Transactions. They both follow the general requirements, with the following modifications:

## Accounts

See the Mongoose schemas defined in src/schemas/schemas.ts

The accounts have an extra id field separate from the email, but also have an index on emails to ensure uniqueness and improve performance. The referredBy field still contains the original email field however, since all the users had to be stored in order to get their id. This could be improved by first storing all the users without this field and keeping a map of the users referredBy data, then updating the users again with a reference to the id. I did not however implement this logic.
I also added an extra "balance" field directly inside the Account schema. While it would have been possible to calculate the balance of accounts on demand using the transactions associated to it, in order to increase the speed of such querries on very big databases, I decided to keep track of it in the account. This introduces some concerns about simultaneous operations on the database (see Mongoose Transactions section for details on atomicity).

## Transactions

The transactions refer directly to accounts by their id, instead of by the account email.
In order to keep track of Admin transactions (debits and credits) that are not part of transfers, transactions have an extra "admin" boolean field. When this is set to true, it means that this transaction came from an Admin debit/credit. This way, we can have a history of those transactions as well.
type: receive and admin: false => account received money from transfer
type: receive and admin: true => account received credit from admin

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

Pull the repository\
run: docker-compose up\
Look at the logs and wait until the 'mongoose is connected' message is sent from the ledn-api container\
Open: http://localhost:3000/api/docs/#/default/get_resetDb \
At the swagger link from above, using the "Try it out" button, execute the command. This will populate your mongodb container (the default database used will be the small one, change the param for "large" in order to populate the bigger sample database. It can take up to 30 seconds to do so).\
All the endpoints are defined in the swagger and linked to the api
