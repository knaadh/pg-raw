
![pgRaw](https://github.com/knaadh/pg-raw/assets/16979444/baa9d8e3-9a6a-400b-a4f8-540d3b4dd9bb)

# Pg-Raw
A modern library for easily generating PostgreSQL raw queries through a clean and simple API.

This isn't an ORM or query executor - it focuses solely on generating SQL strings, allowing you to execute these queries using Knex, Drizzle, Prisma, or your preferred PostgreSQL client or tool.

## Table of Contents
- [Introduction](#pg-raw)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Features](#features)
  - [API](#api)
    - [findMany](#findmany)
    - [insertOne](#insertone)
    - [insertMany](#insertmany)
    - [updateMany](#updatemany)
    - [deleteMany](#deletemany)
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

## API
This section provides detailed documentation for each API method available in the pg-raw library. These methods allow you to construct SQL queries for interacting with PostgreSQL databases.

### findMany

#### Overview

The findMany function generates a PostgreSQL SELECT query to retrieve multiple records from a database table. It allows for specifying selection criteria, filtering conditions, and various query modifiers to fine-tune the data retrieval process.

#### Syntax
```typescript
findMany(params: FindManyParams): string
```

#### Parameters

`params` (`FindManyParams`) is an object with the following structure:

- `table` (string): Specifies the name of the database table from which data is to be retrieved, optionally including the schema.
    - **Direct Table Name**
      ```typescript
        const params: FindManyParams = {
            table: 'users',
            query: {
              select: { id: true, name: true },
            }
        };
        console.log(findMany(params));
        // Output: SELECT "id", "name" FROM "users"
      ```
    - **Table Name with Schema**
      ```typescript
        const params: FindManyParams = {
            table: 'public.users',
            query: {
              select: { id: true, name: true },
            }
        };
        console.log(findMany(params));
        // Output: SELECT "id", "name" FROM "public"."users"
- `query` (SelectQuery): Specifications for the SELECT query, including what data to select, conditions, ordering, and limits.
   - `select` (Select): Specifies which columns and SQL functions to include in the results. Each key in the object can be a column name or an alias for the column, function or expression.
     - **Basic Example:**
      ```typescript
        const params: FindManyParams = {
            table: 'users',
            query: {
              select: { id: true, name: true },
            }
        };
        console.log(findMany(params));
        // Output: SELECT "id", "name" FROM "users"
      ```
      - **Alias Example:**
      ```typescript
        const params: FindManyParams = {
            table: 'users',
            query: {
              select: { id: true, name: 'first_name' },
            }
        };
        console.log(findMany(params));
        // Output: SELECT "id","first_name" AS "name" FROM "users"
      ```
      - **Function Example:**
      ```typescript
        const params: FindManyParams = {
            table: 'users',
            query: {
              select: { 
                id: true, 
                name: "CONCAT(first_name, ' ', last_name)" 
              },
            }
        };
        console.log(findMany(params));
        // Output: SELECT "id", CONCAT(first_name, ' ', last_name) AS "name" FROM "users"
      ```
    - `where` (QueryWhereCondition): Defines conditions for filtering the records. Supports simple conditions, complex expressions, and logical grouping.
      - **Basic Example:**
      ```typescript
        const params: FindManyParams = {
          table: "users",
          query: {
            select: {  id: true,  name: true },
            where: { 
                status: "active" 
            },
          },
        };
        console.log(findMany(params));
        // Output: SELECT "id", "name" FROM "users" WHERE "status" = 'active'
      ```
      - **Complex Example:**
      ```typescript
        const params: FindManyParams = {
          table: "users",
          query: {
            select: {  id: true,  name: true },
            where: {
              AND: [
                { status: "active" },
                {
                  OR: [ { type: "admin"}, { type: "user"} ]
                },
              ],
            },
          },
        };
        console.log(findMany(params));
        // Output: SELECT "id", "name" FROM "users" WHERE ("status" = 'active' AND ("type" = 'admin' OR "type" = 'user'))
      ```
    - `limit` (number): Specifies the maximum number of records to return in the query results. This is useful for pagination or limiting data retrieval to a manageable size.
      ```typescript
        const params: FindManyParams = {
          table: "users",
          query: {
            select: {  id: true,  name: true },
            limit: 10
          },
        };
        console.log(findMany(params));
        // Output: SELECT "id", "name" FROM "users" LIMIT 10
      ```
    - `offset` (number): Specifies the number of records to skip before starting to count the limit of returned records. This is often used in conjunction with limit for implementing pagination.
      ```typescript
        const params: FindManyParams = {
          table: "users",
          query: {
            select: {  id: true,  name: true },
            offset: 10
          },
        };
        console.log(findMany(params));
        // Output: SELECT "id", "name" FROM "users" OFFSET 10
      ```
    - `orderBy` (OrderBy): Specifies the ordering of the results based on one or more columns. The object should have column names as keys and the order direction (`ASC` or `DESC`) as values.
      ```typescript
        const params: FindManyParams = {
          table: "users",
          query: {
            select: {  id: true,  name: true },
            orderBy: {
              id: "DESC",
            },
          },
        };
        console.log(findMany(params));
        // Output: SELECT "id", "name" FROM "users" ORDER BY "id" DESC
      ```
    - `groupBy` (string[]): Specifies the columns by which the results should be grouped. Useful for aggregation queries where you want to summarize or categorize data.
      ```typescript
        const params: FindManyParams = {
          table: "users",
          query: {
            select: {  total_users: "COUNT(id)", gender: true },
            groupBy: ["gender"],
          },
        };
        console.log(findMany(params));
        // Output: SELECT COUNT(id) AS "total_users", "gender" FROM "users" GROUP BY "gender"
      ```
    - `include` (Include): Specifies related entities to include in the query results. Each key corresponds to a relation defined in the relations parameter, enabling the inclusion of complex and nested data from related tables. The include parameter automates the aggregation of related data into a single column, simplifying the retrieval of structured data that would typically require complex joins and groupings.
      - **Basic Example (One-to-One):**
  
      ```typescript
        const params: FindManyParams = {
          table: "users",
          query: {
            select: { id: true, name: true },
            include: {
              profile: {
                select: { address: true, gender: true },
              },
            },
          },
          relations: {
            profile: {
              type: "ONE",
              table: "profiles",
              field: "user_id",
              referenceTable: "users",
              referenceField: "id",
            },
          },
        };
        console.log(findMany(params));
       /*
        Output:
        SELECT "id", "name", "profile" FROM "users"
        LEFT JOIN LATERAL (
          SELECT "profile" FROM (
            SELECT jsonb_build_object('address', "address", 'gender', "gender") AS "profile"
            FROM "profiles" WHERE "profiles"."user_id" = "users"."id"
          )
        ) ON TRUE
        */
      ```
      - **Basic Example (One-To-Many):**
  
      ```typescript
        const params: FindManyParams = {
          table: "artist",
          query: {
            select: { id: true, name: true },
            include: {
              albums: {
                select: { title: true, release_date: true },
              },
            },
          },
          relations: {
            albums: {
              type: "MANY",
              table: "albums",
              field: "artist_id",
              referenceTable: "artist",
              referenceField: "id",
            },
          },
        };
        console.log(findMany(params));
        /* 
        Output:
        SELECT
            "id",
            "name",
            "albums"
        FROM
            "artist"
            LEFT JOIN LATERAL (
                SELECT
                    jsonb_agg("albums") AS "albums"
                FROM
                    (
                        SELECT
                            jsonb_build_object('title', "title", 'release_date', "release_date") AS "albums"
                        FROM
                            "albums"
                        WHERE
                            "albums"."artist_id" = "artist"."id"
                    )
            ) ON TRUE
        */
      ```
      - **Advance Example (Many-To-Many):**
  
      ```typescript
        const params: FindManyParams = {
          table: "artist",
          query: {
            select: { id: true, name: true },
            include: {
              albums: {
                select: { title: true, release_date: true },
                where: {
                  type: "single",
                },
                limit: 5,
              },
            },
          },
          relations: {
            albums: {
              type: "MANY",
              table: "albums",
              field: "id",
              referenceTable: "artist",
              referenceField: "id",
              junction: {
                table: "artist_albums",
                field: "album_id",
                referenceField: "artist_id",
                },
            },
          },
        };
        console.log(findMany(params));
        /*
        Output:
        SELECT
            "id",
            "name",
            "albums"
        FROM
            "artist"
            LEFT JOIN LATERAL (
                SELECT
                    jsonb_agg("albums") AS "albums"
                FROM
                    (
                        SELECT
                            jsonb_build_object('title', "title", 'release_date', "release_date") AS "albums"
                        FROM
                            "artist_albums"
                            LEFT JOIN "albums" ON "artist_albums"."album_id" = "albums"."id"
                        WHERE
                            "type" = 'single'
                            AND "artist_albums"."artist_id" = "artist"."id"
                        LIMIT
                            5
                    )
            ) ON TRUE
        */
      ```
    - `leftJoin` (Join): Builds a left outer join to fetch data from related tables. Ensures that all records from the primary table are included in the results, even if there are no corresponding entries in the joined table. The relationships necessary for using leftJoin must be predefined in the relations parameter, detailing how tables are linked and which fields connect them.
      ```typescript
      const params: FindManyParams = {
        table: "artist",
        query: {
          select: { id: true, name: true },
          leftJoin: {
            albums: {
              select: { title: true },
            },
          },
        },
        relations: {
          albums: {
            table: "albums",
            field: "artist_id",
            referenceTable: "artist",
            referenceField: "id",
          },
        },
      };
      console.log(findMany(params));
      /*
      Output:
      SELECT "id", "name", "title" FROM "artist" LEFT JOIN "albums" ON "albums"."artist_id" = "artist"."id"
      */
      ```
    - `rightJoin` (Join): Similar to leftJoin, but builds a right outer join. This ensures that all records from the related table are included in the results, even if there are no corresponding entries in the primary table. Configure relationships identically to leftJoin.
      
    - `innerJoin` (Join): Builds an inner join, returning only the records where there is a match in both the primary and the related tables. Set up in the same manner as leftJoin.

    - `fullJoin` (Join): Constructs a full outer join, combining the results of both leftJoin and rightJoin. It includes all records from both the primary and related tables, regardless of matching entries. Configure similarly to leftJoin.
  
- `relations` (Relations): Defines how tables are related to each other for SQL joins within queries. Each key in the relations object represents a named relationship, and it is typically used to reference these relationships in the `include`, `leftJoin`, `rightJoin`, `innerJoin`, and `fullJoin` parameters of the query.
   - `Relation` (Relation):
       - `type` ("ONE" | "MANY"): Optional. Specifies whether the join should fetch data as a single JSON object (ONE) or as an aggregated JSON array (MANY), relevant only in `include` query.
      - `table` (string): Refers to the table associated with the `key` in the relations object.
      - `field` (string): Refers to the column of the table (`table`) used for join.
      - `referenceTable` (string): The table from which the relation is called, typically the main table being queried.
      - `referenceField` (string): The column in the `referenceTable` used for join.
      - `junction` (Junction, optional): Details for configuring many-to-many relationships using a junction table.
        - table (string): The junction table facilitating the many-to-many relationship.
        - field (string): The column in the junction table that links to the foreign key column in the `table`.
        - referenceField (string): The column in the junction table that links to the foreign key column in the `referenceTable`.
  
    - **Example:**
      ```typescript
      const params: FindManyParams = {
        table: "artist",
        query: {
          select: { id: true, name: true },
          include: {
            albums: {
              select: {
                address: true,
                gender: true,
              },
            },
          },
        },
        relations: {
          albums: {
            type: "MANY", // Indicates the data is fetched as an aggregated JSON array
            table: "album", // The name of the table being joined
            field: "id",
            referenceTable: "artist", //The main table from which the relation is called
            referenceField: "id",
            junction: {
              table: "artist_albums",
              field: "album_id", // This should be the foreign key in the related table
              referenceField: "artist_id", // This should be the foreign key in the main table
            },
          },
        },
      };
      ```

### insertOne

#### Overview
The `insertOne` function generates a PostgreSQL INSERT query to add a single record to a database table.

#### Syntax
```typescript
insertOne(params: InsertOneParams): string
```

#### Parameters
- `params` (InsertOneParams) is an object with the following structure:
  - `table` (string): Specifies the table where the new record will be inserted.
  - `data` (object): An object containing the key-value pairs that represent the columns and their respective values for the new record.
  - `returning` (array of string): An optional array of column names to be returned after the record is inserted. Useful for retrieving specific fields such as auto-generated IDs or default values.

  **Example:**
  ```typescript
  const params: InsertOneParams = {
    table: "users",
    data: {
      name: "John Doe",
      age: 25,
    },
    returning: ["id"],
  };

  console.log(insertOne(params));
  // Output:
  // INSERT INTO "artist" ("name", "age") VALUES ('John Doe', 25) RETURNING "id"
  ```

### insertMany

#### Overview
The `insertMany` function generates a PostgreSQL INSERT query to add multiple records to a database table in a single operation.

#### Syntax
```typescript
insertMany(params: InsertManyParams): string
```

#### Parameters
- `params` (InsertManyParams) is an object with the following structure:
  - `table` (string): Specifies the table where the new record will be inserted.
  - `data` (array of object): An array of objects, each representing a single record with key-value pairs that correspond to the columns and their respective values for each record.
  - `returning` (array of string): An optional array of column names to be returned after the record is inserted. Useful for retrieving specific fields such as auto-generated IDs or default values.

  **Example:**
  ```typescript
  const params: InsertManyParams = {
    table: "users",
    data: [
      { name: "John Doe", age: 25 },
      { name: "Jane Smith", age: 30 },
      { name: "Alice Johnson", age: 28 },
    ],
    returning: ["id"],
  };
  console.log(insertOne(params));
  // Output:
  // INSERT INTO "users" ("name", "age") VALUES ('John Doe', 25), ('Jane Smith', 30), ('Alice Johnson', 28) RETURNING "id"
  ```
### updateMany

#### Overview
The `updateMany` generates a PostgreSQL UPDATE query for modifying records in a database table. It allows users to specify new data for records and conditions for selecting which records to update.

#### Syntax
```typescript
updateMany(params: UpdateManyParams): string
```

#### Parameters
- `params` (UpdateManyParams) is an object with the following structure:
  - `table` (string): Specifies the table where the records will be updated.
  - `query` (object):
    - `data` (object): Key-value pairs representing the columns to update and their new values.
    - `where` (object): Conditions that define which records to update. This can include simple key-value pairs for equality or more complex expressions for greater control.
    - `returning` (array of string, optional): An optional array of column names to be returned from the updated records. This is often used to retrieve specific fields to confirm the updates or for further processing.

  **Example:**
  ```typescript
  const params: UpdateManyParams = {
    table: "users",
    query: {
      data: { active: true, type: "admin" },
      where: {
        id: 1
      },
      returning: ["id"]
    },
  };
  
  console.log(updateMany(params));
  // Output:
  // UPDATE "users" SET "active" = true, "type" = 'admin' WHERE "id" = 1 RETURNING "id"
  ```

### deleteMany

#### Overview
The `deleteMany` function generates a PostgreSQL DELETE query to remove multiple records from a database table based on specified conditions.

#### Syntax
```typescript
deleteMany(params: DeleteManyParams): string
```

#### Parameters
- `params` (DeleteManyParams) is an object with the following structure:
  - `table` (string): Specifies the table from which records will be deleted.
  - `query` (object):
    - `where` (object): Conditions that specify which records should be deleted. This can include simple key-value pairs for equality or more complex expressions for greater control.
    - `returning` (array of string): An optional array of column names to be returned from the deleted records.

  **Example:**
  ```typescript
  const params: DeleteManyParams = {
    table: "users",
    query: {
      where: {
        id: 1
      },
      returning: ["id"]
    },
  };
  
  console.log(deleteMany(params));
  // Output:
  // DELETE FROM "users" WHERE "id" = 1 RETURNING "id"
  ```


## License

This package is [MIT licensed](LICENSE)

