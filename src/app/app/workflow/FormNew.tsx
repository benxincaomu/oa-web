"use client";
import service from "@/commons/base/service";
import { Button, Col, Form, Input, InputNumber, Row, Space, Upload, message } from "antd"
import { useCallback, useEffect, useState } from "react";
import { WorkbenchPublish, ColumnDefinition } from "../workbenches/design/types";

interface Props {
    workbenchId?: string;
    columnDefinitions?: ColumnDefinition[];
    formId?: number;
    workbenchPublish?: WorkbenchPublish;
    onSubmit?: () => void;
    onCancel?: () => void;
    disabled?: boolean;
}
/**
 * 
 *  表单的新增与编辑
 *  
 */
export default function FormEditor({ workbenchPublish, formId, onSubmit, onCancel, disabled = false, columnDefinitions }: Props) {
    const [messageApi, contextHolder] = message.useMessage();
    const [form] = Form.useForm();
    const getFlowForm = useCallback(() => {
        if (formId && workbenchPublish && workbenchPublish.workbenchId) {
            service.get(`/flowForm/${workbenchPublish.workbenchId}/${formId}`).then((res) => {
                if (res.data) {
                    form.setFieldsValue({ ...res.data.data, "id": res.data.id });

                }
            })
        }
    }, [form, formId, workbenchPublish]);
    // 获取文件服务前缀
    const [fileServerPrefix, setFileServerPrefix] = useState("");
    useEffect(() => {
        service.get("/file/baseUrl").then(res => {

            setFileServerPrefix(res.data);

        });
    }, []);

    useEffect(() => {

        getFlowForm();
        if (!formId) {
            form.resetFields();
        }

    }, [form, formId, getFlowForm, workbenchPublish]);


    const onFinish = (values: any) => {
        if (!workbenchPublish) {

            console.log('preview:', values);
        } else {
            // console.log('new:', values);
            service.post(`/flowForm/${workbenchPublish.workbenchId}`, {
                publishId: workbenchPublish.id,
                data: values,
                id: values.id
            }).then(res => {
                if (res.code == 200) {
                    messageApi.success("提交成功");
                    if (onSubmit) {
                        onSubmit();
                    }
                }

            });
        }
    };

    const commitForm = () => {
        const values = form.getFieldsValue();
        if (!workbenchPublish) {

        } else {
            service.post(`/flowForm/${workbenchPublish.workbenchId}/commit`, {
                publishId: workbenchPublish.id,
                data: values,
                id: values.id
            }).then(res => {
                if (res.code == 200) {
                    messageApi.success("提交成功");
                    if (onSubmit) {
                        onSubmit();
                    }
                }

            });
        }
    };

    return (
        <div>
            {contextHolder}
            <Form form={form} onFinish={(values) => { onFinish(values) }} disabled={disabled}>
                <Form.Item hidden name={"id"}>
                    <Input />
                </Form.Item>
                <Row gutter={16}>

                    {(columnDefinitions || workbenchPublish?.entityDefinition.columns)?.map(column => {
                        return (
                            <Col key={column.columnName} span={column.columnType === "longtext" ||column.columnType === "image"? 24 : 12}>
                                <Form.Item label={column.label} name={column.columnName} valuePropName={column.columnType === "image" ? "fileList" : "value"} rules={[
                                    { required: column.required, message: `请输入${column.label}` },
                                    {
                                        validator: (_, value) => {
                                            if (column.range) {
                                                // 匹配标准区间格式 [1, 10] 或 (1, 10) 等
                                                const standardRangeRegex = /([\[\(])\s*(\d+)\s*,\s*(\d+)\s*([\]\)])/;
                                                const match = column.range?.match(standardRangeRegex);
                                                console.log(column.range);
                                                console.log(match);
                                                if (match) {
                                                    const [, leftBound, leftValue, rightValue, rightBound] = match;
                                                    const isLeftInclusive = leftBound === "[";
                                                    const isRightInclusive = rightBound === "]";
                                                    const isInRange = (value >= leftValue && value <= rightValue) || (value > leftValue && value < rightValue);
                                                    if (!isInRange) {
                                                        return Promise.reject(`${column.label}必须在${leftValue}, ${rightValue}之间`);
                                                    }
                                                }
                                            } else if (column.regExp) {
                                                if (!new RegExp(column.regExp).test(value)) {
                                                    return Promise.reject(`${column.label}格式不正确`);
                                                }
                                            }
                                            return Promise.resolve();
                                        },
                                    }
                                ]}>
                                    {(() => {
                                        switch (column.columnType) {
                                            case "string":
                                                return <Input />;
                                            case "number":
                                                return <InputNumber style={{ width: "100%" }} addonAfter={column.unit} />;
                                            case "longtext":
                                                return <Input.TextArea />
                                            case "image":
                                                const currentFileList = form.getFieldValue(column.columnName) || [];
                                                console.log(form.getFieldValue(column.columnName));
                                                return <Upload
                                                    action={`/file/upload`}
                                                    headers={{
                                                        Accept: "application/json"
                                                    }}
                                                    maxCount={10}
                                                    fileList={currentFileList}
                                                    listType="picture-card"
                                                    accept=".jpg,.png,.jpeg"
                                                    onChange={(info) => {
                                                        // 处理文件上传状态变化
                                                        const fileList = info.fileList.map(file => {
                                                            if (file.response && file.response.data) {
                                                                // 如果上传完成，只保存文件名
                                                                return {
                                                                    uid: file.uid,
                                                                    name: file.name,
                                                                    uuName: file.response.data,
                                                                    url: `${fileServerPrefix}/${file.response.data}`, // 假设这里就是文件名
                                                                    status: 'done'
                                                                };
                                                            }
                                                            return file;
                                                        });

                                                        // 更新表单字段值
                                                        form.setFieldsValue({
                                                            [column.columnName]: fileList
                                                        });
                                                    }}
                                                    onRemove={(file) => {
                                                        // 处理文件删除
                                                        const currentFiles = form.getFieldValue(column.columnName);
                                                        const newFiles = currentFiles.filter((item: any) => item.uid !== file.uid);
                                                        form.setFieldsValue({
                                                            [column.columnName]: newFiles
                                                        });
                                                    }}
                                                    showUploadList={{
                                                        showPreviewIcon: true,
                                                        showRemoveIcon: true,
                                                    }}

                                                >
                                                    <Button>上传</Button>
                                                </Upload>
                                            default:
                                                return <></>;
                                        }
                                        return (
                                            <></>
                                        )
                                    })()}
                                </Form.Item>
                            </Col>
                        )
                    })
                    }
                </Row>
                <Row>
                    <Col span={16}>

                    </Col>
                    <Col span={8}>
                        <Space>
                            <Button type="primary" htmlType="submit">保存</Button>
                            <Button type="primary" onClick={() => { commitForm() }}>提交</Button>
                        </Space>
                    </Col>

                </Row>
            </Form>
        </div>
    )
}