export interface TableResponseDto {
    id: string;
    tableCode: string;
    name: string;
    branchName?: string;
    posX?: number;
    posY?: number;
}

export interface TableSessionResponseDto {
    id: string; // SessionId
    tableId: string;
    startTime: string;
    isClosed?: boolean;
    isActive?: boolean;
}

export interface StartSessionRequestDto {
    tableId: string;
}
