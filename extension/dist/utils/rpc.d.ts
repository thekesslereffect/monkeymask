export interface RpcResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}
export interface AccountInfo {
    balance: string;
    frontier: string;
    representative: string;
    confirmation_height: string;
}
export declare class BananoRPC {
    private static readonly RPC_ENDPOINTS;
    private currentEndpointIndex;
    /**
     * Make RPC call to Banano node
     */
    private makeRpcCall;
    /**
     * Get account information including balance
     */
    getAccountInfo(address: string): Promise<RpcResponse<AccountInfo>>;
    /**
     * Get account balance in raw units
     */
    getAccountBalance(address: string): Promise<RpcResponse<{
        balance: string;
        pending: string;
    }>>;
    /**
     * Get multiple account balances at once
     */
    getAccountsBalances(addresses: string[]): Promise<RpcResponse<{
        balances: Record<string, {
            balance: string;
            pending: string;
        }>;
    }>>;
    /**
     * Convert raw balance to BAN
     */
    static rawToBan(raw: string): string;
    /**
     * Convert BAN to raw
     */
    static banToRaw(ban: string): string;
    /**
     * Check if an account exists (has been opened)
     */
    accountExists(address: string): Promise<boolean>;
    /**
     * Get pending blocks for an account
     */
    getPending(address: string, count?: number): Promise<RpcResponse<{
        blocks: Record<string, any>;
    }>>;
    /**
     * Get account frontier (latest block hash)
     */
    getAccountFrontier(address: string): Promise<RpcResponse<{
        frontier: string;
    }>>;
}
