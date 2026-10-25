"use client";

import { Button, Form, Input, message, Modal, Popconfirm, Select, Space, Switch, Table, TreeSelect } from "antd";
import { useCallback, useEffect, useState } from "react";
import service from "@/commons/base/service";

interface KeycloakUser {
    id: string;
    username: string;
    name?: string;
    email?: string;
    mobile?: string;
    enabled: boolean;
}

interface KeycloakRole {
    id: string;
    name: string;
    description?: string;
}

interface KeycloakGroup {
    id: string;
    name: string;
    code?: string;
    parentId?: string;
}

interface GroupTreeNode {
    title: string;
    value: string;
    key: string;
    children?: GroupTreeNode[];
}

const buildGroupTree = (groups: KeycloakGroup[]): GroupTreeNode[] => {
    const nodes = new Map<string, GroupTreeNode>();
    groups.forEach(group => nodes.set(group.id, { title: group.name, value: group.id, key: group.id }));
    const roots: GroupTreeNode[] = [];
    groups.forEach(group => {
        const node = nodes.get(group.id) as GroupTreeNode;
        const parent = group.parentId ? nodes.get(group.parentId) : undefined;
        if (parent) {
            parent.children = parent.children || [];
            parent.children.push(node);
        } else {
            roots.push(node);
        }
    });
    return roots;
};

/**
 * 用户管理：读写全部经过 OA 的 /identity 接口，数据源是 Keycloak。
 */
