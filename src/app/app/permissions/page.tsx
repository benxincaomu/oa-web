"use client"

import { Form, Input, Button, Select, Space, Table, Modal, message } from 'antd';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import service from '@/commons/base/service';
interface Permission {
    id: number;
    name: string;
    parentId: number;
    type: number;
    description: string;
    value: string;

}


const Permissions = () => {
    const [messageApi, contextHolder] = message.useMessage();
    const [searchForm] = Form.useForm();
    const typeMap = new Map<number, string>();
    typeMap.set(1, '目录菜单');
    typeMap.set(2, '页面菜单');
    typeMap.set(3, '请求链接');
    typeMap.set(4, '页面控制');
    const columns = [
        {
            title: '权限名称',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: '权限类型',
            dataIndex: 'type',
            key: 'type',
            render: (_: any, record: any) => {
                return <Space size="middle">{typeMap.get(record.type)}</Space>;
            },
        },
        {
            title: '权限描述',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: "权限值",
            dataIndex: 'value',
            key: 'value',
        },
        {
            title: '操作',
            dataIndex: 'id',
            render: (_: any, record: any) => (
                <Space size="middle">
                    <a onClick={() => {
                        // console.log("编辑:", record.id)
                    }}>编辑</a>
                </Space>
            )
        }
    ];
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const loadPermissions = async (currPage: number, pageSize: number) => {
        await axios.get("/permission/list", {
            headers: {
            },
        }).then((res) => {
            // console.log("获取权限数据成功:", res.data);
            setPermissions(res.data.data.content);
        });
    };

    useEffect(() => {
        setTimeout(() => {
            loadPermissions(0,0);
        }, 300);
    }, []);

    // 添加权限相关
    const [addOpen, setAddOpen] = useState(false);
    const [addForm] = Form.useForm();
    const handleAddPermission = (values: any) => {
        setAddOpen(true);

        service.post("/permission", values, {
            headers: {
                "Content-Type": "application/json",
                
            },
        }).then((res) => { 
            messageApi.info(res.data);
            loadPermissions(0,0);
            setAddOpen(false);
            addForm.resetFields();
        });
    };
    const [parentPermissions, setParentPermissions] = useState<Permission[]>([]);
    const getParentPermissions = (type: number) => {
        let typeTmp = 0;
        switch (type) {
            case 1:
                typeTmp = 1;
                break;
            case 2:
                typeTmp = 1;
                break;
            case 3:
                typeTmp = 2;
                break;
            default:
                typeTmp = 0;
                break;
        }
        service
            .get(`/permission/permissionsByType?type=${typeTmp}`, {
                
            })
            .then((response) => {
                setParentPermissions(response.data);
            });
    };

    return (
        <div>
            <head>
                <title>权限管理</title>
            </head>
            <Form form={searchForm} layout="inline" onFinish={(values) => loadPermissions(0,0)}>
                <Form.Item label="权限名称" name="name">
                    <Input placeholder="请输入权限名称" />
                </Form.Item>
                <Form.Item label="权限类型" name="type" >
                    <Select placeholder="请选择权限类型">
                        <Select.Option value={1}>目录菜单</Select.Option>
                        <Select.Option value={2}>页面菜单</Select.Option>
                        <Select.Option value={3}>请求链接</Select.Option>
                        <Select.Option value={4}>页面控制</Select.Option>
                    </Select>
                </Form.Item>

                <Form.Item>

                    <Button type='primary' htmlType='submit'>查询</Button>
                </Form.Item>
                <Form.Item>

                    <Button type='primary' onClick={() => {
                        setAddOpen(true);
                    }}>添加权限</Button>
                </Form.Item>
            </Form>
            <Table columns={columns} dataSource={permissions} rowKey={(record) => record.id} bordered = {true} pagination={{defaultCurrent: 1, pageSize: 20,onChange(page, pageSize) {
                loadPermissions(page, pageSize);
            },}}/>
            <Modal title="添加权限" open={addOpen} onCancel={() => {
                setAddOpen(false);
                addForm.resetFields();
            }}  footer={null} >
                <Form form={addForm} onFinish={values => handleAddPermission(values)} layout='horizontal' labelCol={{ span: 6 }} wrapperCol={{ span: 16 }} >
                    <Form.Item label="权限名称" name="name" rules={[{ required: true }]}>
                        <Input placeholder="请输入权限名称" />
                    </Form.Item>
                    <Form.Item label="权限描述" name="description" >
                        <Input placeholder="请输入权限描述" />
                    </Form.Item>
                    <Form.Item label="权限类型" name="type" rules={[{ required: true }]}>
                        <Select placeholder="请选择权限类型" onChange={(value) => getParentPermissions(value)}>
                            <Select.Option value={1}>目录菜单</Select.Option>
                            <Select.Option value={2}>页面菜单</Select.Option>
                            <Select.Option value={3}>请求链接</Select.Option>
                            <Select.Option value={4}>页面控制</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label="权限值"
                        name="value"
                        rules={[{ required: true }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item label="上级权限" name="parentId" >
                        <Select placeholder="请选择上级权限" fieldNames={{ label: 'name', value: 'id' }} options={parentPermissions} showSearch
                            optionFilterProp="name"
                        />

                    </Form.Item>
                    <Form.Item labelCol={{ span: 4 }} wrapperCol={{ span: 8, offset: 16 }}>
                        <Button type='primary' htmlType='submit'>保存</Button>
                        <Button style={{ marginLeft: 8 }} onClick={() => setAddOpen(false)}>取消</Button>
                    </Form.Item>

                </Form>
            </Modal>
        </div>
    )
}
export default Permissions;