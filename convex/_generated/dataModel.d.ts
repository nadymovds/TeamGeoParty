/* prettier-ignore-start */

/* eslint-disable */
/**
 * Generated `dataModel` types.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 *
 * @module
 */

import type { DataModelFromSchemaDefinition } from "convex/server";
import type { DocumentByName, TableNamesInDataModel } from "convex/server";
import type {
  FilterBuilder,
  IndexRangeBuilder,
  IndexRangeBuilderWithEquality,
  QueryInitializer,
  TableQuery,
} from "convex/server";
import type { Expression, ExpressionOrValue, FilterExpression } from "convex/server";
import type { WithoutSystemFields } from "convex/server";
import type schema from "../schema";

type DataModel = DataModelFromSchemaDefinition<typeof schema>;

export type { DataModel };

type Doc<TableName extends TableNamesInDataModel<DataModel>> = DocumentByName<
  DataModel,
  TableName
>;

export type { Doc };

type TableIndexes<
  TableName extends TableNamesInDataModel<DataModel>,
> = TableNamesInDataModel<DataModel>[TableName] extends {
  indexes: infer IndexMap;
}
  ? IndexMap
  : never;

export type { TableIndexes };

export type Id<TableName extends TableNamesInDataModel<DataModel>> =
  TableName extends TableNamesInDataModel<DataModel>
    ? DocumentByName<DataModel, TableName>["_id"]
    : never;

/* prettier-ignore-end */
