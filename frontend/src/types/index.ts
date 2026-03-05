export interface TableResponseDto {
    id: string;
    tableCode: string;
    name: string;
    branchName: string;
}

export interface TableSessionResponseDto {
    id: string; // SessionId
    tableId: string;
    startTime: string;
    isClosed: boolean;
}

export interface StartSessionRequestDto {
    tableId: string;
}
