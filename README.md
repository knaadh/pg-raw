
![pgRaw](https://github.com/knaadh/pg-raw/assets/16979444/baa9d8e3-9a6a-400b-a4f8-540d3b4dd9bb)

# Pg-Raw
A modern library for easily generating PostgreSQL raw queries through a clean and simple API.

This isn't an ORM or query executor - it focuses solely on generating SQL strings, allowing you to execute these queries using Knex, Drizzle, Prisma, or your preferred PostgreSQL client or tool.

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [License](#license)

## Installation

You can install the library using your preferred package manager:

```bash
# NPM 
npm install @knaadh/pg-raw

# Yarn
yarn add @knaadh/pg-raw

# Bun
bun add @knaadh/pg-raw
```

## Usage

Here's a basic example of how to use pg-raw

```typescript
import { findMany, FindManyParams } from '@knaadh/pg-raw';

const params: FindManyParams = {
  table: 'users',
  query: {
    select: {
      id: true,
      name: true,
    },
    where: {
      email: 'admin@gmail.com',
    },
    limit: 1,
  },
};

console.log(findMany(params));
// Output: SELECT "id", "name" FROM "users" WHERE "email" = 'admin@gmail.com' LIMIT 1
```

This example demonstrates how to construct a query to find a user by their email address, selecting only their id and name, and limiting the result to one row.

## Features

- Simple and intuitive API for generating PostgreSQL queries
- Supports generation of SELECT, INSERT, UPDATE, and DELETE queries
- Flexible query building with support for complex conditions and joins
- Automatically generates SQL queries to fetch and aggregate relational data into a single column
- Compatible with any PostgreSQL client or ORM for query execution

## License

This package is [MIT licensed](LICENSE)

