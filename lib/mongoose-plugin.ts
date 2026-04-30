import { IAclQueryHelpers } from './query-helpers';
import { AclMethods } from './methods';
import { AclSchemaDefinition } from './schema/acl.schema';
import { IAclSchema } from './interfaces';
import { Schema } from 'mongoose';

export function AccessControlLists(oldSchema: Schema) {
  const schema: IAclSchema = oldSchema.add({
    acl: AclSchemaDefinition,
  }) as IAclSchema;

  const queryHelpers = IAclQueryHelpers;

  for (const field in queryHelpers) {
    schema.query[field] = queryHelpers[field];
  }

  for (const method in AclMethods) {
    schema.method(method, AclMethods[method]);
  }
}
