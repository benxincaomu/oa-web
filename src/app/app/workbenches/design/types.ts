
export interface ColumnDefinition {
    columnName: string;
    columnType: string;
    label: string;
    listAble: boolean;
    sort: number;
    unit?: string;
    validateTypes?: string[];
    required:boolean;
    regExp?: string;
    range?: string;
}
export interface WorkbenchPublish {
    id:number;
    version:number;
    entityDefinition: EntityDefintion;
    workbenchId:number;
}

export interface EntityDefintion {
    id: number;
    entityName: string;
    entityDesc: string;
    columns: ColumnDefinition[];
    
}