import { WithAcl } from './interfaces';
import { FilterQuery, HydratedDocument, QueryWithHelpers } from 'mongoose';
import { accessibleBy } from './utils/helpers';

export type IAclQueryHelpers = {
  withAccessFor: typeof AclQueryHelpers.withAccessFor;
};
function withAccessFor<T extends WithAcl>(
  this: QueryWithHelpers<T[], HydratedDocument<T>, IAclQueryHelpers>,
  action: string,
  group: string,
);
function withAccessFor<T extends WithAcl, IUser = unknown>(
  this: QueryWithHelpers<T[], HydratedDocument<T>, IAclQueryHelpers>,
  action: string,
  user?: IUser,
);
function withAccessFor<T extends WithAcl, IUser = unknown>(
  this: QueryWithHelpers<T[], HydratedDocument<T>, IAclQueryHelpers>,
  action: string,
  userOrGroup?: IUser | string,
): QueryWithHelpers<T[], HydratedDocument<T>, IAclQueryHelpers> {
  const filter: FilterQuery<T> = accessibleBy<T>(action, userOrGroup);
  return this.where(filter);
}
export const AclQueryHelpers = {
  withAccessFor,
};
