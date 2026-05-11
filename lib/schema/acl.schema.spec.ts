import {
  getModelForClass,
  plugin,
  prop,
  ReturnModelType,
} from '@typegoose/typegoose';
import { AclModule } from '../acl.module';
import { WithAcl } from '../interfaces';
import { AccessControlLists } from '../mongoose-plugin';
import { type IAclQueryHelpers } from '../query-helpers';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Mongoose } from 'mongoose';
import { Acl } from './acl.schema';
import { AclMethodsCls } from '../methods';

describe('Assess The Schema setup', () => {
  let mongod: MongoMemoryServer;
  let connectionUri: string;
  let connection: Mongoose;

  @plugin(AccessControlLists)
  class ResourceWithAcl implements WithAcl {
    acl?: Acl;
    @prop({ type: () => String })
    identifier: string;
  }

  type MockUser = { name: string; role: string };

  const userToGroup = (user: MockUser) => {
    return [`name=${user.name}`, `role=${user.role}`];
  };

  let ResourceModel: ReturnModelType<
    typeof ResourceWithAcl & AclMethodsCls,
    IAclQueryHelpers
  >;

  beforeAll(async () => {
    // This will create an new instance of "MongoMemoryServer" and automatically start it
    mongod = await MongoMemoryServer.create();

    connectionUri = mongod.getUri();
    connection = await mongoose.connect(connectionUri);

    AclModule.setupAclConfiguration({
      groupFromUser: userToGroup,
    });

    ResourceModel = getModelForClass(ResourceWithAcl) as ReturnModelType<
      typeof ResourceWithAcl & AclMethodsCls,
      IAclQueryHelpers
    >;
  });

  afterAll(async () => {
    // Disconnect Mongoose
    await connection.disconnect();
    // The Server can be stopped again with
    await mongod.stop();
  });

  test(`Expect shema default value to be applied to doc upon creation`, async () => {
    const entry = new ResourceModel({
      identifier: 'test0',
    });

    // Expect initialization to run on the doc as it is created
    expect(entry.acl).toBeDefined();
    expect(entry.acl?.policies).toBeDefined();
    expect(entry.acl?.publicPolicy).toBeDefined();
    expect(Array.isArray(entry.acl?.publicPolicy)).toBeTruthy();
    expect(
      entry.acl?.publicPolicy.some((val) => typeof val != 'string'),
    ).toBeFalsy();
  });

  test('Schema definition is compatible with expected use Case', async () => {
    const entry = new ResourceModel({
      identifier: 'test1',
    });

    // // Expect initialization to run on the doc as it is created
    // expect(entry.acl?.policies).toBeDefined();
    // expect(entry.acl?.publicPolicy).toBeDefined();

    entry.grantAccess('role=admin', 'read');
    entry.grantAccess('role=admin', 'write');
    entry.grantAccess('role=user', 'read');

    await entry.save();

    const foundEntry = await ResourceModel.findOne({ identifier: 'test1' });

    expect(foundEntry).toBeTruthy();
    expect(foundEntry?.hasAccess('role=admin', 'read')).toBe(true);
    expect(foundEntry?.hasAccess('role=admin', 'write')).toBe(true);
    expect(foundEntry?.hasAccess('role=user', 'read')).toBe(true);
    expect(foundEntry?.hasAccess('role=user', 'write')).toBe(false);
  });

  test(`Expect user to group usage to not disturb the functioning of the schema`, async () => {
    const entry = new ResourceModel({
      identifier: 'test2',
    });

    const adminUser: MockUser = { name: 'adminUser', role: 'admin' };
    const regularUser: MockUser = { name: 'testRegular', role: 'user' };

    entry.grantAccess('role=admin', 'write');
    entry.grantAccess('role=user', 'read');

    entry.grantAccess('hi', 'ho');

    expect(entry.hasAccess(adminUser, 'read')).toEqual(false);

    expect(entry.hasAccess(regularUser, 'read')).toEqual(true);

    expect(entry.hasAccess(adminUser, 'write')).toEqual(true);

    expect(entry.hasAccess(regularUser, 'write')).toEqual(false);
  });
});
