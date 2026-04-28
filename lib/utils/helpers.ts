import { WithAcl } from 'lib/interfaces';
import { FilterQuery, UpdateQuery } from 'mongoose';
import { groupOrUserToGroups } from './util';

export function grantAccessTo(
  group: string,
  action: string,
): UpdateQuery<WithAcl> {
  return {
    $addToSet: {
      [`acl.policies.${group}`]: action,
    },
  };
}

export function grantToMany(
  groupActionPairs: [string, string][],
): UpdateQuery<WithAcl> {
  const fieldValueUpdates = groupActionPairs.map(
    ([group, action]) => [`acl.policies.${group}`, action] as [string, string],
  );

  const update = fieldValueUpdates.reduce(
    (acc, [field, value]) => {
      const addToSet = acc.$addToSet;
      // First time we encounter a field, we create the $addToSet entry for it
      if (!addToSet[field]) {
        addToSet[field] = value;
      } else {
        // Field already exists, check if we have the $each operator
        if (!addToSet[field].$each) {
          // If not, we convert the existing value to an array with $each
          addToSet[field] = { $each: [addToSet[field], value] };
        } else {
          // If $each already exists, we just push the new value into the array
          addToSet[field].$each.push(value);
        }
      }
      return acc;
    },
    {
      $addToSet: {},
    },
  );

  return update;
}

export function revokeAccessTo(
  group: string,
  action: string,
): UpdateQuery<WithAcl> {
  return {
    $pull: {
      [`acl.policies.${group}`]: action,
    },
  };
}

export function revokeToMany(
  groupActionPairs: [string, string][],
): UpdateQuery<WithAcl> {
  const fieldValueUpdates = groupActionPairs.map(
    ([group, action]) => [`acl.policies.${group}`, action] as const,
  );
  const update = fieldValueUpdates.reduce(
    (acc, [field, value]) => {
      const pull = acc.$pull;
      // First time we encounter a field, we create the $pull entry for it
      if (!pull[field]) {
        pull[field] = value;
      } else {
        // Field already exists, check if we have the $each operator
        if (!pull[field].$each) {
          // If not, we convert the existing value to an array with $each
          pull[field] = { $each: [pull[field], value] };
        } else {
          // If $each already exists, we just push the new value into the array
          pull[field].$each.push(value);
        }
      }
      return acc;
    },
    {
      $pull: {},
    },
  );

  return update;
}

export function grantPublicAccess(action: string): UpdateQuery<WithAcl> {
  return {
    $addToSet: {
      'acl.publicPolicy': action,
    },
  };
}

export function revokePublicAccess(action: string): UpdateQuery<WithAcl> {
  return {
    $pull: {
      'acl.publicPolicy': action,
    },
  };
}

export function accessibleBy<T extends WithAcl>(
  action: string,
  groupOrUser?: string,
): FilterQuery<T>;
export function accessibleBy<T extends WithAcl, User = unknown>(
  action: string,
  groupOrUser?: User,
): FilterQuery<T>;
export function accessibleBy<T extends WithAcl, User = unknown>(
  action: string,
  groupOrUser?: string | User,
): FilterQuery<T> {
  const groups = groupOrUserToGroups(groupOrUser);

  return {
    acl: {
      $or: [
        { publicPolicy: action },
        ...groups.map((group) => ({
          [`policies.${group}`]: action,
        })),
      ],
    },
  };
}
