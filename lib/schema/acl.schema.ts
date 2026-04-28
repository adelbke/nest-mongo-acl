import { prop, PropType } from '@typegoose/typegoose';
import { Prop, Schema as SchemaDec, SchemaFactory } from '@nestjs/mongoose';
import { SchemaDefinition } from 'mongoose';
import { IAcl } from 'lib/interfaces';

// @plugin((schema, opts) => {})
@SchemaDec()
class Acl implements IAcl {
  @prop({ type: () => [String], default: [] }) // For typegoose schema
  @Prop({ type: [String], default: [] }) // For mongoose schema
  publicPolicy: string[] = [];

  @prop({ type: () => [String] }, PropType.MAP) // For typegoose schema
  @Prop({ type: Map, of: { type: [String] } }) // For mongoose schema
  policies: Map<string, string[]>;
}
const AclSchema = SchemaFactory.createForClass(Acl);
const AclSchemaDefinition: SchemaDefinition<IAcl> = {
  policies: {
    type: Map,
    of: {
      type: [{ type: String }],
    },
  },
  publicPolicy: {
    default: [],
    type: [{ type: String }],
  },
};

export { Acl, AclSchema, AclSchemaDefinition };
