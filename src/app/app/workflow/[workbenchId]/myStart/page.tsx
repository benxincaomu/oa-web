"use client"
import { Button, Modal, Space, Table } from "antd";
import { useState, useEffect, use, useCallback } from "react";
import FormNew from "../../FormNew";
import service from "@/commons/base/service";
import { WorkbenchPublish, ColumnDefinition } from "@/app/app/workbenches/design/types";
import FormDetail from "../../FormDetail";
import { FlowForm } from "../../types";



/**
 * 
 * 我发起的工作流
 */
export default function MyStart({
  params,
}: { params: Promise<{ workbenchId: string }> }) {
  const [disableEdit, setDisableEdit] = useState(false);

  const [modalTitle, setModalTitle] = useState("");
  const convertColunms = (columns: ColumnDefinition[]) => {
    const cols = [];
    for (const column of columns) {
      if(column.listAble){
        cols.push({
          title: `${column.label}${column.unit ? `(${column.unit})` : ""}`,
          dataIndex: ['data', column.columnName],
          key: column.columnName,
        });
      }
    }
    cols.push({
      title: "操作",
      key: "action",
      render: (text: any, record: any) => (
        <Space size="middle">
          {!record.started && <a onClick={() => {
            setFlowFormId(record.id);
            setDisableEdit(false);
            setModalTitle("编辑表单")
            setAddOpen(true);
          }}>
            编辑
          </a>}

          <a onClick={() => {
            setFlowFormId(record.id);
            setDisableEdit(true);
            setModalTitle("查看表单")
            setAddOpen(true);
          }}>
            查看
          </a>
        </Space>
      )
    })
    return cols;
  }
  // const [workbenchId,setWorkbenchId] = useState<string>("");
  const { workbenchId } = use(params);
  const [workbenchPublish, setWorkbenchPublish] = useState<WorkbenchPublish>();
  const [columns, setColumns] = useState<any>([]);
  const [flowFormId, setFlowFormId] = useState<number>(0);
  useEffect(() => {
    document.title = "我发起的";
    if (workbenchId) {
      service.get(`/flowForm/${workbenchId}/getWorkbenchPublishById`).then(res => {
        if (res.data) {
          if (res.data) {
            setWorkbenchPublish(res.data);
            setColumns(convertColunms(res.data.entityDefinition.columns));
          }
        }
      })
    }
  }, [params, workbenchId]);

  const [tableData, setTableData] = useState<FlowForm[]>([]);
  const [currPage, setCurrPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const loadMystart = useCallback((currPage: number, pageSize: number) => {
    service.get(`/flowForm/${workbenchId}/listMyStart?currPage=${currPage}&pageSize=${pageSize}`).then(res => {
      setTableData(res.data.content);
      setTotal(res.data.page.totalElements);
    });
  }, [ workbenchId]);


  useEffect(() => {
    if (columns && columns.length > 0) {
      loadMystart(0,pageSize);

    }
  }, [columns, loadMystart, pageSize]);

  const [addOpen, setAddOpen] = useState(false);

  const onAddFormOpen = () => {
    setAddOpen(true);
    setFlowFormId(0);
    setDisableEdit(false);
    setModalTitle("新建表单")
  };

  return (
    <div>
      <div style={{ textAlign: 'right', marginBottom: 16 }}>
        <Button onClick={onAddFormOpen}>新建</Button>
      </div>
      <Modal title={modalTitle} open={addOpen} onCancel={() => setAddOpen(false)} footer={null} width={800} destroyOnHidden={true} >
        {disableEdit ? <FormDetail workbenchId={workbenchId} formId={flowFormId} /> : <FormNew formId={flowFormId} workbenchPublish={workbenchPublish} onCancel={() => setAddOpen(false)} onSubmit={() => {
          setAddOpen(false);
          loadMystart(0,pageSize);
        }} disabled={disableEdit} />}

      </Modal>
      <Table columns={columns} dataSource={tableData} pagination={{
        pageSize: pageSize, current: currPage, total: total, onChange(page, pageSize) {
          setPageSize(pageSize);
          loadMystart(page, pageSize);
        },
      }} bordered = {true} rowKey={(record) => record.id} rowClassName={(record, index) => index % 2 === 0 ? 'row-class-0' : 'row-class-1'} rowHoverable = {true} />
    </div>
  )
}