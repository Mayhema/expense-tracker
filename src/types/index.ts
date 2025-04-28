export interface TransactionData {
    id: string;
    amount: number;
    date: string;
    description: string;
}

export interface Parser {
    parse(filePath: string): Promise<TransactionData[]>;
    validate(data: any): boolean;
}