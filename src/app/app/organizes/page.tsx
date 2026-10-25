"use client"
import service from "@/commons/base/service";
import { Button, Form, Input, message, Modal, Space, Table, TreeSelect } from "antd";
import { useCallback, useEffect, useState } from "react";

interface KeycloakGroup {
    id: string;
    name: string;
    code?: string;
    parentId?: string;
}

interface KeycloakUser {
    id: string;
    username: string;
    name?: string;
}

interface GroupTreeNode {
    title: string;
    value: string;
    key: string;
    children?: GroupTreeNode[];
}

interface GroupNode extends KeycloakGroup {
    children?: GroupNode[];
}

const buildTree = (groups: KeycloakGroup[]): GroupNode[] => {
    const nodes = new Map<string, GroupNode>();
    groups.forEach(group => nodes.set(group.id, { ...group }));
    const roots: GroupNode[] = [];
    groups.forEach(group => {
        const node = nodes.get(group.id) as GroupNode;
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

const buildTreeSelect = (groups: KeycloakGroup[]): GroupTreeNode[] =>
    buildTree(groups).map(function toNode(group: GroupNode): GroupTreeNode {
        return {
            title: group.name,
            value: group.id,
            key: group.id,
            children: group.children ? group.children.map(toNode) : undefined,
        };
    });

/**
 * 组织管理：Keycloak 组即 OA 部门，读写全部经过 /identity 接口。
 */
const Organize = () => {
    const [messageApi, contextHolder] = message.useMessage();
    const [groups, setGroups] = useState<KeycloakGroup[]>([]);
    const [users, setUsers] = useState<KeycloakUser[]>([]);
    const [addOpen, setAddOpen] = useState(false);
    const [leaderOpen, setLeaderOpen] = useState(false);
    const [operatingGroup, setOperatingGroup] = useState<KeycloakGroup | null>(null);
    const [addForm] = Form.useForm();
    const [leaderForm] = Form.useForm();

    const loadGroups = useCallback(() => {
        service.get<KeycloakGroup[]>("/identity/groups")
            .then((res) => setGroups(res.data || []))
            .catch(() => messageApi.error("加载组织失败"));
    }, [messageApi]);

    useEffect(() => {
        document.title = "组织管理";
        loadGroups();
    }, [loadGroups]);

    const submitGroup = (values: any) => {
        service.put("/identity/groups", {
            name: values.name,
            code: values.code || undefined,
            parentId: values.parentId || undefined,
        }).then(() => {
            messageApi.success("保存成功");
            setAddOpen(false);
            addForm.resetFields();
            loadGroups();
        }).catch(() => messageApi.error("保存失败"));
    };

    const openLeader = (group: KeycloakGroup) => {
        setOperatingGroup(group);
        leaderForm.resetFields();
        service.get<KeycloakUser[]>("/identity/users")
            .then((res) => setUsers(res.data || []))
            .catch(() => messageApi.error("加载用户失败"));
        setLeaderOpen(true);
    };

    const submitLeader = (values: any) => {
        if (!operatingGroup) {
            return;
        }
        service.put(`/identity/groups/${operatingGroup.id}/leader`, { userId: values.userId })
            .then(() => {
                messageApi.success("负责人已保存");
                setLeaderOpen(false);
            })
            .catch(() => messageApi.error("保存负责人失败"));
    };

    const columns = [
        { title: "名称", dataIndex: "name", key: "name" },
        { title: "编码", dataIndex: "code", key: "code" },
        {
            title: "操作",
            key: "action",
            render: (_: any, record: KeycloakGroup) => (
                <Space size="middle">
                    <a onClick={() => openLeader(record)}>设置负责人</a>
                </Space>
            ),
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
                    }}>新增部门</Button>
                </Form.Item>
            </Form>
            <br />
            <Table rowKey={(record) => record.id} columns={columns} dataSource={buildTree(groups)}
                pagination={false} bordered />

            <Modal title="新增部门" open={addOpen} onCancel={() => setAddOpen(false)} footer={null}>
                <Form form={addForm} onFinish={submitGroup} labelCol={{ span: 5 }} wrapperCol={{ span: 18 }}>
                    <Form.Item label="部门名称" name="name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="部门编码" name="code">
                        <Input />
                    </Form.Item>
                    <Form.Item label="上级组织" name="parentId">
                        <TreeSelect allowClear treeData={buildTreeSelect(groups)} placeholder="默认挂在租户根组下"
                            fieldNames={{ label: "title", value: "value" }} />
                    </Form.Item>
                    <Form.Item wrapperCol={{ offset: 5, span: 18 }}>
                        <Button type="primary" htmlType="submit">保存</Button>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal title={`设置负责人 - ${operatingGroup?.name || ""}`} open={leaderOpen}
                onCancel={() => setLeaderOpen(false)} footer={null}>
                <Form form={leaderForm} onFinish={submitLeader} labelCol={{ span: 5 }} wrapperCol={{ span: 18 }}>
                    <Form.Item label="负责人" name="userId" rules={[{ required: true }]}>
                        <TreeSelect treeData={users.map(user => ({
                            title: user.name || user.username,
                            value: user.id,
                            key: user.id,
                        }))} placeholder="请选择负责人" fieldNames={{ label: "title", value: "value" }} />
                    </Form.Item>
                    <Form.Item wrapperCol={{ offset: 5, span: 18 }}>
                        <Button type="primary" htmlType="submit">保存</Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Organize;
