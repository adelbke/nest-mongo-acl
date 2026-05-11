import { prop, PropType } from '@typegoose/typegoose';
import { Prop, Schema as SchemaDec, SchemaFactory } from '@nestjs/mongoose';
import { Schema, SchemaDefinition } from 'mongoose';
import { IAcl, WithAcl } from '../interfaces';
import { actionsFromAction } from '../utils/util';
import { AclRegistry } from 'lib/acl.registry';

@SchemaDec()
class Acl implements IAcl {
  @prop({ type: () => [String], default: [] }) // For typegoose schema
  @Prop({ type: [String], default: [] }) // For mongoose schema
  publicPolicy: string[] = [];

  @prop({ type: () => [String] }, PropType.MAP) // For typegoose schema
  @Prop({ type: Map, of: { type: [String] } }) // For mongoose schema
  policies: Record<string, string[]>;
}

const AclSchema = SchemaFactory.createForClass(Acl);
const AclSchemaDefinition: SchemaDefinition<WithAcl> = {
  acl: {
    type: {
      policies: {
        default: {},
        type: Schema.Types.Mixed,
        validate: {
          validator: function (
            // this: HydratedDocument<WithAcl>,
            value: Acl['policies'],
          ) {
            const policies = value;
            // ensure the keys are strings and that the values are arrays of strings
            Object.keys(policies).forEach((key: string) => {
              if (typeof key != 'string') {
                throw new Error(
                  `Acl Policies object: Invalid group key "${key}" is not of type String`,
                );
              }
              const val = policies[key];
              if (!(val instanceof Array)) {
                throw new Error(
                  `Acl Policies object: Invalid actions array in key ${key} for policies Object found ${val}, expected Array<string>`,
                );
              }
              actionsFromAction(val);
            });
            return true;
          },
          // https://mongoosejs.com/docs/8.x/docs/api/schematype.html#error-message-templates
          message(props: { path: string; reason: Error }) {
            return `[Acl path:${props.path}] ${props.reason.message}`;
          },
        },
      },
      publicPolicy: {
        default: [],
        type: [String],
        validate: {
          validator: function (this: WithAcl, value: Acl['publicPolicy']) {
            const publicPolicy = value;
            if (!Array.isArray(publicPolicy)) {
              throw new Error(
                `Acl publicPolicy, expected Array<string>, found ${value}`,
              );
            }
            actionsFromAction(publicPolicy);
            return true;
          },
          message(props: { path: string; reason: Error }) {
            return `[Acl path:${props.path}] ${props.reason.message}`;
          },
        },
      },
    },
    validate: {
      validator(value: Acl) {
        if (!('policies' in value)) {
          return false;
        }
        if (!('publicPolicy' in value)) {
          return false;
        }
        return true;
      },
    },
    default: AclRegistry.getInstance().getDefaultAcl(),
  },
};

export { Acl, AclSchema, AclSchemaDefinition };
