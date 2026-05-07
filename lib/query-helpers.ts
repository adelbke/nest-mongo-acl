import { WithAcl } from './interfaces';
import {
  FilterQuery,
  HydratedDocument,
  // IfEquals,
  QueryWithHelpers,
} from 'mongoose';
import { accessibleBy } from './utils/helpers';

export interface IAclQueryHelpers {
  withAccessFor<User = unknown>(
    action: string,
    userOrGroup: string | User,
  ): this;
}

export const AclQueryHelpers: IAclQueryHelpers = {
  withAccessFor<T extends WithAcl, IUser = unknown>(
    this: QueryWithHelpers<
      HydratedDocument<T>[],
      HydratedDocument<T>,
      IAclQueryHelpers
    >,
    action: string,
    userOrGroup?: IUser | string,
  ) {
    const filter: FilterQuery<T> = accessibleBy<T>(action, userOrGroup);
    return this.where(filter);
  },
};
