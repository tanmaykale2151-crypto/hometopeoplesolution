import { queryOptions } from "@tanstack/react-query";
import { getProperty, listMyProperties, listProperties, type PropertyFilters } from "./properties.functions";

export const propertiesQuery = (filters: PropertyFilters) =>
  queryOptions({
    queryKey: ["properties", "list", filters],
    queryFn: () => listProperties({ data: filters }),
    staleTime: 30_000,
  });

export const propertyQuery = (id: string) =>
  queryOptions({
    queryKey: ["properties", "detail", id],
    queryFn: () => getProperty({ data: { id } }),
    staleTime: 30_000,
  });

export const myPropertiesQuery = () =>
  queryOptions({
    queryKey: ["properties", "mine"],
    queryFn: () => listMyProperties(),
  });
