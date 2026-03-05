import { useQuery, useSuspenseQuery, useMutation } from "@tanstack/react-query";
import type { UseQueryOptions, UseSuspenseQueryOptions, UseMutationOptions } from "@tanstack/react-query";
export class ApiError extends Error {
    status: number;
    statusText: string;
    body: unknown;
    constructor(status: number, statusText: string, body: unknown){
        super(`HTTP ${status}: ${statusText}`);
        this.name = "ApiError";
        this.status = status;
        this.statusText = statusText;
        this.body = body;
    }
}
export interface CompanyOption {
    company_id: number;
    company_name: string;
    industry: string;
}
export interface CompanyRow {
    company_id: number;
    company_name: string;
    esg_environmental: number;
    esg_governance: number;
    esg_overall: number;
    esg_social: number;
    industry: string;
    market_cap?: number | null;
    profit_margin?: number | null;
    region: string;
    revenue?: number | null;
    year: number;
}
export interface ComplexValue {
    display?: string | null;
    primary?: boolean | null;
    ref?: string | null;
    type?: string | null;
    value?: string | null;
}
export interface EnvironmentalRow {
    carbon_emissions: number;
    energy_consumption: number;
    water_usage: number;
    year: number;
}
export interface FilterOptions {
    companies: CompanyOption[];
    sectors: string[];
    years: number[];
}
export interface FinancialRow {
    growth_rate?: number | null;
    market_cap: number;
    profit_margin: number;
    revenue: number;
    year: number;
}
export interface GenieAskRequest {
    conversation_id?: string | null;
    question: string;
}
export interface GenieAskResponse {
    columns?: string[];
    conversation_id: string;
    error?: string | null;
    message_id: string;
    question: string;
    row_count?: number;
    rows?: unknown[][];
    sql?: string | null;
    status?: string;
    text?: string | null;
}
export interface HTTPValidationError {
    detail?: ValidationError[];
}
export interface KpiSummary {
    esg_environmental: number;
    esg_governance: number;
    esg_overall: number;
    esg_social: number;
}
export interface Name {
    family_name?: string | null;
    given_name?: string | null;
}
export interface SectorBar {
    esg_environmental: number;
    esg_governance: number;
    esg_social: number;
    sector: string;
}
export interface TrendPoint {
    esg_environmental: number;
    esg_governance: number;
    esg_overall: number;
    esg_social: number;
    year: number;
}
export interface User {
    active?: boolean | null;
    display_name?: string | null;
    emails?: ComplexValue[] | null;
    entitlements?: ComplexValue[] | null;
    external_id?: string | null;
    groups?: ComplexValue[] | null;
    id?: string | null;
    name?: Name | null;
    roles?: ComplexValue[] | null;
    schemas?: UserSchema[] | null;
    user_name?: string | null;
}
export const UserSchema = {
    "urn:ietf:params:scim:schemas:core:2.0:User": "urn:ietf:params:scim:schemas:core:2.0:User",
    "urn:ietf:params:scim:schemas:extension:workspace:2.0:User": "urn:ietf:params:scim:schemas:extension:workspace:2.0:User"
} as const;
export type UserSchema = typeof UserSchema[keyof typeof UserSchema];
export interface ValidationError {
    ctx?: Record<string, unknown>;
    input?: unknown;
    loc: (string | number)[];
    msg: string;
    type: string;
}
export interface VersionOut {
    version: string;
}
export interface GetCompaniesParams {
    sector?: string | null;
    year?: number | null;
}
export const getCompanies = async (params?: GetCompaniesParams, options?: RequestInit): Promise<{
    data: CompanyRow[];
}> =>{
    const searchParams = new URLSearchParams();
    if (params?.sector != null) searchParams.set("sector", String(params?.sector));
    if (params?.year != null) searchParams.set("year", String(params?.year));
    const queryString = searchParams.toString();
    const url = queryString ? `/api/companies?${queryString}` : "/api/companies";
    const res = await fetch(url, {
        ...options,
        method: "GET"
    });
    if (!res.ok) {
        const body = await res.text();
        let parsed: unknown;
        try {
            parsed = JSON.parse(body);
        } catch  {
            parsed = body;
        }
        throw new ApiError(res.status, res.statusText, parsed);
    }
    return {
        data: await res.json()
    };
};
export const getCompaniesKey = (params?: GetCompaniesParams)=>{
    return [
        "/api/companies",
        params
    ] as const;
};
export function useGetCompanies<TData = {
    data: CompanyRow[];
}>(options?: {
    params?: GetCompaniesParams;
    query?: Omit<UseQueryOptions<{
        data: CompanyRow[];
    }, ApiError, TData>, "queryKey" | "queryFn">;
}) {
    return useQuery({
        queryKey: getCompaniesKey(options?.params),
        queryFn: ()=>getCompanies(options?.params),
        ...options?.query
    });
}
export function useGetCompaniesSuspense<TData = {
    data: CompanyRow[];
}>(options?: {
    params?: GetCompaniesParams;
    query?: Omit<UseSuspenseQueryOptions<{
        data: CompanyRow[];
    }, ApiError, TData>, "queryKey" | "queryFn">;
}) {
    return useSuspenseQuery({
        queryKey: getCompaniesKey(options?.params),
        queryFn: ()=>getCompanies(options?.params),
        ...options?.query
    });
}
export interface CurrentUserParams {
    "X-Forwarded-Host"?: string | null;
    "X-Forwarded-Preferred-Username"?: string | null;
    "X-Forwarded-User"?: string | null;
    "X-Forwarded-Email"?: string | null;
    "X-Request-Id"?: string | null;
    "X-Forwarded-Access-Token"?: string | null;
}
export const currentUser = async (params?: CurrentUserParams, options?: RequestInit): Promise<{
    data: User;
}> =>{
    const res = await fetch("/api/current-user", {
        ...options,
        method: "GET",
        headers: {
            ...(params?.["X-Forwarded-Host"] != null && {
                "X-Forwarded-Host": params["X-Forwarded-Host"]
            }),
            ...(params?.["X-Forwarded-Preferred-Username"] != null && {
                "X-Forwarded-Preferred-Username": params["X-Forwarded-Preferred-Username"]
            }),
            ...(params?.["X-Forwarded-User"] != null && {
                "X-Forwarded-User": params["X-Forwarded-User"]
            }),
            ...(params?.["X-Forwarded-Email"] != null && {
                "X-Forwarded-Email": params["X-Forwarded-Email"]
            }),
            ...(params?.["X-Request-Id"] != null && {
                "X-Request-Id": params["X-Request-Id"]
            }),
            ...(params?.["X-Forwarded-Access-Token"] != null && {
                "X-Forwarded-Access-Token": params["X-Forwarded-Access-Token"]
            }),
            ...options?.headers
        }
    });
    if (!res.ok) {
        const body = await res.text();
        let parsed: unknown;
        try {
            parsed = JSON.parse(body);
        } catch  {
            parsed = body;
        }
        throw new ApiError(res.status, res.statusText, parsed);
    }
    return {
        data: await res.json()
    };
};
export const currentUserKey = (params?: CurrentUserParams)=>{
    return [
        "/api/current-user",
        params
    ] as const;
};
export function useCurrentUser<TData = {
    data: User;
}>(options?: {
    params?: CurrentUserParams;
    query?: Omit<UseQueryOptions<{
        data: User;
    }, ApiError, TData>, "queryKey" | "queryFn">;
}) {
    return useQuery({
        queryKey: currentUserKey(options?.params),
        queryFn: ()=>currentUser(options?.params),
        ...options?.query
    });
}
export function useCurrentUserSuspense<TData = {
    data: User;
}>(options?: {
    params?: CurrentUserParams;
    query?: Omit<UseSuspenseQueryOptions<{
        data: User;
    }, ApiError, TData>, "queryKey" | "queryFn">;
}) {
    return useSuspenseQuery({
        queryKey: currentUserKey(options?.params),
        queryFn: ()=>currentUser(options?.params),
        ...options?.query
    });
}
export interface GetEnvironmentalParams {
    sector?: string | null;
    company_id?: number | null;
}
export const getEnvironmental = async (params?: GetEnvironmentalParams, options?: RequestInit): Promise<{
    data: EnvironmentalRow[];
}> =>{
    const searchParams = new URLSearchParams();
    if (params?.sector != null) searchParams.set("sector", String(params?.sector));
    if (params?.company_id != null) searchParams.set("company_id", String(params?.company_id));
    const queryString = searchParams.toString();
    const url = queryString ? `/api/environmental?${queryString}` : "/api/environmental";
    const res = await fetch(url, {
        ...options,
        method: "GET"
    });
    if (!res.ok) {
        const body = await res.text();
        let parsed: unknown;
        try {
            parsed = JSON.parse(body);
        } catch  {
            parsed = body;
        }
        throw new ApiError(res.status, res.statusText, parsed);
    }
    return {
        data: await res.json()
    };
};
export const getEnvironmentalKey = (params?: GetEnvironmentalParams)=>{
    return [
        "/api/environmental",
        params
    ] as const;
};
export function useGetEnvironmental<TData = {
    data: EnvironmentalRow[];
}>(options?: {
    params?: GetEnvironmentalParams;
    query?: Omit<UseQueryOptions<{
        data: EnvironmentalRow[];
    }, ApiError, TData>, "queryKey" | "queryFn">;
}) {
    return useQuery({
        queryKey: getEnvironmentalKey(options?.params),
        queryFn: ()=>getEnvironmental(options?.params),
        ...options?.query
    });
}
export function useGetEnvironmentalSuspense<TData = {
    data: EnvironmentalRow[];
}>(options?: {
    params?: GetEnvironmentalParams;
    query?: Omit<UseSuspenseQueryOptions<{
        data: EnvironmentalRow[];
    }, ApiError, TData>, "queryKey" | "queryFn">;
}) {
    return useSuspenseQuery({
        queryKey: getEnvironmentalKey(options?.params),
        queryFn: ()=>getEnvironmental(options?.params),
        ...options?.query
    });
}
export interface GetEsgBySectorParams {
    year?: number | null;
}
export const getEsgBySector = async (params?: GetEsgBySectorParams, options?: RequestInit): Promise<{
    data: SectorBar[];
}> =>{
    const searchParams = new URLSearchParams();
    if (params?.year != null) searchParams.set("year", String(params?.year));
    const queryString = searchParams.toString();
    const url = queryString ? `/api/esg-by-sector?${queryString}` : "/api/esg-by-sector";
    const res = await fetch(url, {
        ...options,
        method: "GET"
    });
    if (!res.ok) {
        const body = await res.text();
        let parsed: unknown;
        try {
            parsed = JSON.parse(body);
        } catch  {
            parsed = body;
        }
        throw new ApiError(res.status, res.statusText, parsed);
    }
    return {
        data: await res.json()
    };
};
export const getEsgBySectorKey = (params?: GetEsgBySectorParams)=>{
    return [
        "/api/esg-by-sector",
        params
    ] as const;
};
export function useGetEsgBySector<TData = {
    data: SectorBar[];
}>(options?: {
    params?: GetEsgBySectorParams;
    query?: Omit<UseQueryOptions<{
        data: SectorBar[];
    }, ApiError, TData>, "queryKey" | "queryFn">;
}) {
    return useQuery({
        queryKey: getEsgBySectorKey(options?.params),
        queryFn: ()=>getEsgBySector(options?.params),
        ...options?.query
    });
}
export function useGetEsgBySectorSuspense<TData = {
    data: SectorBar[];
}>(options?: {
    params?: GetEsgBySectorParams;
    query?: Omit<UseSuspenseQueryOptions<{
        data: SectorBar[];
    }, ApiError, TData>, "queryKey" | "queryFn">;
}) {
    return useSuspenseQuery({
        queryKey: getEsgBySectorKey(options?.params),
        queryFn: ()=>getEsgBySector(options?.params),
        ...options?.query
    });
}
export interface GetEsgTrendsParams {
    sector?: string | null;
    company_id?: number | null;
}
export const getEsgTrends = async (params?: GetEsgTrendsParams, options?: RequestInit): Promise<{
    data: TrendPoint[];
}> =>{
    const searchParams = new URLSearchParams();
    if (params?.sector != null) searchParams.set("sector", String(params?.sector));
    if (params?.company_id != null) searchParams.set("company_id", String(params?.company_id));
    const queryString = searchParams.toString();
    const url = queryString ? `/api/esg-trends?${queryString}` : "/api/esg-trends";
    const res = await fetch(url, {
        ...options,
        method: "GET"
    });
    if (!res.ok) {
        const body = await res.text();
        let parsed: unknown;
        try {
            parsed = JSON.parse(body);
        } catch  {
            parsed = body;
        }
        throw new ApiError(res.status, res.statusText, parsed);
    }
    return {
        data: await res.json()
    };
};
export const getEsgTrendsKey = (params?: GetEsgTrendsParams)=>{
    return [
        "/api/esg-trends",
        params
    ] as const;
};
export function useGetEsgTrends<TData = {
    data: TrendPoint[];
}>(options?: {
    params?: GetEsgTrendsParams;
    query?: Omit<UseQueryOptions<{
        data: TrendPoint[];
    }, ApiError, TData>, "queryKey" | "queryFn">;
}) {
    return useQuery({
        queryKey: getEsgTrendsKey(options?.params),
        queryFn: ()=>getEsgTrends(options?.params),
        ...options?.query
    });
}
export function useGetEsgTrendsSuspense<TData = {
    data: TrendPoint[];
}>(options?: {
    params?: GetEsgTrendsParams;
    query?: Omit<UseSuspenseQueryOptions<{
        data: TrendPoint[];
    }, ApiError, TData>, "queryKey" | "queryFn">;
}) {
    return useSuspenseQuery({
        queryKey: getEsgTrendsKey(options?.params),
        queryFn: ()=>getEsgTrends(options?.params),
        ...options?.query
    });
}
export const getFilters = async (options?: RequestInit): Promise<{
    data: FilterOptions;
}> =>{
    const res = await fetch("/api/filters", {
        ...options,
        method: "GET"
    });
    if (!res.ok) {
        const body = await res.text();
        let parsed: unknown;
        try {
            parsed = JSON.parse(body);
        } catch  {
            parsed = body;
        }
        throw new ApiError(res.status, res.statusText, parsed);
    }
    return {
        data: await res.json()
    };
};
export const getFiltersKey = ()=>{
    return [
        "/api/filters"
    ] as const;
};
export function useGetFilters<TData = {
    data: FilterOptions;
}>(options?: {
    query?: Omit<UseQueryOptions<{
        data: FilterOptions;
    }, ApiError, TData>, "queryKey" | "queryFn">;
}) {
    return useQuery({
        queryKey: getFiltersKey(),
        queryFn: ()=>getFilters(),
        ...options?.query
    });
}
export function useGetFiltersSuspense<TData = {
    data: FilterOptions;
}>(options?: {
    query?: Omit<UseSuspenseQueryOptions<{
        data: FilterOptions;
    }, ApiError, TData>, "queryKey" | "queryFn">;
}) {
    return useSuspenseQuery({
        queryKey: getFiltersKey(),
        queryFn: ()=>getFilters(),
        ...options?.query
    });
}
export interface GetFinancialParams {
    sector?: string | null;
    company_id?: number | null;
}
export const getFinancial = async (params?: GetFinancialParams, options?: RequestInit): Promise<{
    data: FinancialRow[];
}> =>{
    const searchParams = new URLSearchParams();
    if (params?.sector != null) searchParams.set("sector", String(params?.sector));
    if (params?.company_id != null) searchParams.set("company_id", String(params?.company_id));
    const queryString = searchParams.toString();
    const url = queryString ? `/api/financial?${queryString}` : "/api/financial";
    const res = await fetch(url, {
        ...options,
        method: "GET"
    });
    if (!res.ok) {
        const body = await res.text();
        let parsed: unknown;
        try {
            parsed = JSON.parse(body);
        } catch  {
            parsed = body;
        }
        throw new ApiError(res.status, res.statusText, parsed);
    }
    return {
        data: await res.json()
    };
};
export const getFinancialKey = (params?: GetFinancialParams)=>{
    return [
        "/api/financial",
        params
    ] as const;
};
export function useGetFinancial<TData = {
    data: FinancialRow[];
}>(options?: {
    params?: GetFinancialParams;
    query?: Omit<UseQueryOptions<{
        data: FinancialRow[];
    }, ApiError, TData>, "queryKey" | "queryFn">;
}) {
    return useQuery({
        queryKey: getFinancialKey(options?.params),
        queryFn: ()=>getFinancial(options?.params),
        ...options?.query
    });
}
export function useGetFinancialSuspense<TData = {
    data: FinancialRow[];
}>(options?: {
    params?: GetFinancialParams;
    query?: Omit<UseSuspenseQueryOptions<{
        data: FinancialRow[];
    }, ApiError, TData>, "queryKey" | "queryFn">;
}) {
    return useSuspenseQuery({
        queryKey: getFinancialKey(options?.params),
        queryFn: ()=>getFinancial(options?.params),
        ...options?.query
    });
}
export const genieAsk = async (data: GenieAskRequest, options?: RequestInit): Promise<{
    data: GenieAskResponse;
}> =>{
    const res = await fetch("/api/genie/ask", {
        ...options,
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...options?.headers
        },
        body: JSON.stringify(data)
    });
    if (!res.ok) {
        const body = await res.text();
        let parsed: unknown;
        try {
            parsed = JSON.parse(body);
        } catch  {
            parsed = body;
        }
        throw new ApiError(res.status, res.statusText, parsed);
    }
    return {
        data: await res.json()
    };
};
export function useGenieAsk(options?: {
    mutation?: UseMutationOptions<{
        data: GenieAskResponse;
    }, ApiError, GenieAskRequest>;
}) {
    return useMutation({
        mutationFn: (data)=>genieAsk(data),
        ...options?.mutation
    });
}
export interface GetKpisParams {
    sector?: string | null;
    company_id?: number | null;
    year?: number | null;
}
export const getKpis = async (params?: GetKpisParams, options?: RequestInit): Promise<{
    data: KpiSummary;
}> =>{
    const searchParams = new URLSearchParams();
    if (params?.sector != null) searchParams.set("sector", String(params?.sector));
    if (params?.company_id != null) searchParams.set("company_id", String(params?.company_id));
    if (params?.year != null) searchParams.set("year", String(params?.year));
    const queryString = searchParams.toString();
    const url = queryString ? `/api/kpis?${queryString}` : "/api/kpis";
    const res = await fetch(url, {
        ...options,
        method: "GET"
    });
    if (!res.ok) {
        const body = await res.text();
        let parsed: unknown;
        try {
            parsed = JSON.parse(body);
        } catch  {
            parsed = body;
        }
        throw new ApiError(res.status, res.statusText, parsed);
    }
    return {
        data: await res.json()
    };
};
export const getKpisKey = (params?: GetKpisParams)=>{
    return [
        "/api/kpis",
        params
    ] as const;
};
export function useGetKpis<TData = {
    data: KpiSummary;
}>(options?: {
    params?: GetKpisParams;
    query?: Omit<UseQueryOptions<{
        data: KpiSummary;
    }, ApiError, TData>, "queryKey" | "queryFn">;
}) {
    return useQuery({
        queryKey: getKpisKey(options?.params),
        queryFn: ()=>getKpis(options?.params),
        ...options?.query
    });
}
export function useGetKpisSuspense<TData = {
    data: KpiSummary;
}>(options?: {
    params?: GetKpisParams;
    query?: Omit<UseSuspenseQueryOptions<{
        data: KpiSummary;
    }, ApiError, TData>, "queryKey" | "queryFn">;
}) {
    return useSuspenseQuery({
        queryKey: getKpisKey(options?.params),
        queryFn: ()=>getKpis(options?.params),
        ...options?.query
    });
}
export const version = async (options?: RequestInit): Promise<{
    data: VersionOut;
}> =>{
    const res = await fetch("/api/version", {
        ...options,
        method: "GET"
    });
    if (!res.ok) {
        const body = await res.text();
        let parsed: unknown;
        try {
            parsed = JSON.parse(body);
        } catch  {
            parsed = body;
        }
        throw new ApiError(res.status, res.statusText, parsed);
    }
    return {
        data: await res.json()
    };
};
export const versionKey = ()=>{
    return [
        "/api/version"
    ] as const;
};
export function useVersion<TData = {
    data: VersionOut;
}>(options?: {
    query?: Omit<UseQueryOptions<{
        data: VersionOut;
    }, ApiError, TData>, "queryKey" | "queryFn">;
}) {
    return useQuery({
        queryKey: versionKey(),
        queryFn: ()=>version(),
        ...options?.query
    });
}
export function useVersionSuspense<TData = {
    data: VersionOut;
}>(options?: {
    query?: Omit<UseSuspenseQueryOptions<{
        data: VersionOut;
    }, ApiError, TData>, "queryKey" | "queryFn">;
}) {
    return useSuspenseQuery({
        queryKey: versionKey(),
        queryFn: ()=>version(),
        ...options?.query
    });
}
