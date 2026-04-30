import { IAclQueryHelpers } from './query-helpers';
import {
  accessibleBy,
  grantAccessTo,
  grantToMany,
  revokeAccessTo,
  revokeToMany,
} from './utils/helpers';
import { AclRegistry } from './acl.registry';
import { Type } from '@nestjs/common';
import { types } from '@typegoose/typegoose';
import { WithAcl } from './interfaces';

describe('AclQueryHelpers', () => {
  const mockUserGroups = ['admin', 'editor'];
  const mockAction = 'read';

  beforeEach(() => {
    // Reset the mock before each test
    AclRegistry.getInstance().registerOptions({
      groupFromUser: jest.fn((user?: { role?: string }) => {
        if (user?.role === 'userWithGroups') {
          return mockUserGroups;
        }
        if (user?.role === 'userWithoutGroups') {
          return [];
        }
        return [];
      }),
    });
  });
  // AclRegistry.getInstance().groupFromUser =

  describe('withAccessFor', () => {
    // Mock a Mongoose query object
    const mockQuery = {
      where: jest.fn().mockReturnThis(),
    };

    it('should return a query that includes publicPolicy when action is public', () => {
      const result = IAclQueryHelpers.withAccessFor.call(
        mockQuery as unknown as types.QueryHelperThis<Type & WithAcl, any>,
        mockAction,
        'someUser',
      );
      expect(result).toBe(mockQuery);
      expect(mockQuery.where).toHaveBeenCalledWith(
        expect.objectContaining({
          acl: expect.objectContaining({
            $or: expect.arrayContaining([{ publicPolicy: mockAction }]),
          }),
        }),
      );
    });

    it('should return a query that includes user groups when user has groups', () => {
      const result = IAclQueryHelpers.withAccessFor.call(
        mockQuery as unknown as types.QueryHelperThis<Type & WithAcl, any>,
        mockAction,
        { role: 'userWithGroups' },
      );
      expect(result).toBe(mockQuery);
      expect(mockQuery.where).toHaveBeenCalledWith({
        acl: {
          $or: [
            { publicPolicy: mockAction },
            { 'policies.admin': mockAction },
            { 'policies.editor': mockAction },
          ],
        },
      });
    });

    it('should return a query that only includes publicPolicy when user has no groups', () => {
      const result = IAclQueryHelpers.withAccessFor.call(
        mockQuery as unknown as types.QueryHelperThis<Type & WithAcl, any>,
        mockAction,
        { role: 'userWithoutGroups' },
      );
      expect(result).toBe(mockQuery);
      expect(mockQuery.where).toHaveBeenCalledWith({
        acl: {
          $or: [{ publicPolicy: mockAction }],
        },
      });
    });

    it('should handle undefined user gracefully', () => {
      const result = IAclQueryHelpers.withAccessFor.call(
        mockQuery as unknown as types.QueryHelperThis<Type & WithAcl, any>,
        mockAction,
        undefined,
      );
      expect(result).toBe(mockQuery);
      expect(mockQuery.where).toHaveBeenCalledWith({
        acl: {
          $or: [{ publicPolicy: mockAction }],
        },
      });
    });

    it('should handle null user gracefully', () => {
      const result = IAclQueryHelpers.withAccessFor.call(
        mockQuery as unknown as types.QueryHelperThis<Type & WithAcl, any>,
        mockAction,
        null,
      );
      expect(result).toBe(mockQuery);
      expect(mockQuery.where).toHaveBeenCalledWith({
        acl: {
          $or: [{ publicPolicy: mockAction }],
        },
      });
    });
  });

  describe('grantAccessTo', () => {
    it('should generate an $addToSet update for a new group and action', () => {
      const update = grantAccessTo('newGroup', 'newAction');
      expect(update).toEqual({
        $addToSet: {
          'acl.policies.newGroup': 'newAction',
        },
      });
    });

    it('should generate an $addToSet update for an existing group and new action', () => {
      const update = grantAccessTo('existingGroup', 'anotherAction');
      expect(update).toEqual({
        $addToSet: {
          'acl.policies.existingGroup': 'anotherAction',
        },
      });
    });
  });

  describe('grantToMany', () => {
    it('should return an empty $addToSet when no pairs are provided', () => {
      const update = grantToMany([]);
      expect(update).toEqual({ $addToSet: {} });
    });

    it('should generate an $addToSet update for a single group-action pair', () => {
      const update = grantToMany([['group1', 'action1']]);
      expect(update).toEqual({
        $addToSet: {
          'acl.policies.group1': 'action1',
        },
      });
    });

    it('should combine multiple actions for the same group using $each', () => {
      const update = grantToMany([
        ['groupA', 'actionX'],
        ['groupB', 'actionY'],
        ['groupA', 'actionZ'],
      ]);
      expect(update).toEqual({
        $addToSet: {
          'acl.policies.groupA': { $each: ['actionX', 'actionZ'] },
          'acl.policies.groupB': 'actionY',
        },
      });
    });

    it('should handle multiple unique group-action pairs correctly', () => {
      const update = grantToMany([
        ['group1', 'action1'],
        ['group2', 'action2'],
        ['group3', 'action3'],
      ]);
      expect(update).toEqual({
        $addToSet: {
          'acl.policies.group1': 'action1',
          'acl.policies.group2': 'action2',
          'acl.policies.group3': 'action3',
        },
      });
    });

    it('should not duplicate actions if provided multiple times for the same group in the input array', () => {
      const update = grantToMany([
        ['group1', 'action1'],
        ['group1', 'action1'], // Duplicate
        ['group2', 'action2'],
      ]);
      expect(update).toEqual({
        $addToSet: {
          'acl.policies.group1': { $each: ['action1', 'action1'] }, // MongoDB handles actual de-duplication
          'acl.policies.group2': 'action2',
        },
      });
    });
  });

  describe('revokeAccessFrom', () => {
    it('should generate a $pull update for an existing group and action', () => {
      const update = revokeAccessTo('existingGroup', 'existingAction');
      expect(update).toEqual({
        $pull: {
          'acl.policies.existingGroup': 'existingAction',
        },
      });
    });

    it('should generate a $pull update for a non-existent group/action (MongoDB handles no-op)', () => {
      const update = revokeAccessTo('nonExistentGroup', 'nonExistentAction');
      expect(update).toEqual({
        $pull: {
          'acl.policies.nonExistentGroup': 'nonExistentAction',
        },
      });
    });
  });

  describe('revokeFromMany', () => {
    it('should return an empty $pull when no pairs are provided', () => {
      const update = revokeToMany([]);
      expect(update).toEqual({ $pull: {} });
    });

    it('should generate a $pull update for a single group-action pair', () => {
      const update = revokeToMany([['group1', 'action1']]);
      expect(update).toEqual({
        $pull: {
          'acl.policies.group1': 'action1',
        },
      });
    });

    it('should combine multiple actions for the same group using $each', () => {
      const update = revokeToMany([
        ['groupA', 'actionX'],
        ['groupB', 'actionY'],
        ['groupA', 'actionZ'],
      ]);
      expect(update).toEqual({
        $pull: {
          'acl.policies.groupA': { $each: ['actionX', 'actionZ'] },
          'acl.policies.groupB': 'actionY',
        },
      });
    });

    it('should handle multiple unique group-action pairs correctly', () => {
      const update = revokeToMany([
        ['group1', 'action1'],
        ['group2', 'action2'],
        ['group3', 'action3'],
      ]);
      expect(update).toEqual({
        $pull: {
          'acl.policies.group1': 'action1',
          'acl.policies.group2': 'action2',
          'acl.policies.group3': 'action3',
        },
      });
    });

    it('should handle duplicate actions for the same group in the input array', () => {
      const update = revokeToMany([
        ['group1', 'action1'],
        ['group1', 'action1'], // Duplicate
        ['group2', 'action2'],
      ]);
      expect(update).toEqual({
        $pull: {
          'acl.policies.group1': { $each: ['action1', 'action1'] },
          'acl.policies.group2': 'action2',
        },
      });
    });
  });
});
