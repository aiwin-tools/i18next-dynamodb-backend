# Introduction

This is a i18next backend to be used with AWS DynamoDB. It will load resources from a [DynamoDB](https://www.aws.amazon.com/DynamoDB) table.

# Getting started

Source can be loaded via [npm](https://www.npmjs.com/package/i18next-dynamodb-backend).

```
$ npm install i18next-dynamodb-backend
```

Wiring up:

```js
var i18next = require('i18next');
var Backend = require('i18next-dynamodb-backend');

i18next
  .use(Backend)
  .init(i18nextOptions);
```

As with all modules you can either pass the constructor function (class) to the i18next.use or a concrete instance.

## Backend Options

```js
{
  // DynamoDB DocumentClient instance
  documentClient: {},
  // DynamodDB table
  tableName: 'i18n',
  hash: 'lang',
  range: 'namespace',
  // collection containing i18next data
  translationsKey: 'data'
}
```

Options can be passed in:

**preferred** - by setting options.backend in i18next.init:

```js
var i18next = require('i18next');
var Backend = require('i18next-dynamodb-backend');

i18next
  .use(Backend)
  .init({
    backend: options
  });
```

on construction:

```js
var Backend = require('i18next-dynamodb-backend');
var backend = new Backend(null, options);
```

by calling init:

```js
var Backend = require('i18next-dynamodb-backend');
var backend = new Backend();
backend.init(options);
```
