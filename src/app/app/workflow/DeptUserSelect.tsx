// 部门用户级联选择
"user client"

import service from "@/commons/base/service";
import { Col, Form, FormInstance, Row, Select, Tree, TreeSelect } from "antd"
import { on } from "events";
import { get } from "http";
import { useCallback, useEffect, useState } from "react"

interface Props {
    form: FormInstance,
    formItemSpan?: number,
    onUserChange?: (value: number) => void,
    userSelectLabel?: string,
}
export default function DeptUserSelect({ form,formItemSpan=4 ,onUserChange,userSelectLabel}: Props) {

    const [depts, setDepts] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    const loadDepts = useCallback(() => {
        if (!depts || depts.length === 0) {
            service.get(`/organize/listTree`).then((response) => {
                setDepts(response.data);
            })
        };
    }, [depts]);

    useEffect(() => {
        loadDepts();
    }, [loadDepts]);

    return (
        <Form form={form} layout="horizontal" style={{display:"inline"}}>
            <Row>
                <Col span={formItemSpan}>
                    <Form.Item name={"deptId"} label="部门">
                        <TreeSelect treeData={depts} fieldNames={{ label: 'name', value: 'id' }} placeholder="请选择部门" style={{ minWidth: "120px" }} onChange={(value) => {
                            service.get(`/organize/getUsersByDeptId/${value}`).then((res) => {
                                form.setFieldValue("starterId", undefined);
                                setUsers(res.data);
                            });
                        }} />
                    </Form.Item>
                </Col>
                <Col span={formItemSpan}>
                    <Form.Item name="userId" label={userSelectLabel}>
                        <Select options={users} fieldNames={{ label: 'name', value: 'id' }} placeholder="请选择用户" style={{ minWidth: "120px" }} onChange={(value) => {
                            if(onUserChange){
                                onUserChange(value);
                            }
                        }}/>
                    </Form.Item>
                </Col>
            </Row>
        </Form>
    )
}