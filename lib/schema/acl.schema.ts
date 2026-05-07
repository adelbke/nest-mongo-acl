import { prop, PropType } from '@typegoose/typegoose';
import { Prop, Schema as SchemaDec, SchemaFactory } from '@nestjs/mongoose';
import { Schema, SchemaDefinition } from 'mongoose';
import { IAcl, WithAcl } from 'lib/interfaces';
import { AclRegistry } from 'lib/acl.registry';
import { actionsFromAction } from 'lib/utils/util';

// @plugin((schema, opts) => {})
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
    default: {
      policies: {},
      publicPolicy: []
    },
    policies: {
      default: {},
      type: Schema.Types.Mixed,
      validate: function (this: IAcl['policies']) {

        // ensure the keys are strings and that the values are arrays of strings
        Object.keys(this).forEach((key: string) => {
          if (typeof key != 'string') {
            return false;
          }
          const val = this[key];
          if (!(val instanceof Array)) {
            return false;
          }
          try {
            actionsFromAction(val);
          } catch (err) {
            return false;
          }

        });
        return true;
      }
    },
    publicPolicy: {
      default: [],
      type: [String],
      validate: function (this: IAcl['publicPolicy']) {
        if (!Array.isArray(this)) {
          return false;
        }

        try {
          const actionsArray = actionsFromAction(this);
          return true;
        } catch (error) {
          return false;
        }
      }
    },
  }
};

export { Acl, AclSchema, AclSchemaDefinition };
