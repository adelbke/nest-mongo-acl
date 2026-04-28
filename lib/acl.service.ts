import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { AclModuleOptions, MODULE_OPTIONS_TOKEN } from './acl.module-options';
import { FilterQuery } from 'mongoose';
import { Acl } from './schema/acl.schema';
import { IAclDocument, IAclModel } from './interfaces';
import { AclMethods } from './methods';
import { grantAccessTo } from './utils/helpers';
import { AclRegistry } from './acl.registry';

@Injectable()
export class AclService implements OnModuleInit {
  constructor(
    @Inject(MODULE_OPTIONS_TOKEN) private readonly options: AclModuleOptions,
    private readonly aclRegistry: AclRegistry,
  ) {}
  onModuleInit() {
    this.aclRegistry.registerOptions(this.options);
  }

  createAccessFilter<UserType = any>(
    action: string,
    user?: UserType,
  ): FilterQuery<Acl> {
    const userGroups = this.aclRegistry.groupFromUser(user);
    return {
      $or: [
        { publicPolicy: action },
        ...userGroups.map((group) => ({
          [`policies.${group}`]: action,
        })),
      ],
    };
  }

  grantAccessToGroup<T extends IAclDocument>(
    doc: T,
    group: string,
    action: string,
  ): T {
    AclMethods.grantAccess.call(doc, group, action);
    return doc;
  }

  revokeAccessToGroup<T extends IAclDocument>(
    doc: T,
    group: string,
    action: string,
  ): T {
    AclMethods.revokeAccess.call(doc, group, action);
    return doc;
  }

  hasAccess<T extends IAclDocument>(
    doc: T,
    group: string,
    action: string,
  ): boolean {
    return AclMethods.hasAccess.call(doc, group, action);
  }

  grantPublicAccess<T extends IAclDocument>(doc: T, action: string): T {
    AclMethods.grantPublicAccess.call(doc, action);
    return doc;
  }

  revokePublicAccess<T extends IAclDocument>(doc: T, action: string): T {
    AclMethods.revokePublicAccess.call(doc, action);
    return doc;
  }

  grantAccessTo<T extends IAclModel>(
    model: T,
    filter: FilterQuery<T>,
    group: string,
    action: string,
  ) {
    model.updateMany(filter, grantAccessTo(group, action));
  }
}
