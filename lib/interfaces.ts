import { HydratedDocument, Model, Schema } from 'mongoose';
import { IAclQueryHelpers } from './query-helpers';
import { IAclMethods } from './methods';

export interface IAcl {
  policies: Map<string, string[]>;
  publicPolicy: string[];
}

// Parent Schema using Acl
export type WithAcl = {
  acl: IAcl;
};

// Parent Model using Acl with Query Helpers
export type IAclModel = Model<WithAcl, IAclQueryHelpers, IAclMethods>;

// Acl's Instance Methods
// export type IAclInstanceMethods = IAclMethods;

// Parent Document Type using Acl
export type IAclDocument = HydratedDocument<
  WithAcl,
  IAclMethods,
  IAclQueryHelpers
>;

// Parent Acl Schema
export type IAclSchema = Schema<WithAcl, IAclModel, IAclMethods>;

export type AclPluginOptions = {
  aclField: string;
};
