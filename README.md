#### LEDN-API

## Table of contents
    + [LEDN-API](#ledn-api)
- [API overview](#api-overview)
- [Libraries used](#libraries-used)


## API overview

This API is built using two docker containers. The first container runs mongodb using a single-node replica set (to allow the use of transactions). The second container runs a node express API.

## Libraries used

The main npm libraries used for this api are express for the api, eslint and prettier for code formatting, body-parser to process requests, swagger-ui-express to host the api documentation and mongoose to interact with mongodb.

## Database structure

The database is composed of 2 collections: Accounts and Transactions. They both follow the general requirements, with the following modifications:

# Accounts

The accounts have an extra id field separate from the email, but also have an index on emails to ensure uniqueness and improve performance. The referredBy field still contains the original email field however, since all the users had to be stored in order to get their id. This could be improved by first storing all the users without this field and keeping a map of the users referredBy data, then updating the users again with a reference to the id. I did not however implement this logic.
I also added an extra "balance" field directly inside the Account schema. While it would have been possible to calculate the balance of accounts on demand using the transactions associated to it, in order to increase the speed of such querries on very big databases, I decided to keep track of it in the account. This introduces some concerns about simultaneous operations on the database (see Mongoose Transactions section for details on atomicity).

# Transactions

The transactions refer directly to accounts by their id, instead of by the account email.
In order to keep track of Admin transactions (debits and credits) that are not part of transfers, transactions have an extra "admin" boolean field. When this is set to true, it means that this transaction came from an Admin debit/credit. This way, we can have a history of those transactions as well.
type: receive and admin: false => account received money from transfer
type: receive and admin: true => account received credit from admin
