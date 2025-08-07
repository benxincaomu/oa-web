export interface FlowForm {
    id: number;
    data : any;
    flowHistories: FlowHistory[];
}

export interface FlowHistory{
    id: number;
    flowFormId: number;
    flowName: string;
    operatorName: string;
    approvalOpinion: string;
    createAt: string;
    nodeName: string;
}