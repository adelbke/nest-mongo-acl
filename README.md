# Nestjs Mongoose Access Control lists

This is a library that offers Granular Access Control to documents in mongodb collections by maintaining access control lists

## Table of Contents
- [Nestjs Mongoose Access Control lists](#nestjs-mongoose-access-control-lists)
  - [Table of Contents](#table-of-contents)
  - [Version Chart](#version-chart)
  - [Installation](#installation)
  - [Setup](#setup)
    - [Setup in NestJS](#setup-in-nestjs)
    - [Setup With Typegoose](#setup-with-typegoose)
    - [Setup with @nestjs/mongoose](#setup-with-nestjsmongoose)
  - [Usage](#usage)
    - [Grant/Revoke Access to a single document resource](#grantrevoke-access-to-a-single-document-resource)
    - [Filter by Access rights](#filter-by-access-rights)
    - [Check Access Rights on documents](#check-access-rights-on-documents)

## Version Chart

| @biocomputingup/nest-mongo-acl | @nestjs/core |
| ------------------------------ | ------------ |
| ^0.0.2                         | ^10.0.0      |
| ^1.0.0                         | ^11.0.0      |

## Installation

```
npm install @biocomputingup/nest-mongo-acl

yarn add @biocomputingup/nest-mongo-acl
```


## Setup

This library can be used independently with Mongoose directly
and with [typegoose](https://typegoose.github.io/typegoose/versions/12.x/) through [@m8a/nestjs/typegoose](https://nestjs-typegoose.m8a.io/)  or [@nestjs/mongoose](https://docs.nestjs.com/v10/techniques/mongodb).

### Setup in NestJS
```typescript
import { Module } from '@nestjs/common';
import { AclModule } from '@biocomputingup/nest-mongo-acl';
import { User } from './user.model'; // Import user type/model where it's defined
@Module({
  imports: [
    // ...
    AclModule.forRoot({
      groupFromUser<User>(user: User): string | string[] {
        // This function should return a "tag" or an Array of "tags"
        // Each tag represents a group that the user belongs to
        // This function allows you to map users to tags
        // Later you'll attach access rights to tags to determine access rights
        return `role=${user.role}`;
      }
    })
    // ...
  ]
})
export class AppModule {}

// Outside of NestJS, using this library requires this call to pass the "groupFromUser" function. This is better done before model initialization

AclModule.setupAclConfiguration({
  groupFromUser<User>(user: User): string | string[] {
    // Return group tag(s)
    return `role=${user.role}`;
  }
})

```

### Setup With Typegoose

Add plugin to model and implement the interface `WithAcl`
Extend the model type to include the methods and query helpers

```typescript
import { AccessControlLists, IAcl, AclMethodsCls} from '@biocomputingup/nest-mongo-acl';
import { type } from '@typegoose/typegoose';
@plugin(AccessControlLists) // Add Plugin to Model
export class Person implements WithAcl { // Implement interface to get correct type
  @prop({type: () => String})
  surname: string;
  acl: IAcl
}

// Update the type of the model to include methods and query helpers
type PersonModel = ReturnModelType<typeof Person & AclMethodsCls, IAclQueryHelpers>;
```


### Setup with @nestjs/mongoose

Add plugin to schema and implement the interface `WithAcl`
```typescript
import { Prop, Schema as SchemaDec, SchemaFactory } from '@nestjs/mongoose';
import { AccessControlLists, IAcl, IAclMethods, IAclQueryHelpers} from '@biocomputingup/nest-mongo-acl';
import { Document, Model, HydratedDocument} from 'mongoose';
@Schema()
export class Person implements WithAcl { // Implement interface to get correct type
  @Prop({ type: String }) // For mongoose schema
  surname: string;
  
  acl: IAcl
}

const PersonSchema = SchemaFactory.createForClass(Person); // For mongoose schema
PersonSchema.plugin(AccessControlLists); // Add Plugin to Schema
export PersonSchema;

// extends model type to add methods and query helpers
export type PersonModel = Model<Person, IAclQueryHelpers, IAclMethods>;

// extends document type to add methods;
export type PersonDocument = HydratedDocument<Person, IAclMethods>;

// Important note:
// using document.model() to retrieve the model instance requires passing the overrided PersonModel as a generic to gain access to the relevant AclMethods

```

## Usage

### Grant/Revoke Access to a single document resource

Through a document instance

```typescript
const doc: PersonDocument;
// This will mutate the state of the document to grant admins read access to the document
doc.grantAccess('admins', 'read');
// This will mutate the state of the document to revoke admins read access to the document
doc.revokeAccess('admins', 'read');
```

Through an update query
```typescript
import { grantAccessTo } from '@biocomputingup/nest-mongo-acl';

const model: PersonModel;
model.updateOne({ /* Select the relevant Document */}, grantAccessTo('admins', 'read'))
// for many modifications use grantToMany
model.updateOne({ /* Select the relevant Document */}, grantToMany([
    ['admins', 'read'], 
    ['editor', 'write']
  ])
)
// Granting public read access to a document (when user is not passed/undefined)
model.updateOne({ /* Select the relevant Document */}, grantPublicAccess('read'));
model.updateOne({ /* Select the relevant Document */}, revokePublicAccess('read'));
// inversely methods revokeAccessTo and revokeToMany can be used
```

### Filter by Access rights

Through Query helpers

```typescript
const model: PersonModel;
// Filters documents accessible to the public with read access (user not passed)
model.find({ /* relevant criteria */ }).withAccessFor('read');
// Filters documents accessible to the passed user for read access
model.find({ /* relevant criteria */ }).withAccessFor('read', user);
```

Through direct filter injection
```typescript
const model: PersonModel;
const user: UserDocument;
model.find({
  $and:[
    { /* relevant criteria */ },
    accessibleBy('read', 'admins') 
  ]
})
// a user can be passed as well
model.find({
  $and:[
    { /* relevant criteria */ },
    accessibleBy('read', user) 
  ]
})
```

### Check Access Rights on documents

```typescript
const doc: PersonDocument;
const user: User; // The user model
if(doc.hasAccess('admins', 'read')){ // if the admins group has access to this document
  // Do something
}
if(doc.hasAccess(user, 'read')) { // If user has read access to this document
  // Do something
}
```
