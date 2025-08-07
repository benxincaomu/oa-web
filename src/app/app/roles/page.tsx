"use client"
import { Form, Input, Button, TreeSelect, Space, Table, Modal, message, Tree,ConfigProvider } from 'antd';
import React, { use, useEffect, useState } from 'react';
import axios from 'axios';
import type { AppProps } from 'next/app';
import service from '@/commons/base/service';

interface Role {
    id: number;
    name: string;
    description: string;
}

interface PermissionNode {
    id: number;
    name: string;
    key: number;
    title: string;
    isLeaf: boolean;
    type: number;
    children: PermissionNode[];
}
const fillPermissionTree = (permissions: PermissionNode[]) => {
    if (permissions != null && permissions.length > 0) {
        permissions.forEach(permission => {
            permission.key = permission.id;
            permission.title = permission.name;
            permission.isLeaf = permission.type != 1;

            fillPermissionTree(permission.children);
        });
    }
    return permissions;
};

const getPermissionIdsByPermissions = (permissions: PermissionNode[]) => {
    let permissionIds: number[] = [];
    if (permissions != null && permissions.length > 0) {
        for (let i = 0; i < permissions.length; i++) {
            if (permissions[i].type != 1 && permissions[i].children.length == 0) {
                permissionIds.push(permissions[i].id);
            }
            permissionIds = permissionIds.concat(getPermissionIdsByPermissions(permissions[i].children));
        }
    }
    return permissionIds;
};
const RoleManager = () => {
    const [messageApi, contextHolder] = message.useMessage();
    const columns = [

        {
            title: '角色名称',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: '角色描述',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: '操作',
            render: (_: any, record: any) => {
                return <Space size="middle">
                    <Button type="primary">编辑</Button>
                    <Button type="primary" onClick={() => {
                        loadPermissionsByRoleId(record.id)
                        // setAuthOpen(true);
                        setOperatingRoleId(record.id);
                    }}>授权</Button>
                    <Button type="primary" danger>删除</Button>
                </Space>;
            },
        },
    ];
    const [roles, setRoles] = useState<Role[]>([]);
    const loadRoles = (values: any) => {
        axios.get('/role/list', {
            params: {
                ...values
            },
            headers: {
            },
        }).then((res) => {
            // console.log("获取角色数据成功:", res.data);
            if (res.data.code === 200) {
                setRoles(res.data.data.content);
            }
        });
    };
    useEffect(() => {
        document.title = "角色管理";
        setTimeout(() => {
            loadRoles({});
            loadPermissions();
        }, 1000);
    }, []);

    // 添加角色
    const [addOpen, setAddOpen] = useState(false);
    const handleAddRole = async (values: any) => {
        await axios.post("/role", values, {
            headers: {
            },
        }).then((res) => {
            if (res.data.code === 200) {
                messageApi.success("添加角色成功");
                setAddOpen(false);
                loadRoles({});
            } else {
                messageApi.error("添加角色失败");
            }
        })
    };
    // 授权相关
    const [authOpen, setAuthOpen] = useState(false);
    const [permissions, setPermissions] = useState<PermissionNode[]>([]);
    const [checkedIds, setCheckedIds] = useState<number[]>([]);
    // 以获取的授权
    const [ownedPermissionIds, setOwnedPermissionIds] = useState<number[]>([]);
    const [operatingRoleId, setOperatingRoleId] = useState<number>(0);
    useEffect(() => {
        // console.log("ownedPermissionIds", ownedPermissionIds);
    }, [ownedPermissionIds]);

    const loadPermissions = async () => {
        await axios.get("/permission/getMenuTree", {
            headers: {
            },
        }).then((res) => {
            console.log("获取权限数据成功:", res.data);
            if (res.data.code === 200) {
                // const pp = fillPermissionTree(res.data.data as PermissionNode[]);
                // console.log("pp", pp);
                setPermissions(fillPermissionTree(res.data.data as PermissionNode[]));
            }
        });
    };
    const loadPermissionsByRoleId = async (id: number) => {
        await axios.get(`/role/permissionsByRoleId?roleId=${id}`, {
            headers: {
            },
        }).then((res) => {
            // console.log("获取权限数据成功:", res.data);

            if (res.data.code === 200) {
                authForm.resetFields();
                const permissions: PermissionNode[] = res.data.data;

                setOwnedPermissionIds(getPermissionIdsByPermissions(permissions));
                setAuthOpen(true);
            }
        });
    };
    const saveAuth = async () => {
        // messageApi.info("正在保存权限...");
        // console.log("saveAuth",checkedIds.concat(halfCheckedIds));
        service.post("/role/auth", {
            roleId: operatingRoleId,
            permissionIds: checkedIds.concat(halfCheckedIds)
        }).then(res => {
            if (res.code === 200) {
                messageApi.info("授权成功");
                setAuthOpen(false);
            } else {
                messageApi.error("授权失败");
            }
        });

    };

    const [halfCheckedIds, setHalfCheckedIds] = useState<number[]>([]);
    const getHalfCheckedIds = () => {
        const halfCheckedIds: number[] = [];

        return halfCheckedIds;
    };
    const getHalfCheckedIdsDeep = (permissions: PermissionNode[]) => {
        const halfCheckedIds: number[] = [];
        for (let i = 0; i < permissions.length; i++) {

        }
        return halfCheckedIds;
    };

    const [authForm] = Form.useForm();
    return (
        <div>
            {contextHolder}
            <Form layout="inline" onFinish={(values) => loadRoles(values)}>
                <Form.Item label="角色名称" name="name">
                    <Input placeholder="请输入角色名称" />
                </Form.Item>


                <Form.Item>

                    <Button type='primary' htmlType='submit'>查询</Button>
                </Form.Item>
                <Form.Item>

                    <Button type='primary' onClick={(e) => { setAddOpen(true) }}>新增角色</Button>
                </Form.Item>
            </Form>
            <Table
                columns={columns}
                dataSource={roles}
                rowKey="id"
                bordered={true}
                rowHoverable = {false}
                rowClassName={(record, index) => index % 2 === 0 ? 'row-class-0' : 'row-class-1'}
            />
            <Modal title="新增角色" open={addOpen} onCancel={() => { setAddOpen(false) }} footer={null} >
                <Form onFinish={(values) => handleAddRole(values)}>
                    <Form.Item label="角色名称" name="name">
                        <Input placeholder="请输入角色名称" />
                    </Form.Item>
                    <Form.Item label="角色描述" name="description">
                        <Input placeholder="请输入角色描述" />
                    </Form.Item>
                    <Form.Item>
                        <Button type='primary' htmlType='submit'>新增角色</Button>
                    </Form.Item>
                </Form>
            </Modal>


            <Modal title="授权" open={authOpen} onCancel={() => {
                setAuthOpen(false)
                authForm.resetFields();
            }} footer={null} >
                <Form id='authForm' form={authForm} onFinish={() => { saveAuth() }} >

                    <Tree
                        checkable
                        defaultExpandAll
                        defaultCheckedKeys={ownedPermissionIds}
                        onCheck={(checkedKeys, info) => {
                            setCheckedIds(checkedKeys as number[]);
                            setHalfCheckedIds(info.halfCheckedKeys as number[]);
                        }}
                        
                        treeData={permissions}
                    />
                    <Form.Item labelCol={{ span: 4 }} wrapperCol={{ span: 8, offset: 16 }}>
                        <Button type="primary" htmlType="submit">
                            保存
                        </Button>
                        <Button onClick={() => {
                            setAuthOpen(false)
                        }}>取消</Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default RoleManager;