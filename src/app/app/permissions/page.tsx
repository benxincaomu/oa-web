"use client"

import { Table } from 'antd';
import { useEffect, useState } from 'react';
import service from '@/commons/base/service';

interface OaResource {
    id: string;
    key: string;
    displayName: string;
    type: string;
    value?: string;
    parentKey?: string;
    workbenchKey?: string;
}

const typeLabel = (type: string) => {
    if (type === 'oa-menu') {
        return '菜单资源';
    }
    if (type === 'oa-api') {
        return '接口资源';
    }
    return type;
};

/**
 * 权限管理：展示 Keycloak Authorization Services 中的资源。
 * 权限的创建（工作台发布）与授权（角色页）都由 Keycloak 承担，这里只读。
 */
const Permissions = () => {
    const [resources, setResources] = useState<OaResource[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        document.title = "权限管理";
        setLoading(true);
        service.get<OaResource[]>("/identity/resources")
            .then((res) => setResources(res.data || []))
            .finally(() => setLoading(false));
    }, []);

    const columns = [
        { title: '权限名称', dataIndex: 'displayName', key: 'displayName' },
        {
            title: '权限类型',
            dataIndex: 'type',
            key: 'type',
            render: (_: any, record: OaResource) => typeLabel(record.type),
        },
        { title: '资源标识', dataIndex: 'key', key: 'key' },
        { title: '路由 / URL', dataIndex: 'value', key: 'value' },
        { title: '上级资源', dataIndex: 'parentKey', key: 'parentKey' },
        { title: '所属工作台', dataIndex: 'workbenchKey', key: 'workbenchKey' },
    ];

    return (
        <div>
            <Table rowKey={(record) => record.key} columns={columns} dataSource={resources}
                loading={loading} bordered pagination={{ pageSize: 50 }} />
        </div>
    );
};

export default Permissions;
