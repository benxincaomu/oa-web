"use client";
import service from "@/commons/base/service";
import { useCallback, useEffect, useRef, useState } from "react";
import { ColumnDefinition } from "../workbenches/design/types";
import { Button, Card, Col, Form, Input, Row, Space, Timeline, Typography, Image } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { FlowForm } from "./types";


interface Props {
    workbenchId: string;
    formId: number;
    onSubmit?: () => void;
    onCancel?: () => void;


}
export default function FormDetail({ workbenchId, formId, onSubmit, onCancel }: Props) {
    const [columns, setColumns] = useState<ColumnDefinition[]>([]);
    const [flowForm, setFlowForm] = useState<FlowForm>();
    const [buttons, setButtons] = useState<any>(null);
    const loadingRef = useRef(false);
    const getFormDetail = useCallback(() => {
        if (workbenchId && formId && !loadingRef.current) {
            loadingRef.current = true;
            service.get(`/flowForm/${workbenchId}/getFlowFormDetail/${formId}`).then((res) => {
                setFlowForm(res.data.flowForm);
                setButtons(res.data.buttons);
                setColumns(res.data.columns);
            }).finally(() => {
                loadingRef.current = false;
            })
        }
    }, [workbenchId, formId]);

    useEffect(() => {
        getFormDetail();

    }, [getFormDetail]);
    const [form] = Form.useForm();
    const sunbmit = (flowId: number) => {
        form.setFieldValue("flowId", flowId);
        // console.log(form.getFieldsValue());
        service.post(`/workflow/${workbenchId}/approval`, form.getFieldsValue()).then((res) => {
            console.log("操作成功");
            if (onSubmit) {
                onSubmit();

            }
        })
    };
    return (
        <div>
            <Row gutter={16}>

                {columns.map((column) => {
                    const fullLine = column.columnType === "image" || column.columnType === "longtext";
                    return (
                        <Col span={fullLine ? 24 : 12} key={column.columnName}>
                            <Row>
                                <Col span={fullLine ? 2 : 4}>
                                    <Typography.Text strong >{column.label}:</Typography.Text>
                                </Col>
                                {(() => {
                                    switch (column.columnType) {
                                        case "image":
                                            return <Col span={18}>
                                                <Row>
                                                    {flowForm?.data[column.columnName]?.map((item: any, index: number) =>
                                                        <Col key={index} span={4}>
                                                            <Image src={item.url} alt={item.name} />
                                                        </Col>
                                                    )}
                                                </Row>
                                            </Col>
                                                ;


                                        default:
                                            return <Col span={16}>
                                                <Typography.Paragraph type="secondary"> {flowForm?.data[column.columnName]}{column.unit}</Typography.Paragraph>
                                            </Col>
                                    }
                                    return <></>
                                })()}
                            </Row>

                        </Col>
                    )
                })}
            </Row>
            {flowForm && flowForm.flowHistories && flowForm.flowHistories.length > 0 && (
                <Card title={<Typography.Title level={4}>流转历史</Typography.Title>} style={{ marginBottom: '24px' }}>
                    <Timeline items={flowForm.flowHistories.map((history, index) => ({
                        dot: <UserOutlined style={{ fontSize: '16px' }} />,
                        children: <>
                            <Space direction="vertical" size={0}>
                                <Typography.Text strong>{history.nodeName}</Typography.Text>
                                <Typography.Text >{history.operatorName}&nbsp;&nbsp;{history.flowName}</Typography.Text>
                                <Typography.Text type="secondary">{history.createAt}</Typography.Text>
                            </Space>
                            &nbsp;&nbsp;&nbsp;
                            <Space>

                                <Typography.Text type="secondary">{history.approvalOpinion}</Typography.Text>
                            </Space>
                        </>,
                        key: history.id,

                    }))} />
                </Card>
            )}
            {buttons && (
                <Form form={form}>
                    <Card>
                        <Form.Item name={"approvalOpinion"} label="审批意见">
                            <Input.TextArea rows={4} placeholder="请输入审批意见" />
                        </Form.Item>
                        <Form.Item hidden name={"flowId"}>
                            <Input />
                        </Form.Item>
                        <Form.Item hidden name={"flowFormId"} initialValue={flowForm?.id}>
                            <Input />
                        </Form.Item>
                        <Row justify="end" gutter={16}>
                            {buttons.map((button: any, index: number) => {
                                return (
                                    <Col key={index}>
                                        <Button type="primary" onClick={() => { sunbmit(button.value) }}>{button.name}</Button>
                                    </Col>
                                )
                            })}
                        </Row>
                    </Card>
                </Form>
            )}
        </div>
    )
}