const UserManager = () => {
    const [messageApi, contextHolder] = message.useMessage();
    const [users, setUsers] = useState<KeycloakUser[]>([]);
    const [roles, setRoles] = useState<KeycloakRole[]>([]);
    const [groups, setGroups] = useState<KeycloakGroup[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    const [userModalOpen, setUserModalOpen] = useState(false);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [roleModalOpen, setRoleModalOpen] = useState(false);
    const [groupModalOpen, setGroupModalOpen] = useState(false);
    const [editing, setEditing] = useState<KeycloakUser | null>(null);
    const [operatingUser, setOperatingUser] = useState<KeycloakUser | null>(null);
    const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
    const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
    const [currentGroupIds, setCurrentGroupIds] = useState<string[]>([]);

    const [userForm] = Form.useForm();
    const [passwordForm] = Form.useForm();

    const loadUsers = useCallback(() => {
        setLoading(true);
        service.get<KeycloakUser[]>("/identity/users", { params: { search: search || undefined } })
            .then((res) => setUsers(res.data || []))
            .catch(() => messageApi.error("加载用户失败"))
            .finally(() => setLoading(false));
    }, [messageApi, search]);

    useEffect(() => {
        document.title = "用户管理";
        loadUsers();
    }, [loadUsers]);

    const openCreate = () => {
        setEditing(null);
        userForm.resetFields();
        setUserModalOpen(true);
    };

    const openEdit = (user: KeycloakUser) => {
        setEditing(user);
        userForm.setFieldsValue({ ...user, password: undefined, temporaryPassword: false });
        setUserModalOpen(true);
    };

    const submitUser = (values: any) => {
        if (!editing && !values.password) {
            messageApi.error("新增用户必须设置初始密码");
            return;
        }
        const payload = {
            user: {
                id: editing?.id,
                username: values.username,
                name: values.name,
                email: values.email,
                mobile: values.mobile,
                enabled: editing ? editing.enabled : true,
            },
            password: values.password,
            temporaryPassword: !!values.temporaryPassword,
        };
        service.put("/identity/users", payload)
            .then(() => {
                messageApi.success("保存成功");
                setUserModalOpen(false);
                loadUsers();
            })
            .catch(() => messageApi.error("保存失败"));
    };

    const toggleEnabled = (user: KeycloakUser) => {
        service.put(`/identity/users/${user.id}/enabled`, { enabled: !user.enabled })
            .then(() => {
                messageApi.success("状态已更新");
                loadUsers();
            })
            .catch(() => messageApi.error("更新失败"));
    };

    const openPassword = (user: KeycloakUser) => {
        setOperatingUser(user);
        passwordForm.resetFields();
        setPasswordModalOpen(true);
    };

    const submitPassword = (values: any) => {
        if (!operatingUser) {
            return;
        }
        service.put(`/identity/users/${operatingUser.id}/password`, {
            password: values.password,
            temporary: !!values.temporary,
        }).then(() => {
            messageApi.success("密码已重置");
            setPasswordModalOpen(false);
        }).catch(() => messageApi.error("重置密码失败"));
    };

    const openRoles = (user: KeycloakUser) => {
        setOperatingUser(user);
        setSelectedRoleIds([]);
        Promise.all([
            service.get<KeycloakRole[]>("/identity/roles"),
            service.get<string[]>(`/identity/users/${user.id}/roles`),
        ]).then(([roleResponse, userRoleResponse]) => {
            setRoles(roleResponse.data || []);
            setSelectedRoleIds(userRoleResponse.data || []);
            setRoleModalOpen(true);
        }).catch(() => messageApi.error("加载角色失败"));
    };

    const submitRoles = () => {
        if (!operatingUser) {
            return;
        }
        service.put(`/identity/users/${operatingUser.id}/roles`, { roleIds: selectedRoleIds })
            .then(() => {
                messageApi.success("角色已更新");
                setRoleModalOpen(false);
            })
            .catch(() => messageApi.error("更新角色失败"));
    };

    const openGroups = (user: KeycloakUser) => {
        setOperatingUser(user);
        setSelectedGroupIds([]);
        setCurrentGroupIds([]);
        Promise.all([
            service.get<KeycloakGroup[]>("/identity/groups"),
            service.get<KeycloakGroup[]>(`/identity/users/${user.id}/groups`),
        ]).then(([allGroups, userGroups]) => {
            setGroups(allGroups.data || []);
            const currentIds = (userGroups.data || []).map(group => group.id);
            setCurrentGroupIds(currentIds);
            setSelectedGroupIds(currentIds);
            setGroupModalOpen(true);
        }).catch(() => messageApi.error("加载组织失败"));
    };

    const submitGroups = () => {
        if (!operatingUser) {
            return;
        }
        const add = selectedGroupIds.filter(id => !currentGroupIds.includes(id));
        const remove = currentGroupIds.filter(id => !selectedGroupIds.includes(id));
        const requests = [
            ...add.map(id => service.put(`/identity/groups/${id}/members/${operatingUser.id}?member=true`, {})),
            ...remove.map(id => service.put(`/identity/groups/${id}/members/${operatingUser.id}?member=false`, {})),
        ];
        Promise.all(requests).then(() => {
            messageApi.success("组织成员关系已更新");
            setGroupModalOpen(false);
        }).catch(() => messageApi.error("更新组织关系失败"));
    };

    const columns = [
        { title: "用户名", dataIndex: "username", key: "username" },
        { title: "姓名", dataIndex: "name", key: "name" },
        { title: "邮箱", dataIndex: "email", key: "email" },
        { title: "手机号", dataIndex: "mobile", key: "mobile" },
        {
            title: "状态",
            dataIndex: "enabled",
            key: "enabled",
            render: (_: any, record: KeycloakUser) => (
                <Switch checked={record.enabled} onChange={() => toggleEnabled(record)}
                    checkedChildren="启用" unCheckedChildren="停用" />
            ),
        },
        {
            title: "操作",
            key: "action",
            render: (_: any, record: KeycloakUser) => (
                <Space size="middle">
                    <a onClick={() => openEdit(record)}>修改</a>
                    <a onClick={() => openPassword(record)}>重置密码</a>
                    <a onClick={() => openRoles(record)}>分配角色</a>
                    <a onClick={() => openGroups(record)}>分配组织</a>
                    <Popconfirm title={record.enabled ? "确定停用该用户？" : "确定启用该用户？"}
                        okText="确定" cancelText="取消" onConfirm={() => toggleEnabled(record)}>
                        <a>{record.enabled ? "停用" : "启用"}</a>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            {contextHolder}
            <Form layout="inline" onFinish={() => loadUsers()}>
                <Form.Item>
                    <Input placeholder="用户名 / 姓名 / 邮箱" value={search}
                        onChange={(event) => setSearch(event.target.value)} allowClear />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit">查询</Button>
                </Form.Item>
                <Form.Item>
                    <Button type="primary" onClick={openCreate}>新增用户</Button>
                </Form.Item>
            </Form>
            <br />
            <Table rowKey={(record) => record.id} columns={columns} dataSource={users} loading={loading}
                pagination={{ pageSize: 20 }} bordered />

            <Modal title={editing ? "修改用户" : "新增用户"} open={userModalOpen}
                onCancel={() => setUserModalOpen(false)} footer={null}>
                <Form form={userForm} onFinish={submitUser} labelCol={{ span: 5 }} wrapperCol={{ span: 18 }}>
                    <Form.Item label="用户名" name="username" rules={[{ required: true }]}>
                        <Input disabled={!!editing} />
                    </Form.Item>
                    <Form.Item label="姓名" name="name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="邮箱" name="email">
                        <Input />
                    </Form.Item>
                    <Form.Item label="手机号" name="mobile">
                        <Input />
                    </Form.Item>
                    <Form.Item label={editing ? "新密码（可选）" : "初始密码"} name="password"
                        rules={editing ? [] : [{ required: true }]}>
                        <Input.Password autoComplete="new-password" />
                    </Form.Item>
                    <Form.Item name="temporaryPassword" valuePropName="checked"
                        wrapperCol={{ offset: 5, span: 18 }}>
                        <Switch checkedChildren="临时密码" unCheckedChildren="永久密码" />
                    </Form.Item>
                    <Form.Item wrapperCol={{ offset: 5, span: 18 }}>
                        <Button type="primary" htmlType="submit">提交</Button>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal title="重置密码" open={passwordModalOpen} onCancel={() => setPasswordModalOpen(false)}
                footer={null}>
                <Form form={passwordForm} onFinish={submitPassword} labelCol={{ span: 5 }} wrapperCol={{ span: 18 }}>
                    <Form.Item label="新密码" name="password" rules={[{ required: true }]}>
                        <Input.Password autoComplete="new-password" />
                    </Form.Item>
                    <Form.Item name="temporary" valuePropName="checked" wrapperCol={{ offset: 5, span: 18 }}>
                        <Switch checkedChildren="临时密码" unCheckedChildren="永久密码" />
                    </Form.Item>
                    <Form.Item wrapperCol={{ offset: 5, span: 18 }}>
                        <Button type="primary" htmlType="submit">提交</Button>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal title={`分配角色 - ${operatingUser?.username || ""}`} open={roleModalOpen}
                onCancel={() => setRoleModalOpen(false)} onOk={submitRoles} okText="保存">
                <Select mode="multiple" style={{ width: "100%" }} placeholder="请选择角色"
                    value={selectedRoleIds} onChange={(values) => setSelectedRoleIds(values as string[])}
                    options={roles.map(role => ({ label: role.name, value: role.id }))} />
            </Modal>

            <Modal title={`分配组织 - ${operatingUser?.username || ""}`} open={groupModalOpen}
                onCancel={() => setGroupModalOpen(false)} onOk={submitGroups} okText="保存">
                <TreeSelect multiple treeCheckable style={{ width: "100%" }} placeholder="请选择组织"
                    value={selectedGroupIds} onChange={(values) => setSelectedGroupIds(values as string[])}
                    treeData={buildGroupTree(groups)} fieldNames={{ label: "title", value: "value" }} />
            </Modal>
        </div>
    );
};

export default UserManager;
