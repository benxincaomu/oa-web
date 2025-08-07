
"use client"
import service from "@/commons/base/service";
import { use, useEffect, useState } from "react";
import { Table, Form, Input, Button, Modal, Select, message, Space } from "antd";
const Organize = () => {
    const [messageApi, contextHolder] = message.useMessage();
    useEffect(() => {
        document.title = "组织管理";
        setTimeout(() => {
            loadOrganizes({});
        }, 500);
    }, []);




    const saveDept = (values: any) => {
        service.post("/organize", { ...values }).then((res) => {
            messageApi.info(res.data);
        });
    };

    const [addModalVisible, setAddModalVisible] = useState(false);
    const [allDepts, setAllDepts] = useState<any[]>([]);

    const [addForm] = Form.useForm();
    const loadAllOrganizes = () => {
        if (allDepts.length == 0) {
            service.get("/organize/listAll").then((res) => {
                setAllDepts(res.data as any[]);
                setAddModalVisible(true);
                addForm.resetFields();
            });
        }
    };
    const [deptManagerOpen, setDeptManagerOpen] = useState(false);
    const [deptUsers, setDeptUsers] = useState<any[]>([]);
    const [assignLeaderForm] = Form.useForm();
    const onAssignLeaderOpen = (record: any) => { 
        service.get(`/organize/getUsersByDeptId/${record.id}`).then((res) => {
            setDeptUsers(res.data);
            assignLeaderForm.setFieldValue("deptId",record.id);
            assignLeaderForm.setFieldValue("leaderUserId",record.leaderUserId);
            setDeptManagerOpen(true);
        });
    };
    const assignDeptLeader = (values: any) => {
        // console.log("values", values);
        service.post("/organize/assignLeader", values).then((res:any) => {
            if (res.code === 200) {
                messageApi.success("保存成功");
                setDeptManagerOpen(false);
            }else{
                messageApi.error(res.data);
            }
        });
    };
    const columns = [
        {
            title: '名称',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: '组织代码',
            dataIndex: 'code',
            key: 'code',
        },
        {
            title: '操作',
            key: 'action',
            render: (value: any, record: any,index: number) => (
                <Space size="middle">
                    {/* <a>编辑</a>
                    <a>删除</a> */}
                    <a onClick={()=>{
                        onAssignLeaderOpen(record);
                    }}>设置负责人</a>
                </Space>
            )
        }
    ];
    const [depts, setDepts] = useState<any[]>([]);
    const loadOrganizes = (values: any) => {
        service.get("/organize/list").then((res) => {
            setDepts(res.data.content);
        });
    };



    return (
        <div>
            {contextHolder}
            <Form layout="inline" onFinish={(values) => loadOrganizes(values)}>
                <Form.Item name={"name"} label="部门名称">
                    <Input />
                </Form.Item>
                <Form.Item name={"code"} label="部门编号">
                    <Input />
                </Form.Item>
                <Form.Item>
                    <Button type="primary">查询</Button>
                </Form.Item>
                <Form.Item>
                    <Button type="primary" onClick={() => {
                        loadAllOrganizes();

                    }}>新增部门</Button>
                </Form.Item>

            </Form>
            <Table columns={columns} dataSource={depts} rowKey={(record) => record.id} />

            <Modal
                title="新增部门"
                open={addModalVisible}

                onCancel={() => {
                    setAddModalVisible(false);
                    addForm.resetFields();
                }}
                footer={null}
            >
                <Form layout='horizontal' labelCol={{ span: 6 }} wrapperCol={{ span: 16 }} onFinish={values => saveDept(values)} form={addForm}>
                    <Form.Item label="部门名称" name={"name"}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="部门描述" name={"description"}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="上级部门" name={"parentId"}>
                        <Select options={allDepts} fieldNames={{ label: 'name', value: 'id' }} showSearch optionFilterProp="name" />
                    </Form.Item>
                    <Form.Item labelCol={{ span: 4 }} wrapperCol={{ span: 8, offset: 16 }}>
                        <Button type='primary' htmlType='submit'>保存</Button>
                        <Button style={{ marginLeft: 8 }} onClick={() => setAddModalVisible(false)}>取消</Button>
                    </Form.Item>
                </Form>
            </Modal>
            <Modal title='部门负责人' open={deptManagerOpen} footer={null}>
                <Form form={assignLeaderForm} onFinish={(values)=> assignDeptLeader(values)}>
                    <Form.Item name= "deptId" hidden>
                        <Input />
                    </Form.Item>
                    <Form.Item label="选择管理人" name={"leaderUserId"}>
                        <Select options={deptUsers} fieldNames={{ label: 'name', value: 'id' }}/>
                    </Form.Item>
                    <Form.Item labelCol={{ span: 4 }} wrapperCol={{ span: 8, offset: 16 }}>
                        <Button type='primary' htmlType='submit'>保存</Button>
                        <Button style={{ marginLeft: 8 }} onClick={() => setDeptManagerOpen(false)}>取消</Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};
export default Organize;