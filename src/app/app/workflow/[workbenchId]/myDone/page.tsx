"use client"
import { Button, Col, Form, Modal, Row, Space, Table, Typography } from "antd";
import { useState, useEffect, use, useCallback } from "react";
import FormNew from "../../FormNew";
import service from "@/commons/base/service";
import { WorkbenchPublish, ColumnDefinition } from "@/app/app/workbenches/design/types";
import FormDetail from "../../FormDetail";
import { FlowForm } from "../../types";
import DeptUserSelect from "../../DeptUserSelect";



/**
 * 
 * 我发起的工作流
 */
export default function MyTodo({
  params,
}: { params: Promise<{ workbenchId: string }> }) {
  const [disableEdit, setDisableEdit] = useState(false);

  const [modalTitle, setModalTitle] = useState("");
  const convertColunms = (columns: ColumnDefinition[]) => {
    const cols = [];
    for (const column of columns) {
      if (column.listAble) {
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
    document.title = "我的已办";
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
  const [starterId, setStarterId] = useState<number>(0);
  const loadMyDone = useCallback(() => {
    service.get(`/flowForm/${workbenchId}/listMyDone?currPage=${currPage}&pageSize=${pageSize}&starterId=${starterId > 0 ? starterId : ""}`).then(res => {
      setTableData(res.data.content);
      setTotal(res.data.page.totalElements);
    });
  }, [currPage, pageSize, starterId, workbenchId]);


  useEffect(() => {
    if (columns && columns.length > 0) {
      loadMyDone();

    }
  }, [columns, loadMyDone]);

  const [addOpen, setAddOpen] = useState(false);


  const [userSelectForm] = Form.useForm();
  

  return (
    <div>
      <Row gutter={16}>
        <Col span={8}>
          <DeptUserSelect form={userSelectForm} formItemSpan={12} userSelectLabel="发起人"/>
        </Col>
        <Col span={4}>
          <Button type="primary" onClick={() => {
            setStarterId(userSelectForm.getFieldValue('userId'));
          }}>搜索</Button>
        </Col>
      </Row>
      <Typography.Title level={4}>我的已办</Typography.Title>
      <Modal title={modalTitle} open={addOpen} onCancel={() => setAddOpen(false)} footer={null} width={800} destroyOnHidden={true} >
        <FormDetail workbenchId={workbenchId} formId={flowFormId} onCancel={() => setAddOpen(false)} onSubmit={() => {
          setAddOpen(false);
          loadMyDone();
        }} />

      </Modal>
      <Table columns={columns} dataSource={tableData} pagination={{
        pageSize: pageSize, current: currPage, total: total, onChange(page, pageSize) {
          setCurrPage(page);
          setPageSize(pageSize);
        },
      }} bordered={true} rowKey={(record) => record.id} rowClassName={(record, index) => index % 2 === 0 ? 'row-class-0' : 'row-class-1'} rowHoverable={true} />
    </div>
  )
}