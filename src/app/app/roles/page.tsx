"use client"

import { Button, Form, Input, message, Modal, Space, Table, Tooltip, Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { useCallback, useEffect, useState } from 'react';
import service from '@/commons/base/service';

interface KeycloakRole {
    id: string;
    name: string;
    description?: string;
}

interface OaResource {
    id: string;
    key: string;
    displayName: string;
    type: string;
    value?: string;
    parentKey?: string;
    workbenchKey?: string;
}

const ADMIN_ROLE = 'oa-admin';

const buildResourceTree = (resources: OaResource[]): DataNode[] => {
    const menus = resources.filter(resource => resource.type === 'oa-menu');
    const apis = resources.filter(resource => resource.type === 'oa-api');
    const groups: DataNode[] = [];
    if (menus.length > 0) {
        groups.push({
            key: 'group:menu',
            title: '菜单权限',
            children: menus.map(menu => ({ key: menu.key, title: menu.displayName || menu.key })),
        });
    }
    if (apis.length > 0) {
        groups.push({
            key: 'group:api',
            title: '接口权限',
            children: apis.map(api => ({ key: api.key, title: api.displayName || api.key })),
        });
    }
    return groups;
};

/**
 * 角色管理：角色是 Keycloak 应用 client role；授权是 Keycloak 资源权限。
 */
const RoleManager = () => {
    const [messageApi, contextHolder] = message.useMessage();
    const [roles, setRoles] = useState<KeycloakRole[]>([]);
    const [resources, setResources] = useState<OaResource[]>([]);
    const [addOpen, setAddOpen] = useState(false);
    const [authOpen, setAuthOpen] = useState(false);
    const [operatingRole, setOperatingRole] = useState<KeycloakRole | null>(null);
    const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
    const [addForm] = Form.useForm();

    const loadRoles = useCallback(() => {
        service.get<KeycloakRole[]>('/identity/roles')
            .then((res) => setRoles(res.data || []))
            .catch(() => messageApi.error('加载角色失败'));
    }, [messageApi]);

    useEffect(() => {
        document.title = '角色管理';
        loadRoles();
        service.get<OaResource[]>('/identity/resources')
            .then((res) => setResources(res.data || []))
            .catch(() => messageApi.error('加载权限资源失败'));
    }, [loadRoles, messageApi]);

    const submitRole = (values: any) => {
        service.put('/identity/roles', { name: values.name, description: values.description })
            .then(() => {
                messageApi.success('角色已保存');
                setAddOpen(false);
                addForm.resetFields();
                loadRoles();
            })
            .catch(() => messageApi.error('保存角色失败'));
    };

    const openAuth = (role: KeycloakRole) => {
        setOperatingRole(role);
        setCheckedKeys([]);
        service.get<string[]>(`/identity/roles/${encodeURIComponent(role.name)}/resources`)
            .then((res) => {
                setCheckedKeys(res.data || []);
                setAuthOpen(true);
            })
            .catch(() => messageApi.error('加载角色授权失败'));
    };

    const saveAuth = () => {
        if (!operatingRole) {
            return;
        }
        const resourceKeys = new Set(resources.map(resource => resource.key));
        const selected = checkedKeys.filter(key => resourceKeys.has(key));
        service.put(`/identity/roles/${encodeURIComponent(operatingRole.name)}/resources`, {
            resourceKeys: selected,
        }).then(() => {
            messageApi.success('授权已保存');
            setAuthOpen(false);
        }).catch(() => messageApi.error('保存授权失败'));
    };

    const columns = [
        { title: '角色名称', dataIndex: 'name', key: 'name' },
        { title: '角色描述', dataIndex: 'description', key: 'description' },
        {
            title: '操作',
            key: 'action',
            render: (_: any, record: KeycloakRole) => {
                const isAdmin = record.name === ADMIN_ROLE;
                return (
                    <Space size="middle">
                        {isAdmin
                            ? <Tooltip title="管理员角色的默认授权由系统维护">
                                <span>
                                    <Button type="primary" disabled>授权</Button>
                                </span>
                            </Tooltip>
                            : <Button type="primary" onClick={() => openAuth(record)}>授权</Button>}
                    </Space>
                );
            },
        },
    ];

    return (
        <div>
            {contextHolder}
            <Form layout="inline">
                <Form.Item>
                    <Button type="primary" onClick={() => {
                        addForm.resetFields();
                        setAddOpen(true);
                    }}>新增角色</Button>
                </Form.Item>
            </Form>
            <br />
            <Table rowKey="id" columns={columns} dataSource={roles} bordered pagination={{ pageSize: 20 }} />

            <Modal title="新增角色" open={addOpen} onCancel={() => setAddOpen(false)} footer={null}>
                <Form form={addForm} onFinish={submitRole} labelCol={{ span: 5 }} wrapperCol={{ span: 18 }}>
                    <Form.Item label="角色名称" name="name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="角色描述" name="description">
                        <Input />
                    </Form.Item>
                    <Form.Item wrapperCol={{ offset: 5, span: 18 }}>
                        <Button type="primary" htmlType="submit">保存</Button>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal title={`角色授权 - ${operatingRole?.name || ''}`} open={authOpen}
                onCancel={() => setAuthOpen(false)} onOk={saveAuth} okText="保存" width={640}>
                <Tree checkable defaultExpandAll treeData={buildResourceTree(resources)}
                    checkedKeys={checkedKeys}
                    onCheck={(keys) => {
                        const checked = Array.isArray(keys) ? keys : keys.checked;
                        setCheckedKeys(checked as string[]);
                    }} />
            </Modal>
        </div>
    );
};

export default RoleManager;